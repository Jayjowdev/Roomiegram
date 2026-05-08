# RoomieGram - guia de microservicios y endpoints

Documento de apoyo para probar y defender el avance funcional del proyecto. Todos los microservicios exponen Swagger UI y OpenAPI en las mismas rutas:

- Swagger UI: `http://localhost:{PUERTO}/swagger-ui.html`
- OpenAPI JSON: `http://localhost:{PUERTO}/api-docs`

## Puertos 

| Microservicio | Puerto | Swagger |
| --- | ---: | --- |
| comprobante | 8082 | `http://localhost:8082/swagger-ui.html` |
| hogar | 8083 | `http://localhost:8083/swagger-ui.html` |
| hogarcuenta | 8084 | `http://localhost:8084/swagger-ui.html` |
| notificacion | 8085 | `http://localhost:8085/swagger-ui.html` |
| publicacion | 8086 | `http://localhost:8086/swagger-ui.html` |
| tarea | 8087 | `http://localhost:8087/swagger-ui.html` |
| usuario | 8088 | `http://localhost:8088/swagger-ui.html` |

## Evidencia de prueba rapida

Fecha de prueba local: 2026-05-08.

Resultado de `/api-docs`:

| Puerto | Estado |
| ---: | --- |
| 8082 | OK 200 |
| 8083 | OK 200 |
| 8084 | OK 200 |
| 8085 | OK 200 |
| 8086 | OK 200 |
| 8087 | OK 200 |
| 8088 | OK 200 |

Endpoints GET probados:

| Prueba | URL | Resultado |
| --- | --- | --- |
| Usuario check | `GET http://localhost:8088/auth/check/test` | OK 200 |
| Publicaciones | `GET http://localhost:8086/publicaciones/listar` | OK 200 |
| Tareas | `GET http://localhost:8087/tareas/listar` | OK 200 |
| Hogares | `GET http://localhost:8083/hogares` | OK 200 |
| Cuentas/gastos | `GET http://localhost:8084/hogar-cuentas` | OK 200 |
| Notificaciones | `GET http://localhost:8085/notificaciones` | OK 200 |

Nota: `comprobante` actualmente expone crear, actualizar y eliminar, pero no tiene endpoint GET de listado.

Pruebas de escritura ejecutadas con datos temporales:

| Microservicio | Metodo probado | Resultado |
| --- | --- | --- |
| usuario | `POST /auth/register`, `POST /auth/login` | OK |
| publicacion | `POST /publicaciones/guardar`, `DELETE /publicaciones/{id}` | OK, recurso temporal eliminado |
| hogar | `POST /hogares`, `DELETE /hogares/{id}` | OK, recurso temporal eliminado |
| hogarcuenta | `POST /hogar-cuentas`, `DELETE /hogar-cuentas/{id}` | OK, recurso temporal eliminado |
| notificacion | `POST /notificaciones`, `DELETE /notificaciones/{id}` | OK, recurso temporal eliminado |
| comprobante | `POST /comprobantes`, `DELETE /comprobantes/{id}` | OK, recurso temporal eliminado |

Observacion tecnica: durante la prueba, `PUT /comprobantes/{id}` devolvia 500 cuando el request no enviaba `fechaSubida`. Se corrigio en `ComprobanteService` para conservar la fecha existente si el body trae `fechaSubida: null` o no la trae. Hay que reiniciar el microservicio `comprobante` para que el cambio quede activo en la app que esta corriendo.

## Comandos PowerShell para repetir la prueba

Verificar Swagger/OpenAPI de todos los servicios:

```powershell
$ports = 8082,8083,8084,8085,8086,8087,8088
foreach ($p in $ports) {
  $url = "http://localhost:$p/api-docs"
  try {
    $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 4
    "$p api-docs OK $($r.StatusCode)"
  } catch {
    "$p api-docs FAIL $($_.Exception.Message)"
  }
}
```

Verificar endpoints principales:

```powershell
$tests = @(
  @("usuario check", "http://localhost:8088/auth/check/test"),
  @("publicaciones listar", "http://localhost:8086/publicaciones/listar"),
  @("tareas listar", "http://localhost:8087/tareas/listar"),
  @("hogares listar", "http://localhost:8083/hogares"),
  @("hogar-cuentas listar", "http://localhost:8084/hogar-cuentas"),
  @("notificaciones listar", "http://localhost:8085/notificaciones")
)

foreach ($t in $tests) {
  try {
    $r = Invoke-WebRequest -Uri $t[1] -UseBasicParsing -TimeoutSec 5
    "$($t[0]) OK $($r.StatusCode)"
  } catch {
    "$($t[0]) FAIL $($_.Exception.Message)"
  }
}
```

## Endpoints por microservicio

### usuario - puerto 8088

| Metodo | Endpoint | Uso |
| --- | --- | --- |
| `POST` | `/auth/register` | Crear cuenta de usuario |
| `POST` | `/auth/login` | Iniciar sesion |
| `GET` | `/auth/check/{usuario}` | Revisar si un usuario existe |
| `PUT` | `/auth/profile/{id}/foto` | Actualizar foto de perfil |
| `POST` | `/auth/admin/create` | Crear admin, requiere rol admin |

Ejemplo registro:

```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:8088/auth/register" `
  -ContentType "application/json" `
  -Body '{"nombre":"Usuario Demo","correo":"demo@roomiegram.cl","telefono":"+56911111111","contrasena":"demo123","usuario":"demo_rubrica"}'
```

Ejemplo login:

```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:8088/auth/login" `
  -ContentType "application/json" `
  -Body '{"usuario":"demo_rubrica","contrasena":"demo123"}'
```

Ejemplo actualizar foto de perfil:

```powershell
Invoke-RestMethod -Method Put -Uri "http://localhost:8088/auth/profile/1/foto" `
  -ContentType "application/json" `
  -Body '{"fotoPerfil":"data:image/png;base64,iVBORw0KGgo="}'
```

### publicacion - puerto 8086

| Metodo | Endpoint | Uso |
| --- | --- | --- |
| `POST` | `/publicaciones/guardar` | Crear publicacion/oferta de habitacion |
| `GET` | `/publicaciones/listar` | Listar publicaciones |
| `DELETE` | `/publicaciones/{id}?usuarioSolicitante={usuario}&rolSolicitante={rol}` | Eliminar publicacion |

Ejemplo crear publicacion:

```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:8086/publicaciones/guardar" `
  -ContentType "application/json" `
  -Body '{"usuarioCreador":"demo_rubrica","titulo":"Habitacion demo para rubrica","ubicacion":"Santiago Centro","descripcion":"Habitacion amoblada cercana al metro.","precio":250000,"numeroHabitaciones":1,"numeroPersonas":1,"numeroBanos":1,"imagen":"data:image/png;base64,iVBORw0KGgo=","galeria":["data:image/png;base64,iVBORw0KGgo="]}'
```

Los campos `imagen` y `galeria` son opcionales. Se guardan como texto largo (`LONGTEXT`) para aceptar imagenes en formato data URL/base64 desde el frontend. Esto permite que una publicacion creada en un entorno dockerizado sea visible desde otro navegador o PC mientras use la misma base de datos.

### tarea - puerto 8087

| Metodo | Endpoint | Uso |
| --- | --- | --- |
| `POST` | `/tareas/guardar` | Crear tarea de convivencia |
| `GET` | `/tareas/listar` | Listar tareas |

Ejemplo crear tarea:

```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:8087/tareas/guardar" `
  -ContentType "application/json" `
  -Body '{"titulo":"Limpiar cocina","encargado":"Sofia","descripcion":"Ordenar cocina compartida","fecha":"2026-05-08"}'
```

### hogar - puerto 8083

| Metodo | Endpoint | Uso |
| --- | --- | --- |
| `POST` | `/hogares` | Crear hogar |
| `GET` | `/hogares` | Listar hogares |
| `GET` | `/hogares/{id}` | Obtener hogar |
| `POST` | `/hogares/{id}/solicitudes` | Solicitar ingreso |
| `POST` | `/hogares/{id}/solicitudes/{usuarioId}/aprobar` | Aprobar solicitud |
| `POST` | `/hogares/{id}/solicitudes/{usuarioId}/rechazar` | Rechazar solicitud |
| `DELETE` | `/hogares/{id}/integrantes/{usuarioId}?administradorId={idAdmin}` | Remover integrante |
| `POST` | `/hogares/{id}/tareas` | Asociar tarea |
| `POST` | `/hogares/{id}/cuentas` | Asociar cuenta/gasto |
| `POST` | `/hogares/{id}/comprobantes` | Asociar comprobante |
| `POST` | `/hogares/{id}/publicaciones` | Asociar publicacion |
| `DELETE` | `/hogares/{id}?administradorId={idAdmin}` | Eliminar hogar |

Ejemplo crear hogar:

```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:8083/hogares" `
  -ContentType "application/json" `
  -Body '{"nombre":"Hogar demo rubrica","descripcion":"Departamento compartido para pruebas","usuarioCreadorId":1}'
```

### hogarcuenta - puerto 8084

| Metodo | Endpoint | Uso |
| --- | --- | --- |
| `POST` | `/hogar-cuentas` | Crear cuenta/gasto compartido |
| `GET` | `/hogar-cuentas` | Listar cuentas |
| `GET` | `/hogar-cuentas/{id}` | Obtener cuenta |
| `DELETE` | `/hogar-cuentas/{id}` | Eliminar cuenta |

Ejemplo crear cuenta:

```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:8084/hogar-cuentas" `
  -ContentType "application/json" `
  -Body '{"descripcion":"Internet departamento","monto":36000,"deudores":[{"usuarioId":1},{"usuarioId":2},{"usuarioId":3}]}'
```

### comprobante - puerto 8082

| Metodo | Endpoint | Uso |
| --- | --- | --- |
| `POST` | `/comprobantes` | Crear comprobante |
| `PUT` | `/comprobantes/{id}` | Actualizar comprobante |
| `DELETE` | `/comprobantes/{id}` | Eliminar comprobante |

Ejemplo crear comprobante:

```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:8082/comprobantes" `
  -ContentType "application/json" `
  -Body '{"hogarCuentaId":1,"usuarioId":1,"nombreArchivo":"pago-demo.txt","tipoContenido":"text/plain","tamanoArchivo":12,"montoPagado":12000,"observacion":"Pago de prueba","archivo":"cGFnbw=="}'
```

### notificacion - puerto 8085

| Metodo | Endpoint | Uso |
| --- | --- | --- |
| `POST` | `/notificaciones` | Crear notificacion |
| `GET` | `/notificaciones` | Listar notificaciones |
| `GET` | `/notificaciones/{id}` | Obtener notificacion |
| `DELETE` | `/notificaciones/{id}` | Eliminar notificacion |

Valores permitidos:

- `tipo`: `INVITACION_HOGAR`, `CUENTA_HOGAR`, `TAREA_HOGAR`
- `estado`: `PENDIENTE`, `LEIDA`, `ACEPTADA`, `RECHAZADA`

Ejemplo crear notificacion:

```powershell
Invoke-RestMethod -Method Post -Uri "http://localhost:8085/notificaciones" `
  -ContentType "application/json" `
  -Body '{"usuarioEmisorId":1,"usuarioReceptorId":2,"hogarId":1,"referenciaId":1,"tipo":"TAREA_HOGAR","estado":"PENDIENTE","titulo":"Nueva tarea","mensaje":"Tienes una tarea asignada."}'
```

## Checklist para la rubrica funcional

- Frontend compila con `npm run build`.
- Login y registro usan `usuario` en `8088`.
- Home consume `publicacion` en `8086` y mantiene datos demo si el servicio falla.
- Tareas consume `tarea` en `8087`.
- Gastos consume `hogarcuenta` en `8084`.
- Hogares consume `hogar` en `8083`.
- Comprobantes consume `comprobante` en `8082`.
- Notificaciones consume `notificacion` en `8085`.
- Todos los microservicios tienen Swagger abierto para mostrar endpoints en vivo.
