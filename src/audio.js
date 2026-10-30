import { STORAGE_MUTE } from "./constants.js";
import { clamp } from "./utils.js";

function createNoiseBuffer(context) {
  const length = context.sampleRate * 1.2;
  const buffer = context.createBuffer(1, length, context.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i += 1) {
    data[i] = Math.random() * 2 - 1;
  }
  return buffer;
}

export function createAudio() {
  let context = null;
  let master = null;
  let noiseBuffer = null;
  let muted = false;

  try {
    muted = localStorage.getItem(STORAGE_MUTE) === "true";
  } catch {
    muted = false;
  }

  const ensure = () => {
    if (context) {
      if (context.state === "suspended") context.resume();
      return context;
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;

    context = new AudioContextClass();
    master = context.createGain();
    master.gain.value = muted ? 0 : 0.72;
    master.connect(context.destination);
    noiseBuffer = createNoiseBuffer(context);
    return context;
  };

  const noise = (
    duration,
    {
      type = "bandpass",
      frequency = 900,
      q = 0.8,
      gain = 0.2,
      sweep = null,
    } = {},
  ) => {
    if (!ensure()) return;
    const now = context.currentTime;
    const source = context.createBufferSource();
    source.buffer = noiseBuffer;
    const filter = context.createBiquadFilter();
    filter.type = type;
    filter.frequency.setValueAtTime(frequency, now);
    filter.Q.value = q;
    if (sweep) {
      filter.frequency.exponentialRampToValueAtTime(
        Math.max(40, sweep),
        now + duration,
      );
    }
    const envelope = context.createGain();
    envelope.gain.setValueAtTime(0.0001, now);
    envelope.gain.exponentialRampToValueAtTime(gain, now + 0.012);
    envelope.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    source.connect(filter);
    filter.connect(envelope);
    envelope.connect(master);
    source.start(now);
    source.stop(now + duration + 0.05);
  };

  const tone = (
    duration,
    {
      frequency = 440,
      endFrequency = frequency,
      type = "sine",
      gain = 0.12,
      delay = 0,
      attack = 0.01,
    } = {},
  ) => {
    if (!ensure()) return;
    const start = context.currentTime + delay;
    const oscillator = context.createOscillator();
    const envelope = context.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    oscillator.frequency.exponentialRampToValueAtTime(
      Math.max(20, endFrequency),
      start + duration,
    );
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(gain, start + attack);
    envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(envelope);
    envelope.connect(master);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.04);
  };

  const play = (name, options = {}) => {
    if (muted) return;

    if (name === "ui") {
      tone(0.07, {
        frequency: 640,
        endFrequency: 880,
        type: "triangle",
        gain: 0.05,
      });
    } else if (name === "drop") {
      tone(0.3, {
        frequency: 420,
        endFrequency: 180,
        type: "sine",
        gain: 0.06,
      });
      noise(0.24, { frequency: 1200, sweep: 380, gain: 0.035 });
    } else if (name === "land") {
      tone(0.22, {
        frequency: 120,
        endFrequency: 55,
        type: "sine",
        gain: 0.16,
      });
      noise(0.3, { type: "lowpass", frequency: 700, sweep: 180, gain: 0.11 });
    } else if (name === "swing") {
      noise(0.28, { frequency: 480, sweep: 1800, q: 1.4, gain: 0.16 });
      tone(0.16, {
        frequency: 220,
        endFrequency: 120,
        type: "sawtooth",
        gain: 0.025,
      });
    } else if (name === "hit") {
      const power = clamp(options.power ?? 0.5, 0, 1);
      tone(0.24, {
        frequency: 92,
        endFrequency: 38,
        type: "sine",
        gain: 0.28 + power * 0.12,
      });
      noise(0.16, {
        type: "highpass",
        frequency: 1600,
        sweep: 4200,
        gain: 0.16 + power * 0.12,
      });
      tone(0.1, {
        frequency: 1900,
        endFrequency: 900,
        type: "square",
        gain: 0.035,
      });
    } else if (name === "launch") {
      noise(0.34, { frequency: 700, sweep: 2600, q: 1.8, gain: 0.12 });
      tone(0.25, {
        frequency: 240,
        endFrequency: 620,
        type: "triangle",
        gain: 0.05,
      });
    } else if (name === "bounce") {
      tone(0.14, {
        frequency: 140,
        endFrequency: 70,
        type: "sine",
        gain: 0.11,
      });
      noise(0.14, { type: "lowpass", frequency: 900, sweep: 300, gain: 0.06 });
    } else if (name === "celebrate") {
      [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
        tone(0.42, {
          frequency,
          endFrequency: frequency,
          type: "triangle",
          gain: 0.065,
          delay: index * 0.1,
        });
      });
    } else if (name === "best") {
      [659.25, 830.61, 987.77, 1318.51].forEach((frequency, index) => {
        tone(0.5, {
          frequency,
          endFrequency: frequency,
          type: "sine",
          gain: 0.07,
          delay: 0.15 + index * 0.11,
        });
      });
    } else if (name === "copy") {
      tone(0.09, {
        frequency: 880,
        endFrequency: 1320,
        type: "triangle",
        gain: 0.05,
      });
    }
  };

  const setMuted = (nextMuted) => {
    muted = nextMuted;
    if (master && context) {
      master.gain.setTargetAtTime(muted ? 0 : 0.72, context.currentTime, 0.03);
    }
    try {
      localStorage.setItem(STORAGE_MUTE, String(muted));
    } catch {
      // Storage is optional.
    }
  };

  const toggleMuted = () => {
    setMuted(!muted);
    return muted;
  };

  const unlock = () => {
    ensure();
  };

  return {
    play,
    setMuted,
    toggleMuted,
    isMuted: () => muted,
    unlock,
  };
}
