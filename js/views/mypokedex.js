import { renderPokemonCard } from "../utils.js";

export function renderMyPokedexView({ app, capturedPokemon, onOpenDetail, onRelease }) {
  if (capturedPokemon.length === 0) {
    app.innerHTML = `
      <section class="panel p-6 text-center fade-up">
        <h1 class="hero-title">Tu Pokedex esta vacia</h1>
        <p class="hero-sub mt-3 mx-auto">Captura Pokemon desde el detalle para construir tu coleccion.</p>
        <a href="#/" class="btn-primary inline-block mt-6">Volver al inicio</a>
      </section>
    `;
    return;
  }

  app.innerHTML = `
    <section class="panel p-5 sm:p-7 fade-up">
      <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h1 class="hero-title">Mi Pokedex</h1>
        <p class="text-sm" style="color:var(--muted)">${capturedPokemon.length} capturados</p>
      </div>

      <div class="poke-grid mt-6">
        ${capturedPokemon
          .map(
            (pokemon) => `
            <div class="relative">
              ${renderPokemonCard(pokemon, true)}
              <button class="btn-danger absolute left-2 right-2 bottom-2 release-btn" data-release-id="${pokemon.id}">Eliminar</button>
            </div>`
          )
          .join("")}
      </div>
    </section>
  `;

  app.querySelectorAll("[data-id]").forEach((card) => {
    card.addEventListener("click", (event) => {
      const releaseButton = event.target.closest(".release-btn");
      if (releaseButton) return;
      onOpenDetail(Number(card.getAttribute("data-id")));
    });
  });

  app.querySelectorAll(".release-btn").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      onRelease(Number(button.getAttribute("data-release-id")));
    });
  });
}
