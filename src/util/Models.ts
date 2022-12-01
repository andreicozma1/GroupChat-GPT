export interface User {
	name: string
	avatar: string
}

export interface Message {
	title: string
	message: string
	time: string
	who: "self" | "other"
	type: "text" | "image"
	images?: string[]
	user: User
}