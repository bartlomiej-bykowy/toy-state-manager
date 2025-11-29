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
  actions?: A;
};

export type StoreInstace<
  S extends State,
  G extends Getters<S>,
  A extends Actions
> = {
  $id: string;
  $state: S;
  $patch: (partialState: Partial<S>) => void;
  $reset: (...args: (keyof S)[]) => void;
  $subscribe(callback: (presState: S, newState: S) => void): () => void;
  $subscribeKey<K extends keyof S>(
    key: K,
    callback: (prevValue: S[K], newValue: S[K]) => void
  ): () => void;
} & {
  [K in keyof G]: ReturnType<G[K]>;
} & {
  [K in keyof A]: A[K];
};
