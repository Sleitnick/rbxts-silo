import { combineSilos } from "./combine-silos";
import { createSilo } from "./create-silo";

export { createSilo } from "./create-silo";
export { combineSilos } from "./combine-silos";
export { Silo } from "./types";

interface MyState {
	kills: number;
	deaths: number;
}

interface MyModifiers {
	addKill: (state: MyState, payload: number) => MyState;
}

const siloTest = createSilo<MyState, MyModifiers>(
	{
		kills: 0,
		deaths: 0,
	},
	{
		addKill: (state, payload) => {
			return {
				...state,
				kills: state.kills + payload,
			};
		},
	},
);

const anotherSilo = createSilo<{ abc: string }, {}>({ abc: "hello" }, {});

siloTest.actions.addKill(10);

const silos = combineSilos({
	test: siloTest,
	another: anotherSilo,
});
