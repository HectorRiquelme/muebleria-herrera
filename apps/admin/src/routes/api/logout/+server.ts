import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ locals }) => {
	const userId = locals.user?.id;

	if (userId) {
		await locals.pb.collection('audit_logs').create({
			user: userId,
			action: 'logout',
			collection: 'users',
			record_id: userId,
			description: `Cierre de sesión: ${locals.user?.email}`,
			old_data: '',
			new_data: ''
		}).catch(() => {});
	}

	locals.pb.authStore.clear();

	return json({ success: true }, {
		headers: {
			'set-cookie': 'pb_auth=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax'
		}
	});
};
