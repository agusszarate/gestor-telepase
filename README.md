# Gestor Telepase

App web para visualizar y gestionar las facturas de peaje de [telepase.com.ar](https://telepase.com.ar) de forma mas amigable.

## Funcionalidades

- Login con credenciales de Telepase
- Listado de facturas pendientes y pagadas
- Descarga de facturas en PDF
- Detalle de pasadas por factura (CSV parseado)
- Deteccion de hora pico por concesionario (AUBASA, Corredores Viales, Autopistas del Sol)
- Historial completo de facturas (no solo las recientes)
- Marcar facturas como pagadas
- Persistencia en PostgreSQL

## Stack

- **Next.js 16** (App Router)
- **Prisma 7** (PostgreSQL con driver adapter)
- **Cheerio** (scraping HTML de telepase.com.ar)
- **Luxon** (manejo de fechas/horas con timezone)
- **Tailwind CSS 4**

## Setup

### 1. Clonar e instalar dependencias

```bash
git clone https://github.com/agusszarate/gestor-telepase.git
cd gestor-telepase
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.example .env
```

Editar `.env` con la URL de tu base de datos PostgreSQL.

### 3. Levantar PostgreSQL

```bash
docker compose up -d
```

### 4. Ejecutar migraciones de Prisma

```bash
npx prisma migrate dev --name init
```

### 5. Iniciar la app

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) e ingresar las credenciales de Telepase.

## Mapa de estaciones

El archivo `app/api/pasadas/route.ts` contiene un mapa de codigos de estacion a nombres y concesionarios (`ESTACIONES_COD`). Actualmente incluye:

| Codigo | Estacion | Concesionario |
|--------|----------|---------------|
| 0001 | Dock Sud | AUBASA |
| 0002 | Quilmes | AUBASA |
| 0004 | Hudson | AUBASA |
| 0005 | Bernal | AUBASA |
| 0020 | Samborombon | AUBASA |
| 0024 | Mar Chiquita | AUBASA |
| 0091 | Riccheri | CORREDORES VIALES |

**Este mapa esta incompleto.** A medida que aparezcan nuevas estaciones en tus pasadas, vas a necesitar agregarlas al objeto `ESTACIONES_COD` con su nombre y concesionario correspondiente. Las estaciones no reconocidas se muestran como "Estacion XXXX".

Las pasadas de **Autopistas del Sol** usan un formato diferente (nombre completo con ASCENDENTE/DESCENDENTE en lugar de codigo numerico) y se detectan automaticamente.

## Reglas de hora pico

- **AUBASA**: Lunes a Viernes, 7-10h y 17-20h
- **Corredores Viales / Autopistas del Sol**: Lunes a Viernes, 7-11h y 16-20h. Sabados, Domingos y Feriados: 11-15h sentido ascendente y 17-21h sentido descendente
