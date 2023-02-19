import {UserAssistantConversational} from "src/util/chat/users/conversational/UserAssistantConversational";

export class UserDavinci extends UserAssistantConversational {
    constructor() {
        super("davinci", "Davinci");
        this.defaultJoin = true;

        this.addTraits({
            personality: ["enthusiastic"],
        })
    }
}
