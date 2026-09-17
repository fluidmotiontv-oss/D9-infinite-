class AudioSynthEngine {
  private audioCtx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private oscPrimary: OscillatorNode | null = null;
  private oscHarmonic1: OscillatorNode | null = null;
  private oscHarmonic2: OscillatorNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private isPlaying = false;
  private volume = 0.15;
  private baseFreq = 108; // 108Hz harmonic base (Formation frequency)

  public init() {
    if (this.audioCtx) return;
    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioContextClass();
      
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.setValueAtTime(0, this.audioCtx.currentTime);

      this.filter = this.audioCtx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.setValueAtTime(650, this.audioCtx.currentTime);
      this.filter.Q.setValueAtTime(2, this.audioCtx.currentTime);

      this.masterGain.connect(this.filter);
      this.filter.connect(this.audioCtx.destination);
    } catch (e) {
      console.warn('AudioContext not supported or blocked:', e);
    }
  }

  public toggle(): boolean {
    this.init();
    if (!this.audioCtx) return false;

    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }

  public start() {
    if (!this.audioCtx || !this.masterGain || this.isPlaying) return;

    try {
      const now = this.audioCtx.currentTime;

      // Primary sine wave
      this.oscPrimary = this.audioCtx.createOscillator();
      this.oscPrimary.type = 'sine';
      this.oscPrimary.frequency.setValueAtTime(this.baseFreq, now);

      // Sub-harmonic
      this.oscHarmonic1 = this.audioCtx.createOscillator();
      this.oscHarmonic1.type = 'sine';
      this.oscHarmonic1.frequency.setValueAtTime(this.baseFreq * 1.5, now); // Perfect 5th

      // Air harmonic
      this.oscHarmonic2 = this.audioCtx.createOscillator();
      this.oscHarmonic2.type = 'triangle';
      this.oscHarmonic2.frequency.setValueAtTime(this.baseFreq * 2.667, now);

      const gain1 = this.audioCtx.createGain();
      gain1.gain.setValueAtTime(0.6, now);

      const gain2 = this.audioCtx.createGain();
      gain2.gain.setValueAtTime(0.35, now);

      const gain3 = this.audioCtx.createGain();
      gain3.gain.setValueAtTime(0.15, now);

      this.oscPrimary.connect(gain1);
      this.oscHarmonic1.connect(gain2);
      this.oscHarmonic2.connect(gain3);

      gain1.connect(this.masterGain);
      gain2.connect(this.masterGain);
      gain3.connect(this.masterGain);

      this.oscPrimary.start(now);
      this.oscHarmonic1.start(now);
      this.oscHarmonic2.start(now);

      this.masterGain.gain.cancelScheduledValues(now);
      this.masterGain.gain.setValueAtTime(0, now);
      this.masterGain.gain.linearRampToValueAtTime(this.volume, now + 1.2);

      this.isPlaying = true;
    } catch (e) {
      console.warn('Failed to start synth oscillator:', e);
    }
  }

  public stop() {
    if (!this.audioCtx || !this.masterGain || !this.isPlaying) return;
    const now = this.audioCtx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.linearRampToValueAtTime(0, now + 0.5);

    setTimeout(() => {
      try {
        this.oscPrimary?.stop();
        this.oscHarmonic1?.stop();
        this.oscHarmonic2?.stop();
        this.oscPrimary?.disconnect();
        this.oscHarmonic1?.disconnect();
        this.oscHarmonic2?.disconnect();
      } catch {
        // ignore
      }
      this.isPlaying = false;
    }, 550);
  }

  public updateFrequency(frequencyMultiplier: number) {
    if (!this.audioCtx || !this.isPlaying) return;
    const now = this.audioCtx.currentTime;
    const targetFreq = Math.max(54, Math.min(432, this.baseFreq * frequencyMultiplier));
    
    this.oscPrimary?.frequency.setTargetAtTime(targetFreq, now, 0.1);
    this.oscHarmonic1?.frequency.setTargetAtTime(targetFreq * 1.5, now, 0.1);
    this.oscHarmonic2?.frequency.setTargetAtTime(targetFreq * 2.667, now, 0.1);
  }

  public setVolume(vol: number) {
    this.volume = vol;
    if (this.audioCtx && this.masterGain && this.isPlaying) {
      this.masterGain.gain.setTargetAtTime(vol, this.audioCtx.currentTime, 0.05);
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying;
  }
}

export const audioSynth = new AudioSynthEngine();
