import type { Actions, Getters, State, StoreInstace } from "./types";

const registry = new Map<
  string,
  StoreInstace<State, Getters<State>, Actions>
>();

export function getStore(id: string) {
  return registry.get(id);
}

export function setStore(store: StoreInstace<State, Getters<State>, Actions>) {
  registry.set(store.$id, store);
}

export function hasStore(id: string) {
  return registry.has(id);
}

export function deleteStore(id: string) {
  return registry.delete(id);
}
