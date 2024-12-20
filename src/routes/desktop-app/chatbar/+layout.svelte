<script lang="ts">
	import { onMount } from 'svelte';
	import moveChatBar from '../../../app/actions/move_chatbar';
	import {
		appConfig,
		config,
		temporaryChatEnabled,
		tools,
		user,
		settings,
		WEBUI_NAME,
		theme,
		models
	} from '$lib/stores';
	import { listen } from '@tauri-apps/api/event';
	import { Toaster } from 'svelte-sonner';
	import { APP_STORES_CHANGED, CHATBAR_WINDOW_LABEL } from '../../../app/constants';
	import { getCurrentWindow, Window } from '@tauri-apps/api/window';
	import { setShortcut } from '../../../app/commands/set_shortcut';
	import { register, unregister, type ShortcutEvent } from '@tauri-apps/plugin-global-shortcut';

	interface StoreChangedPayload {
		store_name:
			| 'models'
			| 'settings'
			| 'config'
			| 'user'
			| 'temporaryChatEnabled'
			| 'tools'
			| 'theme';
		store: any;
	}

	// Sync lib stores with Main Window
	const unlisten = listen(APP_STORES_CHANGED, (event: { payload: StoreChangedPayload }) => {
		console.log('stores changed:', event.payload);
		switch (event.payload.store_name) {
			case 'models':
				$models = event.payload.store;
				break;
			case 'settings':
				$settings = event.payload.store;
				break;
			case 'config':
				$config = event.payload.store;
				break;
			case 'user':
				$user = event.payload.store;
				break;
			case 'temporaryChatEnabled':
				$temporaryChatEnabled = event.payload.store;
				break;
			case 'tools':
				$tools = event.payload.store;
				break;
			case 'theme':
				$theme = event.payload.store;
				break;
		}
	});

	onMount(() => {
		(async () => {
			// Move chat bar
			await moveChatBar($appConfig.chatBarPositionPreference, false);

			// Set global shortcut
			await setShortcut($appConfig.shortcut);

			// Set lose focus: hide
			const chatBarWindow = getCurrentWindow();
			await chatBarWindow.onFocusChanged(async ({ payload: focused }) => {
				if (!focused) {
					// Hide the window and remove Escape close window shortcut
					await chatBarWindow.hide();
					await unregister('Escape');
				} else {
					await register('Escape', closeChatBar);
				}
			});
		})();

		return async () => {
			(await unlisten)();
		};
	});

	const closeChatBar = async (event: ShortcutEvent) => {
		if (event.state !== 'Pressed') {
			return;
		}

		await getCurrentWindow().hide();
	};
</script>

<svelte:head>
	<title>{$WEBUI_NAME}</title>
</svelte:head>
<slot />
<Toaster
	theme={$theme.includes('dark')
		? 'dark'
		: $theme === 'system'
			? window.matchMedia('(prefers-color-scheme: dark)').matches
				? 'dark'
				: 'light'
			: 'light'}
	richColors
	position="top-center"
/>

<style lang="postcss">
	:global(body) {
		@apply w-screen h-screen overflow-hidden;
	}
</style>
