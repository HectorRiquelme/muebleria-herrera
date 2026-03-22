import PocketBase from 'pocketbase';

export const pb = new PocketBase(
	typeof window !== 'undefined'
		? (import.meta.env.VITE_PB_URL ?? 'http://localhost:8090')
		: (process.env.PB_URL ?? 'http://localhost:8090')
);

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
