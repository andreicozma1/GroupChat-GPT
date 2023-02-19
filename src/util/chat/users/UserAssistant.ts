import {Thread} from "src/util/chat/Thread";
import {newlineSeparated} from "src/util/TextUtils";
import {User, UserTypes} from "src/util/chat/users/User";


export class UserAssistant extends User {
    constructor(id: string, name: string) {
        super(id, name, UserTypes.ASSISTANT);
        this.promptConfig.responseHeader = this.id
        this.promptConfig.includeAllMembersInfo = true;
        this.addRules({
            always: [
                "Follow instructions, rules, and examples.",
                "Maintain the logical flow and consistency of the conversation.",
            ],
        })
    }

    getPromptStart(thread: Thread): string | undefined {
        let txt = `# AI ASSISTANT CHAT: ${thread.name}`
        txt += "\n\n"
        txt += newlineSeparated(
            "The following is a group-chat conversation between a human and several AI assistants.",
            User.wrapInTag(
                "nocache",
                `Current Date-Time: ${(new Date()).toUTCString()}`
            ))

        return txt
    }

}
