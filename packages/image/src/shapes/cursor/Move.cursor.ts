import { Cursor } from './Base';

// <svg t="1702955080222" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4218" width="200" height="200"><path d="M554.666667 256 554.666667 469.333333 768 469.333333 768 330.666667 949.333333 512 768 693.333333 768 554.666667 554.666667 554.666667 554.666667 768 693.333333 768 512 949.333333 330.666667 768 469.333333 768 469.333333 554.666667 256 554.666667 256 693.333333 74.666667 512 256 330.666667 256 469.333333 469.333333 469.333333 469.333333 256 330.666667 256 512 74.666667 693.333333 256 554.666667 256Z" p-id="4219"></path></svg>

const WIDTH = 1024;
const HEIGHT = 1024;

export class CursorMove extends Cursor {
  public style = {
    stroke: '#fff',
    strokeWidth: 1,
    fill: '#000',
    opacity: 1,
  };

  public path: Path2D = new Path2D(
    'M554.666667 256 554.666667 469.333333 768 469.333333 768 330.666667 949.333333 512 768 693.333333 768 554.666667 554.666667 554.666667 554.666667 768 693.333333 768 512 949.333333 330.666667 768 469.333333 768 469.333333 554.666667 256 554.666667 256 693.333333 74.666667 512 256 330.666667 256 469.333333 469.333333 469.333333 469.333333 256 330.666667 256 512 74.666667 693.333333 256 554.666667 256Z',
  );

  public render(ctx: CanvasRenderingContext2D | null) {
    if (!ctx) {
      throw Error('No context specific!');
    }

    const { x, y } = this.coordinate;

    if (!x && !y) {
      return;
    }
    const { fill, stroke, strokeWidth } = this.style;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(0.02, 0.02);
    ctx.translate(-WIDTH / 2, -HEIGHT / 2);
    ctx.fillStyle = fill;
    ctx.strokeStyle = stroke;
    ctx.lineWidth = strokeWidth;
    ctx.fill(this.path);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.restore();
  }
}
