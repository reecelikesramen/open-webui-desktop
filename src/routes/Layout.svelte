<script lang="ts">
	import 'tippy.js/dist/tippy.css';
	import '../app.css';
	import '../tailwind.css';

	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { getBackendConfig } from '$lib/apis';
	import { getSessionUser } from '$lib/apis/auths';
	import reopenMainWindow from '$lib/app/actions/reopen-main-window';
	import { MAIN_WINDOW_LABEL, OPEN_IN_MAIN_WINDOW, OPEN_SETTINGS } from '$lib/app/constants';
	import Draggable from '$lib/components/desktop-app/Draggable.svelte';
	import i18n, { getLanguages, initI18n } from '$lib/i18n';
	import {
		activeUserCount,
		appConfig,
		appState,
		config,
		mobile,
		showSettings,
		socket,
		theme,
		USAGE_POOL,
		user,
		WEBUI_BASE_URL,
		WEBUI_NAME
	} from '$lib/stores';
	import { bestMatchingLanguage, delay } from '$lib/utils';
	import { listen, type UnlistenFn } from '@tauri-apps/api/event';
	import { getCurrentWindow } from '@tauri-apps/api/window';
	import { unregisterAll } from '@tauri-apps/plugin-global-shortcut';
	import { io } from 'socket.io-client';
	import { get } from 'svelte/store';
	import { onMount, setContext, tick } from 'svelte';
	import { Toaster } from 'svelte-sonner';
	import { spring } from 'svelte/motion';

	let loadingProgress = spring(0, {
		stiffness: 0.05
	});

	// Initialize i18n
	setContext('i18n', i18n);

	let loaded = false;
	const IS_MAIN_WINDOW = getCurrentWindow().label === MAIN_WINDOW_LABEL;
	const BREAKPOINT = 768;

	$: console.log('Loaded changed', loaded);
	$: console.log('WEBUI_BASE_URL changed', $WEBUI_BASE_URL);

	const setupSocket = () => {
		// Ensure we don't keep multiple sockets alive across host changes / remounts.
		const existing = get(socket);
		try {
			existing?.disconnect();
		} catch (e) {
			console.warn('Failed to disconnect existing socket', e);
		}

		const _socket = io(`${$WEBUI_BASE_URL}` || undefined, {
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
		console.log('Layout onMount called');
		let disposed = false;

		const onResize = () => {
			if (window.innerWidth < BREAKPOINT) {
				mobile.set(true);
			} else {
				mobile.set(false);
			}
		};

		// These are assigned asynchronously; default them to no-ops so cleanup can't throw
		// if the component unmounts before initialization finishes.
		let unlistenReopen: UnlistenFn = () => {};
		let unlistenOpenInMainWindow: UnlistenFn = () => {};
		let unlistenOpenSettings: UnlistenFn = () => {};
		(async () => {
			console.log('Waiting 100ms for cross window stores to load...');
			await delay(100);
			console.log('They should be loaded now!');
			if (disposed) return;

			/////////////////////////////////
			// INITIALIZE APP STATE
			/////////////////////////////////

			// Reopen main window event listener
			unlistenReopen = await listen('reopen', async () => {
				await reopenMainWindow();
			});
			if (disposed) {
				unlistenReopen();
				return;
			}

			// Open settings event listener (emitted from native menu).
			unlistenOpenSettings = await listen(OPEN_SETTINGS, async () => {
				// Ensure we are on a route where the settings modal exists.
				// The modal is mounted under the (app) layout.
				if (['/setup', '/auth', '/error'].includes(page.url.pathname)) {
					await goto('/');
				}
				showSettings.set(true);
				await tick();
				await getCurrentWindow().setFocus();
			});
			if (disposed) {
				unlistenOpenSettings();
				return;
			}

			//
			unlistenOpenInMainWindow = await listen(
				OPEN_IN_MAIN_WINDOW,
				async (event: { payload: { chatId: string } }) => {
					if (!event.payload || !event.payload.chatId) {
						console.warn('open in main window called without chatId');
						return;
					}
					await goto(`/c/${event.payload.chatId}`);
					console.log('Chat', event.payload.chatId, 'opened in main window');
					await getCurrentWindow().setFocus();
				}
			);
			if (disposed) {
				unlistenOpenInMainWindow();
				return;
			}

			console.log('Initial app state:', $appState, $appConfig);

			theme.set(localStorage.theme);

			mobile.set(window.innerWidth < BREAKPOINT);

			window.addEventListener('resize', onResize);

			// Route to setup page if no WEBUI_BASE_URL
			console.log('WEBUI_BASE_URL before setup check:', $WEBUI_BASE_URL);
			if ($WEBUI_BASE_URL === '') {
				console.log('No WEBUI_BASE_URL', page.url.pathname);
				if (page.url.pathname !== '/setup') {
					console.log('Redirecting to /setup');
					await goto('/setup');
				}
				return;
			}

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
						if (page.url.pathname !== '/auth') {
							// await goto('/auth');
							window.location.href = '/auth';
						}
					}
				}
			} else {
				// Redirect to /error when Backend Not Detected
				await goto(`/error`);
			}

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
			disposed = true;
			window.removeEventListener('resize', onResize);

			// Unregister all global shortcuts
			await unregisterAll();

			// Disconnect socket (if any) to avoid leaking connections between remounts.
			try {
				get(socket)?.disconnect();
			} catch (e) {
				console.warn('Failed to disconnect socket during cleanup', e);
			}
			socket.set(null);

			// Unlisten to Reopen event
			unlistenReopen();

			// Unlisten to Open in Main Window event
			unlistenOpenInMainWindow();

			// Unlisten to Open Settings event
			unlistenOpenSettings();
		};
	});
</script>

<svelte:head>
	<title>{$WEBUI_NAME}</title>
</svelte:head>
<Draggable />
{#if loaded || $WEBUI_BASE_URL === ''}
	<slot />
{/if}
{#if IS_MAIN_WINDOW}
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
{/if}
