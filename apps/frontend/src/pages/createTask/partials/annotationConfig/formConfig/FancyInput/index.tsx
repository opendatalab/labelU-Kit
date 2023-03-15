import { inputs } from './fancyInput';

export interface FancyInputProps {
  type: string;
  [key: string]: any;
}

export default function FancyInput({ type, ...props }: FancyInputProps) {
  const Input = inputs[type];

  if (!Input) {
    console.warn(`FancyInput: ${type} is not supported`);
    return <>Not supported yet</>;
  }

  return <Input {...props} />;
}
