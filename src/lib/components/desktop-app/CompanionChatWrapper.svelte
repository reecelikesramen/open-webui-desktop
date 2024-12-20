<script lang="ts">
	import { currentMonitor, getCurrentWindow, PhysicalSize } from '@tauri-apps/api/window';
	import { onMount } from 'svelte';
	import { COMPANION_CHAT_SIZE } from '../../../app/constants';
	import moveChatBar from '../../../app/actions/move_chatbar';
	import { appConfig } from '$lib/stores';
	import XMark from '../icons/XMark.svelte';
	import PencilSquare from '../icons/PencilSquare.svelte';
	import Pencil from '../icons/Pencil.svelte';
	import PencilSolid from '../icons/PencilSolid.svelte';

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
			class="absolute top-3 left-3 w-4 h-4 flex items-center justify-center bg-black text-white hover:bg-gray-900 dark:bg-white dark:text-black dark:hover:bg-gray-100 transition rounded-full z-[50]"
			on:click={() => {
				getCurrentWindow().hide();
			}}
		>
			<XMark className="size-2.5" strokeWidth="3.5" />
		</button>

		<!-- Action buttons -->
		<div class="absolute top-3 right-3 flex gap-2 z-[50]">
			<button
				class="w-6 h-6 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full"
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
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M4 6h12a2 2 0 0 1 2 2v2" />
					<path d="M4 6v12a2 2 0 0 0 2 2h2" />
					<rect x="16" y="16" width="4" height="4" rx="1" />
					<line x1="16" y1="16" x2="6" y2="6" />
				</svg>
			</button>
			<button
				class="w-6 h-6 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-800 rounded-full"
				title="Start new chat"
				on:click={() => {
					/* TODO: Implement start new chat */
				}}
			>
				<PencilSquare className="size-4" strokeWidth="2" />
			</button>
		</div>

		<slot />
	</div>
</div>
