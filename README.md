# Silo
State management based on Redux slices.

## Usage

### Create a Silo
Creating a new silo is easy. Define the state and modifiers, and then create the silo via
`createSilo()`, passing along the initial state and the modifier implementations.
```ts
// Define the shape of the state:
interface MyState {
	kills: number;
	points: number;
}

// Define the modifier actions:
interface MyModifiers {
	addKill: (state: MyState) => MyState;
	addPoints: (state: MyState, points: number) => MyState;
}

// Create the Silo:
const mySilo = createSilo<MyState, MyModifiers>(
	{
		// Default state:
		kills: 0,
		points: 0,
	},
	{
		// Modifier implementations:
		addKill: (state) => {
			return {
				...state,
				kills: state.kills + 1,
			};
		},
		addPoints: (state, points) => {
			return {
				...state,
				points: state.points + points,
			};
		},
	},
);
```

### Modifying state via actions
Modifiers can be accessed through the `actions` property of a silo. Actions are functions
that are identical to the modifier implementation, except the first `state` argument is
dropped, since the silo can inject that itself.

For instance, to use the `addKill` and `addPoints` modifiers, we can call the resulting actions
as `mySilo.actions.addKill` and `mySilo.actions.addPoints`:
```ts
// Add kill:
mySilo.actions.addKill();

// Add 15 points:
mySilo.actions.addPoints(15);
```

### Fetching state
Use the `getState()` function to get the current state of a silo.
```ts
print(mySilo.getState());
print(`Points: ${mySilo.getState().points}`);
```

### Listening for state changes
Use the `subscribe` function to subscribe to all future changes to the entire state, which
will also include a copy of the old state.

Use the `observe` function to observe a specific selection of the state, which will then fire
the given observer function anytime the selection changes, including the immediate value.

```ts
// Subscribe to changes to the state:
mySilo.subscribe((newState, oldState) => {
	print("State changed");
});

// Observe points:
mySilo.observe((state) => state.points, (points) => {
	print(`Points: ${points}`);
});

// The `subscribe` and `observe` functions return functions that can be called
// in order to stop subscribing/observing:
const unsubscribe = mySilo.subscribe((newState, oldState) => {});
unsubscribe();

const stopObserving = mySilo.observe((state) => state.points, (points) => {});
stopObserving();
```

### Cleanup
If a silo needs to be cleaned up during runtime, call the `destroy()` function on the silo.
All this function does is clear out the subscriber/observer list internally.
```ts
mySilo.destroy();
```

### Combine Silos
It is common to have more than one silo. Use the `combineSilo` function to create a wrapper
silo around multiple silos. The individual silos can still be used, but the combined silo
can be used to help manage and observe state.

```ts
// Assuming we have the `mySilo` from the first example.

interface AnotherState { message: string }
interface AnotherModifiers {
	setMessage: (state: AnotherState, msg) => AnotherState;
}
const anotherSilo = createSilo<AnotherState, AnotherModifiers>(
	{ message: "" },
	{ setMessage: (state, msg) => { return {...state, message: msg} }},
);

// Combine `mySilo` and `anotherSilo`:
const silos = combineSilos({
	my: mySilo,
	another: anotherSilo,
});

// Calling `getState()` returns a combined state of all silos:
print(`Message: ${silos.getState().another.message}`);

// Individual silos can also be accessed through the `all` property:
print(`Message: ${silos.all.another.getState().message}`);

// Observe the current message & future changes to the message:
silos.observe((state) => state.another.message, (msg) => {
	print(`Observing message: ${msg}`);
});

// Set a message:
silos.all.another.actions.setMessage("Hello world");
```
