export type Actions<S, K> = {
	[P in keyof K]: K[P] extends (state: S, ...a: infer P) => void ? (...a: P) => void : never;
};

export type Subscriber<S> = (newState: S, oldState: S) => void;
export type Selector<S, T> = (state: S) => T;
export type Observer<T> = (value: T) => void;

export interface Silo<S extends object, M extends object> {
	initialState: Readonly<S>;
	actions: Actions<S, M>;
	getState: () => Readonly<S>;
	subscribe: (subscriber: Subscriber<S>) => () => void;
	observe: <T>(selector: Selector<S, T>, observer: Observer<T>) => () => void;
	destroy: () => void;
}
