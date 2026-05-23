import { PAGE_SIZE, TOTAL_POKEMON, TYPE_COLORS, STAT_COLORS, STAT_LABELS } from './constants.js';
import { fetchPokemon, fetchPokemonList, fetchTypes } from './api.js';
import { loadCapturedPokemon, saveCapturedPokemon } from './storage.js';
import { parseHash, buildDetailHash } from './router.js';
import { playAttackSound, playWinSound, playLoseSound } from './audio.js';

let currentOffset = 0;
let allPokemon = [];
let filteredPokemon = [];
let currentFilter = 'all';
let searchQuery = '';
let isLoading = false;
let currentModalPokemon = null;
let capturedPokemon = loadCapturedPokemon();
let hasInitializedHome = false;
let currentPage = 'home';

// Battle state
let playerPokemon = null;
let rivalPokemon = null;
let selectedBattlePokemon = null;
let battlePokemonList = [];
let battleRunning = false;
let battleWinner = null;

function setActivePage(page) {
  currentPage = page;
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn[data-page]').forEach(b => b.classList.remove('active'));
  document.getElementById(`page-${page}`)?.classList.add('active');
  document.querySelector(`.nav-btn[data-page="${page}"]`)?.classList.add('active');
}

async function navigate(page, updateHash = true) {
  if (!['home', 'battle', 'mycollection'].includes(page)) return;
  setActivePage(page);

  if (updateHash) {
    const next = `#${page}`;
    if (window.location.hash !== next) window.location.hash = page;
  }

  if (page === 'home' && !hasInitializedHome) {
    hasInitializedHome = true;
    await initHome();
  }

  if (page === 'mycollection') renderCollection();
  if (page === 'battle') await loadBattlePokemon();
}

function toggleTheme() {
  const html = document.documentElement;
  html.setAttribute('data-theme', html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark');
}

function showNotification(msg, type = 'info') {
  const n = document.getElementById('notification');
  n.textContent = msg;
  n.className = `notification ${type} show`;
  setTimeout(() => n.classList.remove('show'), 3000);
}

async function initHome() {
  renderSkeletons(PAGE_SIZE);
  await loadTypeFilters();
  await loadPokemonPage();
}

async function loadTypeFilters() {
  const types = await fetchTypes();
  const container = document.getElementById('type-filters');
  container.innerHTML = '';
  types.forEach(t => {
    if (t.name === 'unknown' || t.name === 'shadow') return;
    const chip = document.createElement('button');
    chip.className = 'filter-chip';
    chip.setAttribute('data-type', t.name);
    chip.textContent = t.name;
    chip.style.borderColor = TYPE_COLORS[t.name] || '#555';
    chip.onclick = () => filterByType(t.name, chip);
    container.appendChild(chip);
  });
}

async function loadPokemonPage() {
  if (isLoading) return;
  isLoading = true;

  const list = await fetchPokemonList(currentOffset, PAGE_SIZE);
  const details = await Promise.all(list.map(p => fetchPokemon(p.name)));

  details.forEach(p => {
    if (p && !allPokemon.find(x => x.id === p.id)) allPokemon.push(p);
  });

  currentOffset += PAGE_SIZE;
  isLoading = false;

  applyFilters();
  updateCount();

  const loadMore2 = document.getElementById('load-more-btn2');
  if (loadMore2) {
    loadMore2.style.display = currentOffset < TOTAL_POKEMON ? 'flex' : 'none';
  }
}

async function loadMore() {
  if (currentOffset >= TOTAL_POKEMON || isLoading) return;
  await loadPokemonPage();
}

function applyFilters() {
  let result = [...allPokemon];
  if (currentFilter !== 'all') {
    result = result.filter(p => p.types.some(t => t.type.name === currentFilter));
  }
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    result = result.filter(p => p.name.includes(q) || String(p.id).includes(q));
  }
  filteredPokemon = result;
  renderGrid();
  updateCount();
}

function updateCount() {
  const countEl = document.getElementById('poke-count');
  if (countEl) {
    countEl.textContent = `Mostrando ${filteredPokemon.length} de ${allPokemon.length} Pokémon cargados`;
  }
}

function handleSearch(val) {
  searchQuery = val.toLowerCase().trim();
  applyFilters();
}

function filterByType(type, el) {
  currentFilter = type;
  document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
  if (el) el.classList.add('active');
  applyFilters();
}

function renderGrid() {
  const grid = document.getElementById('poke-grid');
  if (!grid) return;
  grid.innerHTML = '';
  filteredPokemon.forEach((p, i) => {
    const card = createPokeCard(p, i);
    grid.appendChild(card);
  });
}

function renderSkeletons(n) {
  const grid = document.getElementById('poke-grid');
  if (!grid) return;
  grid.innerHTML = '';
  for (let i = 0; i < n; i++) {
    const el = document.createElement('div');
    el.className = 'poke-card';
    el.style.cursor = 'default';
    el.innerHTML = `
      <div class="skeleton" style="height:100px;width:100px;border-radius:50%;margin:0 auto 12px"></div>
      <div class="skeleton" style="height:12px;width:60%;margin:0 auto 8px;border-radius:6px"></div>
      <div class="skeleton" style="height:20px;width:80%;margin:0 auto 8px;border-radius:6px"></div>
      <div style="display:flex;gap:6px;justify-content:center">
        <div class="skeleton" style="height:20px;width:50px;border-radius:10px"></div>
        <div class="skeleton" style="height:20px;width:50px;border-radius:10px"></div>
      </div>`;
    grid.appendChild(el);
  }
}

function createPokeCard(p, animDelay = 0) {
  const mainType = p.types[0].type.name;
  const color = TYPE_COLORS[mainType] || '#888';
  const captured = capturedPokemon.find(c => c.id === p.id);
  const img = p.sprites.other['official-artwork']?.front_default || p.sprites.front_default;

  const card = document.createElement('div');
  card.className = 'poke-card';
  card.style.cssText = `animation: fadeIn 0.3s ease ${animDelay * 0.03}s both;
    background: linear-gradient(135deg, var(--card) 60%, ${color}22 100%)`;
  card.onclick = () => openModal(p);

  card.innerHTML = `
    <div style="background:${color}15;border-radius:12px;padding:8px;margin-bottom:8px;position:relative">
      ${captured ? `<span style="position:absolute;top:4px;right:4px;font-size:14px">⚾</span>` : ''}
      <img src="${img}" alt="${p.name}" loading="lazy"
        style="width:100px;height:100px;object-fit:contain;display:block;margin:auto;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.3))"
        onerror="this.src='https://via.placeholder.com/100x100?text=?'">
    </div>
    <div class="poke-num">#${String(p.id).padStart(3, '0')}</div>
    <div class="poke-name">${p.name}</div>
    <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px">
      ${p.types.map(t => `<span class="type-badge" style="background:${TYPE_COLORS[t.type.name] || '#888'}">${t.type.name}</span>`).join('')}
    </div>`;

  return card;
}

async function openModal(pokemonOrId, updateHash = true) {
  let p = typeof pokemonOrId === 'object' ? pokemonOrId : await fetchPokemon(pokemonOrId);
  if (!p) return;
  currentModalPokemon = p;

  const mainType = p.types[0].type.name;
  const color1 = TYPE_COLORS[mainType] || '#555';
  const color2 = p.types[1] ? TYPE_COLORS[p.types[1].type.name] || color1 : color1;
  const img = p.sprites.other['official-artwork']?.front_default || p.sprites.front_default;

  document.getElementById('modal-header').style.background =
    `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`;
  document.getElementById('modal-img').src = img;
  document.getElementById('modal-num').textContent = `#${String(p.id).padStart(3, '0')}`;
  document.getElementById('modal-name').textContent = p.name;
  document.getElementById('modal-height').textContent = `${(p.height / 10).toFixed(1)} m`;
  document.getElementById('modal-weight').textContent = `${(p.weight / 10).toFixed(1)} kg`;

  const typesEl = document.getElementById('modal-types');
  typesEl.innerHTML = p.types.map(t =>
    `<span class="type-badge" style="background:rgba(255,255,255,0.25);border:1px solid rgba(255,255,255,0.4)">${t.type.name}</span>`
  ).join('');

  document.getElementById('modal-abilities').innerHTML =
    p.abilities.map(a =>
      `<span class="ability-chip">${a.ability.name.replace('-', ' ')}${a.is_hidden ? ' <small style="opacity:0.6">(oculta)</small>' : ''}</span>`
    ).join('');

  const statsEl = document.getElementById('modal-stats');
  statsEl.innerHTML = '';
  p.stats.forEach(s => {
    const name = s.stat.name;
    const val = s.base_stat;
    const pct = Math.min(100, Math.round((val / 255) * 100));
    const color = STAT_COLORS[name] || '#888';
    const div = document.createElement('div');
    div.innerHTML = `
      <div style="display:flex;align-items:center;gap:8px">
        <div style="min-width:80px;font-size:12px;font-weight:700;color:var(--text2)">${STAT_LABELS[name] || name}</div>
        <div style="min-width:32px;font-size:13px;font-weight:800;text-align:right">${val}</div>
        <div class="stat-bar-bg flex-1">
          <div class="stat-bar-fill" style="width:0%;background:${color};border-radius:10px" data-pct="${pct}"></div>
        </div>
      </div>`;
    statsEl.appendChild(div);
  });

  const captured = capturedPokemon.find(c => c.id === p.id);
  const btn = document.getElementById('modal-capture-btn');
  if (captured) {
    btn.innerHTML = '✅ ¡Capturado!';
    btn.disabled = true;
  } else {
    btn.innerHTML = '⚾ Capturar';
    btn.disabled = false;
  }

  document.getElementById('poke-modal').style.display = 'flex';
  document.body.style.overflow = 'hidden';

  if (updateHash) {
    const detailHash = `#${buildDetailHash(p.id)}`;
    if (window.location.hash !== detailHash) {
      window.location.hash = buildDetailHash(p.id);
    }
  }

  setTimeout(() => {
    document.querySelectorAll('.stat-bar-fill').forEach(bar => {
      bar.style.width = bar.getAttribute('data-pct') + '%';
    });
  }, 100);
}

function closeModal(e) {
  if (e?.target === document.getElementById('poke-modal')) closeModalDirect();
}

function closeModalDirect(updateHash = true) {
  document.getElementById('poke-modal').style.display = 'none';
  document.body.style.overflow = '';
  currentModalPokemon = null;
  if (updateHash) {
    const targetHash = `#${currentPage}`;
    if (window.location.hash !== targetHash) window.location.hash = currentPage;
  }
}

function buildCapturedEntry(p) {
  return {
    id: p.id,
    name: p.name,
    types: p.types.map(t => t.type.name),
    sprite: p.sprites.other['official-artwork']?.front_default || p.sprites.front_default,
    capturedAt: Date.now()
  };
}

function captureCurrentPokemon() {
  if (!currentModalPokemon) return;
  const p = currentModalPokemon;
  if (capturedPokemon.find(c => c.id === p.id)) {
    showNotification(`¡${p.name} ya está en tu Pokédex!`, 'info');
    return;
  }

  capturedPokemon.push(buildCapturedEntry(p));
  saveCapturedPokemon(capturedPokemon);
  showNotification(`¡${p.name} fue capturado! ⚾`, 'success');
  spawnConfetti();

  const btn = document.getElementById('modal-capture-btn');
  btn.innerHTML = '✅ ¡Capturado!';
  btn.disabled = true;
  renderGrid();

  if (currentPage === 'battle') loadBattlePokemon();
}

function captureAfterBattle() {
  if (!rivalPokemon) return;
  const p = rivalPokemon;
  if (capturedPokemon.find(c => c.id === p.id)) return;

  capturedPokemon.push(buildCapturedEntry(p));
  saveCapturedPokemon(capturedPokemon);
  showNotification(`¡${p.name} capturado! ⚾`, 'success');
  spawnConfetti();
  document.getElementById('capture-after-btn').style.display = 'none';

  if (currentPage === 'battle') loadBattlePokemon();
}

function spawnConfetti() {
  const colors = ['#ffcc00', '#ee1515', '#6890F0', '#78C850', '#F85888'];
  for (let i = 0; i < 40; i++) {
    const el = document.createElement('div');
    const color = colors[Math.floor(Math.random() * colors.length)];
    el.style.cssText = `
      position:fixed;
      top:0;
      left:${Math.random() * 100}%;
      width:8px;height:12px;
      background:${color};
      border-radius:2px;
      z-index:9998;
      animation:confetti-fall ${1 + Math.random() * 2}s ease forwards ${Math.random() * 0.5}s;
      transform-origin: center;
    `;
    document.body.appendChild(el);
    el.addEventListener('animationend', () => el.remove());
  }
}

function renderCollection() {
  capturedPokemon = loadCapturedPokemon();
  const grid = document.getElementById('my-collection-grid');
  const empty = document.getElementById('collection-empty');
  const countEl = document.getElementById('collection-count');

  countEl.textContent = `${capturedPokemon.length} Pokémon en tu colección`;

  if (capturedPokemon.length === 0) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    return;
  }

  empty.style.display = 'none';
  grid.innerHTML = '';

  capturedPokemon.forEach((p, i) => {
    const mainType = p.types[0];
    const color = TYPE_COLORS[mainType] || '#888';
    const card = document.createElement('div');
    card.className = 'poke-card';
    card.style.cssText = `animation:fadeIn 0.3s ease ${i * 0.04}s both;background:linear-gradient(135deg,var(--card) 60%,${color}22 100%)`;

    card.innerHTML = `
      <div style="background:${color}15;border-radius:12px;padding:8px;margin-bottom:8px;position:relative">
        <button onclick="releasePokemon(${p.id},event)" style="position:absolute;top:4px;right:4px;background:rgba(255,0,0,0.3);border:none;border-radius:50%;width:22px;height:22px;cursor:pointer;font-size:11px;display:flex;align-items:center;justify-content:center;color:#fff" title="Liberar">✕</button>
        <img src="${p.sprite || ''}" alt="${p.name}" loading="lazy"
          style="width:100px;height:100px;object-fit:contain;display:block;margin:auto;filter:drop-shadow(0 4px 8px rgba(0,0,0,0.3))"
          onerror="this.src='https://via.placeholder.com/100?text=?'">
      </div>
      <div class="poke-num">#${String(p.id).padStart(3, '0')}</div>
      <div class="poke-name">${p.name}</div>
      <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:6px">
        ${p.types.map(t => `<span class="type-badge" style="background:${TYPE_COLORS[t] || '#888'}">${t}</span>`).join('')}
      </div>`;

    card.addEventListener('click', () => openModal(p.id));
    grid.appendChild(card);
  });
}

function releasePokemon(id, e) {
  e.stopPropagation();
  capturedPokemon = capturedPokemon.filter(p => p.id !== id);
  saveCapturedPokemon(capturedPokemon);
  showNotification('Pokémon liberado', 'info');
  renderCollection();
  renderGrid();
  if (currentPage === 'battle') loadBattlePokemon();
}

async function loadBattlePokemon() {
  capturedPokemon = loadCapturedPokemon();
  const grid = document.getElementById('battle-selector-grid');
  grid.innerHTML = '';

  const emptyState = document.getElementById('battle-empty-state');
  const startBtn = document.getElementById('start-battle-btn');
  selectedBattlePokemon = null;
  startBtn.disabled = true;

  if (capturedPokemon.length === 0) {
    battlePokemonList = [];
    emptyState.style.display = 'block';
    return;
  }

  emptyState.style.display = 'none';

  for (let i = 0; i < Math.min(8, capturedPokemon.length); i++) {
    const el = document.createElement('div');
    el.className = 'battle-select-card';
    el.innerHTML = `<div class="skeleton" style="width:64px;height:64px;border-radius:8px;margin:0 auto 6px"></div><div class="skeleton" style="height:10px;width:80%;border-radius:5px;margin:auto"></div>`;
    grid.appendChild(el);
  }

  const details = await Promise.all(capturedPokemon.map(p => fetchPokemon(p.id)));
  battlePokemonList = details.filter(Boolean);
  renderBattleSelector(battlePokemonList);
}

function renderBattleSelector(list) {
  const grid = document.getElementById('battle-selector-grid');
  grid.innerHTML = '';
  list.forEach(p => {
    const img = p.sprites.front_default;
    const card = document.createElement('div');
    card.className = 'battle-select-card';
    card.setAttribute('data-id', p.id);
    card.innerHTML = `
      <img src="${img}" alt="${p.name}" style="width:64px;height:64px;object-fit:contain;filter:drop-shadow(0 2px 6px rgba(0,0,0,0.4))">
      <div style="font-size:11px;font-weight:700;text-transform:capitalize;margin-top:4px;color:var(--text)">${p.name}</div>
      <div style="font-size:10px;color:var(--text2)">#${String(p.id).padStart(3, '0')}</div>`;
    card.onclick = () => selectBattlePokemon(p, card);
    grid.appendChild(card);
  });
}

function handleBattleSearch(val) {
  const q = val.toLowerCase().trim();
  const filtered = q ? battlePokemonList.filter(p => p.name.includes(q) || String(p.id).includes(q)) : battlePokemonList;
  renderBattleSelector(filtered);
}

function selectBattlePokemon(p, card) {
  selectedBattlePokemon = p;
  document.querySelectorAll('.battle-select-card').forEach(c => c.classList.remove('selected'));
  card.classList.add('selected');
  document.getElementById('start-battle-btn').disabled = false;
}

async function startBattle() {
  if (!selectedBattlePokemon || battlePokemonList.length < 2) {
    showNotification('Necesitas al menos 2 Pokémon capturados para batallar', 'info');
    return;
  }

  const rivalPool = battlePokemonList.filter(p => p.id !== selectedBattlePokemon.id);
  const rival = rivalPool[Math.floor(Math.random() * rivalPool.length)];

  playerPokemon = selectedBattlePokemon;
  rivalPokemon = rival;
  battleWinner = null;

  document.getElementById('battle-selection').style.display = 'none';
  document.getElementById('battle-arena').style.display = 'block';
  document.getElementById('victory-overlay').style.display = 'none';
  document.getElementById('battle-controls').style.display = 'flex';

  const playerImg = playerPokemon.sprites.other['official-artwork']?.front_default || playerPokemon.sprites.front_default;
  const rivalImg = rivalPokemon.sprites.other['official-artwork']?.front_default || rivalPokemon.sprites.front_default;

  document.getElementById('player-img').src = playerImg;
  document.getElementById('rival-img').src = rivalImg;
  document.getElementById('player-name').textContent = playerPokemon.name;
  document.getElementById('rival-name').textContent = rivalPokemon.name;
  document.getElementById('player-name-small').textContent = playerPokemon.name;
  document.getElementById('rival-name-small').textContent = rivalPokemon.name;

  document.getElementById('player-poke-types').innerHTML =
    playerPokemon.types.map(t => `<span class="type-badge" style="background:${TYPE_COLORS[t.type.name] || '#888'};font-size:9px">${t.type.name}</span>`).join('');
  document.getElementById('rival-poke-types').innerHTML =
    rivalPokemon.types.map(t => `<span class="type-badge" style="background:${TYPE_COLORS[t.type.name] || '#888'};font-size:9px">${t.type.name}</span>`).join('');

  setHPBar('player', 100);
  setHPBar('rival', 100);

  document.getElementById('battle-log').innerHTML = '';
  addLog(`¡${rivalPokemon.name} apareció!`);
  addLog(`¡Vamos ${playerPokemon.name}!`);

  await runBattleSimulation();
}

function getMaxHP(pokemon) {
  const hpStat = pokemon.stats.find(s => s.stat.name === 'hp');
  return hpStat ? hpStat.base_stat : 100;
}

function getAttack(pokemon) {
  const atk = pokemon.stats.find(s => s.stat.name === 'attack');
  return atk ? atk.base_stat : 50;
}

function getDefense(pokemon) {
  const def = pokemon.stats.find(s => s.stat.name === 'defense');
  return def ? def.base_stat : 50;
}

function getSpeed(pokemon) {
  const spd = pokemon.stats.find(s => s.stat.name === 'speed');
  return spd ? spd.base_stat : 50;
}

function setHPBar(who, pct) {
  const bar = document.getElementById(`${who}-hp-bar`);
  const txt = document.getElementById(`${who}-hp-text`);
  bar.style.width = pct + '%';
  bar.className = 'hp-bar ' + (pct > 50 ? 'hp-high' : pct > 20 ? 'hp-mid' : 'hp-low');
  if (txt) txt.textContent = Math.round(pct) + '%';
}

function addLog(msg, color) {
  const log = document.getElementById('battle-log');
  const line = document.createElement('div');
  line.textContent = msg;
  if (color) line.style.color = color;
  log.appendChild(line);
  log.scrollTop = log.scrollHeight;
}

function animateAttack(attacker, victim) {
  const aEl = document.getElementById(`${attacker}-battle-img`);
  const vEl = document.getElementById(`${victim}-battle-img`);
  playAttackSound();
  aEl.classList.add(attacker === 'player' ? 'attack-right' : 'attack-left');
  setTimeout(() => {
    vEl.classList.add('hurt');
    setTimeout(() => {
      aEl.classList.remove('attack-right', 'attack-left');
      vEl.classList.remove('hurt');
    }, 400);
  }, 200);
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function runBattleSimulation() {
  battleRunning = true;

  const pMaxHP = getMaxHP(playerPokemon);
  const rMaxHP = getMaxHP(rivalPokemon);
  let pHP = pMaxHP;
  let rHP = rMaxHP;

  const pSpeed = getSpeed(playerPokemon);
  const rSpeed = getSpeed(rivalPokemon);

  let turn = pSpeed >= rSpeed ? 'player' : 'rival';
  let round = 0;
  const maxRounds = 20;

  while (pHP > 0 && rHP > 0 && round < maxRounds) {
    round++;
    await sleep(1200);

    const attacker = turn;
    const defender = attacker === 'player' ? 'rival' : 'player';
    const atk = attacker === 'player' ? playerPokemon : rivalPokemon;
    const def = defender === 'player' ? playerPokemon : rivalPokemon;

    const atkStat = getAttack(atk);
    const defStat = getDefense(def);
    const baseDmg = Math.max(1, Math.floor((atkStat / defStat) * (15 + Math.random() * 10)));
    const dmgPct = Math.min(50, (baseDmg / (defender === 'player' ? pMaxHP : rMaxHP)) * 100);

    animateAttack(attacker, defender);

    if (defender === 'player') {
      pHP = Math.max(0, pHP - (pMaxHP * dmgPct / 100));
      setHPBar('player', (pHP / pMaxHP) * 100);
    } else {
      rHP = Math.max(0, rHP - (rMaxHP * dmgPct / 100));
      setHPBar('rival', (rHP / rMaxHP) * 100);
    }

    const moves = ['¡Usó Placaje!', '¡Usó Ataque Rápido!', '¡Lanzó Bola de Agua!', '¡Usó Llamarada!', '¡Lanzó Rayo!', '¡Usó Terremoto!'];
    const move = moves[Math.floor(Math.random() * moves.length)];
    const accentColor = attacker === 'player' ? '#6890F0' : '#F08030';
    addLog(`${atk.name} ${move} (-${Math.round(dmgPct)}% HP)`, accentColor);

    if (pHP <= 0 || rHP <= 0) break;
    turn = turn === 'player' ? 'rival' : 'player';
  }

  await sleep(600);

  const playerWon = pHP > rHP;
  battleWinner = playerWon ? playerPokemon : rivalPokemon;

  document.getElementById('battle-controls').style.display = 'none';
  document.getElementById('victory-overlay').style.display = 'block';

  const victoryEl = document.getElementById('victory-text');
  const victoryImg = document.getElementById('victory-img');

  if (playerWon) {
    playWinSound();
    victoryEl.textContent = '🏆 ¡GANASTE!';
    victoryEl.style.color = '#ffcc00';
    addLog(`¡${playerPokemon.name} ganó la batalla!`, '#ffcc00');
    victoryImg.src = playerPokemon.sprites.other['official-artwork']?.front_default || playerPokemon.sprites.front_default;
    document.getElementById('capture-after-btn').style.display = capturedPokemon.find(c => c.id === rivalPokemon.id) ? 'none' : 'flex';
    spawnConfetti();
  } else {
    playLoseSound();
    victoryEl.textContent = '💀 ¡PERDISTE!';
    victoryEl.style.color = '#F08030';
    addLog(`¡${rivalPokemon.name} ganó la batalla!`, '#F08030');
    victoryImg.src = rivalPokemon.sprites.other['official-artwork']?.front_default || rivalPokemon.sprites.front_default;
    document.getElementById('capture-after-btn').style.display = 'none';
  }

  battleRunning = false;
}

function resetBattle() {
  selectedBattlePokemon = null;
  playerPokemon = null;
  rivalPokemon = null;
  battleWinner = null;
  document.getElementById('battle-arena').style.display = 'none';
  document.getElementById('battle-selection').style.display = 'block';
  document.querySelectorAll('.battle-select-card').forEach(c => c.classList.remove('selected'));
  document.getElementById('start-battle-btn').disabled = true;
}

async function battleWithThis() {
  if (!currentModalPokemon) return;
  const p = currentModalPokemon;
  closeModalDirect();
  await navigate('battle');
  setTimeout(() => {
    const card = document.querySelector(`.battle-select-card[data-id="${p.id}"]`);
    if (card) {
      selectBattlePokemon(p, card);
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 400);
}

async function applyRouteFromHash() {
  const route = parseHash();
  await navigate(route.page, false);

  if (route.detailId) {
    await openModal(route.detailId, false);
  } else if (currentModalPokemon) {
    closeModalDirect(false);
  }
}

window.addEventListener('hashchange', () => {
  applyRouteFromHash();
});

window.navigate = navigate;
window.toggleTheme = toggleTheme;
window.handleSearch = handleSearch;
window.filterByType = filterByType;
window.loadMore = loadMore;
window.closeModal = closeModal;
window.closeModalDirect = closeModalDirect;
window.captureCurrentPokemon = captureCurrentPokemon;
window.captureAfterBattle = captureAfterBattle;
window.battleWithThis = battleWithThis;
window.releasePokemon = releasePokemon;
window.handleBattleSearch = handleBattleSearch;
window.startBattle = startBattle;
window.resetBattle = resetBattle;

applyRouteFromHash();
