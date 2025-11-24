export default class AudioEngine {
  private ctx: AudioContext | null = null;
  private buffers: Array<AudioBuffer | null> = [];

  constructor() {
    // lazy init on first resume/play
  }

  private ensureCtx() {
    if (!this.ctx) {
      const C = (window as any).AudioContext || (window as any).webkitAudioContext;
      this.ctx = new C();
    }
  }

  ensurePadCount(count: number) {
    while (this.buffers.length < count) this.buffers.push(null);
  }

  async resume() {
    this.ensureCtx();
    if (this.ctx && this.ctx.state === 'suspended') await this.ctx.resume();
  }

  async loadFromArrayBuffer(padIndex: number, arrayBuffer: ArrayBuffer) {
    this.ensureCtx();
    if (!this.ctx) throw new Error('AudioContext not available');
    const audioBuffer = await this.ctx.decodeAudioData(arrayBuffer.slice(0));
    this.ensurePadCount(padIndex + 1);
    this.buffers[padIndex] = audioBuffer;
  }

  async loadFromFile(padIndex: number, file: File) {
    const ab = await file.arrayBuffer();
    return this.loadFromArrayBuffer(padIndex, ab);
  }

  play(padIndex: number) {
    this.ensureCtx();
    if (!this.ctx) return;
    const buffer = this.buffers[padIndex];
    if (!buffer) return;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const gain = this.ctx.createGain();
    gain.gain.value = 1;
    src.connect(gain).connect(this.ctx.destination);
    try {
      src.start();
    } catch (e) {
      // some browsers require resume before start
      this.ctx.resume().then(() => src.start());
    }
  }

  getSampleDuration(padIndex: number) {
    const buf = this.buffers[padIndex];
    return buf ? buf.duration : 0;
  }
}
