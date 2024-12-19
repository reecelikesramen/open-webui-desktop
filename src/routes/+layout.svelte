<script lang="ts">
	import '../tailwind.css';
	import '../app.css';
	import 'tippy.js/dist/tippy.css';

	import { io } from 'socket.io-client';
	import { spring } from 'svelte/motion';
	import { onMount, tick, setContext } from 'svelte';
	import {
		config,
		user,
		theme,
		WEBUI_NAME,
		mobile,
		socket,
		activeUserCount,
		USAGE_POOL,
		settings,
		models,
		temporaryChatEnabled,
		tools,
		banners
	} from '$lib/stores';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { getBackendConfig, getModels } from '$lib/apis';
	import { getSessionUser } from '$lib/apis/auths';
	import { WEBUI_BASE_URL, WEBUI_HOSTNAME } from '$lib/constants';
	import i18n, { initI18n, getLanguages } from '$lib/i18n';
	import { bestMatchingLanguage } from '$lib/utils';
	import { getBanners } from '$lib/apis/configs';
	import { getTools } from '$lib/apis/tools';
	import { load, Store } from '@tauri-apps/plugin-store';
	import { appState, appConfig } from '$lib/stores';
	import {
		areAppConfigsEqual,
		areAppStatesEqual,
		type AppConfig,
		type AppState
	} from '../app/state';
	import { unregisterAll } from '@tauri-apps/plugin-global-shortcut';
	import { DEFAULT_CONFIG, DEFAULT_STATE } from '../app/constants';

	let loadingProgress = spring(0, {
		stiffness: 0.05
	});

	// Initialize i18n
	setContext('i18n', i18n);

	// App State store
	let store: Store | undefined;

	// Subscribe to app state changes in the app and update the store
	$: if (store) {
		(async () => {
			if (!$appState) {
				console.warn('App State changed to undefined in app, skipping update');
				return;
			}
			let state: AppState | undefined = await store.get('state');
			if (areAppStatesEqual(state, $appState)) {
				console.debug('App State idempotent change in app, skipping update');
				return;
			}
			await store.set('state', $appState);
		})();
	} else {
		console.warn('App State changed in the app, but the Store has not been loaded yet');
	}

	// Subscribe to config changes in the app and update the store
	$: if (store) {
		(async () => {
			if (!$appConfig) {
				console.warn('App Config changed to undefined in app, skipping update');
				return;
			}
			let config: AppConfig | undefined = await store.get('config');
			if (areAppConfigsEqual(config, $appConfig)) {
				console.debug('App Config idempotent change in app, skipping update');
				return;
			}
			await store.set('config', $appConfig);
		})();
	} else {
		console.warn('App Config changed in the app, but the Store has not been loaded yet');
	}

	let loaded = false;
	const BREAKPOINT = 768;

	const setupSocket = () => {
		const _socket = io(`${WEBUI_BASE_URL}` || undefined, {
			reconnection: true,
			reconnectionDelay: 1000,
			reconnectionDelayMax: 5000,
			randomizationFactor: 0.5,
			path: '/ws/socket.io',
			auth: { token: localStorage.token }
		});

		socket.set(_socket);

		_socket.on('connect_error', (err) => {
			console.log('connect_error', err);
		});

		_socket.on('connect', () => {
			console.log('connected', _socket.id);
		});

		_socket.on('reconnect_attempt', (attempt) => {
			console.log('reconnect_attempt', attempt);
		});

		_socket.on('reconnect_failed', () => {
			console.log('reconnect_failed');
		});

		_socket.on('disconnect', (reason, details) => {
			console.log(`Socket ${_socket.id} disconnected due to ${reason}`);
			if (details) {
				console.log('Additional details:', details);
			}
		});

		_socket.on('user-count', (data) => {
			console.log('user-count', data);
			activeUserCount.set(data.count);
		});

		_socket.on('usage', (data) => {
			console.log('usage', data);
			USAGE_POOL.set(data['models']);
		});
	};

	onMount(() => {
		const onResize = () => {
			if (window.innerWidth < BREAKPOINT) {
				mobile.set(true);
			} else {
				mobile.set(false);
			}
		};

		(async () => {
			/////////////////////////////////
			// INITIALIZE APP STATE
			/////////////////////////////////

			// Load the store
			store = await load('app.json', { autoSave: true });

			// Subscribe to state changes in the store and update the app
			await store.onKeyChange('state', (state: AppState | undefined) => {
				if (!state) {
					console.warn('App State changed to undefined in store, skipping update');
					return;
				} else if (areAppStatesEqual(state, $appState)) {
					console.debug('App State idempotent change in store, skipping update');
					return;
				}
				$appState = state;
			});

			// Subscribe to config changes in the store and update the app
			await store.onKeyChange('config', (config: AppConfig | undefined) => {
				if (!config) {
					console.warn('App Config changed to undefined in store, skipping update');
					return;
				} else if (areAppConfigsEqual(config, $appConfig)) {
					console.debug('App Config idempotent change in store, skipping update');
					return;
				}
				$appConfig = config;
			});

			// Load default app state on launch
			$appState = DEFAULT_STATE;
			$appConfig = (await store.get('config')) || DEFAULT_CONFIG;

			theme.set(localStorage.theme);

			mobile.set(window.innerWidth < BREAKPOINT);

			window.addEventListener('resize', onResize);

			let backendConfig = null;
			try {
				backendConfig = await getBackendConfig();
				console.log('Backend config:', backendConfig);
			} catch (error) {
				console.error('Error loading backend config:', error);
			}
			// Initialize i18n even if we didn't get a backend config,
			// so `/error` can show something that's not `undefined`.

			initI18n();
			if (!localStorage.locale) {
				const languages = await getLanguages();
				const browserLanguages = navigator.languages
					? navigator.languages
					: // @ts-expect-error Compatibility with older Internet Explorer browsers
						[navigator.language || navigator.userLanguage];
				const lang = backendConfig.default_locale
					? backendConfig.default_locale
					: bestMatchingLanguage(languages, browserLanguages, 'en-US');
				$i18n.changeLanguage(lang);
			}

			if (backendConfig) {
				// Save Backend Status to Store
				$config = backendConfig;
				$WEBUI_NAME = backendConfig.name;

				if ($config) {
					setupSocket();

					if (localStorage.token) {
						console.log('Token:', localStorage.token);

						// Get Session User Info
						const sessionUser = await getSessionUser(localStorage.token).catch((error) => {
							console.error(error);
							return null;
						});

						if (sessionUser) {
							// Save Session User to Store
							$user = sessionUser;
							$config = await getBackendConfig();
						} else {
							// Redirect Invalid Session User to /auth Page
							localStorage.removeItem('token');
							await goto('/auth');
						}
					} else {
						// Don't redirect if we're already on the auth page
						// Needed because we pass in tokens from OAuth logins via URL fragments
						if ($page.url.pathname !== '/auth') {
							await goto('/auth');
						}
					}
				}
			} else {
				// Redirect to /error when Backend Not Detected
				await goto(`/error`);
			}

			$models = await getModels(localStorage.token);
			$banners = await getBanners(localStorage.token);
			$tools = await getTools(localStorage.token);

			console.log('Models on layout', $models);

			await tick();

			if (
				document.documentElement.classList.contains('her') &&
				document.getElementById('progress-bar')
			) {
				loadingProgress.subscribe((value) => {
					const progressBar = document.getElementById('progress-bar');

					if (progressBar) {
						progressBar.style.width = `${value}%`;
					}
				});

				await loadingProgress.set(100);

				document.getElementById('splash-screen')?.remove();

				const audio = new Audio(`/audio/greeting.mp3`);
				const playAudio = () => {
					audio.play();
					document.removeEventListener('click', playAudio);
				};

				document.addEventListener('click', playAudio);

				loaded = true;
			} else {
				document.getElementById('splash-screen')?.remove();
				loaded = true;
			}
		})();

		return async () => {
			window.removeEventListener('resize', onResize);

			// Unregister all global shortcuts
			await unregisterAll();
		};
	});
</script>

{#if !loaded}
	<slot />
{/if}
