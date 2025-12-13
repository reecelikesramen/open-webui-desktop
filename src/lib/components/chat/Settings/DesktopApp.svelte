<script lang="ts">
	import { setShortcut } from '$lib/app/commands/set-shortcut';
	import { APP_STORE_FILE } from '$lib/app/constants';
	import type { ChatBarPosition, ResetChatTime } from '$lib/app/state';
	import Switch from '$lib/components/common/Switch.svelte';
	import { appConfig, showSettings, WEBUI_BASE_URL } from '$lib/stores';
	import { delay } from '$lib/utils';
	import * as autoStart from '@tauri-apps/plugin-autostart';
	import { isRegistered, unregister } from '@tauri-apps/plugin-global-shortcut';
	import { getStore } from '@tauri-apps/plugin-store';
	import type { i18n as i18nT } from 'i18next';
	import { createEventDispatcher, getContext, onMount } from 'svelte';
	import { toast } from 'svelte-sonner';
	import type { Writable } from 'svelte/store';
	import ShortcutEntry from './DesktopApp/ShortcutEntry.svelte';

	const BANNED_SHORTCUTS = [
		'cmd+c',
		'cmd+v',
		'cmd+a',
		'cmd+x',
		'cmd+z',
		'cmd+shift+z',
		'cmd+s',
		'cmd+shift+s',
		'cmd+backspace',
		'cmd+shift+backspace',
		'cmd+q',
		'cmd+w',
		'cmd+shift+w',
		'cmd+f',
		'cmd+m'
	];

	const dispatch = createEventDispatcher();

	const i18n: Writable<i18nT> = getContext('i18n');

	// Settings
	let positionOnScreen: ChatBarPosition;
	const positionOnScreenChangeHandler = () => {};

	let resetToNewChat: ResetChatTime;
	const resetToNewChatChangeHandler = () => {};

	let keyboardShortcut: string;
	const keyboardShortcutChangeHandler = async () => {
		try {
			if (keyboardShortcut !== $appConfig.shortcut && (await isRegistered(keyboardShortcut))) {
				toast.error($i18n.t('Shortcut already in use. Please try another.'));
				keyboardShortcut = $appConfig.shortcut;
			} else if (BANNED_SHORTCUTS.includes(keyboardShortcut.toLowerCase())) {
				toast.error($i18n.t('Invalid shortcut. Please try another.'));
				keyboardShortcut = $appConfig.shortcut;
			}
		} catch {
			toast.error($i18n.t('Invalid shortcut. Please try another.'));
			keyboardShortcut = $appConfig.shortcut;
		}
	};
	const keyboardShortcutClearHandler = () => {
		keyboardShortcut = '';
	};

	let openNewChatsInCompanion: string;
	const openNewChatsChangeHandler = () => {};

	let launchAtLogin: boolean;
	const launchAtLoginChangeHandler = () => {};

	let openLinksInApp: boolean;
	const openLinksInAppChangeHandler = () => {};

	type HostTestStatus = 'idle' | 'testing' | 'success' | 'error';
	let hostUrlDraft = '';
	let hostTestStatus: HostTestStatus = 'idle';
	let hostTestMessage = '';
	let hostTestResult: null | { name?: string; version?: string } = null;

	const normalizeBaseUrl = (url: string) => url.trim().replace(/\/+$/, '');

	const testHost = async () => {
		const url = normalizeBaseUrl(hostUrlDraft);
		if (!url) {
			hostTestStatus = 'error';
			hostTestMessage = $i18n.t('Please enter a valid URL.');
			hostTestResult = null;
			return;
		}

		hostTestStatus = 'testing';
		hostTestMessage = $i18n.t('Testing connection...');
		hostTestResult = null;

		const controller = new AbortController();
		const timeout = setTimeout(() => controller.abort(), 6000);
		try {
			const res = await fetch(`${url}/api/config`, {
				method: 'GET',
				headers: { 'Content-Type': 'application/json' },
				signal: controller.signal
			});
			if (!res.ok) {
				throw new Error(`${res.status} ${res.statusText}`);
			}
			const json = await res.json();
			hostTestStatus = 'success';
			hostTestResult = { name: json?.name, version: json?.version };
			hostTestMessage = $i18n.t('Connected.');
		} catch (e) {
			hostTestStatus = 'error';
			hostTestResult = null;
			hostTestMessage = `${$i18n.t('Failed to connect.')}${
				e instanceof Error ? ` (${e.message})` : ''
			}`;
		} finally {
			clearTimeout(timeout);
		}
	};

	const applyHost = async () => {
		const url = normalizeBaseUrl(hostUrlDraft);
		if (!url) {
			toast.error($i18n.t('Please enter a valid URL.'));
			return;
		}

		if (url === $WEBUI_BASE_URL) {
			toast.message($i18n.t('No changes to apply.'));
			return;
		}

		// Clear backend-derived cached stores to avoid stale UI / redirect loops when the token is invalid on the new host.
		try {
			const store = await getStore(APP_STORE_FILE);
			const keepKeys = new Set(['app_config', 'app_state', 'webui_base_url', 'theme']);
			for (const key of (await store?.keys()) || []) {
				if (!keepKeys.has(key)) {
					await store?.delete(key);
				}
			}
			await store?.save();
		} catch (e) {
			console.warn('Failed to clear cached store keys during host change', e);
		}

		$WEBUI_BASE_URL = url;
		showSettings.set(false);
		toast.success($i18n.t('Host updated.'));

		// Force a full reload so in-memory stores (e.g. cached `user`) cannot cause redirect loops
		// when switching to a host where the token is invalid.
		setTimeout(() => {
			window.location.href = '/';
		}, 50);
	};

	const saveConfig = async () => {
		console.debug('Saving settings. Before:', Object.entries($appConfig));
		// sets shortcut and saves to config

		console.debug('Right before set:', keyboardShortcut);
		let shortcut = $appConfig.shortcut;
		if (keyboardShortcut !== $appConfig.shortcut) {
			if (keyboardShortcut === '') {
				await unregister($appConfig.shortcut);
				shortcut = '';
			} else if (await setShortcut(keyboardShortcut, $appConfig.shortcut)) {
				shortcut = keyboardShortcut;
			} else {
				keyboardShortcut = $appConfig.shortcut;
				delay(50).then(() => toast.warning($i18n.t('Failed to set shortcut. Please try again.')));
			}
		}

		try {
			if (launchAtLogin) {
				await autoStart.enable();
			} else {
				await autoStart.disable();
			}
		} catch (e) {
			console.error('Failed to set launch at login to', launchAtLogin, e);
		}

		$appConfig = {
			...$appConfig,
			shortcut,
			chatBarPositionPreference: positionOnScreen,
			resetChatTimePreference: resetToNewChat,
			openChatsInCompanion: openNewChatsInCompanion === 'true',
			openLinksInApp
		};

		console.debug('After:', $appConfig);
		dispatch('save');
	};

	onMount(async () => {
		positionOnScreen = $appConfig.chatBarPositionPreference;
		resetToNewChat = $appConfig.resetChatTimePreference;
		keyboardShortcut = $appConfig.shortcut;
		openNewChatsInCompanion = $appConfig.openChatsInCompanion ? 'true' : 'false';
		launchAtLogin = await autoStart.isEnabled();
		openLinksInApp = $appConfig.openLinksInApp;
		hostUrlDraft = $WEBUI_BASE_URL;
	});
</script>

<div class="flex flex-col flex-grow flex-shrink justify-between text-sm">
	<div class="overflow-y-scroll max-h-[28rem] lg:max-h-full">
		<div class="">
			<div class=" mb-1 text-sm font-medium">{$i18n.t('Desktop App Settings')}</div>

			<div class="flex w-full justify-between">
				<div class=" self-center text-xs font-medium">{$i18n.t('Position on Screen')}</div>
				<div class="flex items-center relative">
					<select
						class="text-right dark:bg-gray-900 w-fit pr-8 rounded py-2 px-2 text-xs bg-transparent outline-none"
						bind:value={positionOnScreen}
						on:change={positionOnScreenChangeHandler}
					>
						<option value="BOTTOM_CENTER">{$i18n.t('Bottom Center')}</option>
						<option value="BOTTOM_LEFT">{$i18n.t('Bottom Left')}</option>
						<option value="BOTTOM_RIGHT">{$i18n.t('Bottom Right')}</option>
						<option value="REMEMBER_LAST">{$i18n.t('Remember Last')}</option>
					</select>
				</div>
			</div>

			<div class=" flex w-full justify-between">
				<div class=" self-center text-xs font-medium">{$i18n.t('Reset to New Chat')}</div>
				<div class="flex items-center relative">
					<select
						class="text-right dark:bg-gray-900 w-fit pr-8 rounded py-2 px-2 text-xs bg-transparent outline-none"
						bind:value={resetToNewChat}
						on:change={resetToNewChatChangeHandler}
					>
						<option value="IMMEDIATELY">{$i18n.t('Immediately')}</option>
						<option value="10_MIN">{$i18n.t('After 10 minutes')}</option>
						<option value="15_MIN">{$i18n.t('After 15 minutes')}</option>
						<option value="30_MIN">{$i18n.t('After 30 minutes')}</option>
						<option value="NEVER">{$i18n.t('Never')}</option>
					</select>
				</div>
			</div>

			<div class=" flex w-full justify-between">
				<div class=" self-center text-xs font-medium">{$i18n.t('Keyboard Shortcut')}</div>
				<div class="flex items-center relative">
					<ShortcutEntry
						bind:value={keyboardShortcut}
						on:change={keyboardShortcutChangeHandler}
						on:clear={keyboardShortcutClearHandler}
					/>
				</div>
			</div>

			<div class=" flex w-full justify-between">
				<div class=" self-center text-xs font-medium">{$i18n.t('Open New Chats')}</div>
				<div class="flex items-center relative">
					<select
						class="text-right dark:bg-gray-900 w-fit pr-8 rounded py-2 px-2 text-xs bg-transparent outline-none"
						bind:value={openNewChatsInCompanion}
						on:change={openNewChatsChangeHandler}
						disabled={true}
					>
						<option value="true">{$i18n.t('In Companion Chat')}</option>
						<option value="false">{$i18n.t('In Main Window')}</option>
					</select>
				</div>
			</div>
		</div>

		<div class=" flex w-full justify-between">
			<div class=" self-center text-xs font-medium">
				{$i18n.t('Open Open WebUI Links in Desktop App')}
			</div>
			<div class="flex items-center relative">
				<div class="mt-1">
					<Switch
						bind:state={openLinksInApp}
						on:change={openLinksInAppChangeHandler}
						disabled={true}
					/>
				</div>
			</div>
		</div>

		<div class=" flex w-full justify-between">
			<div class=" self-center text-xs font-medium">{$i18n.t('Launch at Login')}</div>
			<div class="flex items-center relative">
				<div class="mt-1">
					<Switch bind:state={launchAtLogin} on:change={launchAtLoginChangeHandler} />
				</div>
			</div>
		</div>

		<hr class=" dark:border-gray-850 my-3" />

		<div class="flex w-full justify-between gap-3">
			<div class="self-start text-xs font-medium pt-2">{$i18n.t('WebUI Base URL')}</div>
			<div class="flex flex-col flex-1 gap-2">
				<input
					type="text"
					bind:value={hostUrlDraft}
					placeholder="http://localhost:3000"
					class="text-xs px-3 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-850 dark:text-gray-200 focus:outline-none"
				/>

				{#if hostTestStatus !== 'idle'}
					<div
						class="text-xs {hostTestStatus === 'success'
							? 'text-green-600 dark:text-green-400'
							: hostTestStatus === 'error'
								? 'text-red-600 dark:text-red-400'
								: 'text-gray-500 dark:text-gray-400'}"
					>
						{hostTestMessage}
						{#if hostTestResult}
							<span class="ml-1 text-gray-500 dark:text-gray-400">
								{hostTestResult.name ? hostTestResult.name : ''}{hostTestResult.version
									? ` v${hostTestResult.version}`
									: ''}
							</span>
						{/if}
					</div>
				{/if}

				<div class="flex gap-2 justify-end">
					<button
						class="px-3 py-1.5 text-xs font-medium rounded-full bg-gray-700/5 hover:bg-gray-700/10 dark:bg-gray-100/5 dark:hover:bg-gray-100/10 dark:text-gray-300 dark:hover:text-white transition disabled:opacity-50"
						on:click={testHost}
						disabled={hostTestStatus === 'testing'}
						type="button"
					>
						{hostTestStatus === 'testing' ? $i18n.t('Testing...') : $i18n.t('Test Connection')}
					</button>
					<button
						class="px-3 py-1.5 text-xs font-medium rounded-full bg-black hover:bg-gray-900 text-white dark:bg-white dark:text-black dark:hover:bg-gray-100 transition disabled:opacity-50"
						on:click={applyHost}
						disabled={normalizeBaseUrl(hostUrlDraft) === '' || normalizeBaseUrl(hostUrlDraft) === $WEBUI_BASE_URL}
						type="button"
					>
						{$i18n.t('Apply')}
					</button>
					<button
						class="px-3 py-1.5 text-xs font-medium rounded-full bg-transparent hover:bg-gray-700/5 dark:hover:bg-gray-100/5 transition disabled:opacity-50"
						on:click={() => {
							hostUrlDraft = $WEBUI_BASE_URL;
							hostTestStatus = 'idle';
							hostTestMessage = '';
							hostTestResult = null;
						}}
						disabled={hostUrlDraft === $WEBUI_BASE_URL}
						type="button"
					>
						{$i18n.t('Reset')}
					</button>
				</div>
			</div>
		</div>
	</div>
	<div class="flex justify-end pt-3 text-sm font-medium">
		<button
			class="px-3.5 py-1.5 text-sm font-medium bg-black hover:bg-gray-900 text-white dark:bg-white dark:text-black dark:hover:bg-gray-100 transition rounded-full"
			on:click={saveConfig}
		>
			{$i18n.t('Save')}
		</button>
	</div>
</div>
