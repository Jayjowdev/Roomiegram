package com.roomiegram.usuario.controller;

import java.util.Map;

import com.roomiegram.usuario.service.MercadoPagoService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/webhooks")
public class MercadoPagoWebhookController {

    private static final Logger logger = LoggerFactory.getLogger(MercadoPagoWebhookController.class);

    private final MercadoPagoService mercadoPagoService;

    public MercadoPagoWebhookController(MercadoPagoService mercadoPagoService) {
        this.mercadoPagoService = mercadoPagoService;
    }

    @PostMapping("/mercadopago")
    public ResponseEntity<?> recibirNotificacion(@RequestBody Map<String, Object> payload) {
        logger.info("Webhook Mercado Pago recibido: {}", payload);

        Object type = payload.get("type");
        Object data = payload.get("data");

        if (!"payment".equals(type) || !(data instanceof Map<?, ?> dataMap)) {
            return ResponseEntity.ok(Map.of("mensaje", "Evento ignorado"));
        }

        Object id = dataMap.get("id");
        if (id == null) {
            return ResponseEntity.ok(Map.of("mensaje", "Sin id de pago"));
        }

        try {
            Long paymentId = Long.valueOf(id.toString());
            mercadoPagoService.procesarNotificacionPago(paymentId);
            return ResponseEntity.ok(Map.of("mensaje", "Notificacion procesada"));
        } catch (NumberFormatException e) {
            logger.warn("Id de pago invalido: {}", id);
            return ResponseEntity.ok(Map.of("mensaje", "Id de pago invalido"));
        }
    }
}
