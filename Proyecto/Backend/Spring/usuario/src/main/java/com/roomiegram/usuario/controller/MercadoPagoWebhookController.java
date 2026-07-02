package com.roomiegram.usuario.controller;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.roomiegram.usuario.service.MercadoPagoService;
import com.roomiegram.usuario.service.MercadoPagoService.ResultadoPago;

@RestController
@RequestMapping("/webhooks")
public class MercadoPagoWebhookController {

    private static final Logger logger = LoggerFactory.getLogger(MercadoPagoWebhookController.class);

    private final MercadoPagoService mercadoPagoService;

    public MercadoPagoWebhookController(MercadoPagoService mercadoPagoService) {
        this.mercadoPagoService = mercadoPagoService;
    }

    @PostMapping("/mercadopago")
    public ResponseEntity<?> recibirNotificacion(
            @RequestBody(required = false) Map<String, Object> payload,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String topic,
            @RequestParam(required = false) String id) {
        logger.info("Webhook Mercado Pago recibido: {}", payload);

        String eventType = obtenerTexto(payload, "type", type != null ? type : topic);
        if (eventType != null && !"payment".equalsIgnoreCase(eventType)) {
            return ResponseEntity.ok(Map.of("mensaje", "Evento ignorado"));
        }

        Long paymentId = extraerPaymentId(payload, id);
        if (paymentId == null) {
            return ResponseEntity.ok(Map.of("mensaje", "Sin id de pago"));
        }

        ResultadoPago resultado = mercadoPagoService.procesarNotificacionPago(paymentId);
        return ResponseEntity.ok(Map.of(
                "mensaje", resultado.mensaje(),
                "estado", resultado.estado(),
                "aprobado", resultado.aprobado()));
    }

    private Long extraerPaymentId(Map<String, Object> payload, String queryId) {
        Object id = queryId;

        if (id == null && payload != null) {
            Object data = payload.get("data");
            if (data instanceof Map<?, ?> dataMap) {
                id = dataMap.get("id");
            }
        }

        if (id == null && payload != null) {
            id = payload.get("id");
        }

        if (id == null) {
            return null;
        }

        try {
            return Long.valueOf(id.toString());
        } catch (NumberFormatException e) {
            logger.warn("Id de pago invalido: {}", id);
            return null;
        }
    }

    private String obtenerTexto(Map<String, Object> payload, String key, String fallback) {
        if (payload == null || payload.get(key) == null) {
            return fallback;
        }
        return payload.get(key).toString();
    }
}
