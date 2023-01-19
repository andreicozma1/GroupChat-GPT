import {Thread} from "src/util/chat/Thread";

export interface ChatStoreThreadData {
	threadsMap: Record<string, Thread>;
	activeThreadId: string | undefined;
	defaultThreadName: string;
}

const getDefault = (): ChatStoreThreadData => {
	return {
		threadsMap: {},
		activeThreadId: undefined,
		defaultThreadName: "General",
	};
};

export default {
	getDefault,
};
