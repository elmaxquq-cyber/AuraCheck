# Stack Tecnológico Cloud-Native — AuraCheck

El stack tecnológico describe las herramientas elegidas para construir, ejecutar, almacenar y publicar AuraCheck. Se propone una arquitectura por capas, con tecnologías conocidas y compatibles entre sí.

| Capa | Tecnologías permitidas / seleccionadas | Función |
|---|---|---|
| Frontend | HTML5 semántico, CSS3, JavaScript ES6+ (Fetch API), Bootstrap 5 | Interfaz adaptable, formularios, validaciones y comunicación con el servidor. En el prototipo actual se utiliza HTML, CSS y JavaScript nativo; Bootstrap queda como alternativa permitida. |
| Backend | JavaScript con Node.js y Express | Crear una API REST, validar datos, gestionar sesiones y aplicar las reglas del negocio. |
| Base de datos | MySQL 8 / MariaDB, con driver mysql2 | Guardar usuarios, productos, movimientos de stock, ventas y reportes de manera persistente. |
| Seguridad | HTTPS, bcryptjs, express-session, variables de entorno con dotenv | Proteger contraseñas, sesiones y credenciales de conexión. |
| Contenedores | Docker y Docker Compose | Empaquetar la aplicación y sus servicios para facilitar instalación y despliegue. |
| Infraestructura cloud | Servicio de contenedores o máquina virtual cloud; almacenamiento persistente para la base de datos | Ejecutar la aplicación y permitir su acceso desde distintos dispositivos. |
| Control de versiones y despliegue | Git, GitHub y pipeline CI/CD | Mantener versiones del código y automatizar pruebas y publicación. |

## Arquitectura propuesta

1. El navegador presenta la interfaz (Frontend).
2. JavaScript envía solicitudes HTTP a la API REST.
3. Node.js y Express procesan las solicitudes y validan la información.
4. El backend consulta o modifica los datos en MySQL.
5. La respuesta vuelve al navegador en formato JSON.
6. Docker facilita ejecutar los servicios en un entorno reproducible y desplegarlos en la nube.

## Aclaración sobre el estado del proyecto

La versión entregada en esta carpeta es un prototipo frontend. Sus datos de prueba se guardan en `localStorage` del navegador y no requieren servidor. Por eso, Node.js, Express, MySQL, Docker y el despliegue cloud se documentan como la arquitectura objetivo para una siguiente etapa; todavía no están conectados ni implementados en este prototipo. `localStorage` no reemplaza una base de datos de producción y las contraseñas del prototipo no deben utilizarse con cuentas reales.
