use serde::{Deserialize, Serialize};
use std::time::Instant;

pub(crate) struct AppState {
    pub companion_chat_open: bool,
    pub visible: bool,
    pub last_chat_time: Instant,
}

impl Default for AppState {
    fn default() -> Self {
        Self {
            companion_chat_open: false,
            visible: false,
            last_chat_time: Instant::now(),
        }
    }
}

pub(crate) enum ChatbarPosition {
    BottomCenter,
    BottomLeft,
    BottomRight,
}

pub(crate) enum ResetChatTime {
    Immediately,
    After10Minutes,
    After15Minutes,
    After30Minutes,
    Never,
}

#[derive(Debug, Serialize, Deserialize)]
pub(crate) struct AppConfig {
    pub shortcut: String,
    pub base_url: String,
    pub jwt_token: String,
    // pub chatbar_position: ChatbarPosition, // bottom center
    // pub reset_chat_time: ResetChatTime, // after 10 minutes
    // pub auto_launch: bool, // true
    // pub open_chats_in_companion: bool, // true
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            shortcut: "Control+Space".to_string(),
            base_url: "/".to_string(),
            jwt_token: String::new(),
        }
    }
}
