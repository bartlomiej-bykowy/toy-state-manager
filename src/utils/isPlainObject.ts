export function isPlainObject(value: any): boolean {
  if (value === null) return false;
  return typeof value === "object" && value.constructor === Object;
}
