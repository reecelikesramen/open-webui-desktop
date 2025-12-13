use tauri::{Emitter, Manager, RunEvent};

const OPEN_SETTINGS_EVENT: &str = "OPEN_SETTINGS";
const MENU_OPEN_SETTINGS_ID: &str = "open_settings";

fn ensure_main_window(app: &tauri::AppHandle) -> tauri::Result<tauri::WebviewWindow> {
    if let Some(window) = app.get_webview_window("main") {
        return Ok(window);
    }

    tauri::WebviewWindowBuilder::new(app, "main", tauri::WebviewUrl::App("/".into()))
        .title("Open WebUI")
        .inner_size(800.0, 650.0)
        .min_inner_size(600.0, 450.0)
        .resizable(true)
        .minimizable(true)
        .visible(true)
        .build()
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .menu(|app| {
            use tauri::menu::{Menu, MenuItem, MenuItemKind, PredefinedMenuItem, Submenu};

            // Start from Tauri's default menu so we don't accidentally remove standard OS items.
            let menu = Menu::default(app)?;

            let settings = MenuItem::with_id(
                app,
                MENU_OPEN_SETTINGS_ID,
                "Settings…",
                true,
                Some("CmdOrCtrl+,"),
            )?;
            let separator = PredefinedMenuItem::separator(app)?;

            // Try to inject Settings into the existing File menu.
            let mut file_menu_found = false;
            for item in menu.items()?.into_iter() {
                if let MenuItemKind::Submenu(submenu) = item {
                    if submenu.text().unwrap_or_default() == "File" {
                        submenu.insert_items(&[&settings, &separator], 0)?;
                        file_menu_found = true;
                        break;
                    }
                }
            }

            // Fallback: create a File menu if the default menu doesn't include one (some platforms).
            if !file_menu_found {
                let file_menu = Submenu::with_id_and_items(
                    app,
                    "file",
                    "File",
                    true,
                    &[
                        &settings,
                        &separator,
                        &PredefinedMenuItem::close_window(app, None)?,
                        #[cfg(not(target_os = "macos"))]
                        &PredefinedMenuItem::quit(app, None)?,
                    ],
                )?;
                menu.prepend(&file_menu)?;
            }

            Ok(menu)
        })
        .on_menu_event(|app, event| {
            if event.id() == MENU_OPEN_SETTINGS_ID {
                if let Ok(window) = ensure_main_window(app) {
                    let _ = window.show();
                    let _ = window.set_focus();
                    let _ = window.emit(OPEN_SETTINGS_EVENT, ());
                }
            }
        })
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .plugin(tauri_plugin_store::Builder::default().build())
        .plugin(tauri_plugin_global_shortcut::Builder::default().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_nspanel::init())
        .build(tauri::generate_context!())
        .expect("error while running tauri application")
        .run(move |app_handle, event| match event {
            RunEvent::Reopen { .. } => {
                app_handle.emit("reopen", ()).expect("failed to emit event");
            }
            _ => (),
        });
}
