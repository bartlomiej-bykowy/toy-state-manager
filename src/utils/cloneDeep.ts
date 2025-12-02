import { isPlainObject } from "./isPlainObject";

export function cloneDeep<T>(obj: T): T {
  if (!isPlainObject(obj) && !Array.isArray(obj)) return obj;

  if (Array.isArray(obj)) {
    return obj.map(cloneDeep) as T;
  }

  const clone = {} as T;
  for (const key of Object.keys(obj as any)) {
    (clone as any)[key] = cloneDeep((obj as any)[key]);
  }

  return clone;
}
