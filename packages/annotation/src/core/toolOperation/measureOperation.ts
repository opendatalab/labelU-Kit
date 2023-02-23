import type { IRectOperationProps } from './rectOperation';
import RectOperation from './rectOperation';

type IMeasureOpeartion = IRectOperationProps;

const config = {
  textConfigurable: false,
  attributeConfigurable: true,
  attributeList: [],
};

class MeasureOperation extends RectOperation {
  constructor(props: IMeasureOpeartion) {
    super({ ...props, config });
  }

  public setSelectedIdAfterAddingDrawingRect() {
    if (!this.drawingRect) {
      return;
    }

    this.setSelectedRectID(this.drawingRect.id);
  }
}

export default MeasureOperation;
