import PocketBase from 'pocketbase';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const pb = new PocketBase(process.env.PB_URL ?? 'http://localhost:8090');

	const images = await pb.collection('landing_images').getFullList({
		filter: 'active = true',
		sort: 'order,created'
	}).catch(() => []);

	const landingCategories = await pb.collection('landing_categories').getFullList({
		filter: 'active = true',
		sort: 'order,name'
	}).catch(() => []);

	const landingProducts = await pb.collection('landing_products').getFullList({
		filter: 'active = true',
		sort: 'order,name',
		expand: 'category'
	}).catch(() => []);

	return { images, landingCategories, landingProducts };
};
