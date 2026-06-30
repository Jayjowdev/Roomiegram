package com.roomiegram.usuario.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

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
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import com.roomiegram.usuario.enums.Plan;

@Service
public class MercadoPagoService {

    private static final Logger logger = LoggerFactory.getLogger(MercadoPagoService.class);

    private static final String EXTERNAL_REFERENCE_PREFIX = "ROOMIEGRAM";

    @Value("${mercadopago.access-token}")
    private String accessToken;

    @Value("${mercadopago.public-key}")
    private String publicKey;

    @Value("${app.frontend-url:http://localhost:5173}")
    private String frontendUrl;

    @Value("${mercadopago.webhook-url:}")
    private String configuredWebhookUrl;

    private final MembresiaService membresiaService;
    private final Map<String, EstadoPago> pagosPendientes = new ConcurrentHashMap<>();

    public MercadoPagoService(MembresiaService membresiaService) {
        this.membresiaService = membresiaService;
    }

    @PostConstruct
    public void init() {
        MercadoPagoConfig.setAccessToken(accessToken);
    }

    public String getPublicKey() {
        return publicKey;
    }

    public Map<String, String> crearPreferenciaPago(Long usuarioId, Plan plan) {
        if (usuarioId == null || usuarioId <= 0) {
            throw new IllegalArgumentException("El usuario es obligatorio");
        }
        if (plan == null || plan == Plan.GRATIS) {
            throw new IllegalArgumentException("El plan debe ser de pago");
        }

        String planNombre = plan == Plan.PREMIUM_HOGAR ? "Premium Hogar" : "Premium Individual";
        int precio = plan == Plan.PREMIUM_HOGAR ? 8990 : 4990;
        String externalReference = buildExternalReference(usuarioId, plan);

        try {
            PreferenceItemRequest item = PreferenceItemRequest.builder()
                    .title("Roomiegram " + planNombre)
                    .description("Suscripcion mensual a Roomiegram " + planNombre)
                    .quantity(1)
                    .unitPrice(BigDecimal.valueOf(precio))
                    .currencyId("CLP")
                    .build();

            PreferenceBackUrlsRequest backUrls = PreferenceBackUrlsRequest.builder()
                    .success(frontendUrl + "/planes?pago=exitoso")
                    .pending(frontendUrl + "/planes?pago=pendiente")
                    .failure(frontendUrl + "/planes?pago=error")
                    .build();

            String notificationUrl = configuredWebhookUrl != null && !configuredWebhookUrl.isBlank()
                    ? configuredWebhookUrl
                    : null;

            PreferenceRequest request = PreferenceRequest.builder()
                    .items(List.of(item))
                    .externalReference(externalReference)
                    .backUrls(backUrls)
                    .notificationUrl(notificationUrl)
                    .build();

            PreferenceClient client = new PreferenceClient();
            Preference preference = client.create(request);

            pagosPendientes.put(externalReference, EstadoPago.PENDIENTE);

            return Map.of(
                    "initPoint", preference.getInitPoint(),
                    "externalReference", externalReference,
                    "publicKey", publicKey);
        } catch (MPApiException e) {
            String errorContent = e.getApiResponse() != null && e.getApiResponse().getContent() != null
                    ? e.getApiResponse().getContent()
                    : e.getMessage();
            logger.error("Error de Mercado Pago al crear preferencia: {}", errorContent);
            throw new IllegalArgumentException("Mercado Pago: " + errorContent);
        } catch (MPException e) {
            logger.error("Error al crear preferencia de Mercado Pago", e);
            throw new IllegalArgumentException("No se pudo conectar con Mercado Pago: " + e.getMessage());
        }
    }

    public void procesarNotificacionPago(Long paymentId) {
        if (paymentId == null || paymentId <= 0) {
            logger.warn("Notificacion de pago recibida sin id valido");
            return;
        }

        try {
            PaymentClient paymentClient = new PaymentClient();
            Payment payment = paymentClient.get(paymentId);

            if (payment == null || payment.getExternalReference() == null) {
                logger.warn("Pago {} no tiene external reference", paymentId);
                return;
            }

            String externalReference = payment.getExternalReference();
            if (!externalReference.startsWith(EXTERNAL_REFERENCE_PREFIX)) {
                logger.info("Pago {} no pertenece a Roomiegram", paymentId);
                return;
            }

            if (!"approved".equalsIgnoreCase(payment.getStatus())) {
                logger.info("Pago {} no esta aprobado. Estado: {}", paymentId, payment.getStatus());
                return;
            }

            DatosPago datos = parseExternalReference(externalReference);
            if (datos == null) {
                logger.warn("No se pudieron parsear los datos del pago {}", paymentId);
                return;
            }

            logger.info("Activando suscripcion para usuario {} plan {} por pago {}",
                    datos.usuarioId(), datos.plan(), paymentId);
            membresiaService.suscribir(datos.usuarioId(), datos.plan(), true);
            pagosPendientes.put(externalReference, EstadoPago.APROBADO);
        } catch (MPApiException e) {
            logger.error("Error de Mercado Pago al consultar pago {}: {}", paymentId, e.getApiResponse().getContent());
        } catch (MPException e) {
            logger.error("Error al consultar pago {}", paymentId, e);
        }
    }

    public boolean verificarPagoAprobado(String externalReference) {
        if (externalReference == null || !externalReference.startsWith(EXTERNAL_REFERENCE_PREFIX)) {
            return false;
        }

        EstadoPago estado = pagosPendientes.get(externalReference);
        return estado == EstadoPago.APROBADO;
    }

    private String buildExternalReference(Long usuarioId, Plan plan) {
        return EXTERNAL_REFERENCE_PREFIX + "-" + usuarioId + "-" + plan.name() + "-" + System.currentTimeMillis();
    }

    private DatosPago parseExternalReference(String externalReference) {
        String[] parts = externalReference.split("-");
        if (parts.length < 3) {
            return null;
        }

        try {
            Long usuarioId = Long.valueOf(parts[1]);
            Plan plan = Plan.valueOf(parts[2]);
            return new DatosPago(usuarioId, plan);
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    private record DatosPago(Long usuarioId, Plan plan) {
    }

    private enum EstadoPago {
        PENDIENTE,
        APROBADO
    }
}
