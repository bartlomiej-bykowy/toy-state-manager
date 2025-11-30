import type { State } from "./types";
import { deepClone, shallowClone } from "./utils";

export function createStateProxy<S extends State>(
  state: S,
  notify: (prevState: S, newState: S, changedKeys: Set<keyof S>) => void
) {
  const proxy = new Proxy(state, {
    get(target: S, key: string) {
      return target[key];
    },
    set(target: S, key: string, value: any) {
      if (value === target[key]) return true;

      // we cannot siply return state because it's a Proxy, we need copies of
      // the old and new state. For the old state shallow copy is enough - old
      // state is just used to compare values vs new state and it's cheap. New
      // state has to be a deep copy becasue otherwise user could mutate state
      // using it
      const oldState = shallowClone(target);
      target[key as keyof S] = value;
      const newState = deepClone(target);

      notify(oldState, newState, new Set([key]));

      return true;
    }
  });

  return { proxy };
}
