<script lang="ts">
	import { getCurrentWindow } from '@tauri-apps/api/window';
	import { onMount } from 'svelte';
	import { CHATBAR_WINDOW_SIZE, COMPANION_CHAT_SIZE } from '../../../app/constants';
	import moveChatBar from '../../../app/actions/move_chatbar';
	import { appConfig } from '$lib/stores';

	onMount(() => {
		(async () => {
			const window = getCurrentWindow();

			// disable resize
			await window.setResizable(false);

			// resize window
			await window.setSize(CHATBAR_WINDOW_SIZE);

			// move to location
			moveChatBar($appConfig.chatBarPositionPreference, false);
		})();
	});
</script>

<div class="w-full h-full flex flex-col items-center justify-end">
	<div
		class="w-[400px] min-h-[85px] p-3 py-5 text-gray-700 dark:text-gray-100 bg-white dark:bg-gray-900 flex flex-col items-center justify-center rounded-3xl"
		data-tauri-drag-region
	>
		<slot />
	</div>
</div>
