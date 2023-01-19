import {UIPref, UIPrefMinMax} from "src/util/UIPref";

export interface ChatStoreGlobalPrefs {
	ignoredMessageOpacity: UIPref;
	contextMessageOpacity: UIPrefMinMax;
}

const getDefault = (): ChatStoreGlobalPrefs => {
	return {
		ignoredMessageOpacity: {
			title: "Ignored Message Opacity",
			value: 0.4,
		},
		contextMessageOpacity: {
			title: "Context Message Opacity (Min)",
			min: 0.04,
			max: 0.15,
		},
	};
};

export default {
	getDefault,
};
