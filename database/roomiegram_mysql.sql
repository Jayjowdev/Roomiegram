-- Roomiegram - estructura, procedimientos almacenados y datos de prueba
-- Motor objetivo: MySQL 8.x

CREATE DATABASE IF NOT EXISTS roomiegram
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE roomiegram;

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

DROP TABLE IF EXISTS hogar_publicaciones;
DROP TABLE IF EXISTS hogar_comprobantes;
DROP TABLE IF EXISTS hogar_cuentas;
DROP TABLE IF EXISTS hogar_tareas;
DROP TABLE IF EXISTS hogar_solicitudes_pendientes;
DROP TABLE IF EXISTS hogar_integrantes;
DROP TABLE IF EXISTS publicacion_galeria;
DROP TABLE IF EXISTS register_intereses;
DROP TABLE IF EXISTS cuenta_deudor;
DROP TABLE IF EXISTS comprobante;
DROP TABLE IF EXISTS notificacion;
DROP TABLE IF EXISTS hogar_cuenta;
DROP TABLE IF EXISTS tareas;
DROP TABLE IF EXISTS hogares;
DROP TABLE IF EXISTS publicacion;
DROP TABLE IF EXISTS login;
DROP TABLE IF EXISTS `register`;

SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE `register` (
  id BIGINT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(100) NOT NULL,
  apellido VARCHAR(100) NULL,
  correo VARCHAR(100) NOT NULL,
  usuario VARCHAR(100) NOT NULL,
  contrasena VARCHAR(100) NOT NULL,
  telefono VARCHAR(100) NOT NULL,
  foto_perfil LONGTEXT NULL,
  descripcion LONGTEXT NULL,
  esta_en_casa BIT(1) NOT NULL DEFAULT b'0',
  hogar_actual VARCHAR(150) NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uk_register_correo (correo),
  UNIQUE KEY uk_register_usuario (usuario)
);

CREATE TABLE register_intereses (
  register_id BIGINT NOT NULL,
  intereses VARCHAR(100) NOT NULL,
  PRIMARY KEY (register_id, intereses),
  CONSTRAINT fk_register_intereses_register
    FOREIGN KEY (register_id) REFERENCES `register` (id)
    ON DELETE CASCADE
);

CREATE TABLE login (
  id BIGINT NOT NULL AUTO_INCREMENT,
  usuario VARCHAR(100) NOT NULL,
  contrasena VARCHAR(100) NOT NULL,
  role ENUM('CLIENTE', 'ADMIN') NOT NULL DEFAULT 'CLIENTE',
  PRIMARY KEY (id),
  UNIQUE KEY uk_login_usuario (usuario)
);

CREATE TABLE publicacion (
  id BIGINT NOT NULL AUTO_INCREMENT,
  usuario_creador VARCHAR(100) NOT NULL,
  titulo VARCHAR(300) NOT NULL,
  ubicacion VARCHAR(500) NOT NULL,
  descripcion VARCHAR(5000) NOT NULL,
  precio DECIMAL(12,2) NOT NULL,
  numero_habitaciones INT NOT NULL,
  numero_personas INT NOT NULL,
  numero_banos INT NOT NULL,
  imagen LONGTEXT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE publicacion_galeria (
  publicacion_id BIGINT NOT NULL,
  galeria LONGTEXT NULL,
  CONSTRAINT fk_publicacion_galeria_publicacion
    FOREIGN KEY (publicacion_id) REFERENCES publicacion (id)
    ON DELETE CASCADE
);

CREATE TABLE hogares (
  id BIGINT NOT NULL AUTO_INCREMENT,
  nombre VARCHAR(120) NOT NULL,
  descripcion VARCHAR(500) NULL,
  usuario_creador_id BIGINT NOT NULL,
  usuario_administrador_id BIGINT NOT NULL,
  activo BIT(1) NOT NULL DEFAULT b'1',
  fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT fk_hogares_usuario_creador
    FOREIGN KEY (usuario_creador_id) REFERENCES `register` (id),
  CONSTRAINT fk_hogares_usuario_admin
    FOREIGN KEY (usuario_administrador_id) REFERENCES `register` (id)
);

CREATE TABLE hogar_integrantes (
  hogar_id BIGINT NOT NULL,
  usuario_id BIGINT NOT NULL,
  PRIMARY KEY (hogar_id, usuario_id),
  CONSTRAINT fk_hogar_integrantes_hogar
    FOREIGN KEY (hogar_id) REFERENCES hogares (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_hogar_integrantes_usuario
    FOREIGN KEY (usuario_id) REFERENCES `register` (id)
    ON DELETE CASCADE
);

CREATE TABLE hogar_solicitudes_pendientes (
  hogar_id BIGINT NOT NULL,
  usuario_id BIGINT NOT NULL,
  PRIMARY KEY (hogar_id, usuario_id),
  CONSTRAINT fk_hogar_solicitudes_hogar
    FOREIGN KEY (hogar_id) REFERENCES hogares (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_hogar_solicitudes_usuario
    FOREIGN KEY (usuario_id) REFERENCES `register` (id)
    ON DELETE CASCADE
);

CREATE TABLE tareas (
  id BIGINT NOT NULL AUTO_INCREMENT,
  titulo VARCHAR(100) NOT NULL,
  encargado VARCHAR(100) NOT NULL,
  descripcion VARCHAR(100) NOT NULL,
  fecha DATE NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE hogar_tareas (
  hogar_id BIGINT NOT NULL,
  tarea_id BIGINT NOT NULL,
  PRIMARY KEY (hogar_id, tarea_id),
  CONSTRAINT fk_hogar_tareas_hogar
    FOREIGN KEY (hogar_id) REFERENCES hogares (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_hogar_tareas_tarea
    FOREIGN KEY (tarea_id) REFERENCES tareas (id)
    ON DELETE CASCADE
);

CREATE TABLE hogar_cuenta (
  id BIGINT NOT NULL AUTO_INCREMENT,
  descripcion VARCHAR(255) NOT NULL,
  monto DECIMAL(12,2) NOT NULL,
  PRIMARY KEY (id)
);

CREATE TABLE cuenta_deudor (
  id BIGINT NOT NULL AUTO_INCREMENT,
  usuario_id BIGINT NOT NULL,
  monto_adeudado DECIMAL(12,2) NOT NULL,
  hogar_cuenta_id BIGINT NOT NULL,
  PRIMARY KEY (id),
  KEY idx_cuenta_deudor_hogar_cuenta_id (hogar_cuenta_id),
  CONSTRAINT fk_cuenta_deudor_usuario
    FOREIGN KEY (usuario_id) REFERENCES `register` (id),
  CONSTRAINT fk_cuenta_deudor_hogar_cuenta
    FOREIGN KEY (hogar_cuenta_id) REFERENCES hogar_cuenta (id)
    ON DELETE CASCADE
);

CREATE TABLE hogar_cuentas (
  hogar_id BIGINT NOT NULL,
  hogar_cuenta_id BIGINT NOT NULL,
  PRIMARY KEY (hogar_id, hogar_cuenta_id),
  CONSTRAINT fk_hogar_cuentas_hogar
    FOREIGN KEY (hogar_id) REFERENCES hogares (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_hogar_cuentas_cuenta
    FOREIGN KEY (hogar_cuenta_id) REFERENCES hogar_cuenta (id)
    ON DELETE CASCADE
);

CREATE TABLE comprobante (
  id BIGINT NOT NULL AUTO_INCREMENT,
  hogar_cuenta_id BIGINT NOT NULL,
  usuario_id BIGINT NOT NULL,
  nombre_archivo VARCHAR(255) NOT NULL,
  tipo_contenido VARCHAR(100) NOT NULL,
  tamano_archivo BIGINT NOT NULL,
  monto_pagado DECIMAL(12,2) NOT NULL,
  observacion VARCHAR(500) NULL,
  fecha_subida DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  archivo LONGBLOB NOT NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_comprobante_hogar_cuenta
    FOREIGN KEY (hogar_cuenta_id) REFERENCES hogar_cuenta (id),
  CONSTRAINT fk_comprobante_usuario
    FOREIGN KEY (usuario_id) REFERENCES `register` (id)
);

CREATE TABLE hogar_comprobantes (
  hogar_id BIGINT NOT NULL,
  comprobante_id BIGINT NOT NULL,
  PRIMARY KEY (hogar_id, comprobante_id),
  CONSTRAINT fk_hogar_comprobantes_hogar
    FOREIGN KEY (hogar_id) REFERENCES hogares (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_hogar_comprobantes_comprobante
    FOREIGN KEY (comprobante_id) REFERENCES comprobante (id)
    ON DELETE CASCADE
);

CREATE TABLE hogar_publicaciones (
  hogar_id BIGINT NOT NULL,
  publicacion_id BIGINT NOT NULL,
  PRIMARY KEY (hogar_id, publicacion_id),
  CONSTRAINT fk_hogar_publicaciones_hogar
    FOREIGN KEY (hogar_id) REFERENCES hogares (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_hogar_publicaciones_publicacion
    FOREIGN KEY (publicacion_id) REFERENCES publicacion (id)
    ON DELETE CASCADE
);

CREATE TABLE notificacion (
  id BIGINT NOT NULL AUTO_INCREMENT,
  usuario_emisor_id BIGINT NOT NULL,
  usuario_receptor_id BIGINT NOT NULL,
  hogar_id BIGINT NOT NULL,
  referencia_id BIGINT NULL,
  tipo ENUM('INVITACION_HOGAR', 'CUENTA_HOGAR', 'TAREA_HOGAR') NOT NULL,
  estado ENUM('PENDIENTE', 'LEIDA', 'ACEPTADA', 'RECHAZADA') NOT NULL DEFAULT 'PENDIENTE',
  titulo VARCHAR(150) NOT NULL,
  mensaje VARCHAR(500) NOT NULL,
  fecha_creacion DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  fecha_actualizacion DATETIME NULL,
  PRIMARY KEY (id),
  CONSTRAINT fk_notificacion_emisor
    FOREIGN KEY (usuario_emisor_id) REFERENCES `register` (id),
  CONSTRAINT fk_notificacion_receptor
    FOREIGN KEY (usuario_receptor_id) REFERENCES `register` (id),
  CONSTRAINT fk_notificacion_hogar
    FOREIGN KEY (hogar_id) REFERENCES hogares (id)
);

DROP PROCEDURE IF EXISTS sp_crear_usuario;
DROP PROCEDURE IF EXISTS sp_crear_hogar;
DROP PROCEDURE IF EXISTS sp_registrar_tarea;
DROP PROCEDURE IF EXISTS sp_registrar_gasto;
DROP PROCEDURE IF EXISTS sp_registrar_comprobante;
DROP PROCEDURE IF EXISTS sp_crear_notificacion;

DELIMITER $$

CREATE PROCEDURE sp_crear_usuario(
  IN p_nombre VARCHAR(100),
  IN p_apellido VARCHAR(100),
  IN p_correo VARCHAR(100),
  IN p_usuario VARCHAR(100),
  IN p_contrasena_hash VARCHAR(100),
  IN p_telefono VARCHAR(100),
  IN p_descripcion LONGTEXT,
  IN p_esta_en_casa BOOLEAN,
  IN p_hogar_actual VARCHAR(150),
  IN p_role VARCHAR(20)
)
BEGIN
  INSERT INTO `register` (
    nombre, apellido, correo, usuario, contrasena, telefono,
    descripcion, esta_en_casa, hogar_actual
  ) VALUES (
    p_nombre, p_apellido, p_correo, p_usuario, p_contrasena_hash, p_telefono,
    p_descripcion, IFNULL(p_esta_en_casa, 0), p_hogar_actual
  );

  INSERT INTO login (usuario, contrasena, role)
  VALUES (p_usuario, p_contrasena_hash, IFNULL(p_role, 'CLIENTE'));
END $$

CREATE PROCEDURE sp_crear_hogar(
  IN p_nombre VARCHAR(120),
  IN p_descripcion VARCHAR(500),
  IN p_usuario_creador_id BIGINT
)
BEGIN
  DECLARE v_hogar_id BIGINT;

  INSERT INTO hogares (
    nombre, descripcion, usuario_creador_id, usuario_administrador_id, activo, fecha_creacion
  ) VALUES (
    p_nombre, p_descripcion, p_usuario_creador_id, p_usuario_creador_id, 1, NOW()
  );

  SET v_hogar_id = LAST_INSERT_ID();

  INSERT INTO hogar_integrantes (hogar_id, usuario_id)
  VALUES (v_hogar_id, p_usuario_creador_id);
END $$

CREATE PROCEDURE sp_registrar_tarea(
  IN p_hogar_id BIGINT,
  IN p_titulo VARCHAR(100),
  IN p_encargado VARCHAR(100),
  IN p_descripcion VARCHAR(100),
  IN p_fecha DATE
)
BEGIN
  DECLARE v_tarea_id BIGINT;

  INSERT INTO tareas (titulo, encargado, descripcion, fecha)
  VALUES (p_titulo, p_encargado, p_descripcion, p_fecha);

  SET v_tarea_id = LAST_INSERT_ID();

  INSERT INTO hogar_tareas (hogar_id, tarea_id)
  VALUES (p_hogar_id, v_tarea_id);
END $$

CREATE PROCEDURE sp_registrar_gasto(
  IN p_hogar_id BIGINT,
  IN p_descripcion VARCHAR(255),
  IN p_monto DECIMAL(12,2),
  IN p_deudores_json JSON
)
BEGIN
  DECLARE v_hogar_cuenta_id BIGINT;
  DECLARE v_total_deudores INT DEFAULT 0;
  DECLARE v_index INT DEFAULT 0;
  DECLARE v_usuario_id BIGINT;
  DECLARE v_monto_por_persona DECIMAL(12,2);

  SET v_total_deudores = JSON_LENGTH(p_deudores_json);

  IF v_total_deudores IS NULL OR v_total_deudores = 0 THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Debe enviar al menos un deudor en formato JSON';
  END IF;

  INSERT INTO hogar_cuenta (descripcion, monto)
  VALUES (p_descripcion, p_monto);

  SET v_hogar_cuenta_id = LAST_INSERT_ID();
  SET v_monto_por_persona = ROUND(p_monto / v_total_deudores, 2);

  INSERT INTO hogar_cuentas (hogar_id, hogar_cuenta_id)
  VALUES (p_hogar_id, v_hogar_cuenta_id);

  WHILE v_index < v_total_deudores DO
    SET v_usuario_id = CAST(JSON_UNQUOTE(JSON_EXTRACT(p_deudores_json, CONCAT('$[', v_index, ']'))) AS UNSIGNED);

    INSERT INTO cuenta_deudor (usuario_id, monto_adeudado, hogar_cuenta_id)
    VALUES (v_usuario_id, v_monto_por_persona, v_hogar_cuenta_id);

    SET v_index = v_index + 1;
  END WHILE;
END $$

CREATE PROCEDURE sp_registrar_comprobante(
  IN p_hogar_id BIGINT,
  IN p_hogar_cuenta_id BIGINT,
  IN p_usuario_id BIGINT,
  IN p_nombre_archivo VARCHAR(255),
  IN p_tipo_contenido VARCHAR(100),
  IN p_monto_pagado DECIMAL(12,2),
  IN p_observacion VARCHAR(500),
  IN p_archivo_base64 LONGTEXT
)
BEGIN
  DECLARE v_comprobante_id BIGINT;

  INSERT INTO comprobante (
    hogar_cuenta_id, usuario_id, nombre_archivo, tipo_contenido,
    tamano_archivo, monto_pagado, observacion, fecha_subida, archivo
  ) VALUES (
    p_hogar_cuenta_id,
    p_usuario_id,
    p_nombre_archivo,
    p_tipo_contenido,
    OCTET_LENGTH(FROM_BASE64(p_archivo_base64)),
    p_monto_pagado,
    p_observacion,
    NOW(),
    FROM_BASE64(p_archivo_base64)
  );

  SET v_comprobante_id = LAST_INSERT_ID();

  INSERT INTO hogar_comprobantes (hogar_id, comprobante_id)
  VALUES (p_hogar_id, v_comprobante_id);
END $$

CREATE PROCEDURE sp_crear_notificacion(
  IN p_usuario_emisor_id BIGINT,
  IN p_usuario_receptor_id BIGINT,
  IN p_hogar_id BIGINT,
  IN p_referencia_id BIGINT,
  IN p_tipo VARCHAR(30),
  IN p_estado VARCHAR(20),
  IN p_titulo VARCHAR(150),
  IN p_mensaje VARCHAR(500)
)
BEGIN
  INSERT INTO notificacion (
    usuario_emisor_id, usuario_receptor_id, hogar_id, referencia_id,
    tipo, estado, titulo, mensaje, fecha_creacion, fecha_actualizacion
  ) VALUES (
    p_usuario_emisor_id, p_usuario_receptor_id, p_hogar_id, p_referencia_id,
    p_tipo, IFNULL(p_estado, 'PENDIENTE'), p_titulo, p_mensaje, NOW(), NULL
  );
END $$

DELIMITER ;

-- Datos de prueba
-- Nota: los hashes de contrasena son valores bcrypt de ejemplo.

INSERT INTO `register` (
  id, nombre, apellido, correo, usuario, contrasena, telefono,
  foto_perfil, descripcion, esta_en_casa, hogar_actual
) VALUES
  (1, 'Juan', 'Barber', 'juan@roomiegram.cl', 'juan_barber', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+56911111111', NULL, 'Administrador del hogar principal.', b'1', 'Depto Santiago Centro'),
  (2, 'Francisco', 'Ortiz', 'francisco@roomiegram.cl', 'francisco_ortiz', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+56922222222', NULL, 'Coordinador de tareas y gastos.', b'1', 'Depto Santiago Centro'),
  (3, 'Sofia', 'Ruiz', 'sofia@roomiegram.cl', 'sofia_ruiz', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+56933333333', NULL, 'Interesada en convivencia ordenada.', b'1', 'Depto Santiago Centro'),
  (4, 'Matias', 'Rojas', 'matias@roomiegram.cl', 'matias_rojas', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+56944444444', NULL, 'Usuario postulando a un hogar.', b'0', NULL);

INSERT INTO register_intereses (register_id, intereses) VALUES
  (1, 'Cocina'),
  (1, 'Orden'),
  (2, 'Limpieza'),
  (2, 'Musica'),
  (3, 'Mascotas'),
  (3, 'Estudio'),
  (4, 'Lectura'),
  (4, 'Senderismo');

INSERT INTO login (id, usuario, contrasena, role) VALUES
  (1, 'juan_barber', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'ADMIN'),
  (2, 'francisco_ortiz', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'CLIENTE'),
  (3, 'sofia_ruiz', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'CLIENTE'),
  (4, 'matias_rojas', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'CLIENTE');

INSERT INTO publicacion (
  id, usuario_creador, titulo, ubicacion, descripcion, precio,
  numero_habitaciones, numero_personas, numero_banos, imagen
) VALUES
  (1, 'juan_barber', 'Habitacion amoblada cerca del metro', 'Santiago Centro', 'Habitacion disponible en departamento compartido con excelente conectividad.', 280000.00, 3, 1, 2, NULL),
  (2, 'francisco_ortiz', 'Busco roomie responsable para depto compartido', 'Providencia', 'Busco persona ordenada para compartir gastos y tareas del hogar.', 320000.00, 2, 1, 1, NULL);

INSERT INTO publicacion_galeria (publicacion_id, galeria) VALUES
  (1, 'https://placehold.co/800x600?text=Habitacion+1'),
  (1, 'https://placehold.co/800x600?text=Cocina'),
  (2, 'https://placehold.co/800x600?text=Living'),
  (2, 'https://placehold.co/800x600?text=Habitacion+2');

INSERT INTO hogares (
  id, nombre, descripcion, usuario_creador_id, usuario_administrador_id, activo, fecha_creacion
) VALUES
  (1, 'Depto Santiago Centro', 'Hogar principal para pruebas funcionales del proyecto.', 1, 1, b'1', '2026-05-01 10:00:00');

INSERT INTO hogar_integrantes (hogar_id, usuario_id) VALUES
  (1, 1),
  (1, 2),
  (1, 3);

INSERT INTO hogar_solicitudes_pendientes (hogar_id, usuario_id) VALUES
  (1, 4);

INSERT INTO tareas (id, titulo, encargado, descripcion, fecha) VALUES
  (1, 'Limpiar cocina', 'Francisco Ortiz', 'Ordenar cocina y limpiar superficies comunes.', '2026-05-10'),
  (2, 'Sacar basura', 'Sofia Ruiz', 'Retirar basura reciclable y organica del hogar.', '2026-05-11');

INSERT INTO hogar_tareas (hogar_id, tarea_id) VALUES
  (1, 1),
  (1, 2);

INSERT INTO hogar_cuenta (id, descripcion, monto) VALUES
  (1, 'Internet y servicios basicos', 72000.00),
  (2, 'Compra supermercado semanal', 54000.00);

INSERT INTO hogar_cuentas (hogar_id, hogar_cuenta_id) VALUES
  (1, 1),
  (1, 2);

INSERT INTO cuenta_deudor (id, usuario_id, monto_adeudado, hogar_cuenta_id) VALUES
  (1, 1, 24000.00, 1),
  (2, 2, 24000.00, 1),
  (3, 3, 24000.00, 1),
  (4, 1, 18000.00, 2),
  (5, 2, 18000.00, 2),
  (6, 3, 18000.00, 2);

INSERT INTO comprobante (
  id, hogar_cuenta_id, usuario_id, nombre_archivo, tipo_contenido,
  tamano_archivo, monto_pagado, observacion, fecha_subida, archivo
) VALUES
  (
    1,
    1,
    2,
    'transferencia_internet_mayo.txt',
    'text/plain',
    28,
    24000.00,
    'Pago parcial correspondiente a Francisco.',
    '2026-05-09 20:15:00',
    FROM_BASE64('Q29tcHJvYmFudGUgZGUgcGFnbyBkZSBpbnRlcm5ldA==')
  );

INSERT INTO hogar_comprobantes (hogar_id, comprobante_id) VALUES
  (1, 1);

INSERT INTO hogar_publicaciones (hogar_id, publicacion_id) VALUES
  (1, 1);

INSERT INTO notificacion (
  id, usuario_emisor_id, usuario_receptor_id, hogar_id, referencia_id,
  tipo, estado, titulo, mensaje, fecha_creacion, fecha_actualizacion
) VALUES
  (1, 1, 4, 1, 4, 'INVITACION_HOGAR', 'PENDIENTE', 'Solicitud de ingreso recibida', 'Tu solicitud al hogar esta pendiente de revision.', '2026-05-08 18:00:00', NULL),
  (2, 1, 2, 1, 1, 'TAREA_HOGAR', 'LEIDA', 'Nueva tarea asignada', 'Debes limpiar la cocina durante esta semana.', '2026-05-09 08:30:00', '2026-05-09 09:15:00'),
  (3, 2, 3, 1, 2, 'CUENTA_HOGAR', 'PENDIENTE', 'Nuevo gasto compartido', 'Se registro una nueva cuenta del hogar para dividir entre integrantes.', '2026-05-09 19:00:00', NULL);

-- Ejemplos de uso de procedimientos almacenados:
-- CALL sp_crear_usuario('Camila', 'Perez', 'camila@roomiegram.cl', 'camila_perez', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', '+56955555555', 'Nueva usuaria', 0, NULL, 'CLIENTE');
-- CALL sp_crear_hogar('Depto Valparaiso', 'Nuevo hogar de prueba', 1);
-- CALL sp_registrar_tarea(1, 'Limpiar bano', 'Juan Barber', 'Aseo completo del bano comun.', '2026-05-20');
-- CALL sp_registrar_gasto(1, 'Gas mensual', 45000.00, JSON_ARRAY(1, 2, 3));
-- CALL sp_registrar_comprobante(1, 1, 1, 'pago_gas.txt', 'text/plain', 15000.00, 'Pago del tercio correspondiente', TO_BASE64('Pago registrado manualmente'));
-- CALL sp_crear_notificacion(1, 3, 1, 2, 'CUENTA_HOGAR', 'PENDIENTE', 'Recordatorio de pago', 'Recuerda pagar tu parte del gasto registrado.');