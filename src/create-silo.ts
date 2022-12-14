import { Actions, Silo, Subscriber } from "./types";

/**
 * Create a new Silo.
 * @param initialState initial state
 * @param modifiers modifier functions
 * @returns Silo
 */
export function createSilo<S extends object, M extends object>(initialState: S, modifiers: M): Silo<S, M> {
	let state = table.freeze(table.clone(initialState));
	let modifying = false;

	const subscribers: Subscriber<S>[] = [];

	const modifiersWithoutState: Record<string, (...args: unknown[]) => void> = {};
	for (const [name, modifier] of pairs(modifiers as Record<string, (state: S, ...args: unknown[]) => S>)) {
		modifiersWithoutState[name] = (...args: unknown[]) => {
			if (modifying) {
				error(`cannot call an action from within a modifier`, 2);
			}
			modifying = true;
			const oldState = state;
			const newState = modifier(state, ...args);
			if (newState === oldState) {
				modifying = false;
				return;
			}
			state = newState;
			notifySubscribers(newState, oldState);
			modifying = false;
		};
	}

	const getState = () => state;

	const subscribe = (subscriber: Subscriber<S>) => {
		if (modifying) {
			error(`cannot subscribe from within a modifier`, 2);
		}
		let subscribed = true;
		subscribers.push(subscriber);
		return () => {
			if (!subscribed) return;
			if (modifying) {
				error(`cannot unsubscribe from within a modifier`, 2);
			}
			subscribed = false;
			const index = subscribers.indexOf(subscriber);
			if (index === -1) return;
			subscribers.unorderedRemove(index);
		};
	};

	const notifySubscribers = (newState: S, oldState: S) => {
		for (const subscriber of subscribers) {
			subscriber(newState, oldState);
		}
	};

	const observe = <T>(
		selector: (state: S) => T,
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
		if (modifying) {
			error(`cannot destroy silo from within a modifier`, 2);
		}
		table.clear(subscribers);
	};

	return {
		initialState: table.freeze(table.clone(initialState)),
		actions: modifiersWithoutState as Actions<S, M>,
		getState: getState,
		subscribe: subscribe,
		observe: observe,
		destroy: destroy,
	};
}
