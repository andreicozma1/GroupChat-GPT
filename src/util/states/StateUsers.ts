import {UserCodexGen, UserDalleGen} from "src/util/chat/users/UserHelpers";
import {UserCoordinator} from "src/util/chat/users/UserCoordinator";
import {User} from "src/util/chat/users/User";
import {UserDavinci} from "src/util/chat/users/conversational/UserDavinci";
import {UserDalle} from "src/util/chat/users/conversational/UserDalle";
import {UserCodex} from "src/util/chat/users/conversational/UserCodex";


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
	};
};

export default {
	getDefault,
};
