package com.roomiegram.hogar.model;

import java.time.LocalDateTime;
import java.util.LinkedHashSet;
import java.util.Set;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "hogares")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class Hogar {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, length = 120)
	private String nombre;

	@Column(length = 500)
	private String descripcion;

	@Column(name = "usuario_creador_id", nullable = false)
	private Long usuarioCreadorId;

	@Column(name = "usuario_administrador_id", nullable = false)
	private Long usuarioAdministradorId;

	@Column(nullable = false)
	private boolean activo = true;

	@Column(name = "fecha_creacion", nullable = false)
	private LocalDateTime fechaCreacion;

	@ElementCollection(fetch = FetchType.LAZY)
	@CollectionTable(name = "hogar_integrantes", joinColumns = @JoinColumn(name = "hogar_id"))
	@Column(name = "usuario_id", nullable = false)
	private Set<Long> integrantesIds = new LinkedHashSet<>();

	@ElementCollection(fetch = FetchType.LAZY)
	@CollectionTable(name = "hogar_solicitudes_pendientes", joinColumns = @JoinColumn(name = "hogar_id"))
	@Column(name = "usuario_id", nullable = false)
	private Set<Long> solicitudesPendientesIds = new LinkedHashSet<>();

	@ElementCollection(fetch = FetchType.LAZY)
	@CollectionTable(name = "hogar_tareas", joinColumns = @JoinColumn(name = "hogar_id"))
	@Column(name = "tarea_id", nullable = false)
	private Set<Long> tareasIds = new LinkedHashSet<>();

	@ElementCollection(fetch = FetchType.LAZY)
	@CollectionTable(name = "hogar_cuentas", joinColumns = @JoinColumn(name = "hogar_id"))
	@Column(name = "hogar_cuenta_id", nullable = false)
	private Set<Long> hogarCuentaIds = new LinkedHashSet<>();

	@ElementCollection(fetch = FetchType.LAZY)
	@CollectionTable(name = "hogar_comprobantes", joinColumns = @JoinColumn(name = "hogar_id"))
	@Column(name = "comprobante_id", nullable = false)
	private Set<Long> comprobanteIds = new LinkedHashSet<>();

	@ElementCollection(fetch = FetchType.LAZY)
	@CollectionTable(name = "hogar_publicaciones", joinColumns = @JoinColumn(name = "hogar_id"))
	@Column(name = "publicacion_id", nullable = false)
	private Set<Long> publicacionIds = new LinkedHashSet<>();

	@PrePersist
	public void prepararNuevoHogar() {
		if (fechaCreacion == null) {
			fechaCreacion = LocalDateTime.now();
		}
		if (usuarioAdministradorId == null) {
			usuarioAdministradorId = usuarioCreadorId;
		}
		if (usuarioCreadorId != null) {
			integrantesIds.add(usuarioCreadorId);
		}
	}

	public boolean esAdministrador(Long usuarioId) {
		return usuarioId != null && usuarioId.equals(usuarioAdministradorId);
	}

	public boolean solicitarIngreso(Long usuarioId) {
		if (usuarioId == null || integrantesIds.contains(usuarioId)) {
			return false;
		}
		return solicitudesPendientesIds.add(usuarioId);
	}

	public boolean aprobarSolicitud(Long usuarioId) {
		if (usuarioId == null || !solicitudesPendientesIds.remove(usuarioId)) {
			return false;
		}
		return integrantesIds.add(usuarioId);
	}

	public boolean rechazarSolicitud(Long usuarioId) {
		if (usuarioId == null) {
			return false;
		}
		return solicitudesPendientesIds.remove(usuarioId);
	}

	public boolean agregarIntegrante(Long usuarioId) {
		if (usuarioId == null) {
			return false;
		}
		solicitudesPendientesIds.remove(usuarioId);
		return integrantesIds.add(usuarioId);
	}

	public boolean removerIntegrante(Long usuarioId) {
		if (usuarioId == null || esAdministrador(usuarioId)) {
			return false;
		}
		solicitudesPendientesIds.remove(usuarioId);
		return integrantesIds.remove(usuarioId);
	}

	public boolean agregarTarea(Long tareaId) {
		return tareaId != null && tareasIds.add(tareaId);
	}

	public boolean agregarHogarCuenta(Long cuentaId) {
		return cuentaId != null && hogarCuentaIds.add(cuentaId);
	}

	public boolean agregarComprobante(Long comprobanteId) {
		return comprobanteId != null && comprobanteIds.add(comprobanteId);
	}

	public boolean agregarPublicacion(Long publicacionId) {
		return publicacionId != null && publicacionIds.add(publicacionId);
	}
}
