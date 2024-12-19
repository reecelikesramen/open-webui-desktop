<script lang="ts">
	import { WEBUI_BASE_URL } from '$lib/constants';
	import {
		config,
		models,
		settings,
		temporaryChatEnabled,
		theme,
		tools,
		user,
		WEBUI_NAME
	} from '$lib/stores';
	import { emit } from '@tauri-apps/api/event';
	import { Toaster } from 'svelte-sonner';
	import { APP_STORES_CHANGED } from '../../app/constants';

	// Provide store update to chatbar
	$: emit(APP_STORES_CHANGED, { store_name: 'models', store: $models });
	$: emit(APP_STORES_CHANGED, { store_name: 'settings', store: $settings });
	$: emit(APP_STORES_CHANGED, { store_name: 'config', store: $config });
	$: emit(APP_STORES_CHANGED, { store_name: 'user', store: $user });
	$: emit(APP_STORES_CHANGED, { store_name: 'temporaryChatEnabled', store: $temporaryChatEnabled });
	$: emit(APP_STORES_CHANGED, { store_name: 'tools', store: $tools });
	$: emit(APP_STORES_CHANGED, { store_name: 'theme', store: $theme });
</script>

<svelte:head>
	<title>{$WEBUI_NAME}</title>
	<link crossorigin="anonymous" rel="icon" href="{WEBUI_BASE_URL}/static/favicon.png" />

	<!-- rosepine themes have been disabled as it's not up to date with our latest version. -->
	<!-- feel free to make a PR to fix if anyone wants to see it return -->
	<!-- <link rel="stylesheet" type="text/css" href="/themes/rosepine.css" />
	<link rel="stylesheet" type="text/css" href="/themes/rosepine-dawn.css" /> -->
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
