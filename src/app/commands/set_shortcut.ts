import { register, unregister, isRegistered } from '@tauri-apps/plugin-global-shortcut';
import { load } from '@tauri-apps/plugin-store';
import onShortcut from '../handlers/on_shortcut';
import type { AppConfig } from '../state';
import { DEFAULT_CONFIG } from '../constants';

export async function setShortcut(keybind: string) {
	// get old keybind, set new keybind
	const store = await load('app.json', { autoSave: true });
	const config: AppConfig = (await store.get('config')) || DEFAULT_CONFIG;

	console.log(config);

	const old_keybind = config.shortcut;

	try {
		// unregister old shortcut
		if (old_keybind) {
			await unregister(old_keybind);
		}

		// attempt to register new shortcut
		await register(keybind, onShortcut);
		config.shortcut = keybind;
		console.log('Set chatbar shortcut to', keybind);
	} catch {
		console.log(`Shortcut ${keybind} already in use, using ${old_keybind}`);
		// re-register old shortcut
		await register(old_keybind, onShortcut);
		config.shortcut = old_keybind;
	}

	await store.set('config', config);
}
