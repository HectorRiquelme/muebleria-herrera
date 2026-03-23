import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { addCreatedYearFilter, getCollectionYears } from '$lib/year-filter';

export const load: PageServerLoad = async ({ locals, url }) => {
	const page = parseInt(url.searchParams.get('page') ?? '1');
	const search = url.searchParams.get('q') ?? '';
	const inventoried = url.searchParams.get('inventoried') ?? '';
	const year = url.searchParams.get('year') ?? '';

	const filters: string[] = [];
	if (search) filters.push(`(name ~ "${search}" || sku ~ "${search}")`);
	if (inventoried === 'yes') filters.push('inventoried = true');
	if (inventoried === 'no') filters.push('inventoried = false');
	addCreatedYearFilter(filters, year);

	const products = await locals.pb.collection('products').getList(page, 20, {
		filter: filters.join(' && '),
		sort: '-updated',
		expand: 'category'
	});
	const years = await getCollectionYears(locals.pb, 'products');

	return {
		products: products.items,
		totalItems: products.totalItems,
		totalPages: products.totalPages,
		currentPage: page,
		years,
		filters: { search, inventoried, year }
	};
};

export const actions: Actions = {
	markInventory: async ({ request, locals }) => {
		if (locals.user?.role === 'worker') {
			const perms = await locals.pb.collection('user_permissions')
				.getFirstListItem(`user = "${locals.user.id}"`)
				.catch(() => null);
			if (perms !== null && perms.can_manage_inventory === false) return fail(403, { error: 'No tienes permiso para gestionar el inventario' });
		}

		const data = await request.formData();
		const ids = data.getAll('ids[]').map((id) => id.toString());
		if (!ids.length) return fail(400, { error: 'Seleccioná al menos un producto' });

		const now = new Date().toISOString();
		const errors: string[] = [];

		for (const id of ids) {
			try {
				const old = await locals.pb.collection('products').getOne(id);
				await locals.pb.collection('products').update(id, {
					inventoried: true,
					inventoried_at: now,
					inventoried_by: locals.user?.id
				});
				await locals.pb.collection('audit_logs').create({
					user: locals.user?.id, action: 'inventory_check', collection: 'products',
					record_id: id,
					description: `Producto marcado como inventariado: ${old.name}`,
					old_data: JSON.stringify({ inventoried: false }),
					new_data: JSON.stringify({ inventoried: true, inventoried_at: now })
				}).catch(() => {});
			} catch {
				errors.push(id);
			}
		}

		if (errors.length) return fail(400, { error: `No se pudo inventariar ${errors.length} producto(s)` });
		return { success: true, count: ids.length };
	},

	unmarkInventory: async ({ request, locals }) => {
		if (locals.user?.role === 'worker') {
			const perms = await locals.pb.collection('user_permissions')
				.getFirstListItem(`user = "${locals.user.id}"`)
				.catch(() => null);
			if (perms !== null && perms.can_manage_inventory === false) return fail(403, { error: 'No tienes permiso para gestionar el inventario' });
		}
		const data = await request.formData();
		const id = data.get('id')?.toString();
		if (!id) return fail(400, { error: 'ID requerido' });

		try {
			const product = await locals.pb.collection('products').getOne(id);
			await locals.pb.collection('products').update(id, {
				inventoried: false,
				inventoried_at: null,
				inventoried_by: null
			});
			await locals.pb.collection('audit_logs').create({
				user: locals.user?.id, action: 'update', collection: 'products',
				record_id: id,
				description: `Inventario desmarcado: ${product.name}`,
				old_data: JSON.stringify({ inventoried: true }),
				new_data: JSON.stringify({ inventoried: false })
			}).catch(() => {});
			return { success: true };
		} catch (err: unknown) {
			const e = err as { message?: string };
			return fail(400, { error: e.message ?? 'Error' });
		}
	}
};
