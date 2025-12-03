import type {
  Actions,
  Getters,
  State,
  StoreConfig,
  StoreInstance
} from "./types";

export function attachActions<
  S extends State,
  G extends Getters<S>,
  A extends Actions
>(
  store: StoreInstance<S, G, A>,
  actionsFromConfig: StoreConfig<S, G, A>["actions"]
) {
  if (actionsFromConfig && Object.keys(actionsFromConfig).length) {
    for (const key in actionsFromConfig) {
      const action = actionsFromConfig[key];
      (store as any)[key] = action.bind(store);
    }
  }
}
