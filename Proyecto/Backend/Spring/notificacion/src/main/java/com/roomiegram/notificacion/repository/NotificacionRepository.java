package com.roomiegram.notificacion.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.roomiegram.notificacion.model.Notificacion;

public interface NotificacionRepository extends JpaRepository<Notificacion, Long> {

}
