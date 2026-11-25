FITREGISTER - MIGRACIÓN DE LA PWA A ANGULAR

## 1. Descripción general
FITREGISTER es un sistema de gestión y seguimiento de entrenamientos para gimnasios, compuestos por una aplicación web progresiva (PWA) dirigida a entrenadores y una app móvil destinada a clientes.
El sistema contempla una API REST central y una base de datos compartida, mediante las cuales ambos componentes podrán intercambiar información.
Incialmente, la PWA se desarrolló utilizando HTML, CSS Y JavaScript.
Posteriormente, se realizó una migración a Angular para mejorar la organización del código y facilitar el mantenimiento.

## ESTADO DE LA MIGRACIÓN: COMPLETADA Y VALIDADA
La versión Angular sustituye a la implementación web anterior y constituye la base actual para continuar el desarrollo de la PWA.

## Objetivo de la migración
El objetivo principal fue trasladar la PWA existente a Angular, conservando su diseño y las funcionalidades desarrolladas, pero organizando el código mediante componentes, servicios y rutas.
Los objetivos específicos fueron:
- Mantener las pantallas y el diseño visual de la aplicación original.
- Separar las funcionalidades en componentes Angular.
- Centralizar la lógica compartida mediante servicios.
- Implementar navegación utilizando Angular Router.
- Conservar el comportamiento responsivo para computadoras y dispositivos móviles.
- Mantener las capacidades de instalación y funcionamiento offline de la PWA.
- Preparar la estructura para la integración posterior con una API REST.
- Eliminar los archivos de la implementación anterior una vez verificado el funcionamiento de Angular.

## Tecnologías utilizadas

| Tecnología | Propósito |
|---|---|
| Angular | Desarrollo de la aplicación web |
| TypeScript | Lógica de componentes y servicios |
| HTML | Estructura de las interfaces |
| CSS | Estilos y diseño responsivo |
| Bootstrap 5 | Componentes visuales y distribución de interfaces |
| Angular Router | Navegación entre pantallas |
| Angular Service Worker | Recursos y funcionamiento offline |
| Web App Manifest | Instalación como aplicación |
| LocalStorage | Persistencia de determinados datos de demostración |
| IndexedDB | Almacenamiento local de información y operaciones simuladas |
| Node.js y npm | Administración de dependencias y herramientas de desarrollo |
| Git y GitHub | Control de versiones |

## Estructura del proyecto
La aplicación Angular se encuentra dentro de la carpeta web-angular/, ubicada en la raíz del repositorio FITREGISTER.

```text
FITREGISTER/
├── api/
├── docs/
├── movil/
├── pruebas/
├── web-angular/
│   ├── public/
│   │   ├── assets/
│   │   │   └── img/
│   │   └── manifest.webmanifest
│   ├── src/
│   │   ├── app/
│   │   │   ├── clientes/
│   │   │   ├── core/
│   │   │   ├── features/
│   │   │   ├── instalacion/
│   │   │   ├── notificaciones/
│   │   │   ├── plan-pro/
│   │   │   ├── rutinas/
│   │   │   │   ├── models/
│   │   │   │   └── services/
│   │   │   ├── seguimiento/
│   │   │   ├── app.component.ts
│   │   │   └── app.routes.ts
│   │   ├── index.html
│   │   ├── main.ts
│   │   └── styles.css
│   ├── angular.json
│   ├── ngsw-config.json
│   ├── package.json
│   ├── package-lock.json
│   ├── README_MIGRACION.md
│   ├── tsconfig.app.json
│   └── tsconfig.json
├── .gitignore
└── README.md
```

Organización de Angular
- clientes/: administración de los clientes del entrenador.
- core/: servicios generales de sesión y protección de rutas.
- features/: pantallas principales de inicio de sesión, registro e inicio.
- instalacion/: funcionalidad relacionada con la instalación de la PWA.
- notificaciones/: visualización de notificaciones.
- plan-pro/: interfaz demostrativa del plan Pro.
- rutinas/: gestión de rutinas, modelos, catálogo de ejercicios y servicios relacionados.
- seguimiento/: consulta del seguimiento de entrenamientos.
- app.component.ts: estructura principal, encabezado, navegación y menú responsivo.
- app.routes.ts: configuración de las rutas.
- public/: recursos estáticos, imágenes y manifiesto de la aplicación.
- ngsw-config.json: configuración de los recursos administrados por el Service Worker.

## Funcionalidades migradas
Durante la migración se trasladaron y adaptaron las siguientes funcionalidades.

Autenticación demostrativa
- Pantalla de inicio de sesión.
- Pantalla de registro.
- Administración local de la sesión.
- Protección de rutas mediante un guard de Angular.

Inicio
- Panel principal del entrenador.
- Visualización de indicadores.
- Diseño responsivo.
- Navegación hacia las funcionalidades del sistema.

Clientes
- Consulta y administración demostrativa de clientes.
- Visualización de información relacionada con sus entrenamientos.
- Integración con el módulo local de rutinas.

Rutinas y ejercicios
- Consulta de rutinas.
- Creación y edición de planes de entrenamiento.
- Asignación de rutinas a clientes.
- Catálogo de ejercicios.
- Persistencia local de información demostrativa.
- Recuperación de borradores.

Seguimiento
- Consulta de información demostrativa sobre el cumplimiento y seguimiento de rutinas.
- Visualización de datos relacionados con los entrenamientos.

Notificaciones
- Visualización de notificaciones demostrativas.
- Navegación desde una notificación hacia la rutina correspondiente.

Plan Pro
- Interfaz demostrativa del plan Pro.
- Acceso mediante una tarjeta promocional.
- Adaptación del acceso al menú móvil.
El módulo Plan Pro no procesa pagos reales ni administra suscripciones reales.

Instalación de la PWA
- Manifiesto de aplicación.
- Iconos de instalación.
- Configuración del Service Worker de Angular.
- Compatibilidad con instalación desde navegadores que admiten PWA.
- Almacenamiento en caché de recursos para el funcionamiento offline.

## Persistencia y sincronización
La PWA actualmente trabaja con datos demostrativos y almacenamiento local.
Se utilizan mecanismos como LocalStorage e IndexedDB para conservar información de prueba, incluyendo rutinas, ejercicios, borradores y estados de sincronización simulados.
Este funcionamiento permite realizar pruebas sin depender todavía de un servidor.
Importante: la sincronización actual es simulada. No existe una conexión real con PostgreSQL ni con una API REST de producción.
La futura integración deberá sustituir progresivamente la lógica demostrativa por solicitudes a los servicios de backend, cuidando la conservación y compatibilidad de las funcionalidades existentes.

## Configuración de la PWA
La aplicación utiliza los archivos:
- public/manifest.webmanifest
- ngsw-config.json
El manifiesto define los datos necesarios para que FITREGISTER pueda instalarse como aplicación compatible.
El Service Worker de Angular administra recursos estáticos y permite que determinados contenidos previamente almacenados en caché estén disponibles sin conexión.
La disponibilidad offline depende de los recursos cargados y almacenados previamente. Esto no equivale a una sincronización real con un servidor.

## Instalación y ejecución
Requisitos previos
- Node.js compatible con la versión de Angular utilizada.
- npm.
- Un navegador web actualizado.
- Visual Studio Code u otro editor de código.

## Obtener el repositorio
git clone <URL_DEL_REPOSITORIO>
cd FITREGISTER

Si el repositorio ya se encuentra descargado, no es necesario volver a clonarlo.

## Acceder al proyecto Angular
cd web-angular

## Instalar dependencias
npm install

## Ejecutar en desarrollo
npm start
Cuando el servidor esté disponible, abrir:
http://localhost:4200

La ejecución en desarrollo permite trabajar con los componentes y estilos de Angular.

Nota: las pruebas del Service Worker deben realizarse sobre una compilación de producción, no únicamente con el servidor de desarrollo.

## Compilación y pruebas de producción
Para generar una compilación de producción, ejecutar dentro de web-angular/:
npx ng build --configuration production

Si la compilación finaliza correctamente, los archivos generados estarán disponibles en la carpeta dist/, según la configuración de Angular.
Para probar la compilación localmente:
npx serve -s dist/fitregister/browser -l 8080
Abrir:
http://localhost:8080

Este procedimiento permite verificar la versión compilada, la navegación y las funciones propias de la PWA.

Nota: el comando npx serve puede solicitar instalar temporalmente la herramienta si todavía no está disponible.

## Validación de la migración
Después de trasladar las funcionalidades a Angular, se realizaron pruebas para comprobar su funcionamiento.
| Prueba | Resultado |
|---|---|
| Compilación Angular en producción | Correcta |
| Ejecución local de la compilación | Correcta |
| Navegación entre las pantallas principales | Correcta |
| Visualización de las imágenes utilizadas | Correcta |
| Consulta y edición de rutinas | Correcta |
| Navegación desde notificaciones hacia rutinas | Correcta |
| Acceso a Plan Pro desde el menú móvil | Correcta |
| Funcionamiento de recursos offline previamente cargados | Correcto |
| Funcionamiento sin la carpeta `legacy` | Correcto |
| Eliminación de la implementación web anterior | Completada |

Estas pruebas validan el alcance funcional revisado durante la migración. No representan todavía pruebas de integración con API, base de datos ni aplicación móvil.

## Limpieza de archivos anteriores
Una vez que la aplicación Angular funcionó correctamente sin depender de la implementación original, se eliminaron los archivos anteriores.
Entre los elementos eliminados se encuentran:
- FITREGISTER/index.html
- FITREGISTER/manifest.webmanifest
- FITREGISTER/sw.js
- FITREGISTER/web/
- FITREGISTER/web-angular/public/legacy/
- Copias temporales de respaldo del código antiguo.
Las imágenes y los iconos necesarios se conservaron en:
web-angular/public/assets/img/

Se actualizaron las referencias de los componentes y servicios para utilizar estas rutas.
La versión Angular es ahora la implementación activa de la PWA. El código anterior permanece recuperable mediante el historial de Git.

## Control de versiones
El proyecto utiliza Git y GitHub para registrar los cambios realizados durante el desarrollo.
La migración se preparó en la rama develop mediante un commit que incorpora la nueva estructura Angular y retira los archivos antiguos.
Mensaje:
Migrar PWA de FITREGISTER a Angular y eliminar version anterior

## Estado actual del proyecto
Estado actual del proyecto
Completado
- Migración de la PWA a Angular.
- Organización por componentes y servicios.
- Conservación de las funcionalidades demostrativas principales.
- Navegación mediante Angular Router.
- Adaptación responsiva para escritorio y móvil.
- Configuración de instalación de la PWA.
- Configuración de recursos offline.
- Compilación y validación de producción.
- Eliminación de archivos antiguos duplicados.
Pendiente
- Implementación de la API REST con Node.js y Express.
- Configuración de PostgreSQL y Prisma ORM.
- Autenticación real con JWT y contraseñas cifradas.
- Control de acceso real por roles.
- Integración de clientes, ejercicios y rutinas con el backend.
- Desarrollo e integración de la aplicación móvil Ionic Angular.
- Registro real de entrenamientos, pesos y repeticiones.
- Sincronización real entre dispositivos mediante la API.
- Pruebas de integración, seguridad y despliegue.

## Arquitecura prevista
FITREGISTER contempla una arquitectura de monolito modular organizada en tres componentes principales:
PWA Angular: interfaz para los entrenadores, desde la que podrán administrar clientes, crear y asignar rutinas, y consultar el seguimiento.
API REST Node.js y Express: componente central encargado de autenticación, validación, reglas de negocio y acceso a los datos.
Aplicación móvil Ionic Angular: interfaz para los clientes, en la que podrán consultar rutinas asignadas, registrar entrenamientos y revisar su historial.
La API utilizará Prisma ORM para comunicarse con PostgreSQL.
Tanto la PWA como la aplicación móvil consumirán los servicios de la misma API y utilizarán una base de datos central compartida.
Esta arquitectura corresponde al diseño previsto. Actualmente, la PWA es el componente funcional disponible y todavía requiere su integración con el backend real.