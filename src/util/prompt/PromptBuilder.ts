import {processItemizedList} from "src/util/ItemizedList";
import {User} from "src/util/chat/users/User";

export interface PromptConfig {
    promptHeader?: string;
    responseHeader?: string;
    // promptWrapTag?: string;
    // responseWrapTag?: string;
    traits?: PromptTraits;
    rules?: PromptRules;
    examples?: string[]; // Order: Human, AI, Human, AI, etc.
    includeAllMembersInfo?: boolean;
}

export interface PromptTraits {
    fields?: string[];
    personality?: string[];
    strengths?: string[];
    weaknesses?: string[];
    abilities?: string[];
}

export interface PromptRules {
    always?: string[];
    never?: string[];
    sometimes?: string[];
}

export class PromptBuilder {
    constructor(protected promptConfig: PromptConfig) {
    }

    public promptAssistantInfo(user: User): string {
        let header = this.getHeader2(user.id);
        header += ":";
        header += "\n";
        header += `- Name: ${user.name}`;

        if (!user.promptConfig.traits) {
            return header;
        }

        const info = Object.entries(user.promptConfig.traits)
            .map(([k, v]) => {
                const s = v.map((s: string) => s.trim()).join("");
                if (s.length === 0) {
                    return undefined;
                }
                return processItemizedList(k, v, {keyPrefix: "-"});
            })
            .filter((s: string | undefined) => s !== undefined);

        return [header, ...info].join("\n");
    }

    public getHeader1(header: string) {
        return `# ${header}`;
    }

    public getHeader2(header: string) {
        return `## ${header}`;
    }

    public getHeader3(header: string) {
        return `### ${header}`;
    }

    public getHeader4(header: string) {
        return `#### ${header}`;
    }

    public getPromptMessage(
        text: string,
        header: string
    ): string {

        text = `${this.getHeader4(header)}\n${text}`;
        return text;
    }

}
