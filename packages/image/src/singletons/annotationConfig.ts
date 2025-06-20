import type { AnnotatorOptions } from '@/core/AnnotatorConfig';
import AnnotatorConfig from '@/core/AnnotatorConfig';

let config: AnnotatorConfig | null = null;

export function createConfig(params: AnnotatorOptions) {
  config = new AnnotatorConfig(params);

  return config;
}

export { config };
