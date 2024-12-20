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
		class="w-[440px] h-[540px] p-3 py-5 text-gray-700 dark:text-gray-100 bg-white dark:bg-gray-900 flex flex-col items-center justify-center rounded-3xl relative"
		data-tauri-drag-region
	>
		<!-- Close button -->
		<button
			class="absolute top-3 left-3 w-5 h-5 flex items-center justify-center bg-black text-white hover:bg-gray-900 dark:bg-white dark:text-black dark:hover:bg-gray-100 transition rounded-full z-[50]"
			on:click={() => {
				getCurrentWindow().hide();
			}}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				class="h-3 w-3"
				viewBox="0 0 20 20"
				fill="currentColor"
			>
				<path
					fill-rule="evenodd"
					d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
					clip-rule="evenodd"
				/>
			</svg>
		</button>

		<!-- Action buttons -->
		<div class="absolute top-3 right-3 flex gap-2 z-[50]">
			<button
				class="w-5 h-5 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full"
				title="Open in main window"
				on:click={() => {
					/* TODO: Implement open in main window */
				}}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
					/>
				</svg>
			</button>
			<button
				class="w-5 h-5 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full"
				title="Start new chat"
				on:click={() => {
					/* TODO: Implement start new chat */
				}}
			>
				<svg
					xmlns="http://www.w3.org/2000/svg"
					class="h-4 w-4"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
				>
					<path
						stroke-linecap="round"
						stroke-linejoin="round"
						stroke-width="2"
						d="M12 4v16m8-8H4"
					/>
				</svg>
			</button>
		</div>

		<slot />
	</div>
</div>
