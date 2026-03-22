import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

const PERM_FIELDS = [
	{ key: 'can_create_products', label: 'Crear productos' },
	{ key: 'can_edit_products', label: 'Editar productos' },
	{ key: 'can_create_vouchers', label: 'Crear ventas' },
	{ key: 'can_edit_vouchers', label: 'Editar ventas' },
	{ key: 'can_create_clients', label: 'Crear clientes' },
	{ key: 'can_edit_clients', label: 'Editar clientes' },
	{ key: 'can_create_invoices', label: 'Crear facturas' },
	{ key: 'can_edit_invoices', label: 'Editar facturas' },
	{ key: 'can_create_categories', label: 'Crear categorías' },
	{ key: 'can_manage_inventory', label: 'Gestionar inventario' }
] as const;

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user?.role !== 'admin') throw redirect(303, '/dashboard');

	const pb = locals.pb;

	// Get all worker users
	const workers = await pb.collection('users').getFullList({
		filter: 'role = "worker"',
		sort: 'name'
	});

	// Get their existing permissions
	const permissions = await pb.collection('user_permissions').getFullList({
		expand: 'user'
	}).catch(() => []);

	const permMap: Record<string, Record<string, boolean>> = {};
	for (const perm of permissions as Record<string, unknown>[]) {
		const userId = perm.user as string;
		if (!userId) continue;
		const permRecord: Record<string, boolean> = {};
		for (const f of PERM_FIELDS) {
			permRecord[f.key] = Boolean(perm[f.key]);
		}
		permMap[userId] = permRecord;
	}

	return { workers, permMap, permFields: PERM_FIELDS };
};

export const actions: Actions = {
	save: async ({ request, locals }) => {
		if (locals.user?.role !== 'admin') return fail(403, { error: 'Sin permisos' });

		const pb = locals.pb;
		const data = await request.formData();
		const userId = data.get('user_id')?.toString();
		if (!userId) return fail(400, { error: 'Usuario requerido' });

		const permData: Record<string, boolean> = {};
		for (const f of PERM_FIELDS) {
			permData[f.key] = data.get(f.key) === 'on';
		}

		try {
			// Check if permissions record already exists
			const existing = await pb.collection('user_permissions').getFullList({
				filter: `user = "${userId}"`
			}).catch(() => []) as Record<string, unknown>[];

			if (existing.length > 0) {
				await pb.collection('user_permissions').update(existing[0].id as string, {
					user: userId,
					...permData
				});
			} else {
				await pb.collection('user_permissions').create({
					user: userId,
					...permData
				});
			}

			await pb.collection('audit_logs').create({
				user: locals.user?.id,
				action: 'update',
				collection: 'user_permissions',
				record_id: userId,
				description: `Permisos actualizados para usuario: ${userId}`,
				old_data: '',
				new_data: JSON.stringify(permData)
			}).catch(() => {});

			return { success: true };
		} catch (err: unknown) {
			const e = err as { message?: string };
			return fail(400, { error: e.message ?? 'Error al guardar permisos' });
		}
	}
};
