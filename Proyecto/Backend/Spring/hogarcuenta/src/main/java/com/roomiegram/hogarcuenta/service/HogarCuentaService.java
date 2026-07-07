package com.roomiegram.hogarcuenta.service;

import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestTemplate;

import com.roomiegram.hogarcuenta.model.CuentaDeudor;
import com.roomiegram.hogarcuenta.model.HogarCuenta;
import com.roomiegram.hogarcuenta.repository.HogarCuentaRepository;

@Service
public class HogarCuentaService {
    @Autowired
    private HogarCuentaRepository hogarCuentaRepository;

    @Autowired
    private RestTemplate restTemplate;

    @Value("${usuario.service.url}")
    private String usuarioServiceUrl;

    public HogarCuenta guardarHogarCuenta(HogarCuenta hogarCuenta) {
        validarHogarCuenta(hogarCuenta);
        if (hogarCuenta.getCreadoPorId() != null) {
            validarPlanPremium(hogarCuenta.getCreadoPorId());
        }
        prepararRelacionDeudores(hogarCuenta);
        hogarCuenta.recalcularMontosDeudores();

        return hogarCuentaRepository.save(hogarCuenta);
    }

    public List<HogarCuenta> obtenerTodas() {
        return hogarCuentaRepository.findAll();
    }

    public Optional<HogarCuenta> obtenerPorId(Long id) {
        return hogarCuentaRepository.findById(id);
    }

    public void eliminarHogarCuenta(Long id) {
        hogarCuentaRepository.deleteById(id);
    }

    private void validarHogarCuenta(HogarCuenta hogarCuenta) {
        if (hogarCuenta == null) {
            throw new IllegalArgumentException("La cuenta es obligatoria");
        }

        if (hogarCuenta.getDescripcion() == null || hogarCuenta.getDescripcion().isBlank()) {
            throw new IllegalArgumentException("La descripcion es obligatoria");
        }

        if (hogarCuenta.getMonto() == null || hogarCuenta.getMonto().signum() <= 0) {
            throw new IllegalArgumentException("El monto debe ser mayor a 0");
        }
    }

    private void prepararRelacionDeudores(HogarCuenta hogarCuenta) {
        if (hogarCuenta.getDeudores() == null) {
            return;
        }

        for (CuentaDeudor deudor : hogarCuenta.getDeudores()) {
            deudor.setHogarCuenta(hogarCuenta);
        }
    }

    @SuppressWarnings("unchecked")
    private void validarPlanPremium(Long usuarioId) {
        String url = usuarioServiceUrl + "/auth/membresias/usuario/" + usuarioId;
        try {
            ResponseEntity<Map> response = restTemplate.getForEntity(url, Map.class);
            if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                throw new IllegalArgumentException("No se pudo verificar la suscripcion del usuario");
            }
            Object plan = response.getBody().get("plan");
            if (plan == null || "GRATIS".equalsIgnoreCase(plan.toString())) {
                throw new IllegalArgumentException(
                        "Los usuarios con plan gratuito no pueden registrar gastos del hogar. Actualiza tu suscripcion.");
            }
        } catch (RestClientException e) {
            throw new IllegalArgumentException("No se pudo verificar la suscripcion: " + e.getMessage());
        }
    }
}
