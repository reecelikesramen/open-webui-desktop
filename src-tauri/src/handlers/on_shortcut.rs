use crate::{
    move_chatbar,
    prelude::*,
    state::{AppState, ChatbarPosition},
};
use std::{
    sync::Mutex,
    time::{Duration, Instant},
};
use tauri::{Emitter, Manager};

pub fn on_shortcut(handle: &tauri::AppHandle) -> Result<()> {
    // get state
    let state = handle.state::<Mutex<AppState>>();
    let mut state = state.lock().unwrap();

    // get chatbar window
    let window = handle
        .get_webview_window("chatbar")
        .ok_or("chatbar window not found")?;

    // if visible: hide and exit. else show and focus
    if state.visible {
        window.hide()?;
        state.visible = false;
        return Ok(());
    }

    // based on companion chat id: resize window, move window, and set route
    // TODO use time preference
    let time_since_last_chat = Instant::now().duration_since(state.last_chat_time);
    if state.companion_chat_open {
        if time_since_last_chat < Duration::from_secs(600) {
            // TODO set resizable, max and min resizable props
            println!("companion chat: {}", time_since_last_chat.as_secs());
        } else {
            println!("companion chat expired");
            handle.emit_to("chatbar", "shortcut", "companion chat expired")?;
            window.set_size(CHATBAR_WINDOW_SIZE)?;
            move_chatbar(
                &window,
                ChatbarPosition::BottomCenter,
                state.companion_chat_open,
            )?;
        }
    } else {
        window.set_size(CHATBAR_WINDOW_SIZE)?;
        move_chatbar(
            &window,
            ChatbarPosition::BottomCenter,
            state.companion_chat_open,
        )?;
    }

    // move after resizing
    

    // show and set focused
    state.visible = true;
    window.show()?;
    window.set_focus()?;

    Ok(())
}
