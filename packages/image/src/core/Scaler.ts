import EventEmitter from 'eventemitter3';

import type { Annotator } from '../ImageAnnotator';

export class Scaler extends EventEmitter {
  private _minScale = 0.1;

  private _maxScale = 10;

  private _scale: number = 1;
  private _offsetX: number;
  private _offsetY: number;

  private _scalePerTick: number = 0.05;

  private _annotator: Annotator;

  constructor(annotator: Annotator) {
    super();
    this._scale = 1;
    this._offsetX = 0;
    this._offsetY = 0;
    this._annotator = annotator;

    annotator.config.container.addEventListener('wheel', this._wheelScale.bind(this));
  }

  private _wheelScale(e: WheelEvent) {
    e.preventDefault();

    let { _scale, _offsetX, _offsetY } = this;
    const { _scalePerTick, _annotator } = this;

    const rect = _annotator.config.container.getBoundingClientRect();
    // 此处获取的鼠标位置已经考虑了画布的缩放和偏移
    const x = (e.clientX - rect.left - _offsetX) / _scale;
    const y = (e.clientY - rect.top - _offsetY) / _scale;

    const oldScale = _scale;

    if (e.deltaY > 0) {
      // 向上滚动，放大
      _scale = Math.min(_scale + _scalePerTick, this._maxScale);
    } else {
      // 向下滚动，缩小
      _scale = Math.max(_scale - _scalePerTick, this._minScale);
    }

    // 根据新的缩放因子更新偏移量
    _offsetX = _offsetX - x * (_scale - oldScale);
    _offsetY = _offsetY - y * (_scale - oldScale);

    this.setScale(_scale);
    this.setOffsetX(_offsetX);
    this.setOffsetY(_offsetY);

    this.emit('scale', this);
  }

  get scale() {
    return this._scale;
  }
  get offsetX() {
    return this._offsetX;
  }
  get offsetY() {
    return this._offsetY;
  }
  public setScale(scale: number) {
    this._scale = scale;
  }
  public setOffsetX(offsetX: number) {
    this._offsetX = offsetX;
  }
  public setOffsetY(offsetY: number) {
    this._offsetY = offsetY;
  }
  public reset() {
    this._scale = 1;
    this._offsetX = 0;
    this._offsetY = 0;
  }

  public destroy() {
    this._annotator.config.container.removeEventListener('wheel', this._wheelScale.bind(this));
    this._annotator = null as any;
    this.removeAllListeners();
  }
}
