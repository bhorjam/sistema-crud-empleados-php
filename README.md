<div align="center">

#  Sistema CRUD de Empleados con PHP, PDO y MySQL

**Aplicación web moderna, segura y responsiva para la gestión integral de personal, construida con arquitectura limpia basada en API Fetch (JSON), consultas preparadas PDO y protección CSRF.**

![PHP](https://img.shields.io/badge/PHP-8.1%2B-777BB4?style=for-the-badge&logo=php&logoColor=white)
![MySQL](https://img.shields.io/badge/MySQL-MariaDB-4479A1?style=for-the-badge&logo=mysql&logoColor=white)
![Bootstrap](https://img.shields.io/badge/Bootstrap-5-7952B3?style=for-the-badge&logo=bootstrap&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-Fetch_API-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![License](https://img.shields.io/badge/Licencia-MIT-green?style=for-the-badge)

</div>

---

##  Vistas Previas del Sistema

> *Nota: Las siguientes vistas son ilustrativas y emplean datos ficticios para proteger la privacidad de registros reales.*

###  Vista de Escritorio (Gestión y Listado)
![Vista de escritorio del sistema CRUD](docs/images/crud-desktop.svg)

###  Formulario Adaptable (Registro y Validación)
![Formulario adaptable móvil](docs/images/crud-form-mobile.svg)

---

##  Características Principales

* **Gestión Completa (CRUD):** Creación, lectura, búsqueda, edición y eliminación de empleados sin recargar la página mediante consumo asíncrono con `fetch`.
* **Validación de Documentos (Perú):** Soporte para **DNI** (validación estricta de 8 dígitos) y **Carné de Extranjería (CE)**, además de validación de teléfono celular de 9 dígitos y campos obligatorios.
* **Búsqueda y Paginación Dinámica:** Filtrado instantáneo de registros, selector de cantidad de filas visibles por página y numeración correlativa automática.
* **Seguridad Reforzada:** Consultas parametrizadas con **PDO** para evitar inyecciones SQL y validación de tokens **CSRF** en todas las operaciones de escritura.
* **Diseño Responsivo:** Interfaz limpia desarrollada con **Bootstrap 5** y CSS personalizado, adaptable a pantallas de escritorio, tablets y móviles.

---

##  Arquitectura y Operaciones de la API

El frontend (`js.js`) se comunica con `api.php` enviando los cuerpos de escritura en formato **JSON** mediante `fetch`:

| Operación | Método HTTP | Descripción funcional |
| :--- | :---: | :--- |
| **Leer** | `GET` | Obtiene el listado paginado, numeración y resultados de búsqueda de empleados. |
| **Crear** | `POST` | Valida los datos recibidos en JSON y registra un nuevo empleado en MySQL. |
| **Actualizar** | `PUT` | Modifica la información de un empleado existente según su identificador. |
| **Eliminar** | `DELETE` | Elimina de forma segura el registro del empleado seleccionado. |

---

##  Tecnologías Utilizadas

* **Backend:** PHP 8.1 o superior (extensiones `PDO`, `pdo_mysql` y `mbstring`).
* **Base de Datos:** MySQL / MariaDB (compatible con XAMPP, Laragon o WAMP).
* **Frontend:** HTML5, CSS3, JavaScript (ES6+) y Bootstrap 5.

---

##  Estructura del Proyecto

```text
sistema-crud-empleados-php/
├── app/
│   └── empleados.php       # Lógica de negocio, validaciones y operaciones CRUD
├── config/
│   └── db.php              # Configuración y conexión PDO a la base de datos
├── db/
│   └── database.sql        # Script SQL único (creación de esquema y migración segura)
├── docs/
│   └── images/             # Vistas previas ilustrativas incluidas en la documentación
├── api.php                 # Punto de entrada HTTP y enrutamiento de la API
├── index.html              # Interfaz principal de usuario
├── js.js                   # Consumo de la API con Fetch, paginación y validaciones UI
├── styles.css              # Estilos personalizados de la interfaz
├── LICENSE                 # Licencia MIT
└── README.md               # Documentación del proyecto


 Instalación y Ejecución Local (XAMPP)
Clonar o descargar el repositorio:

Bash
git clone [https://github.com/bhorjam/sistema-crud-empleados-php.git](https://github.com/bhorjam/sistema-crud-empleados-php.git)
Ubicar el proyecto en el servidor local:

Copia la carpeta del proyecto dentro de C:\xampp\htdocs\crud (o el nombre de carpeta que prefieras).

Iniciar servicios en XAMPP:

Abre el panel de control de XAMPP e inicia los módulos de Apache y MySQL.

Importar la base de datos (crud_empleados):

Abre tu navegador e ingresa a http://localhost/phpmyadmin.

Ve a la pestaña Importar, selecciona el archivo db/database.sql y haz clic en Importar / Continuar.

Nota: El sistema utiliza una única base de datos llamada crud_empleados. El script crea la tabla empleados desde cero o actualiza esquemas antiguos de forma segura sin eliminar registros previos.

Configurar credenciales (opcional):

Si tu usuario o contraseña de MySQL son distintos a los valores por defecto de XAMPP (root sin clave), actualiza DB_USER y DB_PASS en config/db.php.

Ejecutar el sistema:

Abre tu navegador e ingresa a:

Plaintext
http://localhost/crud/


⭐ ¡Apoya este proyecto!
Si este código te ayudó a entender cómo estructurar un CRUD profesional con PHP, PDO y MySQL, o te sirvió como referencia para tus estudios y proyectos:

Regálale una estrella (⭐) en la parte superior derecha de este repositorio; me motiva a seguir creando y compartiendo más herramientas libres para la comunidad.

Haz un Fork si deseas adaptarlo y agregarle nuevas funciones (como reportes en PDF/Excel o autenticación de usuarios).

¿Tienes alguna duda o sugerencia de mejora? Abre un Issue y lo revisamos juntos.

📄 Licencia
Este proyecto se distribuye bajo la Licencia MIT. Consulta el archivo LICENSE para más detalles.

