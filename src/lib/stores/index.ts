import type { ModelConfig } from '$lib/apis';
import { DEFAULT_CONFIG, DEFAULT_STATE } from '$lib/app/constants';
import { APP_NAME } from '$lib/constants';
import type { Banner } from '$lib/types';
import type { Socket } from 'socket.io-client';
import { derived, type Writable, writable } from 'svelte/store';
import { crossWindowWritable } from './cross-window-writable';

// Backend
export const WEBUI_NAME = writable(APP_NAME);
export const config = crossWindowWritable<Config>('config', undefined);
export const user = crossWindowWritable<SessionUser>('user', undefined);

// Desktop app
export const WEBUI_BASE_URL = crossWindowWritable<string>('webui_hostname', '', true);
export const WEBUI_API_BASE_URL = derived(
	WEBUI_BASE_URL,
	($WEBUI_BASE_URL) => `${$WEBUI_BASE_URL}/api/v1`
);
export const OLLAMA_API_BASE_URL = derived(
	WEBUI_BASE_URL,
	($WEBUI_BASE_URL) => `${$WEBUI_BASE_URL}/ollama`
);
export const OPENAI_API_BASE_URL = derived(
	WEBUI_BASE_URL,
	($WEBUI_BASE_URL) => `${$WEBUI_BASE_URL}/openai`
);
export const AUDIO_API_BASE_URL = derived(
	WEBUI_BASE_URL,
	($WEBUI_BASE_URL) => `${$WEBUI_BASE_URL}/audio/api/v1`
);
export const IMAGES_API_BASE_URL = derived(
	WEBUI_BASE_URL,
	($WEBUI_BASE_URL) => `${$WEBUI_BASE_URL}/images/api/v1`
);
export const RETRIEVAL_API_BASE_URL = derived(
	WEBUI_BASE_URL,
	($WEBUI_BASE_URL) => `${$WEBUI_BASE_URL}/retrieval/api/v1`
);

// Frontend
export const MODEL_DOWNLOAD_POOL = writable({});

export const mobile = writable(false);

export const socket: Writable<null | Socket> = writable(null);
export const activeUserCount: Writable<null | number> = writable(null);
export const USAGE_POOL: Writable<null | string[]> = writable(null);

export const theme = crossWindowWritable<string>('theme', 'system');

export const chatId = writable('');
export const chatTitle = writable('');

export const chats = crossWindowWritable<[]>('chats', []);
export const pinnedChats = writable([]);
export const tags = writable([]);

export const models = crossWindowWritable<Model[]>('models', []);
export const prompts = crossWindowWritable<Prompt[] | null>('prompts', null);
export const knowledge = crossWindowWritable<Document[] | null>('knowledge', null);
export const tools = crossWindowWritable<[] | null>('tools', null);
export const functions = crossWindowWritable<[] | null>('functions', null);

export const banners: Writable<Banner[]> = writable([]);

export const settings = crossWindowWritable<Settings>('settings', undefined);

export const showSidebar = writable(false);
export const showSettings = writable(false);
export const showArchivedChats = writable(false);
export const showChangelog = writable(false);

export const showControls = writable(false);
export const showOverview = writable(false);
export const showArtifacts = writable(false);
export const showCallOverlay = writable(false);

export const temporaryChatEnabled = crossWindowWritable<boolean>('temporary_chat_enabled', false);
export const scrollPaginationEnabled = writable(false);
export const currentChatPage = writable(1);

export const appState = crossWindowWritable('app_state', DEFAULT_STATE);
export const appConfig = crossWindowWritable('app_config', DEFAULT_CONFIG, true);

export type Model = OpenAIModel | OllamaModel;

type BaseModel = {
	id: string;
	name: string;
	info?: ModelConfig;
	owned_by: 'ollama' | 'openai' | 'arena';
};

export interface OpenAIModel extends BaseModel {
	owned_by: 'openai';
	external: boolean;
	source?: string;
}

export interface OllamaModel extends BaseModel {
	owned_by: 'ollama';
	details: OllamaModelDetails;
	size: number;
	description: string;
	model: string;
	modified_at: string;
	digest: string;
	ollama?: {
		name?: string;
		model?: string;
		modified_at: string;
		size?: number;
		digest?: string;
		details?: {
			parent_model?: string;
			format?: string;
			family?: string;
			families?: string[];
			parameter_size?: string;
			quantization_level?: string;
		};
		urls?: number[];
	};
}

type OllamaModelDetails = {
	parent_model: string;
	format: string;
	family: string;
	families: string[] | null;
	parameter_size: string;
	quantization_level: string;
};

type Settings = {
	models?: string[];
	conversationMode?: boolean;
	speechAutoSend?: boolean;
	responseAutoPlayback?: boolean;
	audio?: AudioSettings;
	showUsername?: boolean;
	notificationEnabled?: boolean;
	title?: TitleSettings;
	splitLargeDeltas?: boolean;
	chatDirection: 'LTR' | 'RTL';

	system?: string;
	requestFormat?: string;
	keepAlive?: string;
	seed?: number;
	temperature?: string;
	repeat_penalty?: string;
	top_k?: string;
	top_p?: string;
	num_ctx?: string;
	num_batch?: string;
	num_keep?: string;
	options?: ModelOptions;
};

type ModelOptions = {
	stop?: boolean;
};

type AudioSettings = {
	STTEngine?: string;
	TTSEngine?: string;
	speaker?: string;
	model?: string;
	nonLocalVoices?: boolean;
};

type TitleSettings = {
	auto?: boolean;
	model?: string;
	modelExternal?: string;
	prompt?: string;
};

type Prompt = {
	command: string;
	user_id: string;
	title: string;
	content: string;
	timestamp: number;
};

type Document = {
	collection_name: string;
	filename: string;
	name: string;
	title: string;
};

type Config = {
	status: boolean;
	name: string;
	version: string;
	default_locale: string;
	default_models: string;
	default_prompt_suggestions: PromptSuggestion[];
	features: {
		auth: boolean;
		auth_trusted_header: boolean;
		enable_api_key: boolean;
		enable_signup: boolean;
		enable_login_form: boolean;
		enable_web_search?: boolean;
		enable_image_generation: boolean;
		enable_admin_export: boolean;
		enable_admin_chat_access: boolean;
		enable_community_sharing: boolean;
	};
	oauth: {
		providers: {
			[key: string]: string;
		};
	};
};

type PromptSuggestion = {
	content: string;
	title: [string, string];
};

type SessionUser = {
	id: string;
	email: string;
	name: string;
	role: string;
	profile_image_url: string;
};
