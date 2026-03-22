import PocketBase from 'pocketbase';
import { redirect } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit';

const PUBLIC_ROUTES = ['/login', '/api'];

export const handle: Handle = async ({ event, resolve }) => {
	const pb = new PocketBase(
		process.env.PB_URL ?? 'http://localhost:8090'
	);

	// Load auth from cookie
	const cookie = event.request.headers.get('cookie') ?? '';
	pb.authStore.loadFromCookie(cookie, 'pb_auth');

	try {
		if (pb.authStore.isValid) {
			await pb.collection('users').authRefresh();
		}
	} catch {
		pb.authStore.clear();
	}

	event.locals.pb = pb;
	event.locals.user = pb.authStore.isValid ? pb.authStore.model : null;

	// Guard: redirect to login if not authenticated
	const isPublic = PUBLIC_ROUTES.some((r) => event.url.pathname.startsWith(r));
	if (!isPublic && !event.locals.user) {
		throw redirect(303, '/login');
	}

	const response = await resolve(event);

	// Set auth cookie
	response.headers.append(
		'set-cookie',
		pb.authStore.exportToCookie({ secure: false, httpOnly: true, sameSite: 'Lax' }, 'pb_auth')
	);

	return response;
};
