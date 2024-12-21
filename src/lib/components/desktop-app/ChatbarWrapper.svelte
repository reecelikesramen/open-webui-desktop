<script lang="ts">
	import { getCurrentWindow } from '@tauri-apps/api/window';
	import { onMount, tick } from 'svelte';
	import { CHATBAR_WINDOW_SIZE, COMPANION_CHAT_SIZE } from '../../../app/constants';
	import moveChatBar from '../../../app/actions/move_chatbar';
	import { appConfig } from '$lib/stores';

	const window = getCurrentWindow();
	let element: Element;

	onMount(() => {
		const resizeObserver = new ResizeObserver(async (entries) => {
			await window.setShadow(false);
			await window.setShadow(true);
		});

		resizeObserver.observe(element);

		(async () => {
			// disable resize
			await window.setResizable(false);

			// resize window
			await window.setSize(CHATBAR_WINDOW_SIZE);

			// move to location
			moveChatBar($appConfig.chatBarPositionPreference, false);
		})();

		return () => {
			resizeObserver.disconnect();
		};
	});
</script>

<div class="w-full h-full flex flex-col items-center justify-end">
	<div
		class="w-[440px] min-h-[85px] p-3 py-5 text-gray-700 dark:text-gray-100 bg-white dark:bg-gray-900 flex flex-col items-center justify-center rounded-3xl"
		data-tauri-drag-region
		bind:this={element}
	>
		<slot />
	</div>
</div>
