import { fetchAllPokemon, fetchPokemonById } from "./api.js";
import { getRouteFromHash, navigateTo } from "./router.js";
import {
  state,
  hydrateState,
  toggleCaptured,
  isCaptured,
  toggleTheme
} from "./store.js";
import { renderHomeView } from "./views/home.js";
import { renderDetailView } from "./views/detail.js";
import { renderMyPokedexView } from "./views/mypokedex.js";
import { renderBattleView, runBattleSimulation } from "./views/battle.js";
import { showToast } from "./utils.js";

const app = document.getElementById("app");
const themeToggleBtn = document.getElementById("theme-toggle");

async function ensurePokemonLoaded() {
  if (state.pokemon.length > 0 || state.loadingPokemon) {
    return;
  }

  state.loadingPokemon = true;
  render();

  try {
    state.pokemon = await fetchAllPokemon(151);
  } catch (error) {
    app.innerHTML = `
      <section class="panel p-6">
        <h1 class="text-xl font-black">No se pudieron cargar los Pokemon</h1>
        <p class="mt-2" style="color:var(--muted)">${error.message}</p>
        <button id="retry-load" class="btn-primary mt-4">Reintentar</button>
      </section>
    `;

    app.querySelector("#retry-load")?.addEventListener("click", () => {
      state.loadingPokemon = false;
      ensurePokemonLoaded();
    });
    return;
  }

  state.loadingPokemon = false;
  render();
}

function updateActiveNav(routeName) {
  document.querySelectorAll("[data-nav]").forEach((link) => {
    const routeKey = link.getAttribute("data-nav");
    const isActive =
      (routeName === "home" && routeKey === "home") ||
      (routeName === "battle" && routeKey === "battle") ||
      (routeName === "mypokedex" && routeKey === "mypokedex");

    link.classList.toggle("active", isActive);
  });
}

function getPokemonById(id) {
  return state.pokemon.find((pokemon) => pokemon.id === id);
}

function capturedPokemonList() {
  const list = state.pokemon.filter((pokemon) => state.capturedIds.has(pokemon.id));
  return list.sort((a, b) => a.id - b.id);
}

function renderHome() {
  renderHomeView({
    app,
    state,
    onSearch: (value) => {
      state.search = value;
      state.visibleCount = 24;
      renderHome();
    },
    onTypeFilter: (value) => {
      state.typeFilter = value;
      state.visibleCount = 24;
      renderHome();
    },
    onOpenDetail: (id) => navigateTo(`/pokemon/${id}`),
    onLoadMore: () => {
      state.visibleCount += 24;
      renderHome();
    }
  });
}

async function renderDetail(id) {
  let pokemon = getPokemonById(id);
  if (!pokemon) {
    try {
      pokemon = await fetchPokemonById(id);
    } catch {
      app.innerHTML = `
        <section class="panel p-6">
          <h1 class="text-xl font-black">Pokemon no encontrado</h1>
          <a href="#/" class="btn-primary inline-block mt-4">Volver al inicio</a>
        </section>
      `;
      return;
    }
  }

  renderDetailView({
    app,
    pokemon,
    isCaptured: isCaptured(pokemon.id),
    onCapture: (targetId) => {
      const capturedNow = toggleCaptured(targetId);
      showToast(capturedNow ? "Pokemon capturado" : "Pokemon eliminado de tu Pokedex");
      renderDetail(targetId);
    },
    onBattle: (selectedId) => {
      state.battleSelection = selectedId;
      navigateTo("/battle");
    }
  });
}

function renderMyPokedex() {
  const captured = capturedPokemonList();

  renderMyPokedexView({
    app,
    capturedPokemon: captured,
    onOpenDetail: (id) => navigateTo(`/pokemon/${id}`),
    onRelease: (id) => {
      const wasCaptured = toggleCaptured(id);
      if (!wasCaptured) {
        showToast("Pokemon eliminado de tu Pokedex");
      }
      renderMyPokedex();
    }
  });
}

function renderBattle() {
  const selected = state.battleSelection;

  const view = renderBattleView({
    app,
    pokemonList: state.pokemon,
    selectionId: selected,
    query: state.battleQuery,
    onQueryChange: (value) => {
      state.battleQuery = value;
      renderBattle();
    },
    onSelect: (id) => {
      state.battleSelection = id;
      renderBattle();
    },
    onBack: () => navigateTo("/")
  });

  view.startButton?.addEventListener("click", async () => {
    if (!state.battleSelection) return;

    view.startButton.disabled = true;
    view.startButton.textContent = "Combatiendo...";

    const player = getPokemonById(state.battleSelection);
    if (!player) return;

    await runBattleSimulation({
      simContainer: view.simContainer,
      player,
      pokemonList: state.pokemon,
      onFinished: ({ playerWon, rival }) => {
        if (playerWon && !isCaptured(rival.id)) {
          const capturedNow = toggleCaptured(rival.id);
          if (capturedNow) {
            showToast(`Capturaste a ${rival.name} despues de la batalla`);
          }
        }
      }
    });

    view.startButton.disabled = false;
    view.startButton.textContent = "Iniciar batalla";
  });
}

function renderNotFound() {
  app.innerHTML = `
    <section class="panel p-6 text-center">
      <h1 class="hero-title">Ruta no encontrada</h1>
      <p class="hero-sub mt-2 mx-auto">La ruta solicitada no existe.</p>
      <a href="#/" class="btn-primary inline-block mt-5">Ir al inicio</a>
    </section>
  `;
}

async function render() {
  const route = getRouteFromHash();

  updateActiveNav(route.name);

  if (route.name === "home") {
    renderHome();
    await ensurePokemonLoaded();
    return;
  }

  if (route.name === "detail") {
    app.innerHTML = `<section class="panel p-6"><div class="skeleton" style="height:260px"></div></section>`;
    await ensurePokemonLoaded();
    await renderDetail(route.params.id);
    return;
  }

  if (route.name === "battle") {
    app.innerHTML = `<section class="panel p-6"><div class="skeleton" style="height:260px"></div></section>`;
    await ensurePokemonLoaded();
    renderBattle();
    return;
  }

  if (route.name === "mypokedex") {
    app.innerHTML = `<section class="panel p-6"><div class="skeleton" style="height:180px"></div></section>`;
    await ensurePokemonLoaded();
    renderMyPokedex();
    return;
  }

  renderNotFound();
}

function ensureHash() {
  if (!window.location.hash) {
    navigateTo("/");
  }
}

function initThemeToggle() {
  themeToggleBtn?.addEventListener("click", () => {
    const next = toggleTheme();
    showToast(next === "dark" ? "Modo oscuro activado" : "Modo claro activado");
  });
}

function init() {
  hydrateState();
  ensureHash();
  initThemeToggle();

  window.addEventListener("hashchange", () => {
    render();
  });

  render();
}

init();
