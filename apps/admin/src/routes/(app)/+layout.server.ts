import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';
import { WORKER_MODULES } from '$lib/worker-modules';

const WORKER_MODULE_HREFS = WORKER_MODULES.map((m) => m.href);

export const load: LayoutServerLoad = async ({ locals, url }) => {
	if (!locals.user) {
		throw redirect(303, '/login');
	}

	const pb = locals.pb;

	const pendingDeleteRequests = locals.user.role === 'admin'
		? await pb.collection('delete_requests').getList(1, 1, { filter: 'status = "pending"' })
			.then((r) => r.totalItems)
			.catch(() => 0)
		: 0;

	// For workers: load which modules they can access
	let allowedModules: string[] = [...WORKER_MODULE_HREFS]; // default: all allowed

	if (locals.user.role === 'worker') {
		const accessRecords = await pb.collection('module_access').getFullList({
			filter: `user = "${locals.user.id}"`
		}).catch(() => []) as Record<string, unknown>[];

		// If records exist, use them. Otherwise keep default (all allowed)
		if (accessRecords.length > 0) {
			allowedModules = accessRecords
				.filter((r) => r.enabled === true)
				.map((r) => r.module as string);
		}

		// Redirect if worker tries to access a blocked module
		const currentPath = url.pathname;
		const isWorkerModule = WORKER_MODULE_HREFS.includes(currentPath);
		if (isWorkerModule && !allowedModules.includes(currentPath)) {
			throw redirect(303, '/dashboard');
		}
	}

	return {
		user: {
			id: locals.user.id,
			email: locals.user.email,
			name: locals.user.name ?? locals.user.email,
			role: locals.user.role ?? 'worker',
			avatar: locals.user.avatar ?? null
		},
		pendingDeleteRequests,
		allowedModules
	};
};
