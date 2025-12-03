import type { State } from "./types";
import { cloneDeep, cloneShallow } from "./utils";

export function createStateProxy<S extends State>(
  state: S,
  onChangeCommit: (prevState: S, newState: S, changedKeys: Set<keyof S>) => void
) {
  let pending = false;
  let oldState: S = {} as S;
  const changedKeys = new Set<keyof S>();

  const flush = (target: S) => {
    if (!pending) return;
    const newState = cloneDeep(target);
    onChangeCommit(oldState, newState, changedKeys);
    pending = false;
    changedKeys.clear();
  };

  const proxy = new Proxy(state, {
    get(target: S, key: string) {
      return target[key];
    },
    set(target: S, key: string, value: any) {
      if (value === target[key]) return true;

      /**
       * Batches multiple state mutations into a single commit.
       *
       * The first mutation in a tick:
       *  - saves a shallow snapshot of the previous state,
       *  - schedules a microtask to run `flush()`,
       *  - starts collecting changed keys.
       *
       * Every mutation in the same tick:
       *  - updates the target,
       *  - adds the key to `changedKeys`.
       *
       * `queueMicrotask` lets us defer the `flush()` execution until after
       * **all** synchronous mutations have completed, but before the next
       * event loop tick. So mutations like:
       *   state.a = 1; state.b = 2;
       * trigger exactly ONE state commit + watcher notification.
       *
       * Without batching, each assignment would notify watchers separately.
       */
      if (!pending) {
        pending = true;
        oldState = cloneShallow(target);
        changedKeys.clear();
        queueMicrotask(() => flush(target));
      }

      changedKeys.add(key);
      target[key as keyof S] = value;

      return true;
    }
  });

  return proxy;
}
