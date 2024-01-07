export default function mapValues<T extends Record<string, any>, U>(
  obj: T,
  fn: (value: T[keyof T]) => U,
): { [K in keyof T]: U } {
  const result: { [K in keyof T]?: U } = {};

  Object.keys(obj).forEach((key) => {
    result[key as keyof T] = fn(obj[key as keyof T]);
  });

  return result as { [K in keyof T]: U };
}
