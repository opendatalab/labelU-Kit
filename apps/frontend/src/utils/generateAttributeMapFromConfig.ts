import { jsonParse } from './index';

export function generateAttributeMapFromConfig(config: string) {
  const conf = jsonParse(config);
  const attributeMap = new Map();

  for (const attr of conf.attribute) {
    attributeMap.set(attr.key, attr.value);
  }

  // attributeList in tools
  for (const tool of conf.tools) {
    const toolConfig = tool.config;

    if (toolConfig.attributeList) {
      for (const attr of toolConfig.attributeList) {
        if (!attributeMap.has(attr.key)) {
          attributeMap.set(attr.key, attr.value);
        }
      }
    }
  }

  return attributeMap;
}
