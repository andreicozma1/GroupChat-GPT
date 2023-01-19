import {UIPref, UIPrefMinMax} from "src/util/UIPref";

export interface ChatStoreGlobalPrefs {
	ignoredMessageOpacity: UIPref;
	contextMessageOpac: UIPrefMinMax;
}

const getDefault = (): ChatStoreGlobalPrefs => {
	return {
		ignoredMessageOpacity: {
			title: "Ignored Message Opacity",
			value: 0.4,
		},
		contextMessageOpac: {
			title: "Context Message Opacity (Min)",
			min: 0.1,
			max: 0.2,
		},
	};
};

export default {
	getDefault,
};
