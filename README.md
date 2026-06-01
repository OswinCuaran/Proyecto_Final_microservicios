# Sistema de Gestión de Pedidos y Facturación - Restaurante SI

Proyecto final basado en una arquitectura de microservicios para la gestión de productos, pedidos, facturación, cierre de jornada y visualización de métricas mediante Grafana.

## Descripción del problema

Muchos restaurantes pequeños gestionan sus pedidos, inventario y facturación de forma manual, lo que puede generar errores en el registro de productos, pérdida de información, falta de control de stock y dificultad para analizar las ventas diarias.

## Solución propuesta

Se desarrolló una aplicación web que permite administrar productos, registrar pedidos, generar facturas, controlar stock, cerrar jornadas de trabajo y visualizar estadísticas en tiempo real mediante Grafana.

## Tecnologías utilizadas

- FastAPI
- PostgreSQL
- HTML
- CSS
- JavaScript
- Docker
- Docker Compose
- Nginx
- Grafana
- GitHub

## Arquitectura del proyecto

El sistema está compuesto por los siguientes servicios:

- Backend: API REST desarrollada con FastAPI.
- Frontend: Interfaz web con HTML, CSS y JavaScript.
- Base de datos: PostgreSQL.
- Proxy web: Nginx.
- Monitoreo: Grafana conectado a PostgreSQL.
 - Monitoreo: Grafana conectado a PostgreSQL.

## Funcionalidades principales

- Registro de productos.
- Edición de productos.
- Eliminación de productos no asociados a pedidos.
- Control de stock.
- Registro de pedidos.
- Edición de pedidos pendientes.
- Eliminación de pedidos pendientes.
- Facturación de pedidos.
- Cierre de jornada.
- Tabla de facturas generadas.
- Filtros y búsqueda.
- Alertas visuales por estado.
- Dashboard en Grafana.

## Puertos del sistema

| Servicio | Puerto |
|---|---|
| Frontend (contenedor) | 80:80 |
| Nginx (proxy) | 8081:80 |
| Backend FastAPI | 8001:8000 |
| Grafana | 3001:3000 |
| PostgreSQL | 5433:5432 |

## Puertos del sistema

| Servicio | Puerto |
|---|---|
| Frontend | 8081 |
| Backend FastAPI | 8001 |
| Grafana | 3001 |
| PostgreSQL | 5433 |

# Instalación

# Clonar el repositorio:

```bash
git clone https://github.com/OswinCuaran/Proyecto_Final_microservicios.git
cd Proyecto_Final_microservicios
```
Crear el archivo `.env` basado en `.env.example` o copiar las variables mínimas que se indican más abajo.

Levantar los servicios con Docker Compose (modo foreground):

```bash
docker compose up --build
```

Para ejecutar en segundo plano y luego detener los servicios:

```bash
docker compose up --build -d
docker compose down
```

## Acceso a la aplicación

- Frontend (directo): http://localhost:80
- Nginx (proxy): http://localhost:8081
- Backend FastAPI: http://localhost:8001
- Documentación API (Swagger): http://localhost:8001/docs
- Grafana: http://localhost:3001
    - Usuario: `admin`
    - Contraseña: `admin`
    - Configuración de Grafana:
        - Al agregar PostgreSQL como Data Source desde Grafana (si Grafana y PostgreSQL están en la misma red Docker), use `postgres:5432` como host para conectarse desde Grafana al contenedor de PostgreSQL.
        - Si se conecta desde fuera de Docker (host), use `localhost:5433` y las credenciales publicadas.
        - Database: `microservicios_db`
        - User: `postgres`
        - Password: `postgres`
        - TLS/SSL: disable

## Dependencias del proyecto

### Dependencias del backend

El backend utiliza Python y las dependencias están definidas en:

```txt
backend/requirements.txt
```
## Instalación manual, si no usa Docker

Linux / macOS:

```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

Windows (PowerShell):

```powershell
cd backend
python -m venv venv
venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

## Herramientas necesarias

Para ejecutar el proyecto se recomienda tener instalado:

- Git
- Docker y Docker Compose (en Linux no es necesario Docker Desktop)
- Visual Studio Code (opcional)
- Navegador web
- Python 3.11 o superior, solo si se ejecuta sin Docker

## Variables de entorno mínimas

Crear un archivo `.env` con al menos las siguientes variables (si no usa Docker, adapte los valores):

```
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=microservicios_db
POSTGRES_PORT=5432
```

## Autores

- Oswin Cuarán
- Edwin Hernan Chenas


