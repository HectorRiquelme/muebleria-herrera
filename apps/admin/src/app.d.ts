// See https://svelte.dev/docs/kit/types#app.d.ts
import type PocketBase from 'pocketbase';
import type { User } from '$lib/types';

declare global {
	namespace App {
		interface Error {
			message: string;
		}
		interface Locals {
			user: User | null;
			pb: PocketBase;
		}
		interface PageData {
			user?: User | null;
		}
	}
}

export {};
