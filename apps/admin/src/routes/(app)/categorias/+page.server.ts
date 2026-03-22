import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const categories = await locals.pb.collection('categories').getFullList({ sort: 'name' });
	return { categories };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (locals.user?.role === 'worker') {
			const perms = await locals.pb.collection('user_permissions')
				.getFirstListItem(`user = "${locals.user.id}"`)
				.catch(() => null);
			if (perms !== null && perms.can_create_categories === false) return fail(403, { error: 'No tienes permiso para crear categorías' });
		}

		const data = await request.formData();
		const name = data.get('name')?.toString().trim();
		const description = data.get('description')?.toString().trim();
		if (!name) return fail(400, { error: 'El nombre es requerido' });

		try {
			const record = await locals.pb.collection('categories').create({ name, description });
			await locals.pb.collection('audit_logs').create({
				user: locals.user?.id, action: 'create', collection: 'categories',
				record_id: record.id, description: `Categoría creada: ${name}`,
				old_data: '', new_data: JSON.stringify({ name })
			}).catch(() => {});
			return { success: true };
		} catch (err: unknown) {
			const e = err as { message?: string };
			return fail(400, { error: e.message ?? 'Error al crear categoría' });
		}
	},

	update: async ({ request, locals }) => {
		if (locals.user?.role === 'worker') {
			const perms = await locals.pb.collection('user_permissions')
				.getFirstListItem(`user = "${locals.user.id}"`)
				.catch(() => null);
			if (perms !== null && perms.can_edit_categories === false) return fail(403, { error: 'No tienes permiso para editar categorías' });
		}

		const data = await request.formData();
		const id = data.get('id')?.toString();
		const name = data.get('name')?.toString().trim();
		const description = data.get('description')?.toString().trim();
		if (!id || !name) return fail(400, { error: 'Datos incompletos' });

		try {
			const old = await locals.pb.collection('categories').getOne(id);
			await locals.pb.collection('categories').update(id, { name, description });
			await locals.pb.collection('audit_logs').create({
				user: locals.user?.id, action: 'update', collection: 'categories',
				record_id: id, description: `Categoría actualizada: ${name}`,
				old_data: JSON.stringify({ name: old.name }), new_data: JSON.stringify({ name })
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
				collection_name: 'categories',
				record_id: id,
				record_label: label,
				status: 'pending',
				notes
			});

			await locals.pb.collection('audit_logs').create({
				user: locals.user.id,
				action: 'delete',
				collection: 'categories',
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
			const cat = await locals.pb.collection('categories').getOne(id);
			await locals.pb.collection('categories').delete(id);
			await locals.pb.collection('audit_logs').create({
				user: locals.user?.id, action: 'delete', collection: 'categories',
				record_id: id, description: `Categoría eliminada: ${cat.name}`,
				old_data: JSON.stringify({ name: cat.name }), new_data: ''
			}).catch(() => {});
			return { success: true };
		} catch (err: unknown) {
			const e = err as { message?: string };
			return fail(400, { error: e.message ?? 'Error al eliminar' });
		}
	}
};
