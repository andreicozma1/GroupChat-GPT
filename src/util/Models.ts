import { CreateCompletionRequest, CreateImageRequest } from "openai/api";

export interface MessageThread {
	messages: TextMessage[];
}

export interface TextMessage {
	id?: string | number;
	text: string[];
	images: string[];
	avatar: string;
	name: string;
	date: string | number | Date;
	objective?: string;
	dateCreated?: string | number | Date;
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
	available?: boolean;
	personality?: string[];
	strengths?: string[];
	weaknesses?: string[];
	abilities?: string[];
	createGen?: string;
	vals?: any;
}

export interface GenerationResult {
	result: any;
	text?: string[];
	images?: string[];
	hash: number;
	cached?: boolean;
	errorMsg?: string;
}

export interface MsgHistoryConfig {
	messages: TextMessage[];
	includeSelf?: boolean;
	includeActors?: ActorConfig[];
	excludeActors?: ActorConfig[];
	maxLength?: number;
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
