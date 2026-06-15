Contexto y problemática

El problema que resolvemos

En Santiago de Chile, muchas personas, especialmente estudiantes y trabajadores jóvenes, enfrentan dificultades para acceder a una vivienda individual debido al alto costo de arriendo, los gastos comunes y la necesidad de vivir cerca de zonas con buena conectividad. En este contexto, compartir departamento o casa se ha transformado en una alternativa cada vez más frecuente para reducir costos y mejorar el acceso a vivienda.

La problemática central ocurre cuando personas que no se conocen deben coordinar la búsqueda de un roomie, evaluar compatibilidad de convivencia, organizar gastos del hogar, distribuir tareas y mantener una comunicación ordenada dentro de una vivienda compartida. En la práctica, estos procesos suelen resolverse con herramientas separadas, como grupos de WhatsApp, planillas, publicaciones informales en redes sociales y acuerdos poco estructurados, lo que genera desorganización, conflictos y poca trazabilidad.

Resolver este problema es relevante hoy porque el costo de vida, la presión sobre el mercado de arriendo y la necesidad de optimizar gastos hacen que los hogares compartidos sean cada vez más comunes en zonas urbanas como Santiago. A medida que más personas optan por compartir vivienda, también aumenta la necesidad de contar con una plataforma digital que facilite tanto la búsqueda inicial de compañeros de piso como la gestión posterior de la convivencia.

El modelo de negocio involucrado corresponde a una plataforma digital de intermediación y gestión de convivencia. Por una parte, permite conectar a personas que buscan compartir vivienda mediante publicaciones, filtros y criterios de compatibilidad. Por otra, agrega herramientas de administración del hogar compartido, como control de tareas, gastos, comprobantes y notificaciones. Además, considera un modelo freemium con planes gratuitos y premium para ampliar funcionalidades.

La oportunidad detectada es clara: existe una necesidad real de centralizar en una sola aplicación procesos que actualmente están fragmentados. Roomiegram busca cubrir ese espacio combinando descubrimiento de roomies, organización del hogar y seguimiento operativo de la convivencia en una misma solución.

[Dato / cifra clave]
En la Región Metropolitana, el aumento sostenido del costo de arriendo y del gasto mensual en vivienda ha impulsado a más personas a optar por viviendas compartidas como estrategia para reducir su carga económica.

[Explica qué representa esta cifra y de dónde proviene]
Se recomienda respaldar esta sección con una fuente oficial o sectorial actualizada, por ejemplo INE, CASEN, Ministerio de Vivienda, Cámara Chilena de la Construcción o reportes del mercado de arriendo en Santiago. Si necesitas una versión más formal, puedes reemplazar este bloque por una cifra exacta validada, por ejemplo porcentaje de hogares arrendatarios, variación del arriendo o proporción de ingreso destinada a vivienda.

¿A quién impacta?
Usuario / actor principal:
Personas jóvenes, estudiantes, trabajadores y profesionales que buscan compartir vivienda en Santiago de Chile.

Otros actores afectados:
Arrendatarios actuales, administradores de hogares compartidos, propietarios que publican espacios disponibles y grupos de convivencia que necesitan organizar pagos, tareas y comunicación interna.

Contexto / industria:
Mercado de arriendo urbano, plataformas digitales de vivienda compartida y soluciones tecnológicas para organización doméstica.

Objetivos y alcance

Desarrollar una plataforma web que facilite la búsqueda de roomies y la gestión integral de la convivencia en hogares compartidos mediante herramientas de publicación, compatibilidad, organización y administración.

Objetivos específicos
1. Implementar un sistema de registro e inicio de sesión para administrar perfiles de usuario dentro de la plataforma.
2. Desarrollar un módulo de publicaciones que permita ofrecer y buscar espacios disponibles para compartir vivienda.
3. Incorporar funcionalidades para gestionar hogares compartidos, incluyendo tareas, gastos, comprobantes y notificaciones.
4. Diseñar un sistema de planes de suscripción que permita diferenciar funcionalidades entre usuarios gratuitos y premium.

Alcance del proyecto

Incluye
1. Registro, autenticación y administración básica de perfil de usuario.
2. Publicación y visualización de ofertas de vivienda y búsqueda de roomies.
3. Gestión de convivencia mediante módulos de hogares, tareas, gastos compartidos, comprobantes, notificaciones y planes de membresía.

Fuera de alcance
1. Integración con pasarelas de pago reales, contratos legales de arriendo y validación formal de identidad.
2. Despliegue productivo a gran escala, aplicación móvil nativa y automatización avanzada de moderación de contenido.

Metodología y planificación

Scrum

El proyecto se desarrolló bajo una metodología ágil Scrum, organizada en iteraciones cortas orientadas a entregar avances funcionales de manera incremental.

Duración de sprints / iteraciones:
Sprints de 1 a 2 semanas, según la planificación académica del semestre.

Ceremonias o instancias de seguimiento:
Reuniones de planificación, revisión de avances, seguimiento semanal y retrospectivas para ajustar el trabajo del equipo.

Herramienta de gestión:
Trello para organización de tareas, seguimiento del backlog y control del avance.

Plan de pruebas (QA)

| Tipo de prueba | Qué valida | Herramienta |
| --- | --- | --- |
| Unitarias | Lógica de componentes y servicios individuales | JUnit, pruebas por microservicio |
| Integración | Comunicación entre frontend, microservicios y base de datos | Postman, Swagger, pruebas manuales con Docker |
| Funcionales | Cumplimiento de flujos del usuario | Navegación web, pruebas manuales end-to-end |
| Rendimiento | Tiempo de respuesta básico en entorno local | Pruebas locales de carga controlada |
| Seguridad | Control de accesos, autenticación y exposición de endpoints | Spring Security, revisión manual de endpoints |

Estrategia de pruebas

Objetivo y cobertura esperada:
Validar que los flujos principales del sistema funcionen correctamente, desde el registro de usuarios hasta la gestión de convivencia en hogares compartidos.

Casos de prueba diseñados:
- Registro e inicio de sesión de usuario.
- Creación y visualización de publicaciones.
- Creación y administración de hogares.
- Registro de tareas y gastos.
- Subida y eliminación de comprobantes.
- Envío y visualización de notificaciones.
- Activación de suscripciones y cambio de plan.

Datos de prueba utilizados:
Usuarios de prueba, publicaciones demo, hogares temporales, tareas, gastos y comprobantes simulados en entorno local con MySQL.

Criterios de aceptación:
Cada funcionalidad se considera aprobada si permite completar el flujo esperado sin errores bloqueantes, persiste correctamente la información y responde de manera consistente desde el frontend y backend.

Ambiente de pruebas funcional:
Entorno local con Docker Compose, frontend en React + Vite, backend en microservicios Spring Boot y base de datos MySQL.

Conclusiones y trabajo futuro

Conclusiones

Sí, se cumplió el objetivo general del proyecto, ya que se logró desarrollar una plataforma funcional para apoyar tanto la búsqueda de roomies como la administración de la convivencia en hogares compartidos.

Principales logros del producto entregado:
- Implementación de una arquitectura basada en microservicios.
- Integración de frontend, backend y base de datos en un entorno unificado.
- Desarrollo de módulos funcionales para publicaciones, hogares, tareas, gastos, comprobantes, notificaciones y membresías.
- Disponibilidad de documentación técnica y despliegue local mediante Docker Compose.

Aprendizajes técnicos del equipo:
El equipo fortaleció conocimientos en desarrollo full stack, arquitectura de microservicios, consumo de APIs REST, uso de Docker, manejo de base de datos relacional y validación de flujos entre frontend y backend.

Aprendizajes de trabajo en equipo y gestión:
Se reforzó la importancia de dividir tareas, mantener una comunicación constante, documentar decisiones técnicas y trabajar con una planificación iterativa para cumplir entregas parciales.

Mayor desafío superado durante el semestre:
Uno de los mayores desafíos fue integrar múltiples microservicios con el frontend y asegurar que los flujos funcionales se mantuvieran consistentes durante el despliegue y las pruebas del sistema.

Trabajo futuro
1. Integrar pagos reales para los planes premium y automatizar renovaciones de suscripción.
2. Mejorar rendimiento, escalabilidad y observabilidad para un entorno productivo.
3. Incorporar recomendaciones inteligentes de compatibilidad entre usuarios.
4. Desarrollar una aplicación móvil y ampliar el potencial comercial del producto en el mercado de arriendos compartidos.