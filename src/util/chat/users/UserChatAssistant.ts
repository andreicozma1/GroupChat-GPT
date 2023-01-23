import {ApiRequestConfigTypes} from "src/util/openai/ApiReq";
import {Thread} from "src/util/chat/Thread";
import {newlineSeparated, wrapInHtmlTag} from "src/util/TextUtils";
import {dateToLocaleStr} from "src/util/DateUtils";
import {User, UserTypes} from "src/util/chat/users/User";


export class UserChatAssistant extends User {
	constructor(id: string, name: string) {
		super(id, name, UserTypes.ASSISTANT);
		this.apiReqConfig = ApiRequestConfigTypes.ASSISTANT;
		this.promptConfig.responseHeader = this.id
		this.promptConfig.includeAllMembersInfo = true;
		this.addRules({
						  always: [
							  "Strictly follow rules, examples, and guidelines.",
							  "Respond in a way that follows the logical flow and consistency of the conversation.",
						  ],
					  })
	}

	getPromptStart(thread: Thread): string | undefined {
		let txt = `=== AI CHAT: ${thread.name} ===`
		txt += "\n\n"
		txt += newlineSeparated(
			"The following is a group-chat conversation between a human and several AI assistants.",
			wrapInHtmlTag(
				"nocache",
				`Current Date-Time: ${dateToLocaleStr(new Date())}`
			))

		return txt
	}

}
