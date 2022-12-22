import { CreateCompletionRequest, CreateImageRequest } from "openai/api"

export interface MessageThread {
	messages: TextMessage[];
}

export interface TextMessage {
	id?: string | number;
	text: string[];
	images: string[];
	avatar: string;
	name: string;
	date?: string | number | Date;
	objective?: string;
	dateCreated?: string | number;
	cached?: boolean;
	loading?: boolean;
}

export interface ActorConfig {
	key: string;
	name: string;
	createPrompt: any;
	config: CreateCompletionRequest | CreateImageRequest;
	createComp: any;
	icon: string;
	ignoreCache?: boolean;
}

export interface GenerationResult {
	result: any;
	text?: string[];
	images?: string[];
	hash: number;
	cached: boolean;
	errorMsg?: string;
}

export interface ColorConfig {
	minLightness?: number;
	maxLightness?: number;
	minSaturation?: number;
	maxSaturation?: number;
	minHue?: number;
	maxHue?: number;
	minAlpha?: number;
	maxAlpha?: number;
}