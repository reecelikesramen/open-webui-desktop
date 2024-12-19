import { load } from '@tauri-apps/plugin-store';
import { Window } from '@tauri-apps/api/window';
import {
	CHATBAR_WINDOW_LABEL,
	CHATBAR_WINDOW_SIZE,
	COMPANION_CHAT_EXPIRED,
	DEFAULT_CONFIG,
	DEFAULT_STATE
} from '../constants';
import moveChatBar from '../actions/move_chatbar';
import { resetChatTimePreferenceToSeconds, type AppConfig, type AppState } from '../state';
import type { ShortcutEvent } from '@tauri-apps/plugin-global-shortcut';

export default async function onShortcut(event: ShortcutEvent) {
	console.log('onShortcut');
	if (event.state !== 'Pressed') {
		return;
	}

	// get state
	const store = await load('app.json', { autoSave: true });
	let state: AppState = (await store.get('state')) || DEFAULT_STATE;
	let config: AppConfig = (await store.get('config')) || DEFAULT_CONFIG;

	const window = await Window.getByLabel(CHATBAR_WINDOW_LABEL);
	if (!window) {
		throw new Error('Failed to get chatbar window');
	}

	// if visible, then hide
	if (await window.isVisible()) {
		await window.hide();
		return;
	}

	let lastChatTime = state.lastChatTime;
	let timeSinceLastChat = Date.now() - lastChatTime;
	let companionChatOpen = state.companionChatOpen;
	let resetChatTime = resetChatTimePreferenceToSeconds(config.resetChatTimePreference);
	let chatBarPosition = config.chatBarPositionPreference;
	if (companionChatOpen && timeSinceLastChat > resetChatTime) {
		console.log('companion chat expired');
		await window.setResizable(false);
		await window.emitTo('chatbar', COMPANION_CHAT_EXPIRED);
		await window.setSize(CHATBAR_WINDOW_SIZE);
		await moveChatBar(chatBarPosition, companionChatOpen);
	} else if (!companionChatOpen) {
		await moveChatBar(chatBarPosition, companionChatOpen);
	}

	await window.show();
	await window.setFocus();

	await store.set('state', state);
}
