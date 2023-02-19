import {LocalStorage} from "quasar";
import ThreadsState, {ChatStoreThreadData,} from "src/util/states/StateThreads";
import GlobalPrefs, {ChatStoreGlobalPrefs} from "src/util/states/StatePrefs";
import UsersState, {ChatStoreUserData} from "src/util/states/StateUsers";
import {smartNotify} from "src/util/SmartNotify";
import {ApiResponse} from "stores/chatStore";
import {merge} from "lodash-es";

export const localStorageKey = "data";

interface StateGlobalStore {
    userData: ChatStoreUserData;
    threadData: ChatStoreThreadData;
    cachedResponses: Record<string, ApiResponse>;
    prefs: ChatStoreGlobalPrefs;
    dateCreated: Date;
    dateLastSaved?: Date;
}

const getDefault = (): StateGlobalStore => {
    return {
        userData: UsersState.getDefault(),
        threadData: ThreadsState.getDefault(),
        cachedResponses: {},
        prefs: GlobalPrefs.getDefault(),
        dateCreated: new Date(),
    };
}

const getState = (): StateGlobalStore => {
    let state: StateGlobalStore = getDefault()

    const item: string | null = LocalStorage.getItem(localStorageKey);
    if (!item) {
        console.log("Initializing application for the first time.")
        return state;
    }
    const parsedJson = JSON.parse(item);
    state = merge(parsedJson, state);

    return state;
};

const saveState = (state: StateGlobalStore, verbose = true): void => {
    if (verbose) {
        smartNotify("Saving changes...");
    }
    console.log("saveState:", {...state});
    state.dateLastSaved = new Date();
    LocalStorage.set(localStorageKey, JSON.stringify(state));
}

export default {
    localStorageKey,
    getDefault,
    getState,
    saveState,
};
