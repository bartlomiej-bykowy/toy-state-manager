// storeRegistry.test.ts
import { describe, it, expect } from "vitest";
import { getStore, setStore, hasStore, deleteStore } from "../storeRegistry";
import type { Actions, Getters, StoreInstance } from "../types";

type S = { foo: string };

function createFakeStore(id: string): StoreInstance<S, Getters<S>, Actions> {
  return {
    $id: id,
    $state: { foo: "bar" },
    $patch: () => {},
    $reset: () => {},
    $subscribe: () => () => {},
    $subscribeKey: () => () => {}
  } as any;
}

describe("storeRegistry", () => {
  it("setStore and getStore work together", () => {
    const store = createFakeStore("registry-1");
    setStore(store);

    expect(hasStore("registry-1")).toBe(true);
    const stored = getStore("registry-1");
    expect(stored).toBe(store);
  });

  it("deleteStore removes store from registry", () => {
    const store = createFakeStore("registry-2");
    setStore(store);

    expect(hasStore("registry-2")).toBe(true);

    const deleted = deleteStore("registry-2");
    expect(deleted).toBe(true);
    expect(hasStore("registry-2")).toBe(false);
    expect(getStore("registry-2")).toBeUndefined();
  });

  it("deleteStore returns false for unknown id", () => {
    expect(deleteStore("unknown-id")).toBe(false);
  });
});
