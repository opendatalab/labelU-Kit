export class Ticker {
  private _fps: number;
  private _interval: number;
  private _lastTick: number;
  private _rafId: number | null = null;
  private _shouldUpdate: boolean;
  private _tickHandler: () => void;

  /**
   * constructor
   * @param tickHandler 每一帧执行的函数
   * @param fps 默认60
   */
  constructor(tickHandler: () => void, fps: number = 60) {
    this._tickHandler = tickHandler;
    this._fps = fps;
    this._interval = 1000 / fps;
    this._lastTick = Date.now();
    this._shouldUpdate = false;
  }

  public start() {
    if (!this._rafId) {
      this.tick();
    }
  }

  public stop() {
    cancelAnimationFrame(this._rafId!);
    this._rafId = null;
  }

  public requestUpdate() {
    this._shouldUpdate = true;
  }

  private tick() {
    // const now = Date.now();
    // const elapsed = now - this._lastTick;

    if (this._shouldUpdate) {
      // this._lastTick = now - (elapsed % this._interval);
      this._tickHandler();
      this._shouldUpdate = false;
    }

    this._rafId = requestAnimationFrame(() => this.tick());
  }
}
