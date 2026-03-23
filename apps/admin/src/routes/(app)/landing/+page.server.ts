import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const config = { bodyParser: { sizeLimit: '20mb' } };

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user?.role !== 'admin') throw redirect(303, '/dashboard');

	const images = await locals.pb.collection('landing_images').getFullList({ sort: 'order,created' });
	return { images };
};

export const actions: Actions = {
	upload: async ({ request, locals }) => {
		if (locals.user?.role !== 'admin') return fail(403, { error: 'Sin permisos' });
		const data = await request.formData();

		try {
			const records = [];
			const files = data.getAll('images');

			for (const file of files) {
				if (!(file instanceof File)) continue;
				const formData = new FormData();
				formData.set('image', file);
				formData.set('title', data.get('title')?.toString() ?? file.name);
				formData.set('order', data.get('order')?.toString() ?? '0');
				formData.set('active', 'true');
				const record = await locals.pb.collection('landing_images').create(formData);
				records.push(record);
			}

			await locals.pb.collection('audit_logs').create({
				user: locals.user?.id, action: 'create', collection: 'landing_images',
				record_id: records[0]?.id ?? '',
				description: `${records.length} imagen(es) subidas al landing`,
				old_data: '', new_data: JSON.stringify({ count: records.length })
			}).catch(() => {});

			return { success: true };
		} catch (err: unknown) {
			const e = err as { message?: string };
			return fail(400, { error: e.message ?? 'Error al subir imágenes' });
		}
	},

	toggleActive: async ({ request, locals }) => {
		if (locals.user?.role !== 'admin') return fail(403, { error: 'Sin permisos' });
		const data = await request.formData();
		const id = data.get('id')?.toString();
		const active = data.get('active') === 'true';
		if (!id) return fail(400, { error: 'ID requerido' });

		try {
			await locals.pb.collection('landing_images').update(id, { active: !active });
			await locals.pb.collection('audit_logs').create({
				user: locals.user?.id, action: 'update', collection: 'landing_images',
				record_id: id,
				description: `Imagen del landing ${!active ? 'activada' : 'desactivada'}`,
				old_data: JSON.stringify({ active }), new_data: JSON.stringify({ active: !active })
			}).catch(() => {});
			return { success: true };
		} catch (err: unknown) {
			const e = err as { message?: string };
			return fail(400, { error: e.message ?? 'Error' });
		}
	},

	updateOrder: async ({ request, locals }) => {
		if (locals.user?.role !== 'admin') return fail(403, { error: 'Sin permisos' });
		const data = await request.formData();
		const id = data.get('id')?.toString();
		const order = data.get('order')?.toString();
		if (!id) return fail(400, { error: 'ID requerido' });

		try {
			const newOrder = parseInt(order ?? '0');
			await locals.pb.collection('landing_images').update(id, { order: newOrder });
			await locals.pb.collection('audit_logs').create({
				user: locals.user?.id, action: 'update', collection: 'landing_images',
				record_id: id,
				description: `Orden de imagen actualizado a ${newOrder}`,
				old_data: '', new_data: JSON.stringify({ order: newOrder })
			}).catch(() => {});
			return { success: true };
		} catch (err: unknown) {
			const e = err as { message?: string };
			return fail(400, { error: e.message ?? 'Error' });
		}
	},

	delete: async ({ request, locals }) => {
		if (locals.user?.role !== 'admin') return fail(403, { error: 'Sin permisos' });
		const data = await request.formData();
		const id = data.get('id')?.toString();
		if (!id) return fail(400, { error: 'ID requerido' });

		try {
			await locals.pb.collection('landing_images').delete(id);
			await locals.pb.collection('audit_logs').create({
				user: locals.user?.id, action: 'delete', collection: 'landing_images',
				record_id: id,
				description: 'Imagen del landing eliminada',
				old_data: JSON.stringify({ id }), new_data: ''
			}).catch(() => {});
			return { success: true };
		} catch (err: unknown) {
			const e = err as { message?: string };
			return fail(400, { error: e.message ?? 'Error al eliminar' });
		}
	}
};
