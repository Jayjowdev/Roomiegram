package com.roomiegram.hogar.service;

import com.roomiegram.hogar.model.Hogar;

public interface NotificationPublisher {

    void publicarSolicitudIngreso(Hogar hogar, Long usuarioSolicitanteId);
}