import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals, url }) => {
	const pb = locals.pb;

	// Date range – default: last 3 months
	const now = new Date();
	const defaultTo = now.toISOString().split('T')[0];
	const defaultFrom = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().split('T')[0];

	const dateFrom = url.searchParams.get('from') ?? defaultFrom;
	const dateTo = url.searchParams.get('to') ?? defaultTo;
	const selectedCategory = url.searchParams.get('category') ?? '';

	// Fetch all data needed
	const [vouchers, categories, voucherItems] = await Promise.all([
		pb.collection('vouchers').getFullList({
			filter: `date >= "${dateFrom}" && date <= "${dateTo} 23:59:59" && status = "completado"`,
			sort: 'date'
		}),
		pb.collection('categories').getFullList({ sort: 'name' }),
		pb.collection('voucher_items').getFullList({
			expand: 'product,product.category,voucher',
			filter: `voucher.date >= "${dateFrom}" && voucher.date <= "${dateTo} 23:59:59" && voucher.status = "completado"`
		}).catch(() => [])
	]);

	// --- Monthly sales by category ---
	// Build: { "YYYY-MM": { categoryId: total } }
	const monthLabels: string[] = [];
	const categoryTotals: Record<string, Record<string, number>> = {};

	// Generate month keys for range
	const fromDate = new Date(dateFrom);
	const toDate = new Date(dateTo);
	let cursor = new Date(fromDate.getFullYear(), fromDate.getMonth(), 1);
	while (cursor <= toDate) {
		const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`;
		monthLabels.push(key);
		categoryTotals[key] = {};
		cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
	}

	// Aggregate items into months/categories
	for (const item of voucherItems as Record<string, unknown>[]) {
		const product = (item.expand as Record<string, unknown>)?.product as Record<string, unknown> | undefined;
		const voucher = (item.expand as Record<string, unknown>)?.voucher as Record<string, unknown> | undefined;
		if (!product || !voucher) continue;

		const date = (voucher.date as string)?.split(' ')[0] ?? '';
		const monthKey = date.slice(0, 7);
		if (!categoryTotals[monthKey]) continue;

		const catId = (product.category as string) ?? 'sin-categoria';
		const subtotal = (item.subtotal as number) ?? 0;

		categoryTotals[monthKey][catId] = (categoryTotals[monthKey][catId] ?? 0) + subtotal;
	}

	// --- Top products for selected category ---
	const productTotals: Record<string, { name: string; total: number; quantity: number; category: string }> = {};

	for (const item of voucherItems as Record<string, unknown>[]) {
		const product = (item.expand as Record<string, unknown>)?.product as Record<string, unknown> | undefined;
		if (!product) continue;

		const catId = (product.category as string) ?? 'sin-categoria';
		if (selectedCategory && catId !== selectedCategory) continue;

		const productId = product.id as string;
		const subtotal = (item.subtotal as number) ?? 0;
		const qty = (item.quantity as number) ?? 0;
		const catName = ((product.expand as Record<string, unknown>)?.category as Record<string, unknown>)?.name as string ?? 'Sin categoría';

		if (!productTotals[productId]) {
			productTotals[productId] = { name: product.name as string, total: 0, quantity: 0, category: catName };
		}
		productTotals[productId].total += subtotal;
		productTotals[productId].quantity += qty;
	}

	const topProducts = Object.entries(productTotals)
		.map(([id, data]) => ({ id, ...data }))
		.sort((a, b) => b.total - a.total)
		.slice(0, 10);

	// --- Year-over-year monthly totals ---
	const yearlyData: Record<string, Record<string, number>> = {};
	for (const voucher of vouchers as Record<string, unknown>[]) {
		const date = (voucher.date as string)?.split(' ')[0] ?? '';
		const year = date.slice(0, 4);
		const month = date.slice(5, 7);
		if (!yearlyData[year]) yearlyData[year] = {};
		yearlyData[year][month] = (yearlyData[year][month] ?? 0) + ((voucher.total as number) ?? 0);
	}

	// Also fetch all years for comparison (full year data)
	const allVouchers = await pb.collection('vouchers').getFullList({
		filter: 'status = "completado"',
		fields: 'date,total'
	}).catch(() => []);

	const allYearlyData: Record<string, Record<string, number>> = {};
	for (const v of allVouchers as Record<string, unknown>[]) {
		const date = (v.date as string)?.split(' ')[0] ?? '';
		const year = date.slice(0, 4);
		const month = date.slice(5, 7);
		if (!year || !month) continue;
		if (!allYearlyData[year]) allYearlyData[year] = {};
		allYearlyData[year][month] = (allYearlyData[year][month] ?? 0) + ((v.total as number) ?? 0);
	}

	return {
		dateFrom,
		dateTo,
		selectedCategory,
		categories,
		monthLabels,
		categoryTotals,
		topProducts,
		allYearlyData,
		totalVouchers: vouchers.length
	};
};
