# jpokemon

SPA estática inspirada en Pokémon (sin frameworks) usando:

- HTML
- TailwindCSS por CDN
- JavaScript modular (ES Modules)
- PokeAPI

## Vistas (hash routing)

- `#home` → listado, búsqueda y filtro por tipo
- `#detail/:id` → detalle de Pokémon
- `#battle` → modo batalla con selección desde Pokémon capturados
- `#mycollection` → Mi Pokédex capturada

## Funcionalidades principales

- Tarjetas de Pokémon con imagen, nombre, número y tipos
- Detalle con stats, habilidades y captura en `localStorage`
- Batalla simulada con animaciones y sonido (Web Audio API)
- Colección capturada con opción de liberar
- Modo oscuro/claro
- Skeleton loading, lazy loading de imágenes y microinteracciones

## Deploy estático

Puede desplegarse como sitio estático en Nginx, GitHub Pages o cualquier servidor de archivos.
