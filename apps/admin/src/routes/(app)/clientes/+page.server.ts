import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { addCreatedYearFilter, getCollectionYears } from '$lib/year-filter';

export const load: PageServerLoad = async ({ locals, url }) => {
	const page = parseInt(url.searchParams.get('page') ?? '1');
	const search = url.searchParams.get('q') ?? '';
	const frequent = url.searchParams.get('frequent') ?? '';
	const year = url.searchParams.get('year') ?? '';

	const filters: string[] = [];
	if (search) filters.push(`(name ~ "${search}" || email ~ "${search}" || phone ~ "${search}")`);
	if (frequent === 'yes') filters.push('is_frequent = true');
	addCreatedYearFilter(filters, year);

	const clients = await locals.pb.collection('clients').getList(page, 20, {
		filter: filters.join(' && '),
		sort: 'name'
	});
	const years = await getCollectionYears(locals.pb, 'clients');

	return {
		clients: clients.items,
		totalItems: clients.totalItems,
		totalPages: clients.totalPages,
		currentPage: page,
		years,
		filters: { search, frequent, year }
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (locals.user?.role === 'worker') {
			const perms = await locals.pb.collection('user_permissions')
				.getFirstListItem(`user = "${locals.user.id}"`)
				.catch(() => null);
			if (perms !== null && perms.can_create_clients === false) return fail(403, { error: 'No tienes permiso para crear clientes' });
		}

		const data = await request.formData();
		try {
			const record = await locals.pb.collection('clients').create({
				name: data.get('name'),
				email: data.get('email') || null,
				phone: data.get('phone') || null,
				address: data.get('address') || null,
				notes: data.get('notes') || null,
				is_frequent: data.get('is_frequent') === 'on'
			});
			await locals.pb.collection('audit_logs').create({
				user: locals.user?.id, action: 'create', collection: 'clients',
				record_id: record.id,
				description: `Cliente creado: ${record.name}`,
				old_data: '', new_data: JSON.stringify({ name: record.name })
			}).catch(() => {});
			return { success: true };
		} catch (err: unknown) {
			const e = err as { message?: string };
			return fail(400, { error: e.message ?? 'Error al crear cliente' });
		}
	},

	update: async ({ request, locals }) => {
		if (locals.user?.role === 'worker') {
			const perms = await locals.pb.collection('user_permissions')
				.getFirstListItem(`user = "${locals.user.id}"`)
				.catch(() => null);
			if (perms !== null && perms.can_edit_clients === false) return fail(403, { error: 'No tienes permiso para editar clientes' });
		}

		const data = await request.formData();
		const id = data.get('id')?.toString();
		if (!id) return fail(400, { error: 'ID requerido' });
		try {
			const old = await locals.pb.collection('clients').getOne(id);
			const record = await locals.pb.collection('clients').update(id, {
				name: data.get('name'),
				email: data.get('email') || null,
				phone: data.get('phone') || null,
				address: data.get('address') || null,
				notes: data.get('notes') || null,
				is_frequent: data.get('is_frequent') === 'on'
			});
			await locals.pb.collection('audit_logs').create({
				user: locals.user?.id, action: 'update', collection: 'clients',
				record_id: id,
				description: `Cliente actualizado: ${record.name}`,
				old_data: JSON.stringify({ name: old.name, phone: old.phone }),
				new_data: JSON.stringify({ name: record.name, phone: record.phone })
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
				collection_name: 'clients',
				record_id: id,
				record_label: label,
				status: 'pending',
				notes
			});

			await locals.pb.collection('audit_logs').create({
				user: locals.user.id,
				action: 'delete',
				collection: 'clients',
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
			const client = await locals.pb.collection('clients').getOne(id);
			await locals.pb.collection('clients').delete(id);
			await locals.pb.collection('audit_logs').create({
				user: locals.user?.id, action: 'delete', collection: 'clients',
				record_id: id,
				description: `Cliente eliminado: ${client.name}`,
				old_data: JSON.stringify({ name: client.name }), new_data: ''
			}).catch(() => {});
			return { success: true };
		} catch (err: unknown) {
			const e = err as { message?: string };
			return fail(400, { error: e.message ?? 'Error al eliminar' });
		}
	}
};
