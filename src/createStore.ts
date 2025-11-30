import type {
  Actions,
  Getters,
  State,
  StoreConfig,
  StoreInstance
} from "./types";

export function createStore<
  S extends State,
  G extends Getters<S>,
  A extends Actions
>(config: StoreConfig<S, G, A>): StoreInstance<S, G, A> {
  const store = {} as StoreInstance<S, G, A>;

  const { id, state, getters, actions } = config;

  store.$id = id;
  store.$state = state();

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
  store.$patch = () => console.log("path");
  store.$reset = () => console.log("reset");
  store.$subscribe = (cb) => () => console.log("path");
  store.$subscribeKey = (key, cb) => () => console.log("path");

  return store;
}
