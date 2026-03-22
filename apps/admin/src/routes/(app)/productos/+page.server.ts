import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { addCreatedYearFilter, getCollectionYears } from '$lib/year-filter';

export const load: PageServerLoad = async ({ locals, url }) => {
	const pb = locals.pb;
	const page = parseInt(url.searchParams.get('page') ?? '1');
	const search = url.searchParams.get('q') ?? '';
	const status = url.searchParams.get('status') ?? '';
	const category = url.searchParams.get('category') ?? '';
	const year = url.searchParams.get('year') ?? '';
	const perPage = 20;

	const filters: string[] = [];
	if (search) filters.push(`(name ~ "${search}" || sku ~ "${search}" || barcode ~ "${search}")`);
	if (status) filters.push(`status = "${status}"`);
	if (category) filters.push(`category = "${category}"`);
	addCreatedYearFilter(filters, year);

	const filter = filters.join(' && ');

	const [products, categories] = await Promise.all([
		pb.collection('products').getList(page, perPage, {
			filter,
			sort: '-created',
			expand: 'category'
		}),
		pb.collection('categories').getFullList({ sort: 'name' })
	]);
	const years = await getCollectionYears(pb, 'products');

	return {
		products: products.items,
		totalItems: products.totalItems,
		totalPages: products.totalPages,
		currentPage: page,
		categories,
		years,
		filters: { search, status, category, year }
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (locals.user?.role === 'worker') {
			const perms = await locals.pb.collection('user_permissions')
				.getFirstListItem(`user = "${locals.user.id}"`)
				.catch(() => null);
			if (perms !== null && perms.can_create_products === false) return fail(403, { error: 'No tienes permiso para crear productos' });
		}

		const pb = locals.pb;
		const data = await request.formData();

		try {
			const record = await pb.collection('products').create(data);

			await pb.collection('audit_logs').create({
				user: locals.user?.id,
				action: 'create',
				collection: 'products',
				record_id: record.id,
				description: `Producto creado: ${record.name}`,
				old_data: '',
				new_data: JSON.stringify({ name: record.name, sku: record.sku })
			}).catch(() => {});

			return { success: true };
		} catch (err: unknown) {
			const e = err as { message?: string };
			return fail(400, { error: e.message ?? 'Error al crear producto' });
		}
	},

	update: async ({ request, locals }) => {
		if (locals.user?.role === 'worker') {
			const perms = await locals.pb.collection('user_permissions')
				.getFirstListItem(`user = "${locals.user.id}"`)
				.catch(() => null);
			if (perms !== null && perms.can_edit_products === false) return fail(403, { error: 'No tienes permiso para editar productos' });
		}

		const pb = locals.pb;
		const data = await request.formData();
		const id = data.get('id')?.toString();
		if (!id) return fail(400, { error: 'ID requerido' });

		try {
			const old = await pb.collection('products').getOne(id);
			data.delete('id');
			const record = await pb.collection('products').update(id, data);

			await pb.collection('audit_logs').create({
				user: locals.user?.id,
				action: 'update',
				collection: 'products',
				record_id: id,
				description: `Producto actualizado: ${record.name}`,
				old_data: JSON.stringify({ name: old.name, status: old.status, price: old.price }),
				new_data: JSON.stringify({ name: record.name, status: record.status, price: record.price })
			}).catch(() => {});

			return { success: true };
		} catch (err: unknown) {
			const e = err as { message?: string };
			return fail(400, { error: e.message ?? 'Error al actualizar producto' });
		}
	},

	requestDelete: async ({ request, locals }) => {
		if (locals.user?.role !== 'worker') return fail(403, { error: 'Solo los trabajadores usan este flujo' });

		const pb = locals.pb;
		const data = await request.formData();
		const id = data.get('id')?.toString();
		const label = data.get('label')?.toString() ?? id ?? '';
		const notes = data.get('notes')?.toString() ?? '';
		if (!id) return fail(400, { error: 'ID requerido' });

		try {
			await pb.collection('delete_requests').create({
				requested_by: locals.user.id,
				collection_name: 'products',
				record_id: id,
				record_label: label,
				status: 'pending',
				notes
			});

			await pb.collection('audit_logs').create({
				user: locals.user.id,
				action: 'delete',
				collection: 'products',
				record_id: id,
				description: `Solicitud de eliminación enviada: ${label}`,
				old_data: '',
				new_data: ''
			}).catch(() => {});

			return { success: true, requested: true };
		} catch (err: unknown) {
			const e = err as { message?: string };
			return fail(400, { error: e.message ?? 'Error al enviar solicitud' });
		}
	},

	delete: async ({ request, locals }) => {
		// Only admin can delete
		if (locals.user?.role !== 'admin') {
			return fail(403, { error: 'No tienes permisos para eliminar productos' });
		}

		const pb = locals.pb;
		const data = await request.formData();
		const id = data.get('id')?.toString();
		if (!id) return fail(400, { error: 'ID requerido' });

		try {
			const product = await pb.collection('products').getOne(id);
			await pb.collection('products').delete(id);

			await pb.collection('audit_logs').create({
				user: locals.user?.id,
				action: 'delete',
				collection: 'products',
				record_id: id,
				description: `Producto eliminado: ${product.name} (SKU: ${product.sku})`,
				old_data: JSON.stringify({ name: product.name, sku: product.sku }),
				new_data: ''
			}).catch(() => {});

			return { success: true };
		} catch (err: unknown) {
			const e = err as { message?: string };
			return fail(400, { error: e.message ?? 'Error al eliminar producto' });
		}
	}
};
