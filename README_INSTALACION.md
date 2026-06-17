# Guía de Instalación del Tablero de Indicadores (Campeche)

Esta guía detalla los pasos necesarios para descargar, configurar y ejecutar el tablero de indicadores en cualquier equipo nuevo para propósitos de desarrollo o visualización local.

## 1. Requisitos Previos

Antes de comenzar, asegúrate de tener instalados los siguientes programas en tu equipo local:
* **PHP** (versión 8.1 o superior).
* **Composer** (gestor de dependencias de PHP).
* **Node.js y npm** (versión 18 o superior).
* **Git** (para descargar el proyecto).
* **MySQL** (puedes usar XAMPP, WAMP, Laragon, o MySQL Server nativo).

---

## 2. Descargar el Proyecto

Abre tu terminal (PowerShell, CMD o Git Bash) y ejecuta el siguiente comando para clonar el repositorio en tu máquina:

```bash
git clone https://github.com/felipe1712/campeche-dashboard.git
```

Ingresa a la carpeta recién creada:
```bash
cd campeche-dashboard
```

---

## 3. Instalación de Dependencias del Backend (Laravel)

El proyecto utiliza Laravel. Para instalar las dependencias de PHP, ejecuta:

```bash
composer install
```

---

## 4. Configuración de Variables de Entorno

1. En la raíz del proyecto encontrarás un archivo llamado `.env.example`. Cópialo y renómbralo para que se llame únicamente `.env`.
   ```bash
   copy .env.example .env
   ```
2. Genera la llave de seguridad de la aplicación ejecutando:
   ```bash
   php artisan key:generate
   ```

---

## 5. Configuración de la Base de Datos

1. Abre tu gestor de base de datos MySQL (por ejemplo, phpMyAdmin o MySQL Workbench) o asegúrate de tener el servidor encendido (si usas XAMPP, inicia Apache y MySQL).
2. Crea una nueva base de datos vacía. El proyecto por defecto asume el nombre:
   **`velzon_inertia_react`**
   *(Si deseas nombrarla diferente, actualiza el valor de `DB_DATABASE=` en tu archivo `.env`).*
3. Abre tu archivo `.env` y asegúrate de que las credenciales coincidan con las de tu equipo local (usualmente root sin contraseña en entornos locales):
   ```env
   DB_CONNECTION=mysql
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_DATABASE=velzon_inertia_react
   DB_USERNAME=root
   DB_PASSWORD=
   ```

---

## 6. Migración de Base de Datos y Semillas (Seeders)

Para crear las tablas de la base de datos e insertar los datos semilla (usuarios base y configuración inicial), ejecuta:

```bash
php artisan migrate --seed
```

---

## 7. Instalación y Compilación del Frontend (React + Inertia)

Ahora debemos instalar las dependencias visuales de Node.js e indicarle que empaquete nuestros assets, fuentes y estilos.

1. Instala las dependencias:
   ```bash
   npm install
   ```
2. Inicia el servidor de desarrollo de Vite (el cual observa y compila en tiempo real tus cambios). **Deja esta terminal corriendo.**
   ```bash
   npm run dev
   ```

---

## 8. Iniciar el Servidor de Laravel

Abre una **nueva pestaña** en tu terminal (sin cerrar la anterior donde dejaste corriendo `npm run dev`) y levanta el servidor web de PHP:

```bash
php artisan serve
```

## 9. ¡Listo! Acceso al Sistema
Una vez ejecutados estos comandos, la consola te mostrará una dirección, comúnmente **`http://127.0.0.1:8000`** o **`http://localhost:8000`**.

Ingresa a esa URL en tu navegador y verás la pantalla de Inicio de Sesión del Tablero con el nuevo diseño institucional de Campeche.
