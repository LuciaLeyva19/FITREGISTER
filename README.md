# FITREGISTER
FITREGISTER es un sistema de gestión y seguimiento de entrenamientos que busca facilitar el trabajo de los entrenadores al momento de crear, modificar y asignar rutinas, además de permitir que sus clientes registren y consulten su progreso.
El sistema estará formado por una aplicación web progresiva (PWA) para entrenadores y una aplicación móvil para clientes. Ambas se comunicarán mediante una API REST y compartirán una base de datos PostgreSQL.
## Tecnologías del proyecto
| Componente | Tecnología |
|---|---|
| PWA web | HTML, CSS y JavaScript |
| Aplicación móvil | Ionic, Angular y Capacitor |
| API REST | Node.js y Express |
| Base de datos | PostgreSQL |
| Acceso a datos | Prisma ORM |
| Autenticación | JWT y bcrypt |
| Control de versiones | Git y GitHub |
## Estructura del proyecto

```text
FITREGISTER/
├── api/             # API REST
├── docs/            # Documentación
├── movil/           # Aplicación Ionic
├── pruebas/         # Pruebas del sistema
├── web/             # Módulos de la PWA
├── index.html       # Página principal
├── manifest.webmanifest
├── sw.js
├── README.md
└── .gitignore
```
## Estado actual
FITREGISTER se encuentra en desarrollo.
Actualmente se cuenta con un prototipo de la PWA del entrenador que utiliza datos simulados y almacenamiento local.
La aplicación móvil, la API REST y la conexión real con PostgreSQL están pendientes de implementación.
## Requisitos para ejecutar la PWA
- Git para clonar el repositorio.
- Visual Studio Code u otro editor.
- Un navegador actualizado, como Google Chrome.
- Un servidor local para ejecutar la aplicación.
## Cómo ejecutar la PWA
### 1. Clonar el repositorio

```bash
git clone https://github.com/LuciaLeyva19/FITREGISTER.git
cd FITREGISTER
```

### 2. Abrir el proyecto
Abrir la carpeta FITREGISTER en Visual Studio Code.
### 3. Iniciar el servidor local
Puedes utilizar la extensión Live Server de Visual Studio Code.
1. Instalar la extensión Live Server.
2. Abrir el archivo `index.html` ubicado en la raíz.
3. Hacer clic en **Go Live**.
4. Abrir la dirección local que proporciona Live Server.
También puedes ejecutar la PWA con Node.js:
```bash
npx serve .
```
### 4. Probar la PWA
Una vez abierta la aplicación, se pueden revisar los módulos:
- Inicio
- Clientes
- Rutinas
- Ejercicios
- Seguimiento
- Notificaciones
Actualmente estos módulos trabajan con información simulada.
## Funcionamiento sin internet
La PWA utiliza un service worker para almacenar recursos de la interfaz en caché.
También utiliza almacenamiento local e IndexedDB para guardar información de demostración y representar cambios pendientes de sincronización.
La sincronización actual es simulada. La conexión real con PostgreSQL se implementará posteriormente mediante la API.
Para comprobar la carga sin conexión, primero se debe abrir la aplicación con internet y permitir que los recursos se almacenen en caché.
Después se puede utilizar el modo sin conexión del navegador para comprobar qué recursos siguen disponibles.
## API REST
**Estado: pendiente de implementación.**
La API se desarrollará utilizando Node.js, Express y Prisma ORM con PostgreSQL.
Se encargará de la autenticación, clientes, rutinas, asignaciones, registros de entrenamiento y seguimiento.
Las instrucciones de instalación y ejecución se agregarán cuando el backend esté disponible.
## Aplicación móvil
**Estado: pendiente de implementación.**
Se desarrollará con Ionic, Angular y Capacitor para Android.
Permitirá a los clientes consultar rutinas, registrar pesos y repeticiones, marcar entrenamientos cumplidos y revisar su historial.
Las instrucciones para ejecutarla se agregarán cuando exista el proyecto Ionic.
## Control de versiones
El proyecto utiliza Git y GitHub.
Las ramas previstas son:
- `main`: versión estable.
- `develop`: integración de avances.
- `feature/*`: desarrollo de funcionalidades.
Los cambios se registrarán mediante commits descriptivos y se integrarán mediante Pull Requests.
## Documentación
La documentación de FITREGISTER se encuentra en la carpeta `docs/`.
- `docs/PROJECT_CONTEXT.md`: contiene la información general del sistema, sus funcionalidades, arquitectura y tecnologías.
- `docs/incremento-01/CURRENT_TASK.md`: describe las funcionalidades y criterios de aceptación del primer incremento.
- `docs/incremento-01/IMPLEMENTATION_PLAN.md`: explica las actividades, responsables y pruebas para desarrollar el primer incremento.
Cada nuevo incremento tendrá su propia carpeta para conservar la documentación y los avances de cada etapa.

## Equipo
Proyecto integrador de la Universidad Tecnológica del Sur de Sonora.

l desarrollo se encuentra dividido entre PWA web, aplicación móvil, API y base de datos, y pruebas.
