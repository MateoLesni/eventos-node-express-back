# Express TypeScript API - Vercel Ready

API REST construida con Express, TypeScript y lista para deployar en Vercel.

## 🚀 Características

- ✅ TypeScript configurado
- ✅ Estructura modular (Controllers, Services, Routes)
- ✅ Middlewares de seguridad (Helmet, CORS)
- ✅ Manejo de errores centralizado
- ✅ Logging con Morgan
- ✅ Listo para Vercel

## 📁 Estructura del Proyecto

\`\`\`
src/
├── controllers/     # Controladores de rutas
├── services/        # Lógica de negocio
├── routes/          # Definición de rutas
├── middlewares/     # Middlewares personalizados
├── types/           # Tipos de TypeScript
├── utils/           # Utilidades
└── index.ts         # Punto de entrada
\`\`\`

## 🛠️ Instalación

\`\`\`bash
npm install
\`\`\`

## 💻 Desarrollo

\`\`\`bash
npm run dev
\`\`\`

El servidor estará disponible en `http://localhost:3001`

## 🏗️ Build

\`\`\`bash
npm run build
\`\`\`

## 📡 Endpoints Disponibles

### Health Check
- `GET /health` - Verificar estado del servidor

### Users
- `GET /api/users` - Obtener todos los usuarios
- `GET /api/users/:id` - Obtener usuario por ID
- `POST /api/users` - Crear nuevo usuario
- `PUT /api/users/:id` - Actualizar usuario
- `DELETE /api/users/:id` - Eliminar usuario

### Products
- `GET /api/products` - Obtener todos los productos
- `GET /api/products/:id` - Obtener producto por ID
- `POST /api/products` - Crear nuevo producto

## 🚀 Deploy en Vercel

1. Instala Vercel CLI: `npm i -g vercel`
2. Ejecuta: `vercel`
3. Sigue las instrucciones

O conecta tu repositorio de GitHub directamente en vercel.com

## 📝 Agregar Nuevas Rutas

1. Crea un nuevo archivo en `src/routes/`
2. Crea el controlador en `src/controllers/`
3. Crea el servicio en `src/services/`
4. Define los tipos en `src/types/`
5. Registra la ruta en `src/routes/index.ts`
