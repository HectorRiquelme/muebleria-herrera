import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { addCreatedYearFilter, getCollectionYears } from '$lib/year-filter';

export const load: PageServerLoad = async ({ locals, url }) => {
	const page = parseInt(url.searchParams.get('page') ?? '1');
	const search = url.searchParams.get('q') ?? '';
	const year = url.searchParams.get('year') ?? '';

	const filters: string[] = [];
	if (search) filters.push(`(number ~ "${search}" || supplier ~ "${search}")`);
	addCreatedYearFilter(filters, year);

	const invoices = await locals.pb.collection('invoices').getList(page, 20, {
		filter: filters.join(' && '),
		sort: '-date'
	});
	const years = await getCollectionYears(locals.pb, 'invoices');

	return {
		invoices: invoices.items,
		totalItems: invoices.totalItems,
		totalPages: invoices.totalPages,
		currentPage: page,
		years,
		filters: { search, year }
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (locals.user?.role === 'worker') {
			const perms = await locals.pb.collection('user_permissions')
				.getFirstListItem(`user = "${locals.user.id}"`)
				.catch(() => null);
			if (perms !== null && perms.can_create_invoices === false) return fail(403, { error: 'No tienes permiso para crear facturas' });
		}

		const data = await request.formData();
		try {
			const record = await locals.pb.collection('invoices').create(data);
			await locals.pb.collection('audit_logs').create({
				user: locals.user?.id, action: 'create', collection: 'invoices',
				record_id: record.id, description: `Factura creada: #${record.number} — ${record.supplier}`,
				old_data: '', new_data: JSON.stringify({ number: record.number, supplier: record.supplier })
			}).catch(() => {});
			return { success: true };
		} catch (err: unknown) {
			const e = err as { message?: string };
			return fail(400, { error: e.message ?? 'Error al crear factura' });
		}
	},

	update: async ({ request, locals }) => {
		if (locals.user?.role === 'worker') {
			const perms = await locals.pb.collection('user_permissions')
				.getFirstListItem(`user = "${locals.user.id}"`)
				.catch(() => null);
			if (perms !== null && perms.can_edit_invoices === false) return fail(403, { error: 'No tienes permiso para editar facturas' });
		}

		const data = await request.formData();
		const id = data.get('id')?.toString();
		if (!id) return fail(400, { error: 'ID requerido' });
		data.delete('id');
		try {
			const old = await locals.pb.collection('invoices').getOne(id);
			const record = await locals.pb.collection('invoices').update(id, data);
			await locals.pb.collection('audit_logs').create({
				user: locals.user?.id, action: 'update', collection: 'invoices',
				record_id: id, description: `Factura actualizada: #${record.number}`,
				old_data: JSON.stringify({ number: old.number, total: old.total }),
				new_data: JSON.stringify({ number: record.number, total: record.total })
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
				collection_name: 'invoices',
				record_id: id,
				record_label: label,
				status: 'pending',
				notes
			});

			await locals.pb.collection('audit_logs').create({
				user: locals.user.id,
				action: 'delete',
				collection: 'invoices',
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
			const inv = await locals.pb.collection('invoices').getOne(id);
			await locals.pb.collection('invoices').delete(id);
			await locals.pb.collection('audit_logs').create({
				user: locals.user?.id, action: 'delete', collection: 'invoices',
				record_id: id, description: `Factura eliminada: #${inv.number}`,
				old_data: JSON.stringify({ number: inv.number }), new_data: ''
			}).catch(() => {});
			return { success: true };
		} catch (err: unknown) {
			const e = err as { message?: string };
			return fail(400, { error: e.message ?? 'Error al eliminar' });
		}
	}
};
