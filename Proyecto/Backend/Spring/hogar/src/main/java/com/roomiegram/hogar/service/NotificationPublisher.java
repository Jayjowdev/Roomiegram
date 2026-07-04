package com.roomiegram.hogar.service;

import com.roomiegram.hogar.model.Hogar;
import com.roomiegram.hogar.model.Visita;

public interface NotificationPublisher {

    void publicarSolicitudIngreso(Hogar hogar, Long usuarioSolicitanteId);

    void publicarNuevaVisita(Hogar hogar, Visita visita);

    void publicarVisitaActualizada(Hogar hogar, Visita visita);
}