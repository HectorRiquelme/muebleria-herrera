import PocketBase from 'pocketbase';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const pb = new PocketBase(process.env.PB_URL ?? 'http://localhost:8090');

	const images = await pb.collection('landing_images').getFullList({
		filter: 'active = true',
		sort: 'order,created'
	}).catch(() => []);

	return { images };
};
