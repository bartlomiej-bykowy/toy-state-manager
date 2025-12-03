import type {
  Actions,
  Getters,
  State,
  StoreConfig,
  StoreInstance
} from "./types";

export function createGetters<
  S extends State,
  G extends Getters<S>,
  A extends Actions
>(
  store: StoreInstance<S, G, A>,
  gettersFromConfig: StoreConfig<S, G, A>["getters"]
) {
  const cache = new Map<keyof G, any>();
  const cacheValidity = new Set<keyof G>();

  const attach = () => {
    if (gettersFromConfig && Object.keys(gettersFromConfig).length) {
      for (const key in gettersFromConfig) {
        const getter = gettersFromConfig[key];

        Object.defineProperty(store, key, {
          enumerable: true,
          get() {
            if (!cacheValidity.has(key)) {
              const value = getter(store.$state, store);
              cache.set(key, value);
              cacheValidity.add(key);
            }

            return cache.get(key);
          }
        });
      }
    }
  };

  const invalidateCache = () => cacheValidity.clear();

  return {
    cache,
    cacheValidity,
    attach,
    invalidateCache
  };
}
