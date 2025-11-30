import { createStore } from "./createStore";
import { getStore, hasStore, setStore } from "./storeRegistry";
import type {
  Actions,
  Getters,
  State,
  StoreConfig,
  StoreInstance
} from "./types";

function getOrCreateStore<
  S extends State,
  G extends Getters<S>,
  A extends Actions
>(config: StoreConfig<S, G, A>): StoreInstance<S, G, A> {
  if (hasStore(config.id)) {
    return getStore(config.id) as StoreInstance<S, G, A>;
  }

  const store = createStore<S, G, A>(config);
  setStore(store);

  return store;
}

export function defineStore<
  S extends State,
  G extends Getters<S>,
  A extends Actions
>(config: StoreConfig<S, G, A>) {
  if (hasStore(config.id)) {
    throw new Error(`Store with id: "${config.id}" already exists.`);
  }

  return () => getOrCreateStore(config);
}
