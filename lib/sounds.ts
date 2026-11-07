/**
 * Audio Synthesizer & Sound Alert System for Vinissia Dairy ERP
 * Sourced & Adapted from Choco House & Waffle House Systems.
 * Plays loud, unmistakable alerts for new delivery orders, chat messages, and cashier actions.
 */

let audioCtx: AudioContext | null = null;
let continuousAlarmTimer: any = null;

export function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioContextClass =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;
  if (!audioCtx) audioCtx = new AudioContextClass();
  if (audioCtx.state === "suspended") {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

// Global user interaction listener to un-suspend Chrome AudioContext automatically
if (typeof window !== "undefined") {
  const resumeOnInteraction = () => {
    try {
      if (!audioCtx) {
        const AudioContextClass =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) audioCtx = new AudioContextClass();
      }
      if (audioCtx && audioCtx.state === "suspended") {
        audioCtx.resume().catch(() => {});
      }
    } catch {}
  };
  window.addEventListener("click", resumeOnInteraction, { passive: true });
  window.addEventListener("keydown", resumeOnInteraction, { passive: true });
  window.addEventListener("touchstart", resumeOnInteraction, { passive: true });
}

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return true;
  const val = localStorage.getItem("vinissia_sounds_enabled");
  return val === null || val === "1";
}

export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === "undefined") return;
  localStorage.setItem("vinissia_sounds_enabled", enabled ? "1" : "0");
}

export function playSound(
  type: "click" | "order" | "chat" | "alert" | "success" | "kitchen" | "alarm"
): void {
  if (!isSoundEnabled()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }

  const patterns: Record<string, { tones: [number, number, number][]; wave: OscillatorType }> = {
    click: { tones: [[620, 0, 0.045]], wave: "sine" },
    order: {
      tones: [
        [784, 0, 0.15],
        [988, 0.12, 0.15],
        [1318, 0.25, 0.25],
      ],
      wave: "triangle",
    },
    alarm: {
      // High-volume delivery emergency chime (from Choco House)
      tones: [
        [880, 0, 0.18],
        [1174, 0.16, 0.22],
        [880, 0.42, 0.18],
        [1318, 0.58, 0.3],
      ],
      wave: "triangle",
    },
    chat: {
      tones: [
        [587, 0, 0.1],
        [784, 0.12, 0.14],
      ],
      wave: "sine",
    },
    alert: {
      tones: [
        [520, 0, 0.2],
        [520, 0.25, 0.2],
        [390, 0.5, 0.3],
      ],
      wave: "square",
    },
    success: {
      tones: [
        [587.33, 0, 0.1],
        [739.99, 0.12, 0.1],
        [880.0, 0.24, 0.25],
      ],
      wave: "sine",
    },
    kitchen: {
      tones: [
        [1046, 0, 0.1],
        [880, 0.12, 0.1],
        [1046, 0.24, 0.18],
      ],
      wave: "sine",
    },
  };

  const config = patterns[type] || patterns.order;
  config.tones.forEach(([freq, startTime, duration]) => {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = config.wave;
      osc.frequency.setValueAtTime(freq, ctx.currentTime + startTime);
      const now = ctx.currentTime + startTime;
      gain.gain.setValueAtTime(0.001, now);
      // High volume for loud unmistakable alarm
      gain.gain.exponentialRampToValueAtTime(0.55, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + duration + 0.02);
    } catch {}
  });
}

/**
 * Starts continuous delivery alarm loop that keeps ringing loudly every 1.5 seconds
 * until stopped by cashier acknowledging the order.
 */
export function startContinuousAlarm(intervalMs = 1500): () => void {
  stopContinuousAlarm();
  playSound("alarm");
  continuousAlarmTimer = setInterval(() => {
    playSound("alarm");
  }, intervalMs);

  return stopContinuousAlarm;
}

export function stopContinuousAlarm(): void {
  if (continuousAlarmTimer) {
    clearInterval(continuousAlarmTimer);
    continuousAlarmTimer = null;
  }
}
