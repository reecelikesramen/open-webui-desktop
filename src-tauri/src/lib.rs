mod commands;
pub(crate) mod handlers;
mod prelude;
pub(crate) mod state;

use std::sync::Mutex;

use commands::{set_shortcut, set_shortcut_internal};
use prelude::*;
use state::{AppConfig, AppState, ChatbarPosition};
use tauri::{AppHandle, Manager, PhysicalPosition, WebviewWindow};
use tauri_plugin_global_shortcut::{GlobalShortcutExt, ShortcutState};
use tauri_plugin_store::StoreExt;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_global_shortcut::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_nspanel::init())
        .setup(|app| {
            // Initialize app state
            app.manage(Mutex::new(AppState::default()));

            // Initialize store and load config
            let store = app.store("config.json")?;
            // let config = store
            //     .get("config")
            //     .unwrap_or_else(|| json!(AppConfig::default()));
            // let config: AppConfig = serde_json::from_value(config).unwrap_or_default();
            let config = AppConfig::default();

            // Navigate to base url
            if let Some(window) = app.get_webview_window("main") {
                window.eval(&format!("window.location.href = '{}';", config.base_url))?;
                window.show()?;
            }

            // Use the shared function to set up the initial shortcut
            let app_handle = app.handle();
            set_shortcut_internal(app_handle, config.shortcut)?;

            let handle = app_handle.clone();
            app.global_shortcut()
                .on_shortcut("Escape", move |_, _, event| {
                    if event.state == ShortcutState::Pressed {
                        if let Some(window) = handle.get_webview_window("chatbar") {
                            window.hide().expect("Failed to hide chatbar");
                            let state = handle.state::<Mutex<AppState>>();
                            let mut state = state.lock().unwrap();
                            state.visible = false;
                        }
                    }
                })?;

            // Set up focus change listener
            if let Some(window) = app.get_webview_window("chatbar") {
                let chatbar_window = window.clone();
                let handle = app_handle.clone();
                window.on_window_event(move |event| {
                    if let tauri::WindowEvent::Focused(focused) = event {
                        if !focused {
                            chatbar_window.hide().expect("Failed to hide chatbar");
                            let state = handle.state::<Mutex<AppState>>();
                            let mut state = state.lock().unwrap();
                            state.visible = false;
                        }
                    }
                });
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![set_shortcut])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

pub(crate) fn move_chatbar(
    window: &WebviewWindow,
    position: ChatbarPosition,
    companion_chat_open: bool,
) -> Result<()> {
    let position = match position {
        ChatbarPosition::BottomCenter => {
            let monitor = window
                .current_monitor()
                .expect("Failed to get monitor")
                .expect("Couldn't find monitor");
            let monitor_size = monitor.size();
            let window_size = window.outer_size().expect("Failed to get window size");
            let x = monitor.position().x + ((monitor_size.width - window_size.width) / 2) as i32;
            let mut y =
                monitor.position().y + (monitor_size.height - window_size.height - 132) as i32;

            // TODO: padding distance
            if companion_chat_open {
                y -= 20;
            }
            (x, y)
        }
        ChatbarPosition::BottomLeft => todo!(),
        ChatbarPosition::BottomRight => todo!(),
    };
    let position = PhysicalPosition::<i32>::from(position);
    window
        .set_position(position)
        .expect("Failed to set window position");

    Ok(())
}
