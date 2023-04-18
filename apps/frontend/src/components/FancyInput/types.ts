import type { Rule } from 'antd/es/form';

export interface FancyItemIdentifier {
  /** form field type */
  type: string;
  /** form field name */
  field: string;
  /** uniq key */
  key: string;
  label: string;
  initialValue: any;
  children?: FancyItemIdentifier[];
  hidden?: boolean;
  rules?: Rule[];
  layout?: 'horizontal' | 'vertical';
  /** antd input component props, only in template definition */
  antProps?: Record<string, unknown>;
}

export interface FancyInputProps {
  type: string;
  [key: string]: any;
}
