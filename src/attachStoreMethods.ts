import type { Actions, Getters, State, StoreInstance, Watchers } from "./types";
import { cloneDeep } from "./utils";

export function attachStoreMethods<
  S extends State,
  G extends Getters<S>,
  A extends Actions
>(
  store: StoreInstance<S, G, A>,
  deps: { initialState: S; watchers: Watchers<S> }
) {
  const { initialState, watchers } = deps;

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
      store.$state[key as keyof S] = cloneDeep(initialState[key]);
    }
  };

  store.$subscribe = (cb) => {
    watchers.addGlobalWatcher(cb);

    return () => watchers.removeGlobalWatcher(cb);
  };

  store.$subscribeKey = (key, cb) => {
    watchers.addKeyWatcher(key, cb);

    return () => watchers.removeKeyWatcher(key, cb);
  };
}
