declare module '*.svg' {
  const content: any;
  export default content;
}

declare module '*.png' {
  const value: any;
  export = value;
}

declare module 'color-rgba' {
  const content: (a: string) => any[];
  export default content;
}

declare module 'web-worker:./highlightWorker.js' {
  const content: any;
  export default content;
}
declare module 'web-worker:./filterBoxWorker.js' {
  const content: any;
  export default content;
}

declare module 'web-worker:../pointCloud/highlightOneBoxWorker.js' {
  const content: any;
  export default content;
}

declare module 'web-worker:../pointCloud/highlightBoxesWorkder.js' {
  const content: any;
  export default content;
}
