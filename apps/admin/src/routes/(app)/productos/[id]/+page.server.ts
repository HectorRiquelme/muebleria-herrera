import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const pb = locals.pb;

	const product = await pb.collection('products').getOne(params.id, {
		expand: 'category,invoice,inventoried_by'
	}).catch(() => null);

	if (!product) {
		throw error(404, 'Producto no encontrado');
	}

	// Buscar comprobantes donde aparece este producto
	const voucherItems = await pb.collection('voucher_items').getFullList({
		filter: `product = "${params.id}"`,
		expand: 'voucher,voucher.client',
		sort: '-created'
	}).catch(() => []);

	return { product, voucherItems };
};
