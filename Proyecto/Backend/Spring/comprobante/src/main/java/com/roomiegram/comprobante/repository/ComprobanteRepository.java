package com.roomiegram.comprobante.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.roomiegram.comprobante.model.Comprobante;

public interface ComprobanteRepository extends JpaRepository<Comprobante, Long> {

}
