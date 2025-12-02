import { isPlainObject } from "./isPlainObject";

export function cloneShallow<T>(obj: T): T {
  if (!isPlainObject(obj)) return obj;

  return { ...obj };
}
