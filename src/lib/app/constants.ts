import { LogicalSize } from '@tauri-apps/api/window';
import type { AppConfig, AppState } from './state';

// Store files
export const APP_STORE_FILE = 'stores.json';

// window labels
export const MAIN_WINDOW_LABEL = 'main';
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
export const OPEN_SETTINGS = 'OPEN_SETTINGS';

// default state
export const DEFAULT_STATE: AppState = {
	lastChatTime: 0,
	companionChatOpen: false
} as const;

// default config
export const DEFAULT_CONFIG: AppConfig = {
	shortcut: 'Ctrl+Space',
	webuiBaseUrl: '',
	jwtToken: '',
	chatBarPositionPreference: 'BOTTOM_CENTER',
	resetChatTimePreference: '10_MIN',
	openChatsInCompanion: true,
	openLinksInApp: false
} as const;

// chatbar distances from left/right edge
export const CHATBAR_HORIZONTAL_MARGIN = 150; //px

// chatbar distance from bottom edge
export const CHATBAR_BOTTOM_MARGIN = 297; //px

// main window options for when closed
export const MAIN_WINDOW_OPTIONS = {
	width: 800,
	height: 650,
	minWidth: 600,
	minHeight: 450,
	visible: true,
	transparent: false,
	titleBarStyle: 'overlay',
	hiddenTitle: true,
	resizable: true,
	minimizable: true,
	devtools: true
} as const;
