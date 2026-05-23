const CAPTURED_KEY = "jpokemon_captured";
const THEME_KEY = "jpokemon_theme";

export const state = {
  pokemon: [],
  loadingPokemon: false,
  search: "",
  typeFilter: "all",
  visibleCount: 24,
  capturedIds: new Set(),
  battleSelection: null,
  battleQuery: ""
};

export function hydrateState() {
  try {
    const ids = JSON.parse(localStorage.getItem(CAPTURED_KEY) || "[]");
    state.capturedIds = new Set(ids);
  } catch {
    state.capturedIds = new Set();
  }

  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme === "dark" || savedTheme === "light") {
    document.documentElement.setAttribute("data-theme", savedTheme);
  }
}

export function persistCaptured() {
  localStorage.setItem(CAPTURED_KEY, JSON.stringify(Array.from(state.capturedIds)));
}

export function toggleCaptured(id) {
  if (state.capturedIds.has(id)) {
    state.capturedIds.delete(id);
    persistCaptured();
    return false;
  }
  state.capturedIds.add(id);
  persistCaptured();
  return true;
}

export function isCaptured(id) {
  return state.capturedIds.has(id);
}

export function setTheme(nextTheme) {
  document.documentElement.setAttribute("data-theme", nextTheme);
  localStorage.setItem(THEME_KEY, nextTheme);
}

export function toggleTheme() {
  const current = document.documentElement.getAttribute("data-theme") || "dark";
  const next = current === "dark" ? "light" : "dark";
  setTheme(next);
  return next;
}
