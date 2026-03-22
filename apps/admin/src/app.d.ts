// See https://svelte.dev/docs/kit/types#app.d.ts
import type { AuthModel } from 'pocketbase';

declare global {
	namespace App {
		interface Error {
			message: string;
		}
		interface Locals {
			user: AuthModel | null;
			pb: import('pocketbase').default;
		}
		interface PageData {
			user?: AuthModel | null;
		}
	}
}

export {};
