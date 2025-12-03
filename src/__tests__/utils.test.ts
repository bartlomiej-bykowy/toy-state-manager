// utils.test.ts
import { describe, it, expect } from "vitest";
import { cloneDeep, cloneShallow, isPlainObject } from "../utils";

describe("isPlainObject", () => {
  it("detects plain objects correctly", () => {
    expect(isPlainObject({})).toBe(true);
    expect(isPlainObject({ a: 1 })).toBe(true);

    expect(isPlainObject(null)).toBe(false);
    expect(isPlainObject([])).toBe(false);
    expect(isPlainObject(new Date())).toBe(false);
    expect(isPlainObject("string")).toBe(false);
    expect(isPlainObject(123)).toBe(false);
  });
});

describe("cloneShallow", () => {
  it("returns non-object values as-is", () => {
    expect(cloneShallow(5 as any)).toBe(5);
    expect(cloneShallow("abc" as any)).toBe("abc");
  });

  it("creates a shallow copy of plain objects", () => {
    const original = { a: 1, nested: { v: 2 } };
    const copy = cloneShallow(original);

    expect(copy).not.toBe(original);
    expect(copy).toEqual(original);

    // shallow copy – prop nested should be a reference
    expect(copy.nested).toBe(original.nested);
  });
});

describe("cloneDeep", () => {
  it("returns non-object values as-is", () => {
    expect(cloneDeep(5 as any)).toBe(5);
    expect(cloneDeep("abc" as any)).toBe("abc");
  });

  it("deeply clones plain objects", () => {
    const original = { a: 1, nested: { v: 2 } };
    const copy = cloneDeep(original);

    expect(copy).not.toBe(original);
    expect(copy).toEqual(original);
    expect(copy.nested).not.toBe(original.nested);

    copy.nested.v = 999;
    expect(original.nested.v).toBe(2);
  });

  it("deeply clones arrays", () => {
    const original = [{ v: 1 }, { v: 2 }];
    const copy = cloneDeep(original);

    expect(copy).not.toBe(original);
    expect(copy).toEqual(original);

    copy[0].v = 999;
    expect(original[0].v).toBe(1);
  });
});
