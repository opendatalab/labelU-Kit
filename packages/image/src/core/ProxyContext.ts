export interface IProxyContext extends CanvasRenderingContext2D {
  transformedPoint: (x: number, y: number) => DOMPoint;
}

export class ProxyContext {
  private _svg: SVGSVGElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');

  private _xform = this._svg.createSVGMatrix();

  private _pt = this._svg.createSVGPoint();

  private _savedXform: DOMMatrix[] = [];

  private _ctx: CanvasRenderingContext2D;

  constructor(ctx: CanvasRenderingContext2D) {
    this._ctx = ctx;
  }

  public getTransform() {
    return this._xform;
  }

  public save() {
    this._savedXform.push(this._xform.translate(0, 0));
  }

  public restore() {
    this._xform = this._savedXform.pop()!;
  }

  public scale(sx: number, sy: number) {
    this._xform = this._xform.scaleNonUniform(sx, sy);
  }

  public rotate(radians: number) {
    this._xform = this._xform.rotate((radians * 180) / Math.PI);
  }

  public translate(dx: number, dy: number) {
    this._xform = this._xform.translate(dx, dy);
  }

  public transform(a: number, b: number, c: number, d: number, e: number, f: number) {
    const m2 = this._svg.createSVGMatrix();
    m2.a = a;
    m2.b = b;
    m2.c = c;
    m2.d = d;
    m2.e = e;
    m2.f = f;
    this._xform = this._xform.multiply(m2);
  }

  public setTransform(a: number, b: number, c: number, d: number, e: number, f: number) {
    this._xform.a = a;
    this._xform.b = b;
    this._xform.c = c;
    this._xform.d = d;
    this._xform.e = e;
    this._xform.f = f;
  }

  public transformedPoint(x: number, y: number) {
    this._pt.x = x;
    this._pt.y = y;

    return this._pt.matrixTransform(this._xform.inverse());
  }

  public get xform() {
    return this._xform;
  }

  public get pt() {
    return this._pt;
  }

  public createContext(): IProxyContext {
    const { _ctx } = this;

    return new Proxy(_ctx, {
      get: (target, propKey) => {
        const originMethod = target[propKey as keyof CanvasRenderingContext2D];

        console.log(propKey);
        if (propKey === 'transformedPoint') {
          debugger;
        }

        if (typeof originMethod === 'undefined') {
          return this[propKey as keyof ProxyContext].bind(this);
        }

        if (typeof originMethod === 'function') {
          return (...args: any[]) => {
            let result;

            if (propKey in _ctx) {
              result = originMethod.apply(target, args);
            }

            if (propKey in this) {
              result = this[propKey as keyof ProxyContext].bind(this)(...args);
            }

            return result;
          };
        } else {
          return originMethod;
        }
      },

      set: function (target, propKey, value) {
        // 设置属性值时，我们不需要做任何额外的操作
        target[propKey] = value;
        return true;
      },
    }) as unknown as IProxyContext;
  }
}
