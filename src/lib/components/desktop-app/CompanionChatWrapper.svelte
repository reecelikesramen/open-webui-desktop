<script lang="ts">
	import { currentMonitor, getCurrentWindow, PhysicalSize } from '@tauri-apps/api/window';
	import { onMount } from 'svelte';
	import { COMPANION_CHAT_SIZE } from '../../../app/constants';
	import moveChatBar from '../../../app/actions/move_chatbar';
	import { appConfig } from '$lib/stores';
	import XMark from '../icons/XMark.svelte';
	import PencilSquare from '../icons/PencilSquare.svelte';
	import Tooltip from '../common/Tooltip.svelte';
	import i18n from '$lib/i18n';

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
		class="w-[440px] h-[540px] p-3 pb-5 pt-0 text-gray-700 dark:text-gray-100 bg-white dark:bg-gray-900 flex flex-col items-center justify-center rounded-3xl relative group"
		data-tauri-drag-region
	>
		<!-- Control buttons container -->
		<div
			class="absolute top-0 py-3 w-[calc(100%-3rem)] flex justify-between opacity-0 bg-transparent transition-opacity transition-background duration-400 delay-500 group-hover:opacity-100 group-hover:bg-white group-hover:dark:bg-gray-900 group-hover:delay-0 z-[50]"
		>
			<!-- Close button -->
			<button
				class="mt-1 ml-1 w-4 h-4 flex items-center justify-center bg-black text-white hover:bg-gray-900 dark:bg-white dark:text-black dark:hover:bg-gray-100 transition rounded-full"
				on:click={() => {
					getCurrentWindow().hide();
				}}
			>
				<XMark className="size-2.5" strokeWidth="3.5" />
			</button>

			<!-- Right side buttons -->
			<div class="flex gap-2">
				<Tooltip content={$i18n.t('Open in main window')}>
					<button
						class="w-6 h-6 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full"
						title="Open in main window"
						on:click={() => {
							/* TODO: Implement open in main window */
						}}
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="size-[1.12rem]"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="0"
							stroke-linecap="round"
							stroke-linejoin="round"
							version="1.1"
							xmlns:xlink="http://www.w3.org/1999/xlink"
						>
							<path
								d="m18 1.5.2.005A4 4 0 0 1 22 5.5v8l-.005.2A4 4 0 0 1 18 17.5l-.005.2A4 4 0 0 1 14 21.5H6l-.2-.005A4 4 0 0 1 2 17.5v-8l.005-.2A4 4 0 0 1 6 5.5l.005-.2A4 4 0 0 1 10 1.5zm-12 6-.15.005A2 2 0 0 0 4 9.5v8l.005.15A2 2 0 0 0 6 19.5h8l.15-.005A2 2 0 0 0 16 17.5h-6l-.2-.005A4 4 0 0 1 6 13.5zm12-4h-8l-.15.005A2 2 0 0 0 8 5.5v8l.005.15A2 2 0 0 0 10 15.5h8a2 2 0 0 0 2-2v-8l-.005-.15A2 2 0 0 0 18 3.5m-1 2a.98.98 0 0 1 .828.438l.025.04a1 1 0 0 1 .148.583L18 10.5a1 1 0 0 1-1.993.117L16 10.5V8.914l-3.293 3.293a1 1 0 0 1-1.497-1.32l.083-.094L14.584 7.5H13a1 1 0 0 1-.993-.883L12 6.5a1 1 0 0 1 .883-.993L13 5.5z"
								fill="currentColor"
								stroke="none"
							></path>
						</svg></button
					>
				</Tooltip>
				<Tooltip content={$i18n.t('New chat')}>
					<button
						class="w-6 h-6 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full"
						title="Start new chat"
						on:click={() => {
							/* TODO: Implement start new chat */
						}}
					>
						<PencilSquare className="size-[1.12rem]" strokeWidth="2" />
					</button>
				</Tooltip>
			</div>
		</div>
		<slot />
	</div>
</div>
