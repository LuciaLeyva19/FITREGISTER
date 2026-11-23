FITREGISTER — Tarea actual
Documento: CURRENT_TASK.md
Incremento: 1 — Acceso y estructura inicial
Estado: En desarrollo
Contexto general: PROJECT_CONTEXT.md

1. ¿Qué vamos a hacer en este incremento?
En el primer incremento vamos a preparar las bases para que FITREGISTER deje de depender solamente de las pantallas simuladas. Queremos que el entrenador pueda acceder desde la PWA y el cliente desde la aplicación móvil, usando cuentas reales que se validen con la misma API.
La PWA ya tiene un prototipo desarrollado y el repositorio inicial se subió a GitHub. La API y la aplicación móvil deben construirse sobre esa base. Este incremento se concentrará en el acceso, los roles y la estructura técnica; todavía no será la integración completa de rutinas y seguimiento.

2. Resultado esperado
Al terminar, el proyecto podrá clonarse y ejecutarse siguiendo las instrucciones del repositorio. Tendremos una API con Express y Prisma conectada a PostgreSQL, cuentas de entrenador y cliente, autenticación por JWT, la PWA con acceso real y una app Ionic que permita iniciar y cerrar sesión y realizar una prueba en Android.

3. Qué sí incluye
- Revisar el repositorio GitHub, las carpetas y las instrucciones del README.md.
- Conservar y comprobar la ejecución del prototipo web existente.
- Crear la aplicación Ionic con Angular en movil/, con navegación y formularios iniciales.
- Preparar Capacitor y la ejecución de prueba en Android.
- Iniciar api/ con Node.js LTS y Express, organizado en routes/, controllers/, services/, middlewares/, prisma/ y utils/.
- Configurar Prisma y conexión con PostgreSQL mediante DATABASE_URL; crear api/.env.example con PORT, DATABASE_URL, JWT_SECRET y CORS_ORIGINS, sin subir secretos.
- Crear mediante migraciones las tablas mínimas para usuarios, roles y perfiles de entrenador y cliente.
- Implementar registro, inicio de sesión y consulta del perfil mediante /api/v1/auth/registro, /api/v1/auth/login y /api/v1/auth/perfil.
- Proteger contraseñas con bcrypt y las rutas privadas con JWT y comprobación de rol.
- Definir las respuestas JSON, validaciones y mensajes de error del acceso.
- Conectar el inicio y cierre de sesión de la PWA y de Ionic con la API.
- Ejecutar pruebas de acceso, permisos y funcionamiento básico, dejando sus evidencias.

4. Qué no incluye todavía
No se consideran terminados en este incremento: vinculación mediante código, cuestionario completo, gestión real de clientes, catálogo compartido, creación y asignación real de rutinas, registro de series, cumplimiento, historial, seguimiento o solicitudes.
Tampoco se implementará todavía la sincronización real offline con la API. La PWA ya contiene una simulación de caché, guardado local y cambios pendientes en IndexedDB, pero ese comportamiento se conserva como prototipo mientras se prepara la integración correspondiente a un incremento posterior. La app Ionic no tendrá guardado offline de sesiones en este incremento.
Los cronómetros, Plan Pro y pagos tampoco forman parte de los criterios de aceptación actuales.

5. Criterios de aceptación

## 5. Criterios de aceptación

| ID | Criterio | Cómo se verificará |
|---|---|---|
| CA-01 | El repositorio se puede clonar y la PWA se puede ejecutar siguiendo el README, sin necesitar la API. | Probar desde una carpeta limpia o con otro integrante. |
| CA-02 | La app Ionic inicia y permite navegar entre sus pantallas de acceso. | Ejecutar `ionic serve`. |
| CA-03 | La app Ionic se ejecuta en Android con Capacitor. | Probar en emulador o dispositivo. |
| CA-04 | La API inicia, aplica las migraciones y se conecta a PostgreSQL con Prisma. | Ejecutar el servidor y realizar una consulta de prueba. |
| CA-05 | Se puede crear una cuenta de entrenador y una de cliente. | Probar `POST /api/v1/auth/registro`. |
| CA-06 | Se rechazan correos duplicados y datos inválidos; las contraseñas se guardan protegidas. | Revisar los errores y los datos almacenados. |
| CA-07 | El inicio de sesión correcto devuelve un JWT y el incorrecto se rechaza. | Probar `POST /api/v1/auth/login`. |
| CA-08 | Los usuarios sin token o sin permisos no pueden acceder a rutas protegidas. | Verificar respuestas `401` y `403`. |
| CA-09 | El entrenador puede iniciar y cerrar sesión en la PWA con la API real. | Realizar una prueba desde la interfaz. |
| CA-10 | El cliente puede iniciar y cerrar sesión en Ionic con la API real. | Realizar una prueba desde la aplicación móvil. |
| CA-11 | Los resultados de las pruebas quedan documentados y los cambios se revisan antes de integrarlos. | Revisar evidencias en `pruebas/` y Pull Requests. |

6. Responsables

## 6. Responsables

| Área | Responsable | Trabajo principal |
|---|---|---|
| PWA web | Lucía Leyva | Mantener la PWA y conectar el inicio de sesión con la API. |
| Aplicación móvil | Jose Luis Acuña | Desarrollar pantallas, navegación y pruebas en Android. |
| API y PostgreSQL | Omar Campos | Configurar Express, Prisma, autenticación y permisos. |
| Pruebas | Stephany Valenzuela | Realizar pruebas, registrar resultados y corregir errores. |
| Documentación | Todo el equipo | Mantener actualizados los documentos y las instrucciones del proyecto. |

7. Acuerdos técnicos aplicables
Se utilizará Node.js LTS, npm, Express, Prisma, PostgreSQL, JWT y bcrypt. Para la app móvil se utilizará Ionic con Angular y Capacitor. Se registrarán las versiones realmente instaladas en el informe del entorno; no se darán por instaladas las versiones más recientes. La API manejará JSON y el prefijo /api/v1. El código se organizará por rutas, controladores, servicios y middlewares. Los secretos estarán en variables de entorno, excluidas del repositorio. Las modificaciones al modelo de datos se guardarán mediante migraciones de Prisma.
Aunque el código de vinculación y las tablas de rutinas ya están contemplados en el contexto general, su implementación no se dará por completada en este incremento.

8. Configuración que debe quedar documentada
El README.md explicará cómo ejecutar cada componente según esté disponible. La API deberá incluir api/.env.example y un script de desarrollo comprobado en package.json; la aplicación móvil tendrá configurada su dirección de API para navegador y Android, y la PWA dispondrá de una configuración central al comenzar a consumir el backend. Los comandos de la API y de Ionic se probarán antes de presentarlos como instrucciones funcionales.

9. Trabajo paralelo de la PWA
Como FITREGISTER también debe presentarse en la materia de PWA, en paralelo se verificará la instalación, el manifiesto, el service worker, el comportamiento de la interfaz sin internet, el estado actual de los módulos Clientes y Rutinas y los requisitos de despliegue. También se prepararán las evidencias, la URL del sitio, el repositorio, el Gantt y el documento técnico de esa materia.
Estas actividades son importantes para el proyecto, pero no sustituyen los criterios CA-01 a CA-11. Tener dos módulos simulados funcionando localmente no significa que ya estén conectados a PostgreSQL. La revisión de la sincronización offline real se planificará por separado.

10. Definición de terminado
Este incremento terminará cuando los criterios de aceptación estén comprobados, no existan errores que impidan los recorridos principales, otro integrante haya revisado los cambios y las evidencias se encuentren registradas.
Después seguiremos con el incremento 2: vinculación, cuestionario y asignación/consulta de rutinas.