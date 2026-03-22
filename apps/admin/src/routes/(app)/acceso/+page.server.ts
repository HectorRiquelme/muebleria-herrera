import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { WORKER_MODULES } from '$lib/worker-modules';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user?.role !== 'admin') throw redirect(303, '/dashboard');

	const pb = locals.pb;

	// Disable auto-cancellation to avoid conflicts with layout queries
	pb.autoCancellation(false);
	const workers = await pb.collection('users').getFullList({ filter: 'role = "worker"', sort: 'name' });
	const accessRecords = await pb.collection('module_access').getFullList({ expand: 'user' }).catch(() => []);
	pb.autoCancellation(true);

	// Build access map: { userId: { '/module': true/false } }
	const accessMap: Record<string, Record<string, boolean>> = {};
	for (const record of accessRecords as Record<string, unknown>[]) {
		const userId = record.user as string;
		const mod = record.module as string;
		const enabled = record.enabled as boolean;
		if (!accessMap[userId]) accessMap[userId] = {};
		accessMap[userId][mod] = enabled;
	}

	// Default: if no record exists, worker has access (opt-out model)
	return {
		workers,
		accessMap,
		workerModules: WORKER_MODULES
	};
};

export const actions: Actions = {
	save: async ({ request, locals }) => {
		if (locals.user?.role !== 'admin') return fail(403, { error: 'Sin permisos' });

		const pb = locals.pb;
		const data = await request.formData();
		const userId = data.get('user_id')?.toString();
		if (!userId) return fail(400, { error: 'Usuario requerido' });

		// Get submitted enabled modules
		const enabledModules = new Set(data.getAll('modules').map(String));

		// Get existing records for this user
		const existing = await pb.collection('module_access').getFullList({
			filter: `user = "${userId}"`
		}).catch(() => []) as Record<string, unknown>[];

		const existingByModule: Record<string, string> = {};
		for (const rec of existing) {
			existingByModule[rec.module as string] = rec.id as string;
		}

		// Upsert each module
		for (const mod of WORKER_MODULES) {
			const isEnabled = enabledModules.has(mod.href);
			const existingId = existingByModule[mod.href];

			if (existingId) {
				await pb.collection('module_access').update(existingId, {
					enabled: isEnabled
				});
			} else {
				await pb.collection('module_access').create({
					user: userId,
					module: mod.href,
					enabled: isEnabled
				});
			}
		}

		await pb.collection('audit_logs').create({
			user: locals.user?.id,
			action: 'update',
			collection: 'module_access',
			record_id: userId,
			description: `Acceso a módulos actualizado para usuario: ${userId}`,
			old_data: '',
			new_data: JSON.stringify({ modules: Array.from(enabledModules) })
		}).catch(() => {});

		return { success: true };
	}
};
