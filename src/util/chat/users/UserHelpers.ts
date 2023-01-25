import {User, UserTypes} from "src/util/chat/users/User";
import {ApiReqTypes} from "src/util/openai/ApiReq";

export class UserDalleGen extends User {
	constructor() {
		super("gen_image", "Image Generator", UserTypes.HELPER);
		this.icon = "image"
		this.showInMembersInfo = false;

		this.apiReqType = ApiReqTypes.OAI_CREATE_IMAGE;

		this.apiReqOpts = {
			n: 1,
			size: "256x256",
		}
	}
}
