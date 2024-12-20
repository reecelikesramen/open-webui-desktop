import { LogicalSize } from '@tauri-apps/api/window';
import type { AppConfig, AppState } from './state';

// window labels
export const CHATBAR_WINDOW_LABEL = 'chatbar';

// window sizes
export const MAIN_WINDOW_SIZE = new LogicalSize(800, 650);
export const CHATBAR_WINDOW_SIZE = new LogicalSize(600, 400); // ChatGPT panel size is 400x85 logical px
export const COMPANION_CHAT_SIZE = new LogicalSize(600, 600); // ChatGPT panel size is 440x540 logical px

// event names
export const COMPANION_CHAT_EXPIRED = 'COMPANION_CHAT_EXPIRED';
export const APP_STORES_CHANGED = 'APP_STORES_CHANGED';
export const OPEN_IN_MAIN_WINDOW = 'OPEN_IN_MAIN_WINDOW';
export const OPEN_IN_COMPANION_CHAT = 'OPEN_IN_COMPANION_CHAT';

// state
export const DEFAULT_STATE: AppState = {
	lastChatTime: 0,
	companionChatOpen: false
};
export const DEFAULT_CONFIG: AppConfig = {
	shortcut: 'Control+Space',
	webuiBaseUrl: '',
	jwtToken: '',
	chatBarPositionPreference: 'BOTTOM_CENTER',
	resetChatTimePreference: '10_MIN',
	autoLaunch: true,
	openChatsInCompanion: true
};
