import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { addCreatedYearFilter, getCollectionYears } from '$lib/year-filter';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (locals.user?.role !== 'admin') throw redirect(303, '/dashboard');

	const page = parseInt(url.searchParams.get('page') ?? '1');
	const action = url.searchParams.get('action') ?? '';
	const collection = url.searchParams.get('collection') ?? '';
	const dateFrom = url.searchParams.get('from') ?? '';
	const dateTo = url.searchParams.get('to') ?? '';
	const year = url.searchParams.get('year') ?? '';

	const filters: string[] = [];
	if (action) filters.push(`action = "${action}"`);
	if (collection) filters.push(`collection = "${collection}"`);
	if (dateFrom) filters.push(`created >= "${dateFrom}"`);
	if (dateTo) filters.push(`created <= "${dateTo} 23:59:59"`);
	addCreatedYearFilter(filters, year);

	const logs = await locals.pb.collection('audit_logs').getList(page, 30, {
		filter: filters.join(' && '),
		sort: '-created',
		expand: 'user'
	});
	const years = await getCollectionYears(locals.pb, 'audit_logs');

	return {
		logs: logs.items,
		totalItems: logs.totalItems,
		totalPages: logs.totalPages,
		currentPage: page,
		years,
		filters: { action, collection, dateFrom, dateTo, year }
	};
};

export const actions: Actions = {
	clear: async ({ locals }) => {
		if (locals.user?.role !== 'admin') return fail(403, { error: 'Sin permisos' });

		try {
			const logs = await locals.pb.collection('audit_logs').getFullList({ fields: 'id' });

			for (const log of logs) {
				await locals.pb.collection('audit_logs').delete(log.id);
			}

			return { success: true, cleared: logs.length };
		} catch (err: unknown) {
			const error = err as { message?: string };
			return fail(400, { error: error.message ?? 'No se pudo limpiar la auditoría' });
		}
	}
};
