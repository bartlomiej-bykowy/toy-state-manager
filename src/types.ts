export type State = Record<string, any>;
export type Getters<S extends State> = Record<
  string,
  (state: S, getters: any) => any
>;
export type Actions = Record<string, (...args: any[]) => void | Promise<void>>;

export type StoreConfig<
  S extends State,
  G extends Getters<S>,
  A extends Actions
> = {
  id: string;
  state: () => S;
  getters?: G;
  actions?: A & ThisType<StoreInstance<S, G, A>>;
};

export type StoreInstance<
  S extends State,
  G extends Getters<S>,
  A extends Actions
> = {
  $id: string;
  $state: S;
  $patch: (partialState: Partial<S>) => void;
  $reset: (...args: (keyof S)[]) => void;
  $subscribe(callback: (oldState: S, newState: S) => void): () => void;
  $subscribeKey<K extends keyof S>(
    key: K,
    callback: (oldValue: S[K], newValue: S[K]) => void
  ): () => void;
} & {
  [K in keyof G]: ReturnType<G[K]>;
} & {
  [K in keyof A]: A[K];
};

export type Watchers<S extends State> = {
  globalWatchers: Array<(oldState: S, newState: S) => void>;
  keyWatchers: Map<keyof S, Array<(oldValue: any, newValue: any) => void>>;
  runGlobalWatchers: (oldState: S, newState: S) => void;
  runKeyWatchers: (oldState: S, newState: S, changedKeys: Set<keyof S>) => void;
  addGlobalWatcher: (callback: (oldState: S, newState: S) => void) => void;
  addKeyWatcher<K extends keyof S>(
    key: K,
    callback: (oldValue: S[K], newValue: S[K]) => void
  ): void;
  removeGlobalWatcher: (callback: (oldState: S, newState: S) => void) => void;
  removeKeyWatcher<K extends keyof S>(
    key: K,
    callback: (oldValue: S[K], newValue: S[K]) => void
  ): void;
};
