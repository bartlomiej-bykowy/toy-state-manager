import { describe, it, expect, vi, beforeEach } from "vitest";
import { defineStore } from "../defineStore";
import type { Getters, Actions, StoreConfig } from "../types";
import { __clearStoreForTests } from "../storeRegistry";

type CounterState = { count: number; nested?: { value: number } };
type CounterGetters<S> = {
  double: (state: S) => number;
  triple: (state: S) => number;
};
type CounterActions = {
  inc: (by: number) => void;
  setCount: (value: number) => void;
};

function createCounterStore() {
  const useCounter = defineStore<
    CounterState,
    CounterGetters<CounterState>,
    CounterActions
  >({
    id: "counter",
    state: () => ({
      count: 0,
      nested: { value: 1 }
    }),
    getters: {
      double: (state) => state.count * 2,
      triple: (state) => state.count * 3
    },
    actions: {
      inc(by: number) {
        this.$state.count += by;
      },
      setCount(value: number) {
        this.$state.count = value;
      }
    }
  });

  return useCounter();
}

beforeEach(() => {
  __clearStoreForTests();
});

describe("Basic behavior", () => {
  it("creates a store instance with $id and $state", () => {
    const store = createCounterStore();

    expect(store.$id).toBe("counter");
    expect(store.$state).toEqual({ count: 0, nested: { value: 1 } });
  });

  it("returns the same instance for multiple useStore() calls", () => {
    const useCounter = defineStore<
      CounterState,
      CounterGetters<CounterState>,
      CounterActions
    >({
      id: "counter-2",
      state: () => ({ count: 0, nested: { value: 1 } }),
      getters: {
        double: (state) => state.count * 2,
        triple: (state) => state.count * 3
      },
      actions: {
        inc(by: number) {
          this.$state.count += by;
        },
        setCount(value: number) {
          this.$state.count = value;
        }
      }
    });

    const store1 = useCounter();
    const store2 = useCounter();

    expect(store1).toBe(store2);
  });

  it("throws when defining a store with duplicate id", () => {
    const config = {
      id: "duplicate",
      state: () => ({ count: 0 })
    } as StoreConfig<{ count: number }, Getters<{ count: number }>, Actions>;

    const useStore = defineStore(config);

    // first call OK
    useStore();

    // second defineStore with same id should throw
    expect(() => defineStore(config)).toThrow(
      'Store with id: "duplicate" already exists.'
    );
  });
});

describe("Actions", () => {
  it("binds actions to the store instance and allows modifying $state", async () => {
    const store = createCounterStore();

    store.inc(2);
    expect(store.$state.count).toBe(2);

    store.setCount(10);
    expect(store.$state.count).toBe(10);
  });
});

describe("Getters", () => {
  it("computes getters lazily and caches result until state changes", async () => {
    let computeDoubleCount = 0;

    type S = { count: number };
    type G<S> = {
      double: (state: S) => number;
    };
    type A = {
      inc: (by: number) => void;
    };

    const useStore = defineStore<S, G<S>, A>({
      id: "getter-test",
      state: () => ({ count: 0 }),
      getters: {
        double(state) {
          computeDoubleCount++;
          return state.count * 2;
        }
      },
      actions: {
        inc(by: number) {
          this.$state.count += by;
        }
      }
    });

    const store = useStore();

    // first access - getter calculated
    expect(store.double).toBe(0);
    expect(computeDoubleCount).toBe(1);

    // second access - from cache
    expect(store.double).toBe(0);
    expect(computeDoubleCount).toBe(1);

    // mutate state
    store.inc(1);
    // wait for proxy flush (queueMicrotask)
    await Promise.resolve();

    // getter recomputed after state change
    expect(store.double).toBe(2);
    expect(computeDoubleCount).toBe(2);

    // still cached until next change
    expect(store.double).toBe(2);
    expect(computeDoubleCount).toBe(2);
  });
});

describe("Subscriptions", () => {
  it("calls global watchers once per batched update with correct old/new states", async () => {
    const store = createCounterStore();

    const globalSpy = vi.fn();

    store.$subscribe(globalSpy);

    store.$state.count = 1;
    store.$state.count = 2; // same tick, should be batched

    await Promise.resolve(); // let queueMicrotask flush

    expect(globalSpy).toHaveBeenCalledTimes(1);
    const [oldState, newState] = globalSpy.mock.calls[0];

    expect(oldState).toEqual({ count: 0, nested: { value: 1 } });
    expect(newState).toEqual({ count: 2, nested: { value: 1 } });
  });

  it("calls key watchers with old/new values only for changed keys", async () => {
    const store = createCounterStore();

    const countSpy = vi.fn();
    const nestedSpy = vi.fn();

    store.$subscribeKey("count", countSpy);
    store.$subscribeKey("nested", nestedSpy);

    store.$state.count = 5;

    await Promise.resolve();

    expect(countSpy).toHaveBeenCalledTimes(1);
    const [oldVal, newVal] = countSpy.mock.calls[0];
    expect(oldVal).toBe(0);
    expect(newVal).toBe(5);

    expect(nestedSpy).not.toHaveBeenCalled();
  });

  it("unsubscribe functions stop further notifications", async () => {
    const store = createCounterStore();

    const spy = vi.fn();
    const unsubscribe = store.$subscribe(spy);

    store.$state.count = 1;
    await Promise.resolve();
    expect(spy).toHaveBeenCalledTimes(1);

    unsubscribe();

    store.$state.count = 2;
    await Promise.resolve();
    expect(spy).toHaveBeenCalledTimes(1);
  });
});

describe("$patch", () => {
  it("$patch updates multiple keys and notifies watchers once (batched)", async () => {
    type S = { a: number; b: number };

    const useStore = defineStore<S, Getters<S>, Actions>({
      id: "patch-test",
      state: () => ({ a: 1, b: 2 })
    } as any);

    const store = useStore();
    const spy = vi.fn();
    store.$subscribe(spy);

    store.$patch({ a: 10, b: 20 });

    await Promise.resolve();

    expect(store.$state).toEqual({ a: 10, b: 20 });
    expect(spy).toHaveBeenCalledTimes(1);

    const [oldState, newState] = spy.mock.calls[0];

    expect(oldState).toEqual({ a: 1, b: 2 });
    expect(newState).toEqual({ a: 10, b: 20 });
  });

  it("$patch throws when patching unknown key", () => {
    type S = { a: number };

    const useStore = defineStore<S, Getters<S>, Actions>({
      id: "patch-error-test",
      state: () => ({ a: 1 })
    } as any);

    const store = useStore();

    expect(() => store.$patch({ a: 2, ...({ unknown: 5 } as any) })).toThrow(
      'State does not include property "unknown".'
    );
  });
});

describe("$reset", () => {
  it("$reset with no args restores full initial state (deep clone)", async () => {
    type S = { a: number; nested: { value: number } };
    type A = {
      mutateNested: () => void;
    };

    const useStore = defineStore<S, Getters<S>, A>({
      id: "reset-test",
      state: () => ({ a: 1, nested: { value: 1 } }),
      actions: {
        mutateNested() {
          this.$state.nested.value = 999;
        }
      }
    });

    const store = useStore();

    store.$state.a = 10;
    store.mutateNested();
    await Promise.resolve();

    expect(store.$state).toEqual({ a: 10, nested: { value: 999 } });

    store.$reset();
    await Promise.resolve();

    expect(store.$state).toEqual({ a: 1, nested: { value: 1 } });

    // mutate nested again and check that initial snapshot is not affected
    store.mutateNested();
    await Promise.resolve();

    expect(store.$state.nested.value).toBe(999);
  });

  it("$reset with keys only resets those keys", async () => {
    type S = { a: number; b: number };

    const useStore = defineStore<S, Getters<S>, Actions>({
      id: "reset-keys-test",
      state: () => ({ a: 1, b: 2 })
    } as any);

    const store = useStore();

    store.$patch({ a: 10, b: 20 });
    await Promise.resolve();
    expect(store.$state).toEqual({ a: 10, b: 20 });

    store.$reset("a");
    await Promise.resolve();
    expect(store.$state).toEqual({ a: 1, b: 20 });
  });
});

describe("State isolation", () => {
  it("does not mutate external initial state object", async () => {
    const externalInitial: CounterState = {
      count: 0,
      nested: { value: 1 }
    };

    const useStore = defineStore<
      CounterState,
      CounterGetters<CounterState>,
      CounterActions
    >({
      id: "isolation-test",
      state: () => externalInitial,
      getters: {
        double: (state) => state.count * 2,
        triple: (state) => state.count * 3
      },
      actions: {
        inc(by: number) {
          this.$state.count += by;
        },
        setCount(value: number) {
          this.$state.count = value;
        }
      }
    });

    const store = useStore();

    store.$state.count = 5;
    store.$state.nested!.value = 42;
    await Promise.resolve();

    expect(externalInitial).toEqual({ count: 0, nested: { value: 1 } });
    expect(store.$state).toEqual({ count: 5, nested: { value: 42 } });
  });
});
