export class Ticker {
  private fps: number;
  private interval: number;
  private lastTick: number;
  private rafId: number | null = null;
  private shouldUpdate: boolean;
  private tickHandler: () => void;

  /**
   * constructor
   * @param tickHandler 每一帧执行的函数
   * @param fps 默认60
   */
  constructor(tickHandler: () => void, fps: number = 60) {
    this.tickHandler = tickHandler;
    this.fps = fps;
    this.interval = 1000 / fps;
    this.lastTick = Date.now();
    this.shouldUpdate = false;
  }

  public start() {
    if (!this.rafId) {
      this.tick();
    }
  }

  public stop() {
    cancelAnimationFrame(this.rafId!);
    this.rafId = null;
  }

  public requestUpdate() {
    this.shouldUpdate = true;
  }

  private tick() {
    const now = Date.now();
    const elapsed = now - this.lastTick;

    if (elapsed > this.interval && this.shouldUpdate) {
      this.lastTick = now - (elapsed % this.interval);
      this.tickHandler();
      this.shouldUpdate = false;
    }

    this.rafId = requestAnimationFrame(() => this.tick());
  }
}
