export function createWatchers<S>() {
  const globalWatchers: Array<(oldState: S, newState: S) => void> = [];
  const keyWatchers = new Map<
    keyof S,
    Array<(oldValue: any, newValue: any) => void>
  >();

  const runGlobalWatchers = (oldState: S, newState: S) => {
    for (const watcher of globalWatchers) {
      watcher(oldState, newState);
    }
  };

  const runKeyWatchers = (
    oldState: S,
    newState: S,
    changedKeys: Set<keyof S>
  ) => {
    for (const key of changedKeys) {
      const watchers = keyWatchers.get(key);
      if (!watchers) continue;

      const oldValue = oldState[key];
      const newValue = newState[key];

      for (const watcher of watchers) {
        watcher(oldValue, newValue);
      }
    }
  };

  const addGlobalWatcher = (cb: (oldState: S, newState: S) => void) => {
    globalWatchers.push(cb);
  };

  function addKeyWatcher<K extends keyof S>(
    key: K,
    cb: (oldValue: S[K], newValue: S[K]) => void
  ) {
    const arr = keyWatchers.get(key) ?? [];
    arr.push(cb);
    keyWatchers.set(key, arr);
  }

  const removeGlobalWatcher = (cb: (oldState: S, newState: S) => void) => {
    const index = globalWatchers.indexOf(cb);
    if (index !== -1) globalWatchers.splice(index, 1);
  };

  function removeKeyWatcher<K extends keyof S>(
    key: K,
    cb: (oldValue: S[K], newValue: S[K]) => void
  ) {
    const arr = keyWatchers.get(key);
    if (!arr) return;

    const index = arr.indexOf(cb);
    if (index !== -1) arr.splice(index, 1);

    if (arr.length === 0) {
      keyWatchers.delete(key);
    }
  }

  return {
    globalWatchers,
    keyWatchers,
    runGlobalWatchers,
    runKeyWatchers,
    addGlobalWatcher,
    addKeyWatcher,
    removeGlobalWatcher,
    removeKeyWatcher
  };
}
