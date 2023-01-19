import {LocalStorage} from "quasar";
import ThreadsState, {ChatStoreThreadData,} from "src/util/states/StateThreads";
import GlobalPrefs, {ChatStoreGlobalPrefs} from "src/util/states/StatePrefs";
import UsersState, {ChatStoreUserData} from "src/util/states/StateUsers";
import {smartNotify} from "src/util/SmartNotify";
import {mergeWith} from "lodash-es";

export const localStorageKey = "data";

interface StateGlobalStore {
	userData: ChatStoreUserData;
	threadData: ChatStoreThreadData;
	cachedResponses: Record<string, any>;
	prefs: ChatStoreGlobalPrefs;
	lastSaved?: Date;
}

const getDefault = (): StateGlobalStore => {
	return {
		userData: UsersState.getDefault(),
		threadData: ThreadsState.getDefault(),
		cachedResponses: {},
		prefs: GlobalPrefs.getDefault(),
	};
}

const mergeCustomizer = (
	objValue: any,
	srcValue: any,
	key: any,
	object: any,
	source: any,
	stack: any
) => {
	// if key does not exist in object, ignore it
	// console.log("mergeCustomizer", key, object, source);
	// if object type
	if (!Object.hasOwn(object, key)) {
		console.error("=".repeat(20));
		console.error(object)
		console.error(source)
		console.error(`Key ${key} does not exist in object, ignoring it`);
	}
	// handle by lodash internally
	return undefined
}

const getState = (): StateGlobalStore => {
	let state = getDefault()

	const item: string | null = LocalStorage.getItem(localStorageKey);
	if (!item) return state;
	const parsedJson = JSON.parse(item);
	// recursively assign from parsedJson to state
	// if a key in parsedJson is not in state, it will be ignored and error will be logged
	// state = mergeWith(state, parsedJson, mergeCustomizer);
	state = mergeWith(parsedJson, state, mergeCustomizer);

	saveState(state, false);

	return state;
};

const saveState = (state: StateGlobalStore, verbose = true): void => {
	if (verbose) smartNotify("Saving changes...");
	state.lastSaved = new Date();
	LocalStorage.set(localStorageKey, JSON.stringify(state));
}

export default {
	localStorageKey,
	getDefault,
	getState,
	saveState,
};
