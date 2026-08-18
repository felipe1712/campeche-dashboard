# Manual del Administrador
**Sistema de Indicadores Estratégicos DIF Campeche**

Este documento proporciona las instrucciones de instalación, despliegue, y administración general del sistema, diseñado para personal técnico o administradores del portal.

---

## 1. Instrucciones de Instalación y Migración

### Requisitos Previos
- **PHP**: Versión 8.2 o superior.
- **Node.js**: Versión 18 o superior.
- **Base de Datos**: MySQL 8.0+ o MariaDB.
- **Composer**: Para instalar dependencias de PHP.
- **Nginx/Apache**: Servidor web.

### Instalación desde Cero
1. **Clonar Repositorio**:
   ```bash
   git clone <url-del-repositorio> campeche-dashboard
   cd campeche-dashboard
   ```
2. **Dependencias PHP**:
   ```bash
   composer install --optimize-autoloader --no-dev
   ```
3. **Configuración de Entorno**:
   - Copiar el archivo de ejemplo: `cp .env.example .env`
   - Configurar los parámetros de base de datos (`DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD`).
   - Generar la llave de la aplicación: `php artisan key:generate`
4. **Base de Datos**:
   - Ejecutar las migraciones y seeders iniciales:
   ```bash
   php artisan migrate --seed
   ```
5. **Dependencias Frontend y Compilación**:
   ```bash
   npm install
   npm run build
   ```
6. **Permisos**:
   - Asegurarse de que el servidor web pueda escribir en los directorios `storage` y `bootstrap/cache`:
   ```bash
   sudo chown -R www-data:www-data storage bootstrap/cache
   sudo chmod -R 775 storage bootstrap/cache
   ```

### Actualización o Migración
Si se están bajando nuevos cambios al servidor de producción, se debe seguir la siguiente rutina:
```bash
git pull origin main
composer install --no-dev
npm install
npm run build
php artisan migrate --force
php artisan optimize:clear
php artisan optimize
```

---

## 2. Descripción de las Secciones del Administrador

El sistema cuenta con un panel privado al que se accede iniciando sesión (ruta `/login`). Dentro del menú lateral, el administrador encontrará las siguientes herramientas:

### A. Usuarios (Admin)
- **Ruta**: `/users`
- **Descripción**: Permite el registro, edición y eliminación de usuarios con acceso al sistema.
- **Parámetros configurables**: Nombre, Correo electrónico y Contraseña. 

### B. Importar Excel
- **Ruta**: `/import`
- **Descripción**: Motor principal para la ingesta de datos. Se procesan los archivos en formato `.xlsx`. El sistema cuenta con algoritmos avanzados (`ExcelParserService`) que detectan años, municipios e indicadores, agrupándolos de manera automática.
- **Consideraciones**: Si el formato del Excel cambia estructuralmente, será necesario ajustar los *Parsers* (ej. `MissionThreeExcelParserService`).

### C. Catálogos Oficiales
- **Ruta**: `/catalog`
- **Descripción**: Gestión manual de Temas y Subtemas.
- **Uso**: Útil para dar de alta nuevas agrupaciones semánticas a los indicadores cuando se requiera clasificarlos de manera más específica.

### D. Asignación Manual
- **Ruta**: `/orphans`
- **Descripción**: Lista todos los indicadores huérfanos, es decir, aquellos que fueron extraídos del Excel pero que no se pudieron clasificar automáticamente bajo un tema o subtema existente.
- **Acción requerida**: El administrador puede editar cada registro y asignarle un catálogo válido.

### E. Administrar Indicadores
- **Ruta**: `/admin/indicadores`
- **Descripción**: Configuración visual de los **Indicadores Estratégicos** (aquellos marcados con estrella o que son clave para la organización).
- **Parámetros configurables**: 
  - **Título del Indicador**: El nombre descriptivo público.
  - **Tipo de Gráfica**: Permite seleccionar cómo se renderizará el indicador en el Dashboard público (Barras Verticales, Horizontales, Pastel, Dona, Área).

### F. Administrar Misiones
- **Ruta**: `/admin/misiones`
- **Descripción**: Control global sobre el nombre de las Misiones. 
- **Parámetros configurables**: Se pueden renombrar de "Misión 1" a nombres representativos (Ej. "Bienestar Social"). Esta etiqueta se replicará automáticamente en la Landing Page, Dashboard, y menús de carga.

---

## 3. Arquitectura y Stack Tecnológico
- **Backend**: Laravel 10 (PHP).
- **Frontend**: React.js 18 + Inertia.js.
- **Estilos**: Bootstrap y Tailwind CSS.
- **Gráficas**: ApexCharts.
- **Mapas**: SVG Interactivo del Estado de Campeche.
