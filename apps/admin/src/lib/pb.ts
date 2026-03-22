import PocketBase from 'pocketbase';
import { writable } from 'svelte/store';
import type { AuthModel } from 'pocketbase';

export const pb = new PocketBase(
	typeof window !== 'undefined'
		? (import.meta.env.VITE_PB_URL ?? 'http://localhost:8090')
		: (process.env.PB_URL ?? 'http://localhost:8090')
);

export const currentUser = writable<AuthModel | null>(pb.authStore.model);

pb.authStore.onChange((_, model) => {
	currentUser.set(model);
});

export function isAdmin(user: AuthModel | null): boolean {
	return user?.role === 'admin';
}

export function isWorker(user: AuthModel | null): boolean {
	return user?.role === 'worker';
}

export function getFileUrl(
	collectionId: string,
	recordId: string,
	filename: string,
	thumb?: string
): string {
	const base = typeof window !== 'undefined'
		? (import.meta.env.VITE_PB_URL ?? 'http://localhost:8090')
		: (process.env.PB_URL ?? 'http://localhost:8090');
	const url = `${base}/api/files/${collectionId}/${recordId}/${filename}`;
	if (thumb) return `${url}?thumb=${thumb}`;
	return url;
}
