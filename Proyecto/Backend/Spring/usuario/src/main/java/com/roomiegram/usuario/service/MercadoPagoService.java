package com.roomiegram.usuario.service;

import java.math.BigDecimal;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.mercadopago.MercadoPagoConfig;
import com.mercadopago.client.payment.PaymentClient;
import com.mercadopago.client.preference.PreferenceBackUrlsRequest;
import com.mercadopago.client.preference.PreferenceClient;
import com.mercadopago.client.preference.PreferenceItemRequest;
import com.mercadopago.client.preference.PreferenceRequest;
import com.mercadopago.exceptions.MPApiException;
import com.mercadopago.exceptions.MPException;
import com.mercadopago.resources.payment.Payment;
import com.mercadopago.resources.preference.Preference;
import com.roomiegram.usuario.enums.Plan;
import com.roomiegram.usuario.model.Suscripcion;

import jakarta.annotation.PostConstruct;

@Service
public class MercadoPagoService {

    private static final Logger logger = LoggerFactory.getLogger(MercadoPagoService.class);
    private static final String EXTERNAL_REFERENCE_PREFIX = "ROOMIEGRAM";

    @Value("${mercadopago.access-token:}")
    private String accessToken;

    @Value("${mercadopago.public-key:}")
    private String publicKey;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${mercadopago.webhook-url:}")
    private String configuredWebhookUrl;

    private final MembresiaService membresiaService;
    private final Set<Long> pagosProcesados = ConcurrentHashMap.newKeySet();

    public MercadoPagoService(MembresiaService membresiaService) {
        this.membresiaService = membresiaService;
    }

    @PostConstruct
    public void init() {
        logger.info("Mercado Pago token configurado: {}", tieneTexto(accessToken));
        logger.info("Mercado Pago public key configurada: {}", tieneTexto(publicKey));
        logger.info("Mercado Pago frontend URL configurada: {}", tieneTexto(frontendUrl));
        configurarAccessTokenSiExiste();
    }

    private void configurarAccessTokenSiExiste() {
        if (!tieneTexto(accessToken)) {
            logger.warn("Falta configurar MERCADOPAGO_ACCESS_TOKEN para Mercado Pago");
            return;
        }
        MercadoPagoConfig.setAccessToken(accessToken.trim());
    }

    public Map<String, String> crearPreferenciaPago(Long usuarioId, Plan plan) {
        validarConfiguracion();
        validarPlanPagado(plan);

        if (usuarioId == null || usuarioId <= 0) {
            throw new IllegalArgumentException("El usuario es obligatorio");
        }

        String externalReference = buildExternalReference(usuarioId, plan);
        String planNombre = nombrePlan(plan);

        try {
            PreferenceItemRequest item = PreferenceItemRequest.builder()
                    .title("Roomiegram " + planNombre)
                    .description("Suscripción mensual a Roomiegram " + planNombre)
                    .quantity(1)
                    .unitPrice(BigDecimal.valueOf(precioPlan(plan)))
                    .currencyId("CLP")
                    .build();

            PreferenceBackUrlsRequest backUrls = PreferenceBackUrlsRequest.builder()
                    .success(buildReturnUrl("exitoso", externalReference))
                    .pending(buildReturnUrl("pendiente", externalReference))
                    .failure(buildReturnUrl("error", externalReference))
                    .build();

            var requestBuilder = PreferenceRequest.builder()
                    .items(List.of(item))
                    .externalReference(externalReference)
                    .backUrls(backUrls);

            if (configuredWebhookUrl != null && !configuredWebhookUrl.isBlank()) {
                requestBuilder.notificationUrl(configuredWebhookUrl);
            }

            Preference preference = new PreferenceClient().create(requestBuilder.build());
            String initPoint = obtenerInitPoint(preference);
            if (initPoint == null || initPoint.isBlank()) {
                throw new IllegalArgumentException("Mercado Pago no devolvió un enlace de pago");
            }

            return Map.of(
                    "initPoint", initPoint,
                    "externalReference", externalReference,
                    "publicKey", Optional.ofNullable(publicKey).orElse(""));
        } catch (MPApiException e) {
            String errorContent = e.getApiResponse() != null && e.getApiResponse().getContent() != null
                    ? e.getApiResponse().getContent()
                    : e.getMessage();
            logger.error("Error de Mercado Pago al crear preferencia: {}", errorContent);
            throw new IllegalArgumentException("Mercado Pago no pudo crear la preferencia de pago. Revisa que MERCADOPAGO_ACCESS_TOKEN sea válido");
        } catch (MPException e) {
            logger.error("Error al crear preferencia de Mercado Pago", e);
            throw new IllegalArgumentException("No se pudo conectar con Mercado Pago");
        }
    }

    public ResultadoPago verificarPago(String externalReference, Long paymentId) {
        if (!esExternalReferenceValida(externalReference)) {
            return ResultadoPago.rechazado("Referencia de pago inválida");
        }

        if (paymentId == null || paymentId <= 0) {
            return ResultadoPago.pendiente("Pago pendiente de confirmación");
        }

        return confirmarPago(paymentId, externalReference);
    }

    public ResultadoPago procesarNotificacionPago(Long paymentId) {
        if (paymentId == null || paymentId <= 0) {
            logger.warn("Notificacion de pago recibida sin id valido");
            return ResultadoPago.rechazado("Id de pago inválido");
        }

        return confirmarPago(paymentId, null);
    }

    private ResultadoPago confirmarPago(Long paymentId, String externalReferenceEsperada) {
        validarConfiguracion();

        try {
            Payment payment = new PaymentClient().get(paymentId);

            if (payment == null || payment.getExternalReference() == null) {
                return ResultadoPago.pendiente("Pago sin referencia de Roomiegram");
            }

            String externalReference = payment.getExternalReference();
            if (!esExternalReferenceValida(externalReference)) {
                return ResultadoPago.rechazado("El pago no pertenece a Roomiegram");
            }

            if (externalReferenceEsperada != null && !externalReferenceEsperada.equals(externalReference)) {
                return ResultadoPago.rechazado("La referencia de pago no coincide");
            }

            if (!"approved".equalsIgnoreCase(payment.getStatus())) {
                return ResultadoPago.pendiente("Pago " + payment.getStatus());
            }

            DatosPago datos = parseExternalReference(externalReference);
            validarPlanPagado(datos.plan());

            if (pagosProcesados.add(paymentId)) {
                Suscripcion suscripcion = membresiaService.suscribir(datos.usuarioId(), datos.plan(), true);
                logger.info("Suscripcion {} activada para usuario {} por pago {}",
                        suscripcion.getPlan(), datos.usuarioId(), paymentId);
            }

            return ResultadoPago.aprobado("Pago confirmado");
        } catch (MPApiException e) {
            String errorContent = e.getApiResponse() != null && e.getApiResponse().getContent() != null
                    ? e.getApiResponse().getContent()
                    : e.getMessage();
            logger.error("Error de Mercado Pago al consultar pago {}: {}", paymentId, errorContent);
            return ResultadoPago.pendiente("No se pudo confirmar el pago con Mercado Pago");
        } catch (MPException e) {
            logger.error("Error al consultar pago {}", paymentId, e);
            return ResultadoPago.pendiente("No se pudo conectar con Mercado Pago");
        } catch (IllegalArgumentException e) {
            return ResultadoPago.rechazado(e.getMessage());
        }
    }

    private void validarConfiguracion() {
        if (!tieneTexto(accessToken)) {
            throw new IllegalArgumentException("Falta configurar MERCADOPAGO_ACCESS_TOKEN en .env para crear pagos con Mercado Pago");
        }
        MercadoPagoConfig.setAccessToken(accessToken.trim());
    }

    private boolean tieneTexto(String value) {
        return value != null && !value.isBlank();
    }

    private String obtenerInitPoint(Preference preference) {
        if (esTokenSandbox()) {
            return Optional.ofNullable(preference.getSandboxInitPoint())
                    .orElse(preference.getInitPoint());
        }
        return Optional.ofNullable(preference.getInitPoint())
                .orElseGet(preference::getSandboxInitPoint);
    }

    private boolean esTokenSandbox() {
        return accessToken != null && accessToken.startsWith("TEST-");
    }

    private void validarPlanPagado(Plan plan) {
        if (plan == null || plan == Plan.GRATIS) {
            throw new IllegalArgumentException("El plan debe ser de pago");
        }
    }

    private String buildReturnUrl(String estado, String externalReference) {
        String baseUrl = frontendUrl == null || frontendUrl.isBlank() ? "http://localhost:5173" : frontendUrl;
        String separator = baseUrl.contains("?") ? "&" : "?";
        return baseUrl.replaceAll("/+$", "")
                + "/planes"
                + separator
                + "pago="
                + encode(estado)
                + "&external_reference="
                + encode(externalReference);
    }

    private String buildExternalReference(Long usuarioId, Plan plan) {
        return EXTERNAL_REFERENCE_PREFIX + "-" + usuarioId + "-" + plan.name() + "-" + System.currentTimeMillis();
    }

    private boolean esExternalReferenceValida(String externalReference) {
        return externalReference != null && externalReference.startsWith(EXTERNAL_REFERENCE_PREFIX + "-");
    }

    private DatosPago parseExternalReference(String externalReference) {
        String[] parts = externalReference.split("-");
        if (parts.length < 4) {
            throw new IllegalArgumentException("Referencia de pago inválida");
        }

        try {
            Long usuarioId = Long.valueOf(parts[1]);
            Plan plan = Plan.valueOf(parts[2]);
            return new DatosPago(usuarioId, plan);
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Referencia de pago inválida");
        }
    }

    private String nombrePlan(Plan plan) {
        return plan == Plan.PREMIUM_HOGAR ? "Premium Hogar" : "Premium Individual";
    }

    private int precioPlan(Plan plan) {
        return plan == Plan.PREMIUM_HOGAR ? 8990 : 4990;
    }

    private String encode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private record DatosPago(Long usuarioId, Plan plan) {
    }

    public record ResultadoPago(boolean aprobado, String estado, String mensaje) {
        private static ResultadoPago aprobado(String mensaje) {
            return new ResultadoPago(true, "aprobado", mensaje);
        }

        private static ResultadoPago pendiente(String mensaje) {
            return new ResultadoPago(false, "pendiente", mensaje);
        }

        private static ResultadoPago rechazado(String mensaje) {
            return new ResultadoPago(false, "rechazado", mensaje);
        }
    }
}
