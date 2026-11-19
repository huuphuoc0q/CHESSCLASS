// Synthesized classroom sound effects using Web Audio API (no external MP3 dependencies)

class SoundEngine {
  private ctx: AudioContext | null = null;
  private muted: boolean = false;

  private getContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.muted = muted;
  }

  public isMuted(): boolean {
    return this.muted;
  }

  // Crisp wooden piece placement thud
  public playMove() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(190, now);
    osc.frequency.exponentialRampToValueAtTime(75, now + 0.065);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(650, now);

    gain.gain.setValueAtTime(0.32, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.075);
  }

  // Punchier wooden capture clack
  public playCapture() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Low wood knock
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(280, now);
    osc.frequency.exponentialRampToValueAtTime(65, now + 0.09);

    gain.gain.setValueAtTime(0.42, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.095);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.1);

    // Short snap transient
    const bufferSize = Math.floor(ctx.sampleRate * 0.035);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
    }
    const noise = ctx.createBufferSource();
    const noiseFilter = ctx.createBiquadFilter();
    const noiseGain = ctx.createGain();
    noise.buffer = buffer;
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1400, now);
    noiseGain.gain.setValueAtTime(0.28, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start(now);
  }

  // Check alert chime
  public playCheck() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [523.25, 659.25];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.2, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.22);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.24);
    });
  }

  // Countdown tick (sharp tick for last 5 seconds)
  public playTick(urgent = false) {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = urgent ? 'square' : 'sine';
    osc.frequency.setValueAtTime(urgent ? 980 : 660, now);
    osc.frequency.exponentialRampToValueAtTime(urgent ? 640 : 440, now + 0.045);

    gain.gain.setValueAtTime(urgent ? 0.16 : 0.09, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.055);
  }

  // Classroom bell when countdown reaches 0
  public playTimeUp() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    [880, 1318.5, 1760].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      gain.gain.setValueAtTime(0.18 / (idx + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.78);
    });
  }

  // Cheerful arpeggio + synthesized classroom applause burst
  public playSuccess() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Bright C-major arpeggio
    const freqs = [523.25, 659.25, 783.99, 1046.5];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      const start = now + idx * 0.075;
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.22, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.32);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.34);
    });

    // Soft synthesized applause claps
    for (let c = 0; c < 9; c++) {
      const clapTime = now + 0.12 + c * 0.055 + Math.random() * 0.025;
      const bufLen = Math.floor(ctx.sampleRate * 0.045);
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const ch = buf.getChannelData(0);
      for (let i = 0; i < bufLen; i++) {
        ch[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufLen * 0.28));
      }
      const src = ctx.createBufferSource();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      src.buffer = buf;
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1100 + Math.random() * 600, clapTime);
      gain.gain.setValueAtTime(0.09, clapTime);
      gain.gain.exponentialRampToValueAtTime(0.001, clapTime + 0.045);

      src.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      src.start(clapTime);
    }
  }

  // Gentle low nudge on wrong move
  public playError() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(165, now + 0.16);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  }
}

export const sound = new SoundEngine();
