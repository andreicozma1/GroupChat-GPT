import { Message } from "@/util/Models"

const cache = "conversation"

export const getCache = () => {
	console.log("Getting existing conv.value.conversation from conv.value.cache")
	const cacheStr = localStorage.getItem(cache)
	if (cacheStr) {
		return JSON.parse(cacheStr)
	}
	return []
}
export const updateCache = (history: Message[]) => {
	console.log("Updating conv.value.cache")
	localStorage.setItem(cache, JSON.stringify(history))
}