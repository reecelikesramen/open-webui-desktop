# Open WebUI Desktop

**Status: Early Development, WIP, Unstable.**  
Currently incompatible with non-local setups.

Open WebUI Desktop is a desktop application for [Open WebUI](https://github.com/open-webui/open-webui), a popular self-hosted LLM WebUI. Built using Tauri 2, it incorporates Svelte-based front-end code from Open WebUI to deliver a seamless desktop experience.

---

## Screenshots

### Desktop GUI

<img src="./screenshots/desktop-gui.png" width=300 alt="Desktop GUI Screenshot"/><br />
A panel-inspired interface for Open WebUI on the desktop.

### Chatbar

<img src="./screenshots/chatbar-1.png" width=300 alt="Chatbar Screenshot 1"/>  
<img src="./screenshots/chatbar-2.png" width=300 alt="Chatbar Screenshot 2"/><br />
An always-on-top ChatGPT and Spotlight-inspired chatbar.

- **Global hotkey:** Hardcoded to `Ctrl+Space`.
- **Hide behavior:** Press `Esc` or shift focus to hide the chatbar.

### Chat Companion

<img src="./screenshots/chat-companion-1.png" width=300 alt="Chat Companion Screenshot 1"/>  
<img src="./screenshots/chat-companion-2.png" width=300 alt="Chat Companion Screenshot 2"/><br />
The Chat Companion displays recent chat activity:

- **Message persistence:** Keeps chats available for 10 minutes after the last message (currently hardcoded).
- **Position retention:** The companion remembers its location on the screen.

---

## Installation

### Prerequisites

Ensure you have the following installed:

- **Rust** (latest stable version)
- **Python 3.11** (configured for a virtual environment)
- **Node.js** with a package manager (e.g., npm or deno)

### Steps

1. Clone this repository.
2. Run `npm run tauri dev` or `deno task tauri dev` to initiate the first-time build process (this may take some time).
3. Clone the [Open WebUI repository](https://github.com/open-webui/open-webui).
4. Follow the Open WebUI instructions to start **only the backend development server**.
5. Once the app is built, launch it. You should see the Open WebUI setup screen.

---

## Roadmap

The following features and improvements are planned, roughly in order of priority:

1. **Non-local Setup Support**: Enable compatibility with remote backend configurations.
1. **Full Desktop Integration**: Expand Open WebUI functionality for the desktop.
1. **Customizable App Settings**:
   - Global hotkey configuration
   - Companion chat settings
   - Chatbar position adjustments
1. **Platform-Specific Styling**: Align with design guidelines for macOS, Windows, and Linux (e.g., NSPanel, window effects).
1. **Distribution**: Package the application for easy distribution.
1. **Code Modularization**: Refactor large monolithic components shared between the main UI and chatbar into modular components and migrate to TypeScript.
1. **System Integrations**: Mirror useful features from ChatGPT Desktop, such as clipboard management, screenshots, and app context integration.

---

## Contributing

Contributions are welcome! While formal guidelines are not yet in place, I will review and integrate useful contributions quickly. Feel free to open issues or submit pull requests.

---

## License

This project is licensed under the MIT License, with extensions from Open WebUI's license. For details, see the [LICENSE](./LICENSE) file.
