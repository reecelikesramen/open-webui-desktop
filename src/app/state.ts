export interface AppState {
	lastChatTime: number;
	companionChatOpen: boolean;
}

// check equality of two app states
export function areAppStatesEqual(
	state1: AppState | undefined,
	state2: AppState | undefined
): boolean {
	return (
		state1?.lastChatTime === state2?.lastChatTime &&
		state1?.companionChatOpen === state2?.companionChatOpen
	);
}

export type ChatBarPosition = 'BOTTOM_CENTER' | 'BOTTOM_LEFT' | 'BOTTOM_RIGHT';
export type ResetChatTime = 'IMMEDIATELY' | '10_MIN' | '15_MIN' | '30_MIN' | 'NEVER';

export interface AppConfig {
	shortcut: string;
	webuiBaseUrl: string;
	jwtToken: string;
	chatBarPositionPreference: ChatBarPosition;
	resetChatTimePreference: ResetChatTime;
	autoLaunch: boolean;
	openChatsInCompanion: boolean;
}

export function areAppConfigsEqual(
	config1: AppConfig | undefined,
	config2: AppConfig | undefined
): boolean {
	return (
		config1?.shortcut === config2?.shortcut &&
		config1?.webuiBaseUrl === config2?.webuiBaseUrl &&
		config1?.jwtToken === config2?.jwtToken &&
		config1?.chatBarPositionPreference === config2?.chatBarPositionPreference &&
		config1?.resetChatTimePreference === config2?.resetChatTimePreference &&
		config1?.autoLaunch === config2?.autoLaunch &&
		config1?.openChatsInCompanion === config2?.openChatsInCompanion
	);
}

export function resetChatTimePreferenceToSeconds(resetChatTimePreference: ResetChatTime): number {
	switch (resetChatTimePreference) {
		case 'IMMEDIATELY':
			return 0;
		case '10_MIN':
			return 600_000;
		case '15_MIN':
			return 900_000;
		case '30_MIN':
			return 1_800_000;
		case 'NEVER':
			return Infinity;
	}
}
