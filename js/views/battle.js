import { fetchMoveDetail } from "../api.js";
import { getTypeMultiplier } from "../types.js";
import { getArtwork, renderTypeBadge, getHpClass, playBattleSfx } from "../utils.js";

function getStat(pokemon, statName, fallback = 50) {
  const found = pokemon.stats.find((item) => item.stat.name === statName);
  return found ? found.base_stat : fallback;
}

function chooseRival(pokemonList, playerId) {
  const available = pokemonList.filter((entry) => entry.id !== playerId);
  return available[Math.floor(Math.random() * available.length)];
}

function cleanMoveName(moveName) {
  return moveName
    .replace(/-/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getOffensiveStat(pokemon, category) {
  return category === "special"
    ? getStat(pokemon, "special-attack")
    : getStat(pokemon, "attack");
}

function getDefensiveStat(pokemon, category) {
  return category === "special"
    ? getStat(pokemon, "special-defense")
    : getStat(pokemon, "defense");
}

async function pickBattleMove(attacker) {
  const sample = attacker.moves
    .slice(0, 30)
    .sort(() => Math.random() - 0.5)
    .slice(0, 6);

  for (const moveEntry of sample) {
    try {
      const move = await fetchMoveDetail(moveEntry.move.url);
      const validClass = move.damage_class?.name === "physical" || move.damage_class?.name === "special";
      if (!validClass || !move.power) {
        continue;
      }

      return move;
    } catch {
      continue;
    }
  }

  return {
    name: "tackle",
    power: 40,
    accuracy: 100,
    type: { name: attacker.types[0]?.type?.name || "normal" },
    damage_class: { name: "physical" }
  };
}

function calculateDamage(attacker, defender, move) {
  const category = move.damage_class?.name === "special" ? "special" : "physical";
  const attack = getOffensiveStat(attacker, category);
  const defense = getDefensiveStat(defender, category);
  const power = move.power || 40;
  const randomMod = 0.87 + Math.random() * 0.28;
  const isCritical = Math.random() < 0.1;
  const criticalMod = isCritical ? 1.7 : 1;
  const attackerTypes = attacker.types.map((entry) => entry.type.name);
  const stab = attackerTypes.includes(move.type.name) ? 1.25 : 1;
  const defenderTypes = defender.types.map((entry) => entry.type.name);
  const typeMultiplier = getTypeMultiplier(move.type.name, defenderTypes);

  const base = ((power * (attack / Math.max(1, defense))) / 3.1) + 5;
  const damage = Math.max(3, Math.floor(base * randomMod * criticalMod * stab * typeMultiplier));

  return {
    damage,
    isCritical,
    typeMultiplier
  };
}

function hpPercent(current, max) {
  return Math.max(0, Math.round((current / max) * 100));
}

function renderSelection(list, selectedId) {
  return list
    .map((pokemon) => {
      const selected = pokemon.id === selectedId;
      return `
        <button class="poke-card text-left ${selected ? "ring-2 ring-cyan-300" : ""}" data-select-id="${pokemon.id}" type="button">
          <img src="${getArtwork(pokemon)}" alt="${pokemon.name}" loading="lazy">
          <p class="poke-name">${pokemon.name}</p>
        </button>
      `;
    })
    .join("");
}

export function renderBattleView({ app, pokemonList, selectionId, query, onQueryChange, onSelect, onBack }) {
  const filtered = query.trim()
    ? pokemonList.filter((pokemon) => pokemon.name.includes(query.trim().toLowerCase()))
    : pokemonList;

  app.innerHTML = `
    <section class="panel p-5 sm:p-7 fade-up">
      <h1 class="hero-title">Modo Batalla</h1>
      <p class="hero-sub mt-2">Selecciona tu Pokemon y simula un combate con sonido y animaciones.</p>

      <div class="filter-row mt-6">
        <label>
          <span class="sr-only">Buscar para batalla</span>
          <input id="battle-query" class="search-input" placeholder="Busca un Pokemon" value="${query}">
        </label>
        <div class="flex gap-3">
          <button id="battle-start" class="btn-primary flex-1" ${selectionId ? "" : "disabled style=opacity:0.6"}>Iniciar batalla</button>
          <button id="battle-back" class="btn-ghost">Volver</button>
        </div>
      </div>

      <div class="poke-grid mt-6">${renderSelection(filtered.slice(0, 60), selectionId)}</div>

      <div id="battle-sim" class="hidden-route mt-8"></div>
    </section>
  `;

  app.querySelector("#battle-query")?.addEventListener("input", (event) => onQueryChange(event.target.value));
  app.querySelector("#battle-back")?.addEventListener("click", onBack);

  app.querySelectorAll("[data-select-id]").forEach((button) => {
    button.addEventListener("click", () => {
      onSelect(Number(button.getAttribute("data-select-id")));
    });
  });

  return {
    startButton: app.querySelector("#battle-start"),
    simContainer: app.querySelector("#battle-sim")
  };
}

function appendLog(logElement, message) {
  const row = document.createElement("p");
  row.textContent = message;
  logElement.appendChild(row);
  logElement.scrollTop = logElement.scrollHeight;
}

function updateHpUI(barElement, labelElement, currentHp, maxHp) {
  const percent = hpPercent(currentHp, maxHp);
  barElement.style.width = `${percent}%`;
  barElement.className = `hp-bar ${getHpClass(percent)}`.trim();
  labelElement.textContent = `${percent}%`;
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function animateHit(attackerEl, defenderEl, direction) {
  const attackClass = direction === "right" ? "attack-right" : "attack-left";
  attackerEl.classList.add(attackClass);

  setTimeout(() => {
    defenderEl.classList.add("hit");
    setTimeout(() => {
      attackerEl.classList.remove(attackClass);
      defenderEl.classList.remove("hit");
    }, 250);
  }, 180);
}

export async function runBattleSimulation({ simContainer, player, pokemonList, onFinished }) {
  const rival = chooseRival(pokemonList, player.id);
  const playerMaxHp = getStat(player, "hp", 100);
  const rivalMaxHp = getStat(rival, "hp", 100);

  let playerCurrentHp = playerMaxHp;
  let rivalCurrentHp = rivalMaxHp;

  simContainer.classList.remove("hidden-route");
  simContainer.innerHTML = `
    <div class="panel p-5 battle-zone">
      <article class="panel p-4">
        <h2 class="text-lg font-black">Arena</h2>
        <div class="arena mt-4 grid grid-cols-2 gap-4 items-end">
          <div>
            <img id="player-avatar" class="battler w-full max-w-[140px]" src="${getArtwork(player)}" alt="${player.name}">
            <p class="font-black capitalize">${player.name}</p>
            <div class="hp-wrap mt-2"><div id="player-hp" class="hp-bar" style="width:100%"></div></div>
            <p id="player-hp-label" class="text-xs mt-1" style="color:var(--muted)">100%</p>
            <div class="flex flex-wrap gap-1 mt-2">${player.types.map((entry) => renderTypeBadge(entry.type.name)).join("")}</div>
          </div>
          <div class="text-right">
            <img id="rival-avatar" class="battler w-full max-w-[140px] ml-auto" src="${getArtwork(rival)}" alt="${rival.name}">
            <p class="font-black capitalize">${rival.name}</p>
            <div class="hp-wrap mt-2"><div id="rival-hp" class="hp-bar" style="width:100%"></div></div>
            <p id="rival-hp-label" class="text-xs mt-1" style="color:var(--muted)">100%</p>
            <div class="flex flex-wrap gap-1 mt-2 justify-end">${rival.types.map((entry) => renderTypeBadge(entry.type.name)).join("")}</div>
          </div>
        </div>
      </article>

      <article class="panel p-4">
        <h2 class="text-lg font-black">Registro de combate</h2>
        <div id="battle-log" class="battle-log mt-3"></div>
        <div class="mt-4">
          <p id="battle-result" class="text-sm font-black uppercase tracking-wide"></p>
        </div>
      </article>
    </div>
  `;

  const playerAvatar = simContainer.querySelector("#player-avatar");
  const rivalAvatar = simContainer.querySelector("#rival-avatar");
  const playerHpBar = simContainer.querySelector("#player-hp");
  const rivalHpBar = simContainer.querySelector("#rival-hp");
  const playerHpLabel = simContainer.querySelector("#player-hp-label");
  const rivalHpLabel = simContainer.querySelector("#rival-hp-label");
  const logElement = simContainer.querySelector("#battle-log");
  const resultElement = simContainer.querySelector("#battle-result");

  appendLog(logElement, `Empieza la batalla: ${player.name} vs ${rival.name}`);

  let turn = getStat(player, "speed") >= getStat(rival, "speed") ? "player" : "rival";

  for (let round = 1; round <= 20; round += 1) {
    const attacker = turn === "player" ? player : rival;
    const defender = turn === "player" ? rival : player;
    const move = await pickBattleMove(attacker);
    const result = calculateDamage(attacker, defender, move);
    const damage = result.damage;
    const moveName = cleanMoveName(move.name);
    const typeText = result.typeMultiplier > 1
      ? " Es super efectivo."
      : result.typeMultiplier < 1
      ? " No es muy efectivo."
      : "";
    const criticalText = result.isCritical ? " Golpe critico." : "";

    if (turn === "player") {
      animateHit(playerAvatar, rivalAvatar, "right");
      rivalCurrentHp = Math.max(0, rivalCurrentHp - damage);
      updateHpUI(rivalHpBar, rivalHpLabel, rivalCurrentHp, rivalMaxHp);
    } else {
      animateHit(rivalAvatar, playerAvatar, "left");
      playerCurrentHp = Math.max(0, playerCurrentHp - damage);
      updateHpUI(playerHpBar, playerHpLabel, playerCurrentHp, playerMaxHp);
    }

    playBattleSfx("hit");
    appendLog(logElement, `Ronda ${round}: ${attacker.name} uso ${moveName} y hace ${damage} de dano.${criticalText}${typeText}`);

    if (playerCurrentHp === 0 || rivalCurrentHp === 0) {
      break;
    }

    turn = turn === "player" ? "rival" : "player";
    await wait(820);
  }

  const playerWon = playerCurrentHp > rivalCurrentHp;
  const winner = playerWon ? player : rival;
  const loser = playerWon ? rival : player;

  resultElement.textContent = `${winner.name} gana el combate.`;
  resultElement.style.color = playerWon ? "#2ddf7f" : "#ff7c83";
  appendLog(logElement, `${winner.name} derrota a ${loser.name}.`);
  playBattleSfx(playerWon ? "win" : "lose");

  onFinished({ winner, loser, playerWon, rival });
}
