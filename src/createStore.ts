import type {
  Actions,
  Getters,
  State,
  StoreConfig,
  StoreInstance
} from "./types";
import { cloneDeep } from "./utils";

export function createStore<
  S extends State,
  G extends Getters<S>,
  A extends Actions
>(config: StoreConfig<S, G, A>): StoreInstance<S, G, A> {
  const { id, state, getters, actions } = config;

  const rawState = state();
  const initialState = cloneDeep(rawState);
  const globalWatchers: Array<(oldState: S, newState: S) => void> = [];
  const keyWatchers = new Map<
    keyof S,
    Array<(oldValue: any, newValue: any) => void>
  >();
  const gettersCache = new Map<keyof G, any>();
  const gettersCacheValid = new Set<keyof G>();

  const store = {} as StoreInstance<S, G, A>;

  store.$id = id;
  store.$state = initialState;

  // ADD GETTERS AS COMPUTED VALUES
  if (getters && Object.keys(getters).length) {
    for (const key in getters) {
      const getter = getters[key];

      Object.defineProperty(store, key, {
        enumerable: true,
        get() {
          if (!gettersCacheValid.has(key)) {
            const value = getter(store.$state, store);
            gettersCache.set(key, value);
            gettersCacheValid.add(key);
          }

          return gettersCache.get(key);
        }
      });
    }
  }
  // ADD ACTIONS
  if (actions && Object.keys(actions).length) {
    for (const key in actions) {
      const action = actions[key];
      (store as any)[key] = action.bind(store);
    }
  }
  // ADD STORE METHODS
  store.$patch = (partialState: Partial<S>) => {
    for (const key in partialState) {
      if (!(key in store.$state)) {
        throw new Error(`State does not include property "${key}".`);
      }

      store.$state[key as keyof S] = partialState[key as keyof S]!;
    }
  };
  store.$reset = (...args: (keyof S)[]) => {
    if (args.length === 0) {
      for (const key in initialState) {
        store.$state[key] = cloneDeep(initialState[key]);
      }
      return;
    }

    for (const key of args) {
      store.$state[key] = cloneDeep(initialState[key]);
    }
  };
  store.$subscribe = (cb) => {
    globalWatchers.push(cb);

    return () => {
      const idx = globalWatchers.indexOf(cb);
      if (idx !== -1) globalWatchers.splice(idx, 1);
    };
  };
  store.$subscribeKey = (key, cb) => () => {
    const arr = keyWatchers.get(key) ?? [];
    arr.push(cb);
    keyWatchers.set(key, arr);

    return () => {
      const arr = keyWatchers.get(key);
      if (!arr) return;

      const idx = arr.indexOf(cb);
      if (idx !== -1) arr.splice(idx, 1);

      if (arr.length === 0) {
        keyWatchers.delete(key);
      }
    };
  };

  return store;
}
