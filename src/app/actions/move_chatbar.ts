import { PhysicalPosition, Window, currentMonitor } from '@tauri-apps/api/window';
import { CHATBAR_WINDOW_LABEL } from '../constants';
import type { ChatBarPosition } from '../state';

export default async function moveChatBar(
	chatBarPosition: ChatBarPosition,
	companionChatOpen: boolean
) {
	const window = await Window.getByLabel(CHATBAR_WINDOW_LABEL);
	const monitor = await currentMonitor();

	if (!window) {
		throw new Error('Failed to get chatbar window');
	} else if (!monitor) {
		throw new Error('Failed to get monitor');
	}

	const windowSize = await window.outerSize();
	let x: number, y: number;
	switch (chatBarPosition) {
		case 'BOTTOM_CENTER':
			x = Math.floor(monitor.position.x + (monitor.size.width - windowSize.width) / 2);
			y = Math.floor(monitor.position.y + (monitor.size.height - windowSize.height - 297));
			break;
		case 'BOTTOM_LEFT':
			throw new Error('Not implemented');
		case 'BOTTOM_RIGHT':
			throw new Error('Not implemented');
	}

	await window.setPosition(new PhysicalPosition(x, y));
}
