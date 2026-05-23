import { TYPE_COLORS } from "./types.js";

export function capitalize(value = "") {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function formatId(id) {
  return `#${String(id).padStart(3, "0")}`;
}

export function getArtwork(pokemon) {
  return (
    pokemon?.sprites?.other?.["official-artwork"]?.front_default ||
    pokemon?.sprites?.front_default ||
    ""
  );
}

export function renderTypeBadge(type) {
  const color = TYPE_COLORS[type] || "#8d8d8d";
  return `<span class="type-badge" style="background:${color}">${type}</span>`;
}

export function renderPokemonCard(pokemon, isCaptured) {
  const artwork = getArtwork(pokemon);
  const badges = pokemon.types.map((entry) => renderTypeBadge(entry.type.name)).join("");

  return `
    <article class="poke-card fade-up" data-id="${pokemon.id}">
      ${isCaptured ? '<span class="capture-chip" title="Capturado">⚾</span>' : ""}
      <div class="rounded-xl p-2" style="background:rgba(255,255,255,0.08)">
        <img src="${artwork}" alt="${pokemon.name}" loading="lazy" decoding="async">
      </div>
      <p class="poke-id mt-2">${formatId(pokemon.id)}</p>
      <h3 class="poke-name">${pokemon.name}</h3>
      <div class="flex flex-wrap gap-1 mt-2">${badges}</div>
    </article>
  `;
}

let toastTimer;
export function showToast(message) {
  const toast = document.getElementById("toast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.add("show");

  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2200);
}

let audioContext;
function getAudioContext() {
  if (!audioContext) {
    audioContext = new window.AudioContext();
  }
  return audioContext;
}

function beep(frequency, duration, volume = 0.05, type = "square") {
  const ctx = getAudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gainNode.gain.value = volume;

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start();
  gainNode.gain.exponentialRampToValueAtTime(0.00001, ctx.currentTime + duration);
  oscillator.stop(ctx.currentTime + duration);
}

export function playBattleSfx(kind) {
  try {
    if (kind === "hit") {
      beep(140, 0.13, 0.04, "sawtooth");
    } else if (kind === "win") {
      beep(540, 0.15, 0.045, "triangle");
      setTimeout(() => beep(760, 0.18, 0.045, "triangle"), 120);
    } else if (kind === "lose") {
      beep(220, 0.2, 0.05, "square");
      setTimeout(() => beep(150, 0.23, 0.05, "square"), 120);
    }
  } catch {
    // Audio en Web APIs puede no estar disponible en algunos navegadores.
  }
}

export function getTypeList(pokemonList) {
  const typeSet = new Set();

  pokemonList.forEach((pokemon) => {
    pokemon.types.forEach((entry) => typeSet.add(entry.type.name));
  });

  return ["all", ...Array.from(typeSet).sort((a, b) => a.localeCompare(b))];
}

export function getHpClass(percent) {
  if (percent > 55) return "";
  if (percent > 25) return "hp-mid";
  return "hp-low";
}

export function debounce(fn, delay = 200) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), delay);
  };
}
