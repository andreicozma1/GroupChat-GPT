import {UIPref} from "stores/chatStore";

export interface ChatStoreGlobalPrefs {
	ignoredMessageOpacity: UIPref;
	contextMessageOpacity: UIPref;
}

const getDefault = (): ChatStoreGlobalPrefs => {
	return {
		ignoredMessageOpacity: {
			title: "Ignored Message Opacity",
			value: 0.4,
		},
		contextMessageOpacity: {
			title: "Context Message Highlight Opacity",
			value: 0.10,
		},
	}
}

export default {
	getDefault
}