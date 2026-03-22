import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
	try {
		const items = await locals.pb.collection('voucher_items').getFullList({
			filter: `voucher = "${params.id}"`,
			expand: 'product'
		});
		return json(items);
	} catch {
		return json([]);
	}
};
