import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const pb = locals.pb;

	const [products, vouchers, clients, invoices] = await Promise.all([
		pb.collection('products').getList(1, 1, { filter: 'status = "disponible"' }).catch(() => ({ totalItems: 0 })),
		pb.collection('vouchers').getList(1, 1, {}).catch(() => ({ totalItems: 0 })),
		pb.collection('clients').getList(1, 1, {}).catch(() => ({ totalItems: 0 })),
		pb.collection('invoices').getList(1, 1, {}).catch(() => ({ totalItems: 0 }))
	]);

	// Pending delete requests (only for admin)
	// Desactivar auto-cancelacion: layout tambien consulta delete_requests
	pb.autoCancellation(false);
	const pendingRequests = locals.user?.role === 'admin'
		? await pb.collection('delete_requests').getList(1, 1, { filter: 'status = "pending"' }).catch(() => ({ totalItems: 0 }))
		: { totalItems: 0 };

	// Recent vouchers
	const recentVouchers = await pb.collection('vouchers').getList(1, 5, {
		sort: '-created',
		expand: 'client'
	}).catch(() => ({ items: [] }));

	// Low stock (available products)
	const availableProducts = await pb.collection('products').getList(1, 5, {
		filter: 'status = "disponible"',
		sort: '-created',
		expand: 'category'
	}).catch(() => ({ items: [] }));

	// Sales total this month
	const now = new Date();
	const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
	const monthVouchers = await pb.collection('vouchers').getFullList({
		filter: `created >= "${firstOfMonth}" && status = "completado"`
	}).catch(() => []);

	const monthTotal = monthVouchers.reduce((sum: number, v: { total?: number }) => sum + (v.total ?? 0), 0);

	return {
		stats: {
			availableProducts: products.totalItems,
			totalVouchers: vouchers.totalItems,
			totalClients: clients.totalItems,
			totalInvoices: invoices.totalItems,
			monthTotal,
			pendingDeleteRequests: pendingRequests.totalItems
		},
		recentVouchers: recentVouchers.items,
		recentProducts: availableProducts.items
	};
};
