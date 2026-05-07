import type { SimBody } from "../simulation/types";

interface Voice {
  oscillator: OscillatorNode;
  gain: GainNode;
  panner: StereoPannerNode;
}

export class OrbitalAudio {
  private context: AudioContext | null = null;
  private master: GainNode | null = null;
  private voices = new Map<number, Voice>();

  async enable() {
    if (!this.context) {
      this.context = new AudioContext();
      this.master = this.context.createGain();
      this.master.gain.value = 0.08;
      this.master.connect(this.context.destination);
    }

    if (this.context.state !== "running") {
      await this.context.resume();
    }
  }

  disable() {
    for (const voice of this.voices.values()) {
      voice.gain.gain.setTargetAtTime(0, this.now(), 0.04);
      voice.oscillator.stop(this.now() + 0.12);
    }
    this.voices.clear();
  }

  update(bodies: SimBody[]) {
    if (!this.context || !this.master || this.context.state !== "running") {
      return;
    }

    const audible = bodies
      .filter((body) => body.period > 0 && body.mass > 0)
      .sort((a, b) => b.mass - a.mass)
      .slice(1, 8);

    const activeIds = new Set(audible.map((body) => body.id));
    for (const [id, voice] of this.voices) {
      if (!activeIds.has(id)) {
        voice.gain.gain.setTargetAtTime(0, this.now(), 0.08);
        voice.oscillator.stop(this.now() + 0.2);
        this.voices.delete(id);
      }
    }

    const referencePeriod = audible[0]?.period ?? 1;
    audible.forEach((body, index) => {
      const voice = this.getVoice(body.id, index);
      const harmonic = Math.max(0.3, Math.min(4, referencePeriod / body.period));
      const frequency = 110 * harmonic * (index % 2 === 0 ? 1 : 1.5);
      const gain = 0.025 / Math.sqrt(index + 1);
      const pan = Math.max(-0.8, Math.min(0.8, body.position[0] / 2.5));

      voice.oscillator.frequency.setTargetAtTime(frequency, this.now(), 0.12);
      voice.gain.gain.setTargetAtTime(gain, this.now(), 0.12);
      voice.panner.pan.setTargetAtTime(pan, this.now(), 0.12);
    });
  }

  private getVoice(id: number, index: number): Voice {
    const existing = this.voices.get(id);
    if (existing) {
      return existing;
    }

    if (!this.context || !this.master) {
      throw new Error("Audio context is not initialized");
    }

    const oscillator = this.context.createOscillator();
    oscillator.type = index % 3 === 0 ? "sine" : index % 3 === 1 ? "triangle" : "square";
    const gain = this.context.createGain();
    const panner = this.context.createStereoPanner();
    gain.gain.value = 0;
    oscillator.connect(gain);
    gain.connect(panner);
    panner.connect(this.master);
    oscillator.start();

    const voice = { oscillator, gain, panner };
    this.voices.set(id, voice);
    return voice;
  }

  private now() {
    return this.context?.currentTime ?? 0;
  }
}
