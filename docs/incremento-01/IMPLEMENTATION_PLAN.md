FITREGISTER — Plan de implementación
Documento: IMPLEMENTATION_PLAN.md
Incremento: 1 — Acceso y estructura inicial
Relacionado con: PROJECT_CONTEXT.md y CURRENT_TASK.md

1. Objetivo del plan
Organizar el trabajo para que la PWA del entrenador y la aplicación móvil del cliente puedan utilizar una misma API para registrarse e iniciar sesión.

| Componente | Responsable | Qué desarrollará |
|---|---|---|
| PWA | Lucía | Revisar los formularios de acceso, conectarlos a la API y verificar que los módulos existentes sigan funcionando. |
| App móvil | Jose Luis Acuña | Crear la app, preparar navegación, registro, login y prueba Android. |
| API y BD | Omar Campos | Node.js, Express, Prisma, PostgreSQL, JWT, bcrypt y permisos. |
| Pruebas | Stephany Valenzuela | Preparar casos, probar el acceso y registrar los resultados. |
| Documentación | Todos | Actualizar README, contratos y evidencias. |

3. Actividades y orden de trabajo

| Paso | Actividad | Resultado que debemos obtener | Dependencia |
|---|---|---|---|
| 1 | Revisar `main`, ramas, `.gitignore`, `README.md` y carpetas del repositorio. | Proyecto disponible para todos, sin secretos ni archivos innecesarios. | Repositorio inicial. |
| 2 | Clonar el proyecto en otra carpeta y ejecutar la PWA existente. | Instrucciones verificadas y prototipo accesible. | Paso 1. |
| 3 | Crear proyecto Ionic con Angular dentro de `movil/` y sus pantallas iniciales. | Navegación y formularios visibles con `ionic serve`. | Paso 1. |
| 4 | Preparar Capacitor y Android Studio. | Primera ejecución de la app en Android. | Paso 3. |
| 5 | Inicializar el servidor Node.js + Express en `api/`. | Servidor levantado y rutas organizadas. | Paso 1. |
| 6 | Crear `api/.env.example` con `PORT`, `DATABASE_URL`, `JWT_SECRET` y `CORS_ORIGINS`. Configurar Prisma y PostgreSQL y crear la migración inicial. | Esquema inicial de usuarios y perfiles guardado en la base de datos. | Paso 5. |
| 7 | Acordar contratos JSON de registro, login y perfil. | Campos, validaciones, respuestas y errores definidos para web y móvil. | Pasos 3 y 5; antes de 9 y 10. |
| 8 | Implementar registro, login y perfil con bcrypt, JWT y verificación de roles. | Endpoints de autenticación probados. | Pasos 6 y 7. |
| 9 | Conectar los formularios de la PWA a la API y manejar carga, errores y cierre de sesión. | Acceso real del entrenador. | Paso 8. |
| 10 | Conectar los formularios de Ionic a la API. | Acceso real del cliente. | Pasos 3 y 8. |
| 11 | Ejecutar pruebas, resolver errores, revisar y fusionar cambios. | CA-01 a CA-11 comprobados y documentados. | Pasos 1 al 10. |

4. Estructura prevista del backend
api/
├── routes/          # Rutas de los módulos
├── controllers/     # Solicitudes y respuestas
├── services/        # Lógica de negocio
├── middlewares/     # Autenticación, roles, validación
├── prisma/          # Esquema y migraciones
├── utils/           # Funciones de apoyo
├── .env.example     # PORT, DATABASE_URL, JWT_SECRET, CORS_ORIGINS (sin valores privados)
└── ...              # Archivos de configuración del proyecto
Las carpetas podrán organizarse internamente por módulos, como autenticación, clientes, rutinas o sesiones. Esta estructura es el acuerdo general; no obliga a crear archivos vacíos que no se estén utilizando.

5. Acuerdos para integrar web, móvil y API
- Prefijo de rutas: /api/v1.
- Intercambio de información: JSON mediante HTTP(S).
- Inicio de sesión: POST /api/v1/auth/login; registro: POST /api/v1/auth/registro; perfil: GET /api/v1/auth/perfil.
- Roles: entrenador y cliente. Cada ruta protegida deberá comprobar el token y el permiso.
- Hash de contraseñas: bcrypt. Tokens: JWT mediante Authorization: Bearer <token>.
- Errores: estructura uniforme y códigos HTTP adecuados (400, 401, 403, 404, 500, según corresponda).
- Validaciones: elegir Zod o express-validator y aplicar las mismas reglas acordadas a las solicitudes.
- Versiones: comprobar las versiones instaladas con los comandos locales y las dependencias reales en package.json y su archivo de bloqueo; no copiar números de versión no verificados.
- Entorno: verificar que exista el script npm run dev antes de recomendarlo; el archivo api/.env no se sube a Git.
- Móvil: preparar Ionic con Angular y Capacitor; comprobar ionic serve, ionic build y la configuración Android con los archivos que realmente genere el proyecto.
- Base de datos: Prisma con migraciones compartidas, sin subir valores reales de .env.
- CORS: permitir los orígenes web necesarios; no usar CORS como sustituto de los permisos ni del JWT.
- PWA: reemplazar la autenticación simulada por peticiones reales sin alterar innecesariamente los demás módulos.
- Ionic: definir la URL de API apropiada para navegador, emulador y dispositivo; no asumir que localhost del teléfono apunta al servidor de la computadora.

6. Pasos para preparar y comprobar los entornos
1. API: instalar Node.js LTS y npm; inicializar api/ como proyecto Node.js; instalar Express, Prisma, el cliente de Prisma, JWT, bcrypt y la herramienta de validación elegida. Agregar un script dev real a package.json y comprobarlo ejecutándolo.
2. Variables de entorno: mantener api/.env local y privado. Incluir api/.env.example sin secretos, con PORT, DATABASE_URL, JWT_SECRET y CORS_ORIGINS.
3. PostgreSQL: configurar una base de desarrollo, definir el esquema mínimo en Prisma, generar y ejecutar migraciones con npx prisma migrate dev y probar una consulta desde la API.
4. Pruebas de API: utilizar Postman o una herramienta equivalente para comprobar registro, login, perfil y rechazo de peticiones sin permisos.
5. PWA: ejecutar la aplicación desde la raíz del repositorio con un servidor local HTTP (por ejemplo npx serve .), ya que allí están index.html, sw.js y el manifiesto. Configurar después la URL de API en un lugar central; la interfaz no debe depender de variables privadas.
6. Móvil: crear Ionic con Angular, ejecutar ionic serve y después configurar Capacitor, compilar y probar en Android Studio. La dirección de la API para el emulador o teléfono se configurará específicamente: localhost dentro del dispositivo no es la computadora que ejecuta Express.
7. Documentación: completar el README.md y el informe del entorno usando versiones verificadas, no solamente las últimas publicadas. No anunciar como funcionales comandos de módulos todavía vacíos.

7. Plan de pruebas

| Prueba | Qué debemos revisar | Evidencia |
|---|---|---|
| Entorno | Clonación y ejecución siguiendo el README. | Pasos realizados y captura. |
| Servidor y BD | Express conecta con PostgreSQL y aplica migraciones Prisma. | Salida de migración y consulta de prueba. |
| Registro | Creación válida, correo duplicado y campos incorrectos. | Solicitudes y respuestas. |
| Contraseñas | No se guardan contraseñas en texto plano. | Comprobación de hash en base de pruebas. |
| Login | Credenciales correctas generan token; incorrectas son rechazadas. | Respuestas HTTP. |
| Permisos | Sin token devuelve `401`; sin rol autorizado devuelve `403`. | Pruebas sobre rutas protegidas. |
| PWA | Registro/acceso del entrenador y cierre de sesión. | Recorrido de interfaz. |
| Ionic | Registro/acceso del cliente, navegación y Android. | Prueba en `ionic serve` y dispositivo/emulador. |
| Regresión | Los módulos actuales de la PWA no presentan errores bloqueantes después de conectar el login. | Lista de revisión y capturas. |

Las evidencias se guardarán en pruebas/ y se asociarán con los criterios de CURRENT_TASK.md. Si una prueba falla, se documentará el defecto y se volverá a ejecutar después de corregirlo.

8. Trabajo paralelo: PWA instalable y funcionamiento sin conexión
Mientras se desarrolla el acceso real, también se revisará la PWA para cumplir la entrega de esa materia. Estas actividades son paralelas al incremento de autenticación:
1. Comprobar que el manifiesto y el service worker se registren correctamente y que la PWA pueda instalarse.
2. Verificar qué recursos se guardan en caché y qué ocurre si se abre la aplicación sin internet después de haberla utilizado.
3. Probar los módulos de Clientes y Rutinas y distinguir sus operaciones locales simuladas de las que realmente lleguen a la API.
4. Revisar las rutinas y ejercicios guardados en localStorage e IndexedDB, la cola de cambios pendientes y los indicadores de conexión.
5. Documentar que, por ahora, recuperar la conexión simula la sincronización y no transmite información a PostgreSQL.
6. Preparar una especificación para la sincronización real: guardar una operación local pendiente, reintentarla al recuperar conexión, confirmar recepción del servidor, resolver conflictos y mostrar el estado correcto al entrenador.
7. Reservar la implementación y las pruebas completas de sincronización con API para un incremento posterior, cuando existan endpoints, identificadores persistentes y reglas de actualización de rutinas y ejercicios.
8. Preparar el despliegue por HTTPS, la URL de hosting, el Gantt, el enlace del repositorio y las evidencias técnicas de PWA.
La app móvil Ionic no hereda automáticamente el funcionamiento offline de la PWA. Su consulta y guardado de entrenamientos se diseñarán inicialmente con conexión, y cualquier modo sin internet será una decisión adicional.

9. Estrategia de GitHub
- main: versión estable revisada.
- develop: rama de integración prevista; crearla y utilizarla si el equipo mantiene ese flujo.
- feature/pwa, feature/movil, feature/api y otras ramas feature/*: trabajo de cada componente o funcionalidad.
- Cambios a develop o main: mediante Pull Requests, revisión y pruebas.
- Commits claros, por ejemplo feat(api): implementar login con JWT, feat(movil): crear formularios de acceso y docs: actualizar contratos de autenticacion.
- Versiones importantes: etiquetas como v0.1.0 para el prototipo inicial; los siguientes números se asignarán a avances integrados y comprobados.

10. Riesgos y cómo los atenderemos

| Riesgo | Cómo lo vamos a manejar |
|---|---|
| La API tarda más que las interfaces. | Trabajar con pantallas provisionales, sin marcar la integración como terminada hasta probarla. |
| Los campos JSON no coinciden. | Revisar el contrato entre backend, web y móvil antes de conectar. |
| Las migraciones cambian sin avisar. | Versionarlas con Prisma y probarlas en una base de desarrollo. |
| Falla el acceso en Android. | Probar desde temprano la URL del servidor y la configuración de Capacitor. |
| Un usuario ve información de otro. | Aplicar controles de permisos en la API y realizar pruebas negativas. |
| El login real afecta pantallas simuladas. | Hacer pruebas de regresión de Inicio, Clientes, Rutinas y Seguimiento. |
| Se confunde la sincronización local con la real. | Mostrarla como demostración hasta que exista confirmación del servidor. |
| Queda poco tiempo para la entrega de PWA. | Priorizar módulos útiles, instalación, hosting, pruebas y evidencias en paralelo. |

11. Incrementos posteriores

| Incremento | Objetivo principal | Componentes involucrados |
|---|---|---|
| 2 — Vinculación y rutinas | Código de entrenador, cuestionario, clientes, catálogo, creación y asignación de rutinas desde la PWA y consulta desde Ionic. | PWA, Ionic, API y BD. |
| 3 — Registros e historial | Registro de pesos y repeticiones por serie, cumplimiento de sesiones, historial y seguimiento del entrenador. | Ionic, PWA, API y BD. |
| 4 — Integración y validación | Recorrido completo, Android, permisos, conectividad, despliegue, pruebas y correcciones. | Equipo completo. |
Mejoras que deben calendarizarse de manera explícita: solicitudes/notificaciones reales, cronómetros, Plan Pro y sincronización offline real de la PWA. Si el equipo decide que alguna es obligatoria para su primera versión, deberá incorporarse a un incremento con criterios propios, sin asumir que la simulación equivale a una implementación terminada.

12. Cuándo estará listo este incremento
El incremento 1 estará terminado únicamente cuando se cumplan CA-01 a CA-11 del CURRENT_TASK.md, los resultados estén documentados, otro integrante revise los cambios y no haya errores bloqueantes en el acceso real de ambos tipos de usuario.
El repositorio y el prototipo ya son una base útil, pero no sustituyen las pruebas de registro, inicio de sesión, permisos y conexión real con PostgreSQL.