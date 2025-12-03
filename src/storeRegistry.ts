import type { Actions, Getters, State, StoreInstance } from "./types";

type AnyStoreInstance = StoreInstance<any, any, any>;

const registry = new Map<string, AnyStoreInstance>();

export function getStore(id: string) {
  return registry.get(id);
}

export function setStore<
  S extends State,
  G extends Getters<S>,
  A extends Actions
>(store: StoreInstance<S, G, A>): void {
  registry.set(store.$id, store as AnyStoreInstance);
}

export function hasStore(id: string): boolean {
  return registry.has(id);
}

export function deleteStore(id: string): boolean {
  return registry.delete(id);
}

export function __clearStoreForTests() {
  registry.clear();
}
