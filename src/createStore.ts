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

  const store = {} as StoreInstance<S, G, A>;

  store.$id = id;
  store.$state = initialState;

  // ADD GETTERS AS COMPUTED VALUES
  if (getters && Object.keys(getters).length) {
    for (const key in getters) {
      const getter = getters[key];
      (store as any)[key] = getter(store.$state, store);
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
  // TODO: implement methods
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
  store.$subscribe = (cb) => () => console.log("path");
  store.$subscribeKey = (key, cb) => () => console.log("path");

  return store;
}
