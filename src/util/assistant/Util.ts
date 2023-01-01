import { ActorConfig } from "src/util/Models"
import { actors } from "src/util/assistant/Configs"

export const getAvailable = (): ActorConfig[] => {
	return Object.values(actors).filter((a) => {
		if (a.available === undefined) return true
		return a.available
	})
}
export const getAllExcept = (actor: ActorConfig): ActorConfig[] => {
	return getAvailable().filter((a) => a.key !== actor.key)
}
export const actorsToKeys = (actors: ActorConfig[]): string[] => {
	return actors.map((a) => a.key)
}
export const actorsToNames = (actors: ActorConfig[]): string[] => {
	return actors.map((a) => a.name)
}