export interface IScribbleData {
  id: string;
  sourceID: string;
  url: string;
}

export interface IScribbleConfig extends IToolConfig {
  attributeList: IInputList[];
}
