import {LocalStorage} from "quasar";
import ThreadsState, {ChatStoreThreadData} from "src/util/states/StateThreads";
import GlobalPrefs, {ChatStoreGlobalPrefs} from "src/util/states/StatePrefs";
import UsersState, {ChatStoreUserData} from "src/util/states/StateUsers";

export const localStorageKey = "data";

interface StateGlobalStore {
	userData: ChatStoreUserData
	threadData: ChatStoreThreadData
	cachedResponses: Record<string, any>
	prefs: ChatStoreGlobalPrefs
}

const getDefault = (): StateGlobalStore => {
	const item: string | null = LocalStorage.getItem(localStorageKey)
	let state: StateGlobalStore = {
		userData: UsersState.getDefault(),
		threadData: ThreadsState.getDefault(),
		cachedResponses: {},
		prefs: GlobalPrefs.getDefault(),
	}
	if (!item) return state
	state = Object.assign(state, JSON.parse(item))
	return state
}

export default {
	localStorageKey,
	getDefault
}