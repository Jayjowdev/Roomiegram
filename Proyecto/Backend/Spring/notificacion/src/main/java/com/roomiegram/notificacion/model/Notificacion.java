package com.roomiegram.notificacion.model;

import java.time.LocalDateTime;

import com.roomiegram.notificacion.enums.EstadoNotificacion;
import com.roomiegram.notificacion.enums.TipoNotificacion;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "notificacion")
@Data
@AllArgsConstructor
@NoArgsConstructor
public class Notificacion {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(name = "usuario_emisor_id", nullable = false)
	private Long usuarioEmisorId;

	@Column(name = "usuario_receptor_id", nullable = false)
	private Long usuarioReceptorId;

	@Column(name = "hogar_id", nullable = false)
	private Long hogarId;

	@Column(name = "referencia_id")
	private Long referenciaId;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 30)
	private TipoNotificacion tipo;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 20)
	private EstadoNotificacion estado;

	@Column(nullable = false, length = 150)
	private String titulo;

	@Column(nullable = false, length = 500)
	private String mensaje;

	@Column(name = "fecha_creacion", nullable = false)
	private LocalDateTime fechaCreacion;

	@Column(name = "fecha_actualizacion")
	private LocalDateTime fechaActualizacion;

	@PrePersist
	public void prePersist() {
		LocalDateTime ahora = LocalDateTime.now();

		if (fechaCreacion == null) {
			fechaCreacion = ahora;
		}

		if (estado == null) {
			estado = EstadoNotificacion.PENDIENTE;
		}
	}
}
