// TODO: Move this into a store
export const ApiReqOpts: { [key: string]: { [key: string]: any } } = {
	defaults: {
		chatting: {
			max_tokens: 250,
			temperature: 0.75,
			frequency_penalty: 0.0,
			presence_penalty: 0.6,
		},
		coordinator: {
			temperature: 0.6,
			max_tokens: 25,
		},
	},
	custom: {},
};
