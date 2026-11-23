FITREGISTER — Contexto general del proyecto
Proyecto: FITREGISTER
Tipo: Sistema de gestión y seguimiento de entrenamientos
Documento: PROJECT_CONTEXT.md

1. Descripción general
FITREGISTER es un sistema que busca facilitar el trabajo de los entrenadores al momento de crear, modificar, organizar y asignar rutinas, además de ayudarles a llevar un mejor seguimiento de sus clientes. También permite que los clientes tengan sus entrenamientos disponibles en el teléfono y puedan registrar lo que realmente hacen durante cada sesión.
El sistema contará con dos aplicaciones conectadas: una PWA para entrenadores y una aplicación móvil hecha con Ionic para clientes. Las dos se comunicarán con una API REST compartida, desarrollada con Node.js y Express, que utilizará Prisma para guardar y consultar información en PostgreSQL.
Cuando el entrenador cree o modifique una rutina desde la PWA, el cliente podrá consultar la rutina que tenga asignada en su aplicación móvil. Cuando el cliente registre pesos, repeticiones o el cumplimiento de una sesión, el entrenador podrá consultar esos registros desde la PWA.
FITREGISTER está dirigido a entrenadores que atienden a sus propios clientes, ya sea dentro de un gimnasio, por su cuenta o en línea. No es un sistema para administrar gimnasios completos.

2. Problemática
Muchos entrenadores utilizan notas, documentos, hojas de cálculo o mensajes para elaborar rutinas y llevar el seguimiento de sus clientes. Esto puede hacer que crear o actualizar una rutina tome más tiempo y que la información de cada persona quede repartida en diferentes lugares.
Por otra parte, los clientes pueden olvidar los pesos o las repeticiones que hicieron anteriormente y no siempre llevan un historial organizado. Eso dificulta comparar sus entrenamientos y saber qué información deben compartir con su entrenador cuando necesitan algún ajuste.
FITREGISTER busca resolver estas situaciones al agilizar la creación de rutinas para el entrenador y permitir que ambos trabajen con la misma información, cada uno desde la aplicación que le corresponde.

3. Objetivos
3.1 Objetivo general
Desarrollar un sistema integrado que permita a los entrenadores administrar clientes, crear y asignar rutinas de manera más rápida y consultar su progreso, mientras los clientes visualizan sus entrenamientos y registran sus resultados desde una aplicación móvil conectada a una API y base de datos compartidas.
3.2 Objetivos específicos
1. Permitir que entrenadores y clientes creen cuentas e ingresen con permisos diferentes.
2. Vincular cada cliente con su entrenador para compartir la información autorizada.
3. Recopilar información inicial del cliente mediante un cuestionario que apoye la elaboración de rutinas.
4. Facilitar la creación, edición, duplicación y asignación de rutinas con ayuda de un catálogo de ejercicios.
5. Mostrar en el móvil las rutinas y sesiones asignadas, con sus ejercicios y objetivos.
6. Registrar el peso y las repeticiones reales de cada serie, sin modificar los valores objetivo de la rutina.
7. Permitir que el cliente marque los días o sesiones que completó.
8. Conservar un historial para que cliente y entrenador consulten los entrenamientos anteriores.
9. Permitir que el cliente solicite cambios de ejercicios o rutinas y que el entrenador pueda atenderlos.
10. Ofrecer herramientas complementarias, como cronómetros de descanso y de duración del entrenamiento, según la prioridad acordada.
11. Mantener una experiencia PWA instalable y contemplar el trabajo sin conexión del entrenador, con sincronización real una vez que la API lo permita.

4. Usuarios del sistema
Entrenador
Utiliza la PWA. Puede administrar los clientes vinculados a su cuenta, revisar la información autorizada de sus perfiles, elaborar rutinas, asignarlas, consultar registros de entrenamiento y atender solicitudes de cambios. No podrá acceder a los datos de clientes vinculados a otro entrenador.
Cliente
Utiliza la aplicación móvil. Puede registrarse, vincularse con un entrenador, responder su cuestionario, consultar su rutina, registrar sus resultados, marcar sesiones completadas, revisar el historial y enviar solicitudes. No puede modificar las rutinas del entrenador ni consultar los datos de otros clientes.

5. Componentes y funcionalidades
5.1 PWA web para entrenadores
La PWA es el espacio donde el entrenador organiza su trabajo. Sus módulos principales son:
-Acceso y perfil. Registro, inicio y cierre de sesión del entrenador, consulta de datos de cuenta y acceso a sus funciones según el rol.
-Inicio. Panel con información general, indicadores y resúmenes del seguimiento de sus clientes.
-Clientes. Lista de clientes vinculados, búsqueda, consulta de perfiles y de la información que hayan compartido en el cuestionario. La vinculación estará relacionada con un código del entrenador.
-Rutinas. Creación, edición, organización por días, selección de ejercicios, series y repeticiones objetivo, asignación a clientes y consulta de planes existentes. La API contempla también la duplicación de rutinas para personalizarlas sin modificar las que utilizan otras personas.
-Ejercicios. Catálogo para facilitar la elaboración de rutinas. Se contempla un catálogo general y ejercicios creados por el entrenador, con datos como nombre, grupo muscular, descripción e imagen.
-Seguimiento. Consulta de entrenamientos registrados en el móvil, pesos y repeticiones por serie, sesiones completadas, historial y evolución de cada cliente.
-Notificaciones y solicitudes. Recepción de solicitudes enviadas por los clientes, por ejemplo cuando quieren cambiar un ejercicio o necesitan una nueva rutina. El entrenador podrá revisarlas y cambiar su estado.
-Plan Pro. El prototipo contempla un apartado de suscripción; las funciones comerciales, límites y pagos reales deberán definirse antes de implementarlos.
Características de PWA. Interfaz adaptable, manifiesto de aplicación, service worker, posibilidad de instalación y manejo de recursos en caché.

5.1.1 Funcionamiento de la PWA sin internet
Esta es una característica importante de FITREGISTER y se manejará con dos conceptos diferentes:
Recursos disponibles sin conexión: el service worker permite guardar archivos de la interfaz en caché para que puedan abrirse cuando no haya internet, siempre que se hayan cargado previamente. Esto no significa que los datos del servidor estén actualizados.
Trabajo local del entrenador: en el prototipo actual se utilizan localStorage e IndexedDB para consultar datos de ejemplo, guardar rutinas y ejercicios en el dispositivo, registrar cambios pendientes y mostrar indicadores del estado de conexión. También se simula el procesamiento de esos cambios cuando regresa internet.
Funcionamiento esperado al integrar la API: se busca que el entrenador pueda consultar los datos previamente disponibles en su dispositivo y realizar determinados cambios locales sin conexión. Estos cambios quedarían pendientes y se enviarían a la API al recuperar internet. Solo se mostrarían como sincronizados cuando el servidor confirmara que se guardaron correctamente en PostgreSQL.
Para conseguirlo habrá que definir qué operaciones podrán hacerse sin internet, cómo se almacenarán las versiones locales, qué pasará si un dato cambió en otro dispositivo y cómo se evitarán duplicados o pérdidas de información. La sincronización actual del prototipo es simulada: todavía no envía cambios a PostgreSQL.

5.2 Aplicación móvil para clientes
La aplicación móvil se desarrollará con Ionic con Angular y se preparará para Android mediante Capacitor y Android Studio. Está pensada para acompañar al cliente antes, durante y después de su entrenamiento.
-Registro e inicio de sesión. El cliente podrá crear una cuenta, iniciar sesión, cerrar sesión y consultar los datos permitidos de su perfil. El acceso se realizará mediante la API compartida.
-Vinculación con el entrenador. El sistema utilizará un código de vinculación del entrenador. El cliente lo ingresará en la aplicación para quedar asociado con ese entrenador. El orden exacto entre registro, vinculación y cuestionario deberá establecerse en el flujo de pantallas.
-Cuestionario inicial. El cliente responderá información útil para que el entrenador personalice el entrenamiento, como objetivo, experiencia, días disponibles y limitaciones físicas. Los campos autorizados aparecerán en el perfil que consulta el entrenador desde la PWA.
-Consulta de rutinas. Al recibir una asignación, el cliente verá la rutina vigente con sus días o sesiones, nombres de ejercicios, series, repeticiones objetivo, descansos e indicaciones disponibles. Si aún no tiene rutina, la aplicación se lo indicará.
-Registro de entrenamiento. Durante cada sesión podrá indicar el peso utilizado y las repeticiones realizadas en cada serie. La aplicación distinguirá lo que estaba planeado de lo que realmente hizo. Cada registro quedará asociado con una fecha, una sesión y un ejercicio.
-Cumplimiento del entrenamiento. El cliente podrá marcar una sesión como completada. El entrenador verá ese cumplimiento desde el módulo de Seguimiento de la PWA. La acción se guardará mediante la API y no se confirmará como exitosa si el servidor no la recibe.
-Historial y progreso. El cliente podrá consultar sesiones anteriores y revisar los pesos y repeticiones que registró. Con esta información podrá comparar sus resultados; las gráficas o indicadores avanzados se determinarán durante el diseño.
-Solicitudes al entrenador. Podrá enviar mensajes relacionados con el entrenamiento, como pedir que se cambie un ejercicio, solicitar otra rutina o hacer una consulta. En la PWA, el entrenador podrá ver la solicitud y atenderla. El alcance inicial se plantea como solicitudes con estados, no como chat completo en tiempo real.
-Cronómetros propuestos. Un temporizador para los descansos entre series o ejercicios y un cronómetro para mostrar cuánto dura la sesión. El control del tiempo puede funcionar dentro del teléfono; las horas de inicio y fin podrán guardarse en el registro de la sesión. Su prioridad y experiencia exacta siguen por concretar.
-Conectividad móvil. Para la primera integración, consultar rutinas actualizadas y confirmar registros requerirá conexión con la API. El guardado offline de sesiones y su sincronización posterior no se considera definido ni implementado para Ionic.
-Pantallas previstas: registro/acceso, vinculación y cuestionario, inicio, rutina asignada, detalle de sesión y series, historial, solicitudes y perfil. El diseño exacto se realizará durante el desarrollo móvil.

5.3 API REST compartida
La API conectará ambas aplicaciones con PostgreSQL y se encargará de aplicar las reglas del sistema, validar datos y proteger la información.
Tecnologías decididas: Node.js en versión LTS, Express, Prisma ORM, PostgreSQL, JWT y bcrypt. El proyecto usará npm para administrar las dependencias del backend. Se utilizarán solicitudes HTTP(S) con respuestas JSON y rutas bajo /api/v1. La herramienta específica para validar los datos se elegirá entre Zod y express-validator; por ahora no se considera cerrada esa elección.
Organización prevista del backend:
- routes/: rutas de los módulos.
- controllers/: recepción de solicitudes y respuestas.
- services/: reglas de negocio.
- middlewares/: autenticación, permisos y validación.
- prisma/: esquema y migraciones.
- utils/: funciones auxiliares.
Recursos previstos en la API: autenticación y perfiles, cuestionario, vínculos entrenador-cliente, clientes, ejercicios, rutinas, asignaciones, sesiones, registros por serie, seguimiento y solicitudes.
Rutas principales propuestas por el responsable de API:
| Recurso | Ejemplos de rutas bajo /api/v1 | Uso |
|---|---|---|
| Acceso | `POST /auth/registro`, `POST /auth/login`, `GET /auth/perfil` | Cuentas y acceso. |
| Cuestionario | `POST /cuestionario`, `GET /cuestionario` | Información inicial del cliente. |
| Vínculos | `POST /vinculos`, `GET /vinculos/mi-entrenador` | Asociación con entrenador. |
| Clientes | `GET /clientes`, `GET /clientes/:id` | Consulta autorizada desde la PWA. |
| Ejercicios | `GET /ejercicios`, `POST /ejercicios` | Catálogo general y propio. |
| Rutinas | `GET /rutinas`, `POST /rutinas`, `PUT /rutinas/:id`, `POST /rutinas/:id/duplicar` | Gestión de rutinas. |
| Asignaciones | `POST /asignaciones`, `GET /asignaciones/activa` | Compartir y consultar la rutina vigente. |
| Sesiones | `POST /sesiones`, `POST /sesiones/:id/series`, `PUT /sesiones/:id/completar` | Registro del entrenamiento. |
| Seguimiento | `GET /seguimiento/clientes/:id`, `GET /seguimiento/resumen` | Historial e indicadores. |
| Solicitudes | `POST /solicitudes`, `GET /solicitudes`, `PUT /solicitudes/:id` | Comunicación entrenador-cliente. |


Configuración del backend. La API utilizará variables de entorno como PORT, DATABASE_URL, JWT_SECRET y CORS_ORIGINS. Los nombres y valores requeridos se documentarán en api/.env.example, sin incluir contraseñas ni secretos reales. Las versiones efectivamente instaladas se documentarán en el reporte del entorno, no se supondrán por ser las últimas disponibles.

Seguridad. Los usuarios usarán cuentas con roles de entrenador o cliente. Las contraseñas se guardarán como hash con bcrypt. La API validará tokens JWT enviados mediante Authorization: Bearer <token> y comprobará los permisos en cada operación. El CORS se configurará para los orígenes web permitidos, pero no sustituye la autenticación ni protege por sí mismo las peticiones de Android.

5.4 Base de datos PostgreSQL
PostgreSQL será la fuente central de los datos del sistema. Prisma permitirá manejar el esquema, las relaciones, las consultas y las migraciones.

Entidades principales del modelo planteado:
FITREGISTER utilizará PostgreSQL como base de datos para almacenar la información de los entrenadores, clientes, rutinas y registros de entrenamiento.

La base de datos estará conectada con la API REST y permitirá que tanto la PWA como la aplicación móvil trabajen con la misma información.

Para organizar los datos, se tienen contempladas las siguientes tablas:

| Tabla | Información que almacenará |
|---|---|
| `usuarios` | Cuentas, correos, contraseñas protegidas, roles y estado de los usuarios. |
| `entrenadores` | Información del entrenador, código de vinculación y plan. |
| `clientes` | Datos personales y perfil de cada cliente. |
| `cuestionarios` | Objetivos, experiencia, disponibilidad y limitaciones del cliente. |
| `vinculos` | Relación entre entrenadores y clientes. |
| `ejercicios` | Catálogo de ejercicios, grupos musculares, descripciones e imágenes. |
| `rutinas` | Información general de las rutinas creadas por los entrenadores. |
| `rutina_dias` | Días y sesiones que conforman cada rutina. |
| `rutina_ejercicios` | Ejercicios, series, repeticiones objetivo y descansos. |
| `asignaciones` | Rutinas asignadas a los clientes y sus fechas de vigencia. |
| `sesiones` | Entrenamientos realizados, fecha, duración y cumplimiento. |
| `registros_series` | Pesos y repeticiones realizados en cada serie. |
| `solicitudes` | Solicitudes enviadas al entrenador y su estado. |

El modelo debe implementarse con llaves foráneas, restricciones adecuadas y migraciones de Prisma. No se deberán hacer cambios manuales a una base compartida que no queden registrados como migración.

6. Cómo funcionará el sistema completo
1. El entrenador crea su cuenta y accede a la PWA; el cliente se registra en Ionic.
2. El cliente utiliza el código de vinculación del entrenador y completa su cuestionario inicial en el orden que se establezca.
3. El entrenador consulta el perfil y cuestionario del cliente vinculado.
4. Desde la PWA crea o adapta una rutina, la organiza por días y la asigna al cliente.
5. La API guarda la rutina y su asignación en PostgreSQL.
6. El cliente entra a Ionic y consulta la rutina que le corresponde.
7. Al entrenar, registra peso y repeticiones por serie, y marca su sesión como completada cuando corresponda.
8. La API guarda los resultados; el historial móvil y el seguimiento web recuperan esos mismos datos.
9. Si necesita un cambio, el cliente envía una solicitud; el entrenador la revisa en Notificaciones y puede ajustar la rutina.
10. Los cambios del entrenador se reflejan cuando el cliente vuelve a consultar los datos actualizados.
Si el entrenador trabaja sin internet desde la PWA, los cambios locales permitidos deberán distinguirse de los que ya estén confirmados en el servidor.

7. Arquitectura y estructura del proyecto
FITREGISTER seguirá una arquitectura cliente-servidor, organizada lógicamente en tres capas:
1. Presentación: PWA del entrenador y aplicación móvil Ionic del cliente.
2. Lógica de negocio: API REST con Express, validación, autenticación y reglas.
3. Datos: PostgreSQL mediante Prisma.
El proyecto se manejará como un monorepositorio con partes separadas:

FITREGISTER/
├── api/                    # Node.js, Express, Prisma y endpoints
├── docs/                   # Documentación del sistema y los incrementos
├── movil/                  # Aplicación Ionic y Capacitor para clientes
├── pruebas/                # Casos de prueba y evidencias
├── web/                    # Módulos de la PWA del entrenador
├── index.html              # Entrada actual de la PWA
├── manifest.webmanifest    # Configuración de instalación de la PWA
├── sw.js                   # Service worker de la PWA
├── README.md               # Cómo ejecutar el proyecto
└── .gitignore              # Archivos excluidos de Git

La PWA actual está organizada por funcionalidades con HTML, CSS y JavaScript. Aunque el planteamiento inicial contempló Angular para la PWA, el prototipo compartido está realizado sin Angular. No se considera acordada una migración de la PWA a Angular. La aplicación móvil utilizará Ionic con Angular y Capacitor; su estructura concreta se definirá al iniciar el proyecto. La URL de la API se configurará en los archivos de entorno de la app móvil, sin dejar una dirección fija repartida entre componentes.
La API tendrá una organización por rutas, controladores, servicios y middlewares. Esto no implica que todo el sistema sea de microservicios.

8. Reglas de negocio
1. El entrenador solo accederá a los clientes vinculados a su cuenta.
2. El cliente solo podrá consultar y modificar su propia información autorizada.
3. Un cliente tendrá un único vínculo activo con un entrenador a la vez.
4. Un entrenador podrá estar vinculado con varios clientes.
5. Cada cliente tendrá una sola asignación de rutina activa a la vez; al sustituirla, el historial anterior se conservará.
6. El entrenador podrá asignar una misma rutina a varios clientes.
7. Si se modifica una rutina compartida, el cambio afectará a todos los clientes que usen esa rutina. Para personalizarla solo para uno, se deberá duplicar antes.
8. Los valores objetivo de una rutina y los resultados reales de las series se guardarán por separado.
9. Los registros conservarán la fecha y su relación con la sesión, el cliente y el ejercicio correspondiente.
10. Marcar una sesión como cumplida actualizará su seguimiento una vez que el servidor confirme el registro.
11. Las rutinas, días o ejercicios con historial asociado no se eliminarán de forma que se pierdan registros; se utilizará una estrategia de desactivación o conservación histórica.
12. Los cambios enviados sin internet no se mostrarán como sincronizados hasta recibir confirmación de la API.
13. Las solicitudes al entrenador tendrán estados controlados, por ejemplo pendiente, atendida o rechazada.
14. La API validará permisos y datos recibidos, incluso si la interfaz ya los validó.

9. Requisitos técnicos y de calidad
Usabilidad. Formularios claros, navegación sencilla y distinción entre metas de la rutina y resultados reales.
Seguridad. Acceso por roles, JWT, hash de contraseñas con bcrypt, validación de entradas y secretos guardados en variables de entorno no publicadas.
Integridad. Los datos compartidos se consultarán mediante la API; no se considerarán correctos registros sin confirmación del servidor. Se protegerá el historial al cambiar rutinas.
PWA. Debe poder instalarse en navegadores compatibles, contar con manifiesto y service worker, manejar recursos en caché y disponer de funciones útiles de gestión como Clientes y Rutinas, además de consultas.
Conectividad. Debe indicarse cuándo falta conexión y distinguir información almacenada localmente de información sincronizada. La PWA offline real necesitará pruebas de reintentos, conflictos y permisos.
Pruebas. Se comprobarán navegación, funcionalidades, validación, roles, API, base de datos, conectividad, funcionamiento de la PWA y ejecución de Android.
Configuración de entornos. Cada componente tendrá sus propias instrucciones de instalación y ejecución en el README.md. La API contará con un archivo .env.example y excluirá .env mediante .gitignore. La PWA tendrá una configuración central para la URL de la API cuando se realice su integración, conservando sus archivos de entrada en la raíz del repositorio.
Despliegue. Se contemplan Vercel o Netlify para la PWA, Render o Railway para la API y Neon o Railway para PostgreSQL. Estas plataformas son opciones, no decisiones finales. Se buscará HTTPS para los servicios desplegados. La app Android se probará como APK generada con Capacitor, sin publicación inicial en tiendas.

10. Alcance principal y funcionalidades complementarias
Alcance principal: cuentas y roles, vinculación entrenador-cliente, cuestionario inicial, catálogo de ejercicios, creación y asignación de rutinas, consulta móvil, registro por serie, cumplimiento, historial, seguimiento e integración por API con PostgreSQL.
Funcionalidades incluidas en el diseño, cuya prioridad o implementación final debe cerrarse: solicitudes al entrenador, cronómetros, sincronización real de cambios offline de la PWA, indicadores avanzados y Plan Pro. El prototipo ya muestra varias de estas interfaces, pero eso no equivale a su implementación con datos reales.
Fuera del alcance inicial: administración de gimnasios como negocio, planes alimenticios, relojes inteligentes, publicación en tiendas, pagos móviles completos y desarrollo específico para iOS, salvo que el equipo amplíe el alcance.

11. Estado de desarrollo y decisiones pendientes
La definición anterior describe el sistema que se quiere construir. En el momento en que se elaboró este documento, la PWA ya existía como prototipo con datos de ejemplo y operaciones locales; la API, PostgreSQL compartido y la aplicación Ionic todavía debían implementarse e integrarse. El repositorio GitHub y su versión inicial ya se habían preparado.
Decisiones cerradas: aplicación móvil con Ionic, Angular y Capacitor; API con Node.js, Express, Prisma y PostgreSQL; JWT y bcrypt; rutas REST con prefijo /api/v1; cliente vinculado mediante código del entrenador; un vínculo activo y una rutina asignada activa por cliente; conservación del historial.
Pendiente de definir o validar: elección entre Zod y express-validator; plataformas concretas de hosting, secuencia exacta de registro, cuestionario, contratos JSON completos, prioridades y alcance de solicitudes, cronómetros y Plan Pro, estrategia final de conflictos y sincronización offline, distribución definitiva de las tareas de pruebas. La PWA actual se mantiene con HTML, CSS y JavaScript.

12. Contexto del desarrollo
Durante el desarrollo de FITREGISTER utilizaremos estos documentos para mantener organizada y actualizada la información del proyecto.
Es importante conservarlos porque estamos trabajando en diferentes partes del sistema: PWA, aplicación móvil, API y base de datos. De esta manera, todos los integrantes podremos consultar las mismas decisiones y conocer cómo debe funcionar cada componente.
También nos servirán cuando utilicemos herramientas de inteligencia artificial como apoyo para programar, ya que podremos proporcionarles el contexto del proyecto, las tecnologías acordadas y las funcionalidades que necesitamos desarrollar. Esto ayudará a evitar propuestas que no correspondan con lo que estamos trabajando.

12.1 Actualización de los documentos
Para mantener la información actualizada seguiremos este proceso:
1. Cuando se tome una decisión importante sobre el proyecto, se actualizará `PROJECT_CONTEXT.md`.
2. Al comenzar un nuevo incremento, se crearán sus archivos `CURRENT_TASK.md` e `IMPLEMENTATION_PLAN.md`.
3. Si durante el desarrollo cambia alguna actividad, funcionalidad o decisión técnica, se actualizará el documento correspondiente.
4. Antes de integrar los cambios a GitHub, revisaremos que la documentación coincida con lo desarrollado.
5. Los cambios se registrarán mediante commits para conservar el historial de las modificaciones.

12.2 Ubicación de los documentos
Los documentos estarán disponibles en la carpeta `docs/` del repositorio de FITREGISTER.
- `docs/PROJECT_CONTEXT.md`: información general del proyecto.
- `docs/incremento-01/CURRENT_TASK.md`: actividades y criterios de aceptación del primer incremento.
- `docs/incremento-01/IMPLEMENTATION_PLAN.md`: pasos para desarrollar el primer incremento.
Cada nuevo incremento tendrá su propia carpeta para conservar la documentación de las etapas anteriores.
**Repositorio:** https://github.com/LuciaLeyva19/FITREGISTER
Cada integrante deberá consultar estos documentos antes de comenzar sus actividades y actualizarlos cuando realice cambios importantes.