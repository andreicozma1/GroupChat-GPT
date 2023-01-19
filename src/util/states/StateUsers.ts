import {User} from "src/util/chat/User";
import {UserCodex, UserCoordinator, UserDalle, UserDavinci} from "src/util/chat/assistants/Assistant";
import {UserCodexGen, UserDalleGen} from "src/util/chat/assistants/Helpers";

export interface ChatStoreUserData {
	usersMap: Record<string, User>;
	myUserId: string;
}

const getDefault = (): ChatStoreUserData => {
	return {
		usersMap: {
			coordinator: new UserCoordinator(),
			davinci: new UserDavinci(),
			// DALL-E
			dalle: new UserDalle(),
			dalle_gen: new UserDalleGen(),
			// Codex
			codex: new UserCodex(),
			codex_gen: new UserCodexGen(),
		},
		myUserId: "human",
	}
}

export default {
	getDefault
}