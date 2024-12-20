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
		models,
		appState
	} from '$lib/stores';
	import { listen, type UnlistenFn } from '@tauri-apps/api/event';
	import { Toaster } from 'svelte-sonner';
	import { APP_STORES_CHANGED, CHATBAR_WINDOW_LABEL } from '../../../app/constants';
	import { getCurrentWindow, Window } from '@tauri-apps/api/window';
	import { setShortcut } from '../../../app/commands/set_shortcut';
	import { register, unregister, type ShortcutEvent } from '@tauri-apps/plugin-global-shortcut';
	import { applyTheme } from '$lib/utils';

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
	const unlistenStoreChange = listen(
		APP_STORES_CHANGED,
		(event: { payload: StoreChangedPayload }) => {
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
		}
	);

	$: {
		localStorage.setItem('theme', $theme);
		console.log('App theme changed to', $theme);
		applyTheme($theme);
	}

	onMount(() => {
		let unlistenFocusChange: UnlistenFn;
		(async () => {
			// Move chat bar
			await moveChatBar($appConfig.chatBarPositionPreference, false);

			// Set global shortcut
			await setShortcut($appConfig.shortcut);

			// Add shadows
			const chatBarWindow = getCurrentWindow();
			await chatBarWindow.setShadow(true);

			// Set lose focus: hide
			unlistenFocusChange = await chatBarWindow.onFocusChanged(async ({ payload: focused }) => {
				if (!focused) {
					// Hide the window and remove Escape close window shortcut
					if (!$appState.companionChatOpen) {
						await chatBarWindow.hide();
					}
					await unregister('Escape');
				} else {
					await register('Escape', closeChatBar);
				}
			});
		})();

		return async () => {
			unlistenFocusChange();
			(await unlistenStoreChange)();
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
