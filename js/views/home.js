import { renderPokemonCard, getTypeList } from "../utils.js";

function renderSkeletonCards(amount = 8) {
  return Array.from({ length: amount })
    .map(
      () => `
      <div class="poke-card" aria-hidden="true">
        <div class="skeleton" style="height:140px"></div>
        <div class="skeleton mt-3" style="height:12px;width:45%"></div>
        <div class="skeleton mt-2" style="height:14px;width:65%"></div>
        <div class="flex gap-2 mt-3">
          <div class="skeleton" style="height:20px;width:60px"></div>
          <div class="skeleton" style="height:20px;width:60px"></div>
        </div>
      </div>`
    )
    .join("");
}

function filterPokemon({ pokemon, search, typeFilter }) {
  const query = search.trim().toLowerCase();

  return pokemon.filter((entry) => {
    const matchesName = query
      ? entry.name.includes(query) || String(entry.id).includes(query)
      : true;

    const matchesType =
      typeFilter === "all"
        ? true
        : entry.types.some((item) => item.type.name === typeFilter);

    return matchesName && matchesType;
  });
}

export function renderHomeView({
  app,
  state,
  onSearch,
  onTypeFilter,
  onOpenDetail,
  onLoadMore
}) {
  const { pokemon, loadingPokemon, search, typeFilter, visibleCount, capturedIds } = state;

  if (loadingPokemon) {
    app.innerHTML = `
      <section class="panel p-5 sm:p-7">
        <h1 class="hero-title">Explora la region Kanto</h1>
        <p class="hero-sub mt-3">Cargando pokedex...</p>
        <div class="poke-grid mt-7">${renderSkeletonCards(12)}</div>
      </section>
    `;
    return;
  }

  const types = getTypeList(pokemon);
  const filtered = filterPokemon({ pokemon, search, typeFilter });
  const visible = filtered.slice(0, visibleCount);

  app.innerHTML = `
    <section class="panel p-5 sm:p-7 fade-up">
      <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 class="hero-title">Elige tu proximo campeon</h1>
          <p class="hero-sub mt-2">Busca por nombre, filtra por tipo y abre el detalle para capturar.</p>
        </div>
        <p class="text-sm" style="color:var(--muted)">Mostrando ${visible.length} de ${filtered.length}</p>
      </div>

      <div class="filter-row mt-6">
        <label>
          <span class="sr-only">Buscar pokemon</span>
          <input id="search-input" class="search-input" value="${search}" placeholder="Buscar por nombre o numero">
        </label>
        <label>
          <span class="sr-only">Filtrar por tipo</span>
          <select id="type-select" class="select-input">
            ${types
              .map(
                (type) =>
                  `<option value="${type}" ${type === typeFilter ? "selected" : ""}>${
                    type === "all" ? "Todos los tipos" : type
                  }</option>`
              )
              .join("")}
          </select>
        </label>
      </div>

      <div class="poke-grid mt-6">
        ${visible
          .map((entry) => renderPokemonCard(entry, capturedIds.has(entry.id)))
          .join("")}
      </div>

      <div class="mt-6 flex justify-center">
        ${visible.length < filtered.length ? '<button id="load-more" class="btn-ghost">Cargar mas</button>' : ""}
      </div>
    </section>
  `;

  app.querySelector("#search-input")?.addEventListener("input", (event) => {
    onSearch(event.target.value);
  });

  app.querySelector("#type-select")?.addEventListener("change", (event) => {
    onTypeFilter(event.target.value);
  });

  app.querySelectorAll("[data-id]").forEach((card) => {
    card.addEventListener("click", () => {
      const id = Number(card.getAttribute("data-id"));
      onOpenDetail(id);
    });
  });

  app.querySelector("#load-more")?.addEventListener("click", () => onLoadMore());
}
