const CAPTURED_KEY = 'captured_pokemon';

export function loadCapturedPokemon() {
  return JSON.parse(localStorage.getItem(CAPTURED_KEY) || '[]');
}

export function saveCapturedPokemon(capturedPokemon) {
  localStorage.setItem(CAPTURED_KEY, JSON.stringify(capturedPokemon));
}
