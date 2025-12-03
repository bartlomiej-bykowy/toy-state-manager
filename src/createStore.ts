import { attachActions } from "./attachActions";
import { attachStoreMethods } from "./attachStoreMethods";
import { createGetters } from "./createGetters";
import { createStateProxy } from "./createStateProxy";
import { createWatchers } from "./createWatchers";
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
  // create new deep copies of state to remove potencial reference to the original state object
  const rawState = config.state();
  const initialState = cloneDeep(rawState);
  const proxyState = cloneDeep(rawState);

  const store = {
    $id: config.id
  } as StoreInstance<S, G, A>;

  // global and key-specific watchers for state changes
  const watchers = createWatchers<S>();

  const getters = createGetters<S, G, A>(store, config.getters);

  const onChangeCommit = (
    oldState: S,
    newState: S,
    changedKeys: Set<keyof S>
  ) => {
    // Invalidate getters' cache (state changed, so getters may have changed)
    getters.invalidateCache();

    watchers.runGlobalWatchers(oldState, newState);
    watchers.runKeyWatchers(oldState, newState, changedKeys);
  };

  // create "reactive" state proxy
  store.$state = createStateProxy(proxyState, onChangeCommit);
  // attach getters as computed values
  getters.attach();
  // attach actions
  attachActions(store, config.actions);
  // attach store methods
  attachStoreMethods<S, G, A>(store, { initialState, watchers });

  return store;
}
