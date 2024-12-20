export const APP_NAME = 'Open WebUI';

export const WEBUI_HOSTNAME = 'localhost:8080';
export const WEBUI_BASE_URL = `http://${WEBUI_HOSTNAME}`;
export const WEBUI_API_BASE_URL = `${WEBUI_BASE_URL}/api/v1`;

export const OLLAMA_API_BASE_URL = `${WEBUI_BASE_URL}/ollama`;
export const OPENAI_API_BASE_URL = `${WEBUI_BASE_URL}/openai`;
export const AUDIO_API_BASE_URL = `${WEBUI_BASE_URL}/audio/api/v1`;
export const IMAGES_API_BASE_URL = `${WEBUI_BASE_URL}/images/api/v1`;
export const RETRIEVAL_API_BASE_URL = `${WEBUI_BASE_URL}/retrieval/api/v1`;

// @ts-expect-error defined in vite.config.ts
export const WEBUI_VERSION = APP_VERSION;
// @ts-expect-error defined in vite.config.ts
export const WEBUI_BUILD_HASH = APP_BUILD_HASH;
export const REQUIRED_OLLAMA_VERSION = '0.1.16';

export const SUPPORTED_FILE_TYPE = [
	'application/epub+zip',
	'application/pdf',
	'text/plain',
	'text/csv',
	'text/xml',
	'text/html',
	'text/x-python',
	'text/css',
	'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	'application/octet-stream',
	'application/x-javascript',
	'text/markdown',
	'audio/mpeg',
	'audio/wav',
	'audio/ogg',
	'audio/x-m4a'
];

export const SUPPORTED_FILE_EXTENSIONS = [
	'md',
	'rst',
	'go',
	'py',
	'java',
	'sh',
	'bat',
	'ps1',
	'cmd',
	'js',
	'ts',
	'css',
	'cpp',
	'hpp',
	'h',
	'c',
	'cs',
	'htm',
	'html',
	'sql',
	'log',
	'ini',
	'pl',
	'pm',
	'r',
	'dart',
	'dockerfile',
	'env',
	'php',
	'hs',
	'hsc',
	'lua',
	'nginxconf',
	'conf',
	'm',
	'mm',
	'plsql',
	'perl',
	'rb',
	'rs',
	'db2',
	'scala',
	'bash',
	'swift',
	'vue',
	'svelte',
	'doc',
	'docx',
	'pdf',
	'csv',
	'txt',
	'xls',
	'xlsx',
	'pptx',
	'ppt',
	'msg'
];

export const PASTED_TEXT_CHARACTER_LIMIT = 1000;

export const THEMES = ['dark', 'light', 'rose-pine dark', 'rose-pine-dawn light', 'oled-dark'];

const IS_TAURI = '__TAURI_INTERNALS__' in window || '__TAURI__' in window;
export default IS_TAURI; // running on a desktop app or a mobile app - but not in the browser
export const isWeb = !IS_TAURI; // running on the browser on either desktop or mobile - but not as a tauri app

export const IS_MOBILE = navigator.maxTouchPoints > 0; // running in mobile either in the browser or as a tauri app
export const IS_DESKTOP = !IS_MOBILE; // running in desktop either in the browser or as a tauri app

export const IS_TAURI_MOBILE = IS_TAURI && IS_MOBILE; // running on mobile as a tauri app - but not on the browser
export const IS_TAURI_DESKTOP = IS_TAURI && IS_DESKTOP; // running on desktop as a tauri app - but not on the browser

export const IS_WEB_MOBILE = isWeb && IS_MOBILE; // running on mobile in the browser - but not as a tauri app
export const IS_WEB_DESKTOP = isWeb && IS_DESKTOP; // running on desktop in the browser - but not as a tauri app

// Source: https://kit.svelte.dev/docs/modules#$env-static-public
// This feature, akin to $env/static/private, exclusively incorporates environment variables
// that are prefixed with config.kit.env.publicPrefix (usually set to PUBLIC_).
// Consequently, these variables can be securely exposed to client-side code.
