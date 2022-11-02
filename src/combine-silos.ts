import { Silo, Subscriber } from "./types";

type SiloMap<T> = { [K in keyof T]: T[K] extends Silo<infer S, infer M> ? Silo<S, M> : never };
type CombinedState<T> = { [K in keyof T]: T[K] extends Silo<infer S, infer M> ? Silo<S, M>["initialState"] : never };
type CombinedSilo<S extends SiloMap<S>> = Silo<CombinedState<S>, {}> & {
	all: SiloMap<S>;
};

function combineState<S extends SiloMap<S>>(silos: S) {
	const state: Record<string, {}> = {};
	// eslint-disable-next-line roblox-ts/no-array-pairs
	for (const [name, silo] of pairs(silos)) {
		state[name as string] = (silo as Silo<{}, {}>).getState();
	}
	return state as CombinedState<S>;
}

/**
 * Combine silos.
 * @param silos Silos to combine
 * @returns Combined silos
 */
export function combineSilos<S extends SiloMap<S>>(silos: S): CombinedSilo<S> {
	let state = combineState(silos);

	const subscribers: Subscriber<CombinedState<S>>[] = [];

	const getState = () => state;

	const subscribe = (subscriber: Subscriber<CombinedState<S>>) => {
		let subscribed = true;
		subscribers.push(subscriber);
		return () => {
			if (!subscribed) return;
			subscribed = false;
			const index = subscribers.indexOf(subscriber);
			if (index === -1) return;
			subscribers.unorderedRemove(index);
		};
	};

	const notifySubscribers = (newState: CombinedState<S>, oldState: CombinedState<S>) => {
		for (const subscriber of subscribers) {
			subscriber(newState, oldState);
		}
	};

	const observe = <T>(
		selector: (state: CombinedState<S>) => T,
		observer: (value: T) => void,
		changed?: (newValue: T, oldValue: T) => boolean,
	) => {
		let value = selector(getState());
		observer(value);
		const didChange = changed ?? ((newValue: T, oldValue: T) => newValue !== oldValue);
		return subscribe((newState) => {
			const newValue = selector(newState);
			if (!didChange(newValue, value)) return;
			value = newValue;
			observer(value);
		});
	};

	const destroy = () => {
		table.clear(subscribers);
	};

	// eslint-disable-next-line roblox-ts/no-array-pairs
	for (const [name, silo] of pairs(silos)) {
		(silo as Silo<object, object>).subscribe(() => {
			const oldState = state;
			const newState = combineState(silos);
			state = newState;
			notifySubscribers(state, oldState);
		});
	}

	return {
		initialState: table.freeze(table.clone(state)),
		actions: {},
		getState: getState,
		subscribe: subscribe,
		observe: observe,
		destroy: destroy,
		all: silos,
	};
}
