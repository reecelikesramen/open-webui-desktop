use tauri::LogicalSize;

// Useful stuff
pub type E = Box<dyn std::error::Error>;
pub type Result<T> = std::result::Result<T, E>;
pub struct W<T>(pub T);

// Constants
pub const MAIN_WINDOW_SIZE: LogicalSize<u32> = LogicalSize::new(800, 650);
pub const CHATBAR_WINDOW_SIZE: LogicalSize<u32> = LogicalSize::new(600, 250); // panel size: 400x85 logical px
pub const COMPANION_CHAT_SIZE: LogicalSize<u32> = LogicalSize::new(600, 600); // panel size 440x540 logical px
