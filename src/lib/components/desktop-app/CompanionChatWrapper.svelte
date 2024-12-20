<script lang="ts">
	import { currentMonitor, getCurrentWindow, PhysicalSize } from '@tauri-apps/api/window';
	import { onMount } from 'svelte';
	import { COMPANION_CHAT_SIZE } from '../../../app/constants';
	import moveChatBar from '../../../app/actions/move_chatbar';
	import { appConfig } from '$lib/stores';

	onMount(() => {
		(async () => {
			console.log('CompanionChatWrapper mounted');
			const window = getCurrentWindow();

			// disable resize
			await window.setResizable(true);

			// resize window
			await window.setSize(COMPANION_CHAT_SIZE);

			// move to location
			await moveChatBar($appConfig.chatBarPositionPreference, true);

			// set resize limits
			// await window.setMinSize(COMPANION_CHAT_MIN_SIZE);

			// max width of 1/3 of screen, max height of screen
			const monitor = await currentMonitor();
			if (!monitor) {
				throw new Error('Could not get monitor');
			}
			await window.setMaxSize(
				new PhysicalSize(Math.floor(monitor.size.width / 2), monitor.size.height)
			);

			// move to location
		})();
	});
</script>

<div class="w-full h-full flex flex-col items-center justify-end">
	<div
		class="w-[440px] h-[540px] p-3 py-5 text-gray-700 dark:text-gray-100 bg-white dark:bg-gray-900 flex flex-col items-center justify-center rounded-3xl"
		data-tauri-drag-region
	>
		<slot />
	</div>
</div>
