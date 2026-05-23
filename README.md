# jpokemon

SPA tipo juego de Pokemon construida con HTML + TailwindCSS (CDN) + JavaScript modular (sin frameworks).

Nota: el script de Tailwind se encuentra vendorizado localmente en `js/vendor/tailwindcdn.js` para despliegue estatico sin dependencia remota.

## Funcionalidades

- Pantalla principal con lista de Pokemon (imagen, nombre, numero, tipos)
- Busqueda por nombre o numero
- Filtro por tipo
- Tarjetas con hover, animaciones y lazy loading de imagenes
- Vista de detalle por ruta hash (`#/pokemon/:id`) con:
	- Imagen grande
	- Numero
	- Tipos con colores oficiales
	- Stats con barras de progreso
	- Habilidades
	- Boton de captura con persistencia en `localStorage`
- Modo batalla (`#/battle`):
	- Seleccion de Pokemon
	- Rival aleatorio
	- Simulacion de combate con animacion
	- Sonido sintetizado con Web Audio API
	- Resultado del ganador
- Mi Pokedex (`#/mypokedex`):
	- Lista de capturados
	- Eliminacion de Pokemon capturados
- UI moderna y responsive (mobile + desktop)
- Modo oscuro/claro
- Skeleton loading

## Estructura

- `index.html`: shell de la SPA
- `styles.css`: estilos visuales, animaciones y componentes
- `js/main.js`: orquestacion, rutas y eventos principales
- `js/router.js`: hash routing
- `js/api.js`: consumo de PokeAPI
- `js/store.js`: estado y persistencia (`localStorage`)
- `js/utils.js`: utilidades y sonido
- `js/views/`: vistas (`home`, `detail`, `battle`, `mypokedex`)

## Ejecucion local

Al ser estatico, puedes abrirlo con cualquier servidor local.

Ejemplo:

```bash
python3 -m http.server 8080
```

Luego abre:

`http://localhost:8080`

## Deploy

Listo para deploy estatico en Nginx o cualquier hosting estatico.
