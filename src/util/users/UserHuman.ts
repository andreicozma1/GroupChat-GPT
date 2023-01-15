import {ApiRequestConfigTypes} from "src/util/openai/ApiReq";
import {User, UserTypes} from "src/util/users/User";

export class UserHuman extends User {
	constructor(id: string) {
		super(id, "Human", UserTypes.HUMAN);
		this.apiReqConfig = ApiRequestConfigTypes.HUMAN;
		this.showInMembersInfo = false;
	}
}