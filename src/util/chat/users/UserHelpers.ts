import {ApiRequestConfigTypes} from "src/util/openai/ApiReq";
import {newlineSeparated, wrapInCodeBlock} from "src/util/TextUtils";
import {User, UserTypes} from "src/util/chat/users/User";

export class UserDalleGen extends User {
	constructor() {
		super("dalle_gen", "DALL-E Generator", UserTypes.HELPER);
		this.icon = "image"
		this.apiReqConfig = ApiRequestConfigTypes.DALLE_GEN;
		this.showInMembersInfo = false;
	}
}

export class UserCodexGen extends User {
	constructor() {
		super("codex_gen", "Codex Generator", UserTypes.HELPER);
		this.icon = "code"
		this.apiReqConfig = ApiRequestConfigTypes.CODEX_GEN;
		this.showInMembersInfo = false;
		this.promptConfig.promptHeader = "Instructions"
		this.promptConfig.responseHeader = "Response"

		this.addRules({
						  always: [
							  "Use Markdown and wrap any code in a code block.",
							  "Use a language identifier for the code block if possible.",
							  "Before each code block, write a description or explanation of what the following code will do."
						  ],
					  })

		this.addExamples([
							 // ------------------------------------------------------------
							 newlineSeparated(
								 "Write Python code that tests for a valid anagram.",
								 "An Anagram is a word or phrase formed by rearranging the letters of a different word or phrase, typically using all the original letters exactly once.",
								 "Given two strings s and t, return true if t is an anagram of s, and false otherwise.",
							 ),
							 // ------------------------------------------------------------
							 newlineSeparated(
								 "**Valid Anagram:**",
							 ) + "\n" +
							 wrapInCodeBlock("python",
											 "class Solution:",
											 "\tdef isAnagram(self, s: str, t: str) -> bool:",
											 "\t\ta = {}",
											 "\t\tb = {}",
											 "\t\tfor i in s:",
											 "\t\t\tif i in a:",
											 "\t\t\t\ta[i]+=1",
											 "\t\t\telse:",
											 "\t\t\t\ta[i]=1",
											 "\t\tfor i in t:",
											 "\t\t\tif i in b:",
											 "\t\t\t\tb[i]+=1",
											 "\t\t\telse:",
											 "\t\t\t\tb[i]=1",
											 "\t\tif a == b:",
											 "\t\t\treturn True",
											 "\t\telse:",
											 "\t\t\treturn False") + "\n" +
							 newlineSeparated(
								 "**Explanation:**",
								 "Here we make use of Dictionary in Python.",
								 "- Dictionaries are used to store data values in key-value pairs.",
								 "\n",
								 "Taking each letter in the given word as keys, we can find its ***frequency*** and store it as their respective values.",
								 "- Eg: REED. `{R:1, E:2, D:1}`, as *R* and *D* occur once, and *E* occurs twice.",
								 "Similarly, we find the ***frequency of letters*** of both the given words and store it in ***two different dictionaries***.",
								 "\n",
								 "Finally, if both the dictionaries are equal we can conclude that the given words form an Anagram, and `return True`, else `return False`!"
							 )
							 // ------------------------------------------------------------
						 ]
		)
	}
}
