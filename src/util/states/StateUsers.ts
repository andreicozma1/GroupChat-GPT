import {User} from "src/util/chat/User";
import {UserCodexGen, UserDalleGen} from "src/util/chat/assistants/Helpers";
import {UserCoordinator} from "src/util/chat/assistants/UserCoordinator";
import {UserDavinci} from "src/util/chat/assistants/chatting/UserDavinci";
import {UserDalle} from "src/util/chat/assistants/chatting/UserDalle";
import {UserCodex} from "src/util/chat/assistants/chatting/UserCodex";


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
