export type Actions<S, K> = {
	[P in keyof K]: K[P] extends (state: S, ...a: infer P) => void ? (...a: P) => void : never;
};

export type Subscriber<S> = (newState: S, oldState: S) => void;
export type Selector<S, T> = (state: S) => T;
export type Observer<T> = (value: T) => void;

export interface Silo<S extends object, M extends object> {
	/** The initial state of the Silo. */
	initialState: Readonly<S>;

	/** Actions associated with the silo. These are used to modify the state. */
	actions: Actions<S, M>;

	/** Get the current state. */
	getState: () => Readonly<S>;

	/** Subscribe to changes to the state. */
	subscribe: (subscriber: Subscriber<S>) => () => void;

	/** Observe a selection of the state. */
	observe: <T>(selector: Selector<S, T>, observer: Observer<T>) => () => void;

	/** Disconnect subscribers and observers. */
	destroy: () => void;
}
