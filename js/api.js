const API_BASE = "https://pokeapi.co/api/v2";

const pokemonCache = new Map();
const moveCache = new Map();

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Error en API (${response.status})`);
  }
  return response.json();
}

export async function fetchPokemonById(id) {
  if (pokemonCache.has(id)) {
    return pokemonCache.get(id);
  }

  const data = await fetchJson(`${API_BASE}/pokemon/${id}`);
  pokemonCache.set(data.id, data);
  pokemonCache.set(data.name, data);
  return data;
}

export async function fetchPokemonByName(name) {
  if (pokemonCache.has(name)) {
    return pokemonCache.get(name);
  }

  const data = await fetchJson(`${API_BASE}/pokemon/${name}`);
  pokemonCache.set(data.id, data);
  pokemonCache.set(data.name, data);
  return data;
}

async function fetchBatch(items) {
  const detailPromises = items.map((entry) => fetchPokemonByName(entry.name));
  return Promise.all(detailPromises);
}

export async function fetchAllPokemon(limit = 151, chunkSize = 24) {
  const list = await fetchJson(`${API_BASE}/pokemon?limit=${limit}&offset=0`);
  const results = [];

  for (let index = 0; index < list.results.length; index += chunkSize) {
    const batch = list.results.slice(index, index + chunkSize);
    const details = await fetchBatch(batch);
    results.push(...details);
  }

  return results.sort((a, b) => a.id - b.id);
}

export async function fetchMoveDetail(moveUrlOrName) {
  const key = moveUrlOrName;
  if (moveCache.has(key)) {
    return moveCache.get(key);
  }

  const url = moveUrlOrName.startsWith("http")
    ? moveUrlOrName
    : `${API_BASE}/move/${moveUrlOrName}`;

  const data = await fetchJson(url);
  moveCache.set(key, data);
  moveCache.set(data.name, data);
  moveCache.set(data.url || url, data);
  return data;
}
