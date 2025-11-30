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
  // TODO: implement function
}
