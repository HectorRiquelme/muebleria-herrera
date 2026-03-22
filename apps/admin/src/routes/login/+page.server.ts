import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		throw redirect(303, '/dashboard');
	}
};

export const actions: Actions = {
	default: async ({ request, locals }) => {
		const data = await request.formData();
		const email = data.get('email')?.toString().trim();
		const password = data.get('password')?.toString();

		if (!email || !password) {
			return fail(400, { error: 'Email y contraseña son requeridos' });
		}

		try {
			await locals.pb.collection('users').authWithPassword(email, password);

			// Log the login action
			const userId = locals.pb.authStore.model?.id;
			if (userId) {
				await locals.pb.collection('audit_logs').create({
					user: userId,
					action: 'login',
					collection: 'users',
					record_id: userId,
					description: `Inicio de sesión: ${email}`,
					old_data: '',
					new_data: ''
				}).catch(() => {});
			}
		} catch {
			return fail(401, { error: 'Credenciales incorrectas' });
		}

		throw redirect(303, '/dashboard');
	}
};
