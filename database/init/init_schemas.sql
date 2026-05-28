-- Script de inicializacion de esquemas por servicio (Fase 1 - esquemas en un mismo MySQL)
-- Usado cuando se prefiere un unico contenedor MySQL con bases separadas por servicio.
-- Para Fase 2 (contenedores independientes) este script no es necesario:
-- cada contenedor recibe su MYSQL_DATABASE por variable de entorno.

CREATE DATABASE IF NOT EXISTS roomiegram_comprobante CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS roomiegram_hogar       CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS roomiegram_hogarcuenta CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS roomiegram_notificacion CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS roomiegram_publicacion  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS roomiegram_tarea        CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS roomiegram_usuario      CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Permisos (solo necesario si el usuario no es root)
-- GRANT ALL PRIVILEGES ON roomiegram_comprobante.* TO 'roomiegram'@'%';
-- GRANT ALL PRIVILEGES ON roomiegram_hogar.*        TO 'roomiegram'@'%';
-- GRANT ALL PRIVILEGES ON roomiegram_hogarcuenta.*  TO 'roomiegram'@'%';
-- GRANT ALL PRIVILEGES ON roomiegram_notificacion.* TO 'roomiegram'@'%';
-- GRANT ALL PRIVILEGES ON roomiegram_publicacion.*  TO 'roomiegram'@'%';
-- GRANT ALL PRIVILEGES ON roomiegram_tarea.*        TO 'roomiegram'@'%';
-- GRANT ALL PRIVILEGES ON roomiegram_usuario.*      TO 'roomiegram'@'%';
-- FLUSH PRIVILEGES;
