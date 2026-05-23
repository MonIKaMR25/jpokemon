import { API } from './constants.js';

const pokeCache = {};

export async function fetchPokemon(idOrName) {
  if (pokeCache[idOrName]) return pokeCache[idOrName];
  const res = await fetch(`${API}/pokemon/${idOrName}`);
  if (!res.ok) return null;
  const data = await res.json();
  pokeCache[idOrName] = data;
  pokeCache[data.id] = data;
  pokeCache[data.name] = data;
  return data;
}

export async function fetchPokemonList(offset, limit) {
  const res = await fetch(`${API}/pokemon?offset=${offset}&limit=${limit}`);
  const data = await res.json();
  return data.results;
}

export async function fetchTypes() {
  const res = await fetch(`${API}/type?limit=18`);
  const data = await res.json();
  return data.results;
}
