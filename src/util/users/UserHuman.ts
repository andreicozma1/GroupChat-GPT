import {ChatUserTypes} from "src/util/chat/ChatModels";
import {ApiRequestConfigTypes} from "src/util/openai/ApiReq";
import {User} from "src/util/users/User";

export class UserHuman extends User {
	constructor(id: string, name: string) {
		super(id, name, ChatUserTypes.HUMAN);
		this.apiReqConfig = ApiRequestConfigTypes.HUMAN;
		this.showInMembersInfo = false;
	}
}