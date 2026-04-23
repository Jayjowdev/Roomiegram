package com.roomiegram.notificacion.config;

import java.time.LocalDateTime;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import com.roomiegram.notificacion.enums.EstadoNotificacion;
import com.roomiegram.notificacion.enums.TipoNotificacion;
import com.roomiegram.notificacion.model.Notificacion;
import com.roomiegram.notificacion.repository.NotificacionRepository;


@Configuration
public class LoadDatabase {
    @Bean
    CommandLineRunner initDatabase(NotificacionRepository notificacionRepository) {
        return args -> {
            if (notificacionRepository.count() == 0) {
                Notificacion invitacionHogar = new Notificacion();
                invitacionHogar.setUsuarioEmisorId(1L);
                invitacionHogar.setUsuarioReceptorId(2L);
                invitacionHogar.setHogarId(100L);
                invitacionHogar.setReferenciaId(100L);
                invitacionHogar.setTipo(TipoNotificacion.INVITACION_HOGAR);
                invitacionHogar.setEstado(EstadoNotificacion.PENDIENTE);
                invitacionHogar.setTitulo("Invitacion a hogar compartido");
                invitacionHogar.setMensaje("Has sido invitado a unirte al hogar Roomie Centro.");
                invitacionHogar.setFechaCreacion(LocalDateTime.now().minusDays(1));
                invitacionHogar.setFechaActualizacion(LocalDateTime.now().minusDays(1));
                notificacionRepository.save(invitacionHogar);

                Notificacion cuentaHogar = new Notificacion();
                cuentaHogar.setUsuarioEmisorId(1L);
                cuentaHogar.setUsuarioReceptorId(3L);
                cuentaHogar.setHogarId(100L);
                cuentaHogar.setReferenciaId(200L);
                cuentaHogar.setTipo(TipoNotificacion.CUENTA_HOGAR);
                cuentaHogar.setEstado(EstadoNotificacion.LEIDA);
                cuentaHogar.setTitulo("Nueva cuenta del hogar");
                cuentaHogar.setMensaje("Se registro una cuenta de electricidad para dividir entre los integrantes.");
                cuentaHogar.setFechaCreacion(LocalDateTime.now().minusHours(6));
                cuentaHogar.setFechaActualizacion(LocalDateTime.now().minusHours(2));
                notificacionRepository.save(cuentaHogar);

                Notificacion tareaHogar = new Notificacion();
                tareaHogar.setUsuarioEmisorId(2L);
                tareaHogar.setUsuarioReceptorId(1L);
                tareaHogar.setHogarId(100L);
                tareaHogar.setReferenciaId(300L);
                tareaHogar.setTipo(TipoNotificacion.TAREA_HOGAR);
                tareaHogar.setEstado(EstadoNotificacion.PENDIENTE);
                tareaHogar.setTitulo("Nueva tarea asignada");
                tareaHogar.setMensaje("Se te asigno la tarea de sacar la basura esta noche.");
                tareaHogar.setFechaCreacion(LocalDateTime.now().minusMinutes(30));
                tareaHogar.setFechaActualizacion(LocalDateTime.now().minusMinutes(30));
                notificacionRepository.save(tareaHogar);

                System.out.println("Base de datos inicializada con notificaciones de ejemplo.");
            } else {
                System.out.println("La Base de datos ya contiene datos.");
            }
        };
    }
}