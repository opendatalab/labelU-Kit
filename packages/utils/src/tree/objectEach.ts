export function objectEach<T>(
  input: T,
  callback: (item: T[keyof T], path: string[], input: T) => void,
  onEnd?: (item: T) => void,
  path?: string[],
) {
  if (typeof input !== 'object' || !input) {
    return;
  }

  for (const key of Object.keys(input)) {
    const item = input[key as keyof T];

    callback(item, [...(path || []), key], input);

    if (typeof item === 'object' && !Array.isArray(item)) {
      objectEach(item as unknown as T, callback, onEnd, path);
    } else if (typeof onEnd === 'function') {
      onEnd(input);
    }
  }
}
