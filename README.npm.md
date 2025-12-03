# toy-state-manager

toy-state-manager is a tiny, dependency-free, fully typed state management system inspired by Pinia/Vuex and designed to demonstrate how reactivity, watchers, getters, batching and state proxies work under the hood.

It is framework-agnostic, works with plain JavaScript or TypeScript, and is built around Proxies, microtask batching, and computed getters with caching.

To see it in action, check the demo app:
👉 [https://github.com/bartlomiej-bykowy/toy-shop](https://github.com/bartlomiej-bykowy/toy-shop)

---

## ⚠️ This package was created as a side/hobby project and it's not meant to be used in production.

---

## 🚀 Features

- 🎯 Zero dependencies
- 🧱 Proxy-based reactivity (mutations trigger watchers automatically)
- 🧵 Microtask batching (multiple synchronous writes = one notification)
- 🔍 Watchers (global and key-specific watchers)
- 🧮 Getters with caching (omputed values re-compute only when needed)
- 🛠️ Actions bound to the store instance
- 🔄 $patch() for partial updates
- 🧼 $reset() for full or partial reset
- 🗃️ Store registry (prevents accidental duplicate store creation)
- 🧪 Fully typed APIs with TS inference

---

## 📦 Installation

```bash
npm install @bartlomiej-bykowy/toy-store
# or
pnpm add @bartlomiej-bykowy/toy-store
# or
yarn add @bartlomiej-bykowy/toy-store
```

---

## 🕹️ Basic Usage

### 1. Define a store

```ts
import { defineStore } from "@bartlomiej-bykowy/toy-store";

type State = { count: number };
type Getters<S> = {
  double: (state: S) => void;
};
type Actions = {
  increment: () => void;
};

export const useCounter = defineStore<State, Getters<State>, Actions>({
  id: "counter",
  state: () => ({ count: 0 }),

  getters: {
    double: (state) => state.count * 2
  },

  actions: {
    increment() {
      this.$state.count++;
    }
  }
});
```

### 2. Use the store

```ts
const counter = useCounter();

counter.increment();
console.log(counter.$state.count); // 1
console.log(counter.double); // 2
```

---

## 🔭 API

#### `defineStore(config)`

Creates a store factory function.

#### Type definition:

```ts
type State = Record<string, any>;
type Getters<S extends State> = Record<string, (state: S, getters: any) => any>;
type Actions = Record<string, (...args: any[]) => void | Promise<void>>;

type StoreConfig<S extends State, G extends Getters<S>, A extends Actions> = {
  id: string;
  state: () => S;
  getters?: G;
  actions?: A & ThisType<StoreInstance<S, G, A>>;
};
```

#### Usage

```ts
const useStore = defineStore<S, G<S>, A>({
  id: "products",
  state: () => ({ products: [], cart: [] }),
  getters: { ... },
  actions: { ... }
});
```

Calling it returns the store instance:

```ts
const store = useStore();
```

#### Config fields

| Field     | Description                       |
| --------- | --------------------------------- |
| `id`      | Store identifier (must be unique) |
| `state`   | Function returning initial state  |
| `getters` | Computed values with caching      |
| `actions` | Business logic; can mutate state  |

### 🏪 Store Instance

Every store has the following fields:

```ts
{
  $id: string
  $state: S
  $patch(partialState)
  $reset(...keys)
  $subscribe(cb)
  $subscribeKey(key, cb)
  ...getters // as computed values
  ...actions
}
```

#### `$state`

Reactive state proxy.
Mutations trigger watchers:

```ts
store.$state.count = 10;
```

#### `$patch(partialState)`

Partial updates:

```ts
store.$patch({ count: 5 });
```

#### $reset(...keys)

Reset the entire state:

```ts
store.$reset();
```

Or reset selected fields:

```ts
store.$reset("products", "cart");
```

Internally uses a deep clone of the original initial state.

#### $subscribe(callback)

Watches the entire state.

```ts
const unsubscribe = store.$subscribe((oldState, newState) => {
  console.log("State changed:", oldState, "→", newState);
});

// later:
unsubscribe();
```

#### $subscribeKey(key, callback)

Watches a specific key:

```ts
store.$subscribeKey("count", (oldValue, newValue) => {
  console.log("count:", oldValue, "→", newValue);
});
```

### 🧮 Getters

Getters behave like computed properties:

```ts
double: (state) => state.count * 2;
```

They are:

- memorized (cached),
- recomputed only when state changes,
- attached directly to the store:

```ts
store.double;
```

### ⚙️ Actions

Actions are bound to the store instance:

```ts
actions: {
  addProduct(product) {
    this.$state.products = [...this.$state.products, product];
  }
}
```

Async actions are supported:

```ts
actions: {
  async fetchData() {
    const data = await fetch("/api");
    this.$state.items = await data.json();
  }
}
```

## 🔍 Reactivity & Batching

All state changes happen through a Proxy.

#### **Example**

```ts
store.$state.a = 1;
store.$state.b = 2;
```

Only **one** watcher call occurs. It's because internally:

- first mutation snapshots oldState,
- schedules a microtask,
- collects changed keys,
- flushes everything at once at the end of the tick.

It's good for performance and make updates predictable.

## 🔐 Store Registry

Each store is registered by its `id`.

```ts
const useA = defineStore({ id: "x", ... });
const useB = defineStore({ id: "x", ... }); // ❌ throws error
```

## 🧪 TypeScript Support

Everything is fully typed, including:

- inference of state shape,
- getters return types,
- action this types,
- key-specific watchers,
- partial & deep state updates.

Example:

```ts
const store = useStore();

store.$patch({ count: 10 }); // typed
store.$subscribeKey("count", (old, next) => {}); // typed
store.double; // typed getter
store.increment(); // typed action
```

## 🧠 Why shallow copy for oldState but deep copy for newState?

**oldState (shallow copy)**
Used only for comparisons and watchers — cheap and safe.

**newState (deep copy)**
Given to watchers so they cannot accidentally mutate your store through reference sharing.

## ⚠️ Dev Notes

- The store requires state to be a function `(state: () => ({...}))`, otherwise multiple instances would share a single state object.
- Direct array mutation (push) won't trigger watchers; use immutable updates:

```ts
this.$state.items = [...this.$state.items, item];
```

## 🧭 Example Store

```ts
export type Product = {
  id: number;
  name: string;
  desc: string;
  img: string;
  price: number;
};
type ProductsState = { products: Product[]; cart: Product[] };
type Getters<S> = {
  productsInCart: (state: S) => number;
};
type Actions = {
  loadProducts: (products: Product[]) => void;
  addToCart: (products: Product[]) => void;
  removeFromCart: (id: number) => Product[];
  clearCart: () => void;
};

const useProductsStore = defineStore<
  ProductsState,
  Getters<ProductsState>,
  Actions
>({
  id: "test",
  state: () => ({
    products: [],
    cart: []
  }),
  getters: {
    productsInCart: (state) => state.cart.length
  },
  actions: {
    loadProducts(products: Product[]) {
      this.$state.products = products;
    },
    addToCart(products: Product[]) {
      this.$state.cart = [...this.$state.cart, ...products];
    },
    removeFromCart(id: number) {
      const newCart = this.$state.cart.filter((product) => product.id !== id);
      this.$state.cart = newCart;
      return newCart;
    },
    clearCart() {
      this.$state.cart = [];
    }
  }
});

export const productsStore = useProductsStore();
```
