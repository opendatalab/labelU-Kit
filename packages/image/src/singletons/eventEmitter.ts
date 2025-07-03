import EventEmitter from 'eventemitter3';

import type { EInternalEvent } from '../enums';

export type EventName =
  | EInternalEvent
  | 'hover'
  | 'move'
  | 'change'
  | 'zoom'
  | 'select'
  | 'unselect'
  | 'add'
  | 'delete'
  | 'clear'
  | 'load'
  | 'labelChange'
  | 'attributesChange'
  | 'backgroundImageLoaded'
  | 'toolChange'
  | 'click'
  | 'mouseup'
  | 'dblclick'
  | 'error'
  | 'rightClick'
  | 'contextmenu'
  | 'relationModeStart'
  | 'relationModeEnd'
  | 'relationCreated';

const eventEmitter = new EventEmitter();

function on(name: EventName, callback: (...args: any[]) => void) {
  return eventEmitter.on(name, callback);
}

function once(name: EventName, callback: (...args: any[]) => void) {
  return eventEmitter.once(name, callback);
}

function off(name: EventName, callback: (...args: any[]) => void) {
  return eventEmitter.off(name, callback);
}

function emit(name: EventName, ...args: any[]) {
  return eventEmitter.emit(name, ...args);
}

function removeAllListeners() {
  return eventEmitter.removeAllListeners();
}

export { on, once, off, emit, removeAllListeners };
