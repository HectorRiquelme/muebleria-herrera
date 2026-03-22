import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user?.role !== 'admin') throw redirect(303, '/dashboard');

	const users = await locals.pb.collection('users').getFullList({ sort: 'name' });
	return { users };
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (locals.user?.role !== 'admin') return fail(403, { error: 'Sin permisos' });
		const data = await request.formData();
		const password = data.get('password')?.toString();
		if (!password || password.length < 8) return fail(400, { error: 'La contraseña debe tener al menos 8 caracteres' });

		try {
			const record = await locals.pb.collection('users').create({
				email: data.get('email'),
				password,
				passwordConfirm: password,
				name: data.get('name'),
				role: data.get('role') ?? 'worker',
				emailVisibility: true
			});
			await locals.pb.collection('audit_logs').create({
				user: locals.user?.id, action: 'create', collection: 'users',
				record_id: record.id,
				description: `Usuario creado: ${record.name} (${record.email}) — rol: ${record.role}`,
				old_data: '', new_data: JSON.stringify({ email: record.email, role: record.role })
			}).catch(() => {});
			return { success: true };
		} catch (err: unknown) {
			const e = err as { message?: string };
			return fail(400, { error: e.message ?? 'Error al crear usuario' });
		}
	},

	update: async ({ request, locals }) => {
		if (locals.user?.role !== 'admin') return fail(403, { error: 'Sin permisos' });
		const data = await request.formData();
		const id = data.get('id')?.toString();
		if (!id) return fail(400, { error: 'ID requerido' });

		try {
			const old = await locals.pb.collection('users').getOne(id);
			const updateData: Record<string, unknown> = {
				name: data.get('name'),
				role: data.get('role')
			};
			const newPassword = data.get('new_password')?.toString();
			if (newPassword && newPassword.length >= 8) {
				updateData.password = newPassword;
				updateData.passwordConfirm = newPassword;
			}
			const record = await locals.pb.collection('users').update(id, updateData);
			await locals.pb.collection('audit_logs').create({
				user: locals.user?.id, action: 'update', collection: 'users',
				record_id: id,
				description: `Usuario actualizado: ${record.name}`,
				old_data: JSON.stringify({ name: old.name, role: old.role }),
				new_data: JSON.stringify({ name: record.name, role: record.role })
			}).catch(() => {});
			return { success: true };
		} catch (err: unknown) {
			const e = err as { message?: string };
			return fail(400, { error: e.message ?? 'Error al actualizar' });
		}
	},

	delete: async ({ request, locals }) => {
		if (locals.user?.role !== 'admin') return fail(403, { error: 'Sin permisos' });
		const data = await request.formData();
		const id = data.get('id')?.toString();
		if (!id) return fail(400, { error: 'ID requerido' });
		if (id === locals.user?.id) return fail(400, { error: 'No podés eliminar tu propio usuario' });

		try {
			const user = await locals.pb.collection('users').getOne(id);
			await locals.pb.collection('users').delete(id);
			await locals.pb.collection('audit_logs').create({
				user: locals.user?.id, action: 'delete', collection: 'users',
				record_id: id,
				description: `Usuario eliminado: ${user.email}`,
				old_data: JSON.stringify({ email: user.email }), new_data: ''
			}).catch(() => {});
			return { success: true };
		} catch (err: unknown) {
			const e = err as { message?: string };
			return fail(400, { error: e.message ?? 'Error al eliminar' });
		}
	}
};
