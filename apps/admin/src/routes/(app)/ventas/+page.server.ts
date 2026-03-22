import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { addCreatedYearFilter, getCollectionYears } from '$lib/year-filter';

export const load: PageServerLoad = async ({ locals, url }) => {
	const page = parseInt(url.searchParams.get('page') ?? '1');
	const search = url.searchParams.get('q') ?? '';
	const status = url.searchParams.get('status') ?? '';
	const dateFrom = url.searchParams.get('from') ?? '';
	const dateTo = url.searchParams.get('to') ?? '';
	const clientId = url.searchParams.get('client') ?? '';
	const year = url.searchParams.get('year') ?? '';

	const filters: string[] = [];
	if (search) filters.push(`(number ~ "${search}")`);
	if (status) filters.push(`status = "${status}"`);
	if (dateFrom) filters.push(`date >= "${dateFrom}"`);
	if (dateTo) filters.push(`date <= "${dateTo}"`);
	if (clientId) filters.push(`client = "${clientId}"`);
	addCreatedYearFilter(filters, year);

	const [vouchers, clients, products] = await Promise.all([
		locals.pb.collection('vouchers').getList(page, 20, {
			filter: filters.join(' && '),
			sort: '-date',
			expand: 'client'
		}),
		locals.pb.collection('clients').getFullList({ sort: 'name' }),
		locals.pb.collection('products').getFullList({
			filter: 'status = "disponible"',
			sort: 'name',
			expand: 'category'
		})
	]);
	const years = await getCollectionYears(locals.pb, 'vouchers');

	return {
		vouchers: vouchers.items,
		totalItems: vouchers.totalItems,
		totalPages: vouchers.totalPages,
		currentPage: page,
		clients,
		products,
		years,
		filters: { search, status, dateFrom, dateTo, clientId, year }
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (locals.user?.role === 'worker') {
			const perms = await locals.pb.collection('user_permissions')
				.getFirstListItem(`user = "${locals.user.id}"`)
				.catch(() => null);
			if (perms !== null && perms.can_create_vouchers === false) return fail(403, { error: 'No tienes permiso para crear ventas' });
		}

		const data = await request.formData();
		const itemsRaw = data.get('items')?.toString();
		data.delete('items');

		// Validar que haya al menos un ítem en el carrito
		let items: { product: string; quantity: number; unit_price: number }[] = [];
		if (itemsRaw) {
			try { items = JSON.parse(itemsRaw); } catch { /* ignorar */ }
		}
		if (items.length === 0) {
			return fail(400, { error: 'Debe agregar al menos un producto a la venta' });
		}

		// Validar unicidad del número de comprobante
		const number = data.get('number')?.toString().trim();
		if (!number) return fail(400, { error: 'El número de comprobante es obligatorio' });
		const existing = await locals.pb.collection('vouchers')
			.getFirstListItem(`number = "${number}"`)
			.catch(() => null);
		if (existing) return fail(400, { error: `El número de comprobante #${number} ya existe` });

		try {
			const voucher = await locals.pb.collection('vouchers').create(data);

			// Create voucher items and update product status
			for (const item of items) {
					const subtotal = item.quantity * item.unit_price;
					await locals.pb.collection('voucher_items').create({
						voucher: voucher.id,
						product: item.product,
						quantity: item.quantity,
						unit_price: item.unit_price,
						subtotal
					});
					// Mark product as sold
				await locals.pb.collection('products').update(item.product, { status: 'vendido' }).catch(() => {});
			}

			await locals.pb.collection('audit_logs').create({
				user: locals.user?.id, action: 'create', collection: 'vouchers',
				record_id: voucher.id,
				description: `Venta registrada: #${voucher.number}`,
				old_data: '', new_data: JSON.stringify({ number: voucher.number, total: voucher.total })
			}).catch(() => {});

			return { success: true };
		} catch (err: unknown) {
			const e = err as { message?: string };
			return fail(400, { error: e.message ?? 'Error al registrar venta' });
		}
	},

	update: async ({ request, locals }) => {
		if (locals.user?.role === 'worker') {
			const perms = await locals.pb.collection('user_permissions')
				.getFirstListItem(`user = "${locals.user.id}"`)
				.catch(() => null);
			if (perms !== null && perms.can_edit_vouchers === false) return fail(403, { error: 'No tienes permiso para editar ventas' });
		}

		const data = await request.formData();
		const id = data.get('id')?.toString();
		if (!id) return fail(400, { error: 'ID requerido' });
		data.delete('id');

		try {
			const old = await locals.pb.collection('vouchers').getOne(id);
			const record = await locals.pb.collection('vouchers').update(id, data);
			await locals.pb.collection('audit_logs').create({
				user: locals.user?.id, action: 'update', collection: 'vouchers',
				record_id: id,
				description: `Venta actualizada: #${record.number}`,
				old_data: JSON.stringify({ status: old.status, total: old.total }),
				new_data: JSON.stringify({ status: record.status, total: record.total })
			}).catch(() => {});
			return { success: true };
		} catch (err: unknown) {
			const e = err as { message?: string };
			return fail(400, { error: e.message ?? 'Error al actualizar' });
		}
	},

	requestDelete: async ({ request, locals }) => {
		if (locals.user?.role !== 'worker') return fail(403, { error: 'Solo los trabajadores usan este flujo' });

		const data = await request.formData();
		const id = data.get('id')?.toString();
		const label = data.get('label')?.toString() ?? id ?? '';
		const notes = data.get('notes')?.toString() ?? '';
		if (!id) return fail(400, { error: 'ID requerido' });

		try {
			await locals.pb.collection('delete_requests').create({
				requested_by: locals.user.id,
				collection_name: 'vouchers',
				record_id: id,
				record_label: label,
				status: 'pending',
				notes
			});

			await locals.pb.collection('audit_logs').create({
				user: locals.user.id,
				action: 'delete',
				collection: 'vouchers',
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
		if (locals.user?.role !== 'admin') return fail(403, { error: 'Sin permisos' });
		const data = await request.formData();
		const id = data.get('id')?.toString();
		if (!id) return fail(400, { error: 'ID requerido' });

		try {
			const voucher = await locals.pb.collection('vouchers').getOne(id);

			// Revertir productos a "disponible" antes de eliminar el comprobante
			const voucherItems = await locals.pb.collection('voucher_items').getFullList({
				filter: `voucher = "${id}"`,
				fields: 'product'
			}).catch(() => []);

			for (const item of voucherItems) {
				await locals.pb.collection('products').update(
					item.product as string,
					{ status: 'disponible' }
				).catch(() => {});
			}

			await locals.pb.collection('vouchers').delete(id);

			await locals.pb.collection('audit_logs').create({
				user: locals.user?.id, action: 'delete', collection: 'vouchers',
				record_id: id,
				description: `Venta eliminada: #${voucher.number} (${voucherItems.length} producto(s) revertido(s) a disponible)`,
				old_data: JSON.stringify({ number: voucher.number }), new_data: ''
			}).catch(() => {});

			return { success: true };
		} catch (err: unknown) {
			const e = err as { message?: string };
			return fail(400, { error: e.message ?? 'Error al eliminar' });
		}
	}
};
