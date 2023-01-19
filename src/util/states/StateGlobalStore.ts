import {LocalStorage} from "quasar";
import ThreadsState, {ChatStoreThreadData} from "src/util/states/StateThreads";
import GlobalPrefs, {ChatStoreGlobalPrefs} from "src/util/states/StatePrefs";
import UsersState, {ChatStoreUserData} from "src/util/states/StateUsers";
import {merge} from 'lodash'

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
	const parsedJson = JSON.parse(item)
	// recursively assign from parsedJson to state
	// if a key in parsedJson is not in state, it will be ignored and error will be logged
	state = merge(state, parsedJson)
	return state
}

export default {
	localStorageKey,
	getDefault
}