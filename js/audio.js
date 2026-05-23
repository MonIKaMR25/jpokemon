let audioContext = null;

function getContext() {
  if (!audioContext) {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return null;
    audioContext = new Context();
  }
  return audioContext;
}

function beep({ frequency = 440, duration = 0.12, type = 'square', volume = 0.04 }) {
  const ctx = getContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime);

  gain.gain.setValueAtTime(volume, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + duration);
}

export function playAttackSound() {
  beep({ frequency: 420 + Math.random() * 180, duration: 0.1, type: 'square', volume: 0.035 });
}

export function playWinSound() {
  beep({ frequency: 660, duration: 0.14, type: 'triangle' });
  setTimeout(() => beep({ frequency: 880, duration: 0.16, type: 'triangle' }), 100);
}

export function playLoseSound() {
  beep({ frequency: 240, duration: 0.16, type: 'sawtooth', volume: 0.03 });
  setTimeout(() => beep({ frequency: 180, duration: 0.2, type: 'sawtooth', volume: 0.03 }), 120);
}
