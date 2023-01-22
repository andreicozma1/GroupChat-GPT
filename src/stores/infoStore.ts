import {defineStore} from "pinia";

interface InfoState {
	message?: string;
}

export const useInfoStore = defineStore("info", {
	state: (): InfoState => ({
		message: undefined,
	}),
	getters: {},
	actions: {
		setInfo(message: string) {
			this.message = message;
		},
		resetInfo() {
			this.message = undefined;
		}
	},
});
