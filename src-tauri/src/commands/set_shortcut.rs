use crate::{handlers::on_shortcut, prelude::*};
use serde_json::json;
use tauri_plugin_global_shortcut::{GlobalShortcutExt, Shortcut, ShortcutState};
use tauri_plugin_store::StoreExt;

use crate::state::AppConfig;

pub fn set_shortcut_internal(app_handle: &tauri::AppHandle, new_shortcut: String) -> Result<()> {
    // Try to convert the string to a shortcut to validate it
    let shortcut: Shortcut = new_shortcut
        .clone()
        .try_into()
        .map_err(|_| "Invalid shortcut format".to_string())?;

    // Update store
    let store = app_handle
        .store("config.json")
        .map_err(|_| "Failed to get store")?;

    // Get config from store
    let config = store
        .get("config")
        .unwrap_or_else(|| json!(AppConfig::default()));
    let mut config: AppConfig =
        serde_json::from_value(config).map_err(|_| "Failed to parse config".to_string())?;

    config.shortcut = new_shortcut;

    store.set("config", json!(config));

    store.save().map_err(|e| e.to_string())?;

    // Unregister all shortcuts and register the new one
    let global_shortcut = app_handle.global_shortcut();
    global_shortcut
        .unregister_all()
        .map_err(|e| e.to_string())?;

    let handle = app_handle.clone();
    global_shortcut
        .on_shortcut(shortcut, move |_, _, event| {
            if event.state == ShortcutState::Pressed {
                on_shortcut(&handle).unwrap();
            }
        })
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub async fn set_shortcut(
    app_handle: tauri::AppHandle,
    new_keybind: String,
) -> std::result::Result<(), String> {
    set_shortcut_internal(&app_handle, new_keybind).map_err(|e| e.to_string())
}
