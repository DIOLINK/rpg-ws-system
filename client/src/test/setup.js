import '@testing-library/jest-dom';
import { TextDecoder, TextEncoder } from 'node:util';
import 'whatwg-fetch';

globalThis.TextEncoder = TextEncoder;
globalThis.TextDecoder = TextDecoder;

globalThis.importMetaEnv = {
  VITE_API_URL: 'http://localhost:5001/api',
};
Object.defineProperty(globalThis, 'import', {
  value: { meta: { env: globalThis.importMetaEnv } },
});

process.env.VITE_FIREBASE_API_KEY = 'AIzaSyCQXxUc4OexgIqLeeORYJA1MXoLgovjVNs';
process.env.VITE_FIREBASE_AUTH_DOMAIN = 'rpg-game-dio-a058e.firebaseapp.com';
process.env.VITE_FIREBASE_PROJECT_ID = 'rpg-game-dio-a058e';
process.env.VITE_FIREBASE_STORAGE_BUCKET =
  'rpg-game-dio-a058e.firebasestorage.app';
process.env.VITE_FIREBASE_MESSAGING_SENDER_ID = '62594432376';
process.env.VITE_FIREBASE_APP_ID = '1:62594432376:web:7bd8dcb29276224e2c1c8d';
