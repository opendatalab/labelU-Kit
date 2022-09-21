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
