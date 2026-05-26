# Roomiegram

Guia de despliegue del proyecto Roomiegram.

##  Descripcion

Roomiegram es una aplicacion web para busqueda de roomies y gestion de convivencia en hogares compartidos.
El proyecto incluye:

- Frontend en React + Vite.
- Backend con microservicios Spring Boot.
- Base de datos MySQL.
- Despliegue local con Docker Compose.

## Estructura general

- `Proyecto/Frontend/Roomiegram`: frontend web.
- `Proyecto/Backend/Spring/usuario`: microservicio de usuarios y autenticacion.
- `Proyecto/Backend/Spring/publicacion`: microservicio de publicaciones.
- `Proyecto/Backend/Spring/hogar`: microservicio de hogares.
- `Proyecto/Backend/Spring/hogarcuenta`: microservicio de gastos/cuentas.
- `Proyecto/Backend/Spring/tarea`: microservicio de tareas.
- `Proyecto/Backend/Spring/notificacion`: microservicio de notificaciones.
- `Proyecto/Backend/Spring/comprobante`: microservicio de comprobantes.
- `docker-compose.yml`: orquestacion completa del entorno.

## Requisitos previos

Antes de desplegar el proyecto, asegurese de tener instalado:

- Docker Desktop.
- Docker Compose.
- Git.

Opcional para desarrollo fuera de contenedores:

- Node.js 22 o superior.
- Java 21.
- Maven Wrapper incluido en cada microservicio.

## Despliegue rapido con Docker Compose

Desde la raiz del proyecto ejecute:

```powershell
docker compose up --build -d
```

Este comando:

- Construye las imagenes del frontend y los microservicios.
- Levanta MySQL.
- Espera a que la base de datos quede saludable.
- Inicia todos los servicios del proyecto.

## Verificar que el despliegue fue exitoso

Revisar contenedores activos:

```powershell
docker compose ps
```

Ver logs en tiempo real:

```powershell
docker compose logs -f
```

Ver logs de un servicio especifico:

```powershell
docker compose logs -f frontend
docker compose logs -f usuario
docker compose logs -f hogar
```

## Accesos del sistema

### Frontend

- Aplicacion web: `http://localhost:5173`

### Base de datos

- MySQL: `localhost:3306`
- Base de datos: `roomiegram`
- Usuario: `root`
- Contrasena: `roomiegram`

### Microservicios

- comprobante: `http://localhost:8082`
- hogar: `http://localhost:8083`
- hogarcuenta: `http://localhost:8084`
- notificacion: `http://localhost:8085`
- publicacion: `http://localhost:8086`
- tarea: `http://localhost:8087`
- usuario: `http://localhost:8088`

### Swagger / OpenAPI

Cada microservicio expone documentacion en:

- Swagger UI: `http://localhost:{puerto}/swagger-ui.html`
- OpenAPI JSON: `http://localhost:{puerto}/api-docs`

Ejemplos:

- `http://localhost:8088/swagger-ui.html`
- `http://localhost:8086/api-docs`

## Comandos utiles

Detener contenedores:

```powershell
docker compose down
```

Detener y eliminar volumen de base de datos:

```powershell
docker compose down -v
```

Reconstruir todo desde cero:

```powershell
docker compose down
docker compose up --build -d
```

Reiniciar un servicio puntual:

```powershell
docker compose restart comprobante
```

## Despliegue de un servicio especifico

Si necesita levantar solo una parte del entorno:

```powershell
docker compose up --build -d mysql usuario frontend
```

## Flujo recomendado de despliegue

1. Abrir una terminal en la raiz del repositorio.
2. Ejecutar `docker compose up --build -d`.
3. Confirmar que MySQL y los microservicios esten arriba con `docker compose ps`.
4. Abrir `http://localhost:5173` en el navegador.
5. Validar endpoints en Swagger si necesita pruebas tecnicas.

## Solucion de problemas

### Un contenedor no inicia

Revise los logs del servicio:

```powershell
docker compose logs -f nombre_del_servicio
```

### El frontend no responde

- Verifique que el contenedor `frontend` este en ejecucion.
- Revise los logs con `docker compose logs -f frontend`.
- Confirme que el puerto `5173` no este ocupado.

### La base de datos presenta inconsistencias o datos antiguos

Puede reiniciar el entorno y eliminar el volumen:

```powershell
docker compose down -v
docker compose up --build -d
```

Nota: esto elimina los datos persistidos de MySQL en el volumen `roomiegram_mysql_data`.

### Un cambio backend no aparece reflejado

Reconstruya el servicio afectado:

```powershell
docker compose up --build -d comprobante
```

## Desarrollo local sin Docker

Esta opcion es util solo si desea trabajar servicio por servicio.

### Frontend

```powershell
cd Proyecto/Frontend/Roomiegram
npm install
npm run dev
```

### Microservicio Spring Boot

Ejemplo con `usuario`:

```powershell
cd Proyecto/Backend/Spring/usuario
.\mvnw spring-boot:run
```

Repita el mismo proceso en cada microservicio segun corresponda.

## Documentacion adicional

- Guia de endpoints: `Proyecto/Backend/Spring/README_ENDPOINTS_ROOMIEGRAM.md`
