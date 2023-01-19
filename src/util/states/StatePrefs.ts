import {UIPref} from "stores/chatStore";

export interface ChatStoreGlobalPrefs {
	ignoredMessageOpacity: UIPref;
	contextMessageOpacity: {
		min: UIPref;
		max: UIPref;
	}
}

const getDefault = (): ChatStoreGlobalPrefs => {
	return {
		ignoredMessageOpacity: {
			title: "Ignored Message Opacity",
			value: 0.4,
		},
		contextMessageOpacity: {
			min: {
				title: "Context Message Opacity (Min)",
				value: 0.1,
			},
			max: {
				title: "Context Message Opacity (Max)",
				value: 0.3,
			}
		}
	}
}

export default {
	getDefault
}