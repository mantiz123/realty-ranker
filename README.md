# Realty Ranker

Quiero un marketplace de agentes inmobiliarios (realtors) organizado por estado de EE.UU.

Construye la estructura de páginas y las tablas de base de datos. NO implementes lógica

de pagos ni de pujas todavía — solo interfaz y estructura de datos vacía. Esa parte la

completaremos manualmente después.

PÁGINAS:

1. Home (/) — selector de estados de EE.UU., cada uno muestra si ya tiene realtors activos

2. Página de estado (/estados/[slug]) — dos secciones:

   a. Tabla de ranking: lista de realtors ordenada por "monto_pagado" descendente,

      mostrando nombre, foto, contador de clics, botón "Superar posición"

   b. Reproductor de valla: un solo video visible a la vez, con overlay de nombre de

      la inmobiliaria, que avanza automáticamente al siguiente video de una lista

3. Login (/login) — solo campo de email, sin contraseña (magic link)

4. Panel del realtor (/panel) — protegido por login, tres pestañas:

   a. Mi posición en el ranking y monto pagado

   b. Mis videos generados (galería con estado: procesando/listo)

   c. Mi slot en la valla (días activos restantes, contador de clics)

5. Subir propiedad (/subir) — formulario para subir 5-15 fotos, campo de email,

   muestra estado "generando video..." (sin conectar la API de video todavía,

   solo la interfaz y el estado de carga)

TABLAS DE SUPABASE (solo estructura, sin lógica ni triggers todavía):

- realtors: id, email, nombre, telefono, estado (US), licencia_numero, verificado (bool), creado_en

- bids: id, realtor_id, estado (US), monto, creado_en

- videos: id, realtor_id, fotos_urls (array), video_url, tier (basico/pro), estado_generacion, creado_en

- billboard_slots: id, realtor_id, video_id, estado (US), fecha_inicio, fecha_fin, clics

- page_views: id, estado (US), realtor_id (nullable), tipo (ranking_click/billboard_view), creado_en

Usa shadcn-ui y Tailwind para el diseño, consistente con un estilo limpio y profesional

inmobiliario. Activa autenticación de Supabase por magic link (sin contraseña).

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/37d4192e-c8e9-4a66-bd9e-ad214a664209).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
