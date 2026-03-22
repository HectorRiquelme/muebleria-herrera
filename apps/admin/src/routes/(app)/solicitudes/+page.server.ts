import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user?.role !== 'admin') throw redirect(303, '/dashboard');

	const pb = locals.pb;

	const requests = await pb.collection('delete_requests').getFullList({
		sort: '-created',
		expand: 'requested_by,resolved_by'
	}).catch(() => []);

	const pending = requests.filter((r) => r.status === 'pending');
	const resolved = requests.filter((r) => r.status !== 'pending');

	return { pending, resolved };
};

export const actions: Actions = {
	approve: async ({ request, locals }) => {
		if (locals.user?.role !== 'admin') return fail(403, { error: 'Sin permisos' });

		const pb = locals.pb;
		const data = await request.formData();
		const requestId = data.get('request_id')?.toString();
		if (!requestId) return fail(400, { error: 'ID de solicitud requerido' });

		try {
			const deleteRequest = await pb.collection('delete_requests').getOne(requestId);

			// Delete the actual record
			await pb.collection(deleteRequest.collection_name).delete(deleteRequest.record_id).catch(() => {});

			// Update request status
			await pb.collection('delete_requests').update(requestId, {
				status: 'approved',
				resolved_by: locals.user?.id,
				resolved_at: new Date().toISOString().replace('T', ' ').slice(0, 19)
			});

			// Audit log
			await pb.collection('audit_logs').create({
				user: locals.user?.id,
				action: 'delete',
				collection: deleteRequest.collection_name,
				record_id: deleteRequest.record_id,
				description: `Solicitud de eliminación APROBADA: ${deleteRequest.record_label}`,
				old_data: JSON.stringify({ id: deleteRequest.record_id }),
				new_data: ''
			}).catch(() => {});

			return { success: true, action: 'approved' };
		} catch (err: unknown) {
			const e = err as { message?: string };
			return fail(400, { error: e.message ?? 'Error al aprobar solicitud' });
		}
	},

	reject: async ({ request, locals }) => {
		if (locals.user?.role !== 'admin') return fail(403, { error: 'Sin permisos' });

		const pb = locals.pb;
		const data = await request.formData();
		const requestId = data.get('request_id')?.toString();
		if (!requestId) return fail(400, { error: 'ID de solicitud requerido' });

		try {
			await pb.collection('delete_requests').update(requestId, {
				status: 'rejected',
				resolved_by: locals.user?.id,
				resolved_at: new Date().toISOString().replace('T', ' ').slice(0, 19)
			});

			// Audit log
			const deleteRequest = await pb.collection('delete_requests').getOne(requestId).catch(() => null);

			await pb.collection('audit_logs').create({
				user: locals.user?.id,
				action: 'update',
				collection: deleteRequest?.collection_name ?? 'unknown',
				record_id: deleteRequest?.record_id ?? '',
				description: `Solicitud de eliminación RECHAZADA: ${deleteRequest?.record_label ?? requestId}`,
				old_data: '',
				new_data: ''
			}).catch(() => {});

			return { success: true, action: 'rejected' };
		} catch (err: unknown) {
			const e = err as { message?: string };
			return fail(400, { error: e.message ?? 'Error al rechazar solicitud' });
		}
	}
};
