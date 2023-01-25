import {UserPrompt} from "src/util/prompt/UserPrompt";
import {User} from "src/util/chat/users/User";
import {openAiApi} from "src/util/openai/OpenAiApi";

export enum ApiReqTypes {
	OAI_CREATE_COMPLETION = "OAI_CREATE_COMPLETION",
	OAI_CREATE_IMAGE = "OAI_CREATE_IMAGE",
}

export const ApiReqMap: { [key in ApiReqTypes]: (user: User, prompt: UserPrompt) => Promise<any> } = {
	[ApiReqTypes.OAI_CREATE_COMPLETION]: (user: User, prompt: UserPrompt) => {
		console.log(ApiReqTypes.OAI_CREATE_COMPLETION, user, prompt)
		return openAiApi.createCompletion({
											  ...user.apiReqOpts,
											  prompt: prompt.text,
										  })

	},
	[ApiReqTypes.OAI_CREATE_IMAGE]: (user: User, prompt: UserPrompt) => {
		console.log(ApiReqTypes.OAI_CREATE_IMAGE, user, prompt)
		return openAiApi.createImage({
										 ...user.apiReqOpts,
										 prompt: prompt.text,
									 })
	}
}