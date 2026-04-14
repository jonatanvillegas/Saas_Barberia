# Barbería Pro (MVP)

Monorepo con **backend** (Node.js/Express + MongoDB) y **frontend** (React + Vite) para gestión de barberías (pagos, caja, roles y paneles).

## Requisitos

- Node.js (recomendado 18+)
- MongoDB corriendo local o una URI remota

## Configuración

### 1) Backend

1. Crear el archivo `backend/.env` (no se sube a GitHub). Ejemplo:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/barberia
JWT_SECRET=barberia_super_secret_key_2024
JWT_EXPIRES_IN=7d
NODE_ENV=development
# Opcional: contraseña del superadmin cuando limpias la BD
# SUPERADMIN_PASSWORD=tu_password_segura
```

2. Instalar dependencias:

```bash
npm -C backend install
```

3. Levantar servidor:

```bash
npm -C backend run dev
```

Backend por defecto: `http://localhost:5000`

### 2) Frontend

1. Instalar dependencias:

```bash
npm -C frontend install
```

2. Levantar frontend:

```bash
npm -C frontend run dev
```

Frontend por defecto: `http://localhost:5173`

## Scripts útiles

### Limpiar BD (deja siempre un superadmin)

Borra colecciones y recrea el usuario `superadmin`:

```bash
npm -C backend run clean
```

Credenciales por defecto (si no defines `SUPERADMIN_PASSWORD`):
- Email: `root@sistema.com`
- Password: `root123`

### Seed demo

Crea barbería demo + usuarios demo + pagos:

```bash
npm -C backend run seed
```

Credenciales demo:
- Slug barbería: `barberia-demo`
- Admin: `admin@demo.com` / `admin123`
- Caja: `caja@demo.com` / `caja123`

### Lint frontend

```bash
npm -C frontend run lint
```

## Notas

- Este repo ignora `node_modules` y archivos `.env` por seguridad.
- El control de acceso por roles se aplica en frontend y backend.
