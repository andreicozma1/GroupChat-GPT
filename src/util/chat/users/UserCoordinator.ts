import {UserAssistant} from "src/util/chat/users/UserAssistant";

export class UserCoordinator extends UserAssistant {
    constructor() {
        super("coordinator", "Coordinator");
        this.defaultIgnored = true;
        this.showInMembersInfo = false;

        this.addRules({
            always: [
                "Only respond with the exact IDs of the assistant(s) that should respond to the user's message.",
                "Only respond with the last user when the user uses the words 'you' or 'yourself'.",
                // "Separate assistant IDs with commas if more than one assistant should respond.",
                "Take into consideration the assistant's profile info such as fields, strengths, weaknesses, abilities, etc.",
            ],
            never: [
                "Respond with None or N/A.",
                "Break the flow of the conversation between the user and an assistant.",
            ]
        })

        this.addExamples([
                "Hey!",
                "@davinci",
                "I need help with art.",
                "@dalle",
                "Write a program that adds two numbers.",
                "@codex"
            ]
        )

        this.updateApiReqOpts({
            temperature: 0.8,
            max_tokens: 25,
        })
    }
}
