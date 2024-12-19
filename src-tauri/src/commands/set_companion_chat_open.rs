use crate::prelude::*;
use crate::state::AppState;
use tauri::Manager;

#[tauri::command]
pub async fn set_companion_chat_open(
    app_handle: tauri::AppHandle,
    open_state: bool,
) -> std::result::Result<(), String> {
    let state = app_handle.state::<std::sync::Mutex<AppState>>();
    let mut state = state.lock().unwrap();
    state.companion_chat_open = open_state;

    let window = app_handle
        .get_webview_window("chatbar")
        .ok_or("chatbar window not found")?;

    // set window size
    window
        .set_size(if open_state {
            COMPANION_CHAT_SIZE
        } else {
            CHATBAR_WINDOW_SIZE
        })
        .map_err(|e| e.to_string())?;

    Ok(())
}
