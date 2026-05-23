import { STAT_COLORS, STAT_LABELS } from "../types.js";
import { capitalize, formatId, getArtwork, renderTypeBadge } from "../utils.js";

function statRow(stat) {
  const name = stat.stat.name;
  const label = STAT_LABELS[name] || capitalize(name);
  const value = stat.base_stat;
  const percentage = Math.min(100, Math.round((value / 255) * 100));
  const color = STAT_COLORS[name] || "#91a2ff";

  return `
    <div class="stat-row">
      <span class="stat-name">${label}</span>
      <span class="stat-value">${value}</span>
      <div class="stat-track">
        <div class="stat-fill" style="background:${color}" data-width="${percentage}"></div>
      </div>
    </div>
  `;
}

export function renderDetailView({ app, pokemon, isCaptured, onCapture, onBattle }) {
  const artwork = getArtwork(pokemon);
  const typeBadges = pokemon.types.map((entry) => renderTypeBadge(entry.type.name)).join("");
  const abilities = pokemon.abilities
    .map((entry) => {
      const hidden = entry.is_hidden ? " (oculta)" : "";
      return `<span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide bg-white/10">${entry.ability.name}${hidden}</span>`;
    })
    .join("");

  app.innerHTML = `
    <section class="panel p-5 sm:p-7 fade-up">
      <button id="go-back" class="btn-ghost mb-5">Volver</button>

      <div class="grid gap-6 lg:grid-cols-[300px_1fr]">
        <div class="panel p-4">
          <img src="${artwork}" alt="${pokemon.name}" class="w-full h-auto object-contain" loading="lazy">
        </div>

        <div>
          <p class="poke-id">${formatId(pokemon.id)}</p>
          <h1 class="hero-title mt-2">${capitalize(pokemon.name)}</h1>
          <div class="flex flex-wrap gap-2 mt-3">${typeBadges}</div>

          <div class="grid grid-cols-2 gap-3 mt-5 max-w-sm">
            <div class="panel p-3">
              <p class="stat-name">Altura</p>
              <p class="text-lg font-extrabold">${(pokemon.height / 10).toFixed(1)} m</p>
            </div>
            <div class="panel p-3">
              <p class="stat-name">Peso</p>
              <p class="text-lg font-extrabold">${(pokemon.weight / 10).toFixed(1)} kg</p>
            </div>
          </div>

          <h2 class="mt-6 text-sm font-black uppercase tracking-wide" style="color:var(--muted)">Habilidades</h2>
          <div class="flex flex-wrap gap-2 mt-2">${abilities}</div>

          <h2 class="mt-6 text-sm font-black uppercase tracking-wide" style="color:var(--muted)">Stats base</h2>
          <div class="stats-list mt-3">${pokemon.stats.map((stat) => statRow(stat)).join("")}</div>

          <div class="mt-7 flex flex-wrap gap-3">
            <button id="capture-btn" class="btn-primary">${isCaptured ? "Capturado" : "Capturar"}</button>
            <button id="battle-btn" class="btn-ghost">Ir a batalla</button>
          </div>
        </div>
      </div>
    </section>
  `;

  const captureBtn = app.querySelector("#capture-btn");
  if (captureBtn && isCaptured) {
    captureBtn.disabled = true;
    captureBtn.style.opacity = "0.7";
  }

  app.querySelector("#go-back")?.addEventListener("click", () => history.back());
  app.querySelector("#capture-btn")?.addEventListener("click", () => onCapture(pokemon.id));
  app.querySelector("#battle-btn")?.addEventListener("click", () => onBattle(pokemon.id));

  requestAnimationFrame(() => {
    app.querySelectorAll(".stat-fill").forEach((bar) => {
      const width = bar.getAttribute("data-width");
      bar.style.width = `${width}%`;
    });
  });
}
