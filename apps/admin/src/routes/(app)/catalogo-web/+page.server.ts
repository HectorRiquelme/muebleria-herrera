import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const config = { bodyParser: { sizeLimit: '20mb' } };

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user?.role !== 'admin') throw redirect(303, '/dashboard');

	const categories = await locals.pb.collection('landing_categories').getFullList({
		sort: 'order,name'
	});

	const products = await locals.pb.collection('landing_products').getFullList({
		sort: 'order,name',
		expand: 'category'
	});

	return { categories, products };
};

export const actions: Actions = {
	createCategory: async ({ request, locals }) => {
		if (locals.user?.role !== 'admin') return fail(403, { error: 'Sin permisos' });
		const data = await request.formData();
		const name = data.get('name')?.toString()?.trim();
		if (!name) return fail(400, { error: 'El nombre es requerido' });

		try {
			const formData = new FormData();
			formData.set('name', name);
			formData.set('description', data.get('description')?.toString() ?? '');
			formData.set('order', data.get('order')?.toString() ?? '0');
			formData.set('active', 'true');

			const imageFile = data.get('image');
			if (imageFile instanceof File && imageFile.size > 0) {
				formData.set('image', imageFile);
			}

			const record = await locals.pb.collection('landing_categories').create(formData);

			await locals.pb.collection('audit_logs').create({
				user: locals.user?.id, action: 'create', collection: 'landing_categories',
				record_id: record.id,
				description: `Categoría de catálogo web creada: ${name}`,
				old_data: '', new_data: JSON.stringify({ name, id: record.id })
			}).catch(() => {});

			return { success: true };
		} catch (err: unknown) {
			const e = err as { message?: string };
			return fail(400, { error: e.message ?? 'Error al crear categoría' });
		}
	},

	updateCategory: async ({ request, locals }) => {
		if (locals.user?.role !== 'admin') return fail(403, { error: 'Sin permisos' });
		const data = await request.formData();
		const id = data.get('id')?.toString();
		const name = data.get('name')?.toString()?.trim();
		if (!id || !name) return fail(400, { error: 'ID y nombre son requeridos' });

		try {
			const formData = new FormData();
			formData.set('name', name);
			formData.set('description', data.get('description')?.toString() ?? '');
			formData.set('order', data.get('order')?.toString() ?? '0');

			const imageFile = data.get('image');
			if (imageFile instanceof File && imageFile.size > 0) {
				formData.set('image', imageFile);
			}

			await locals.pb.collection('landing_categories').update(id, formData);

			await locals.pb.collection('audit_logs').create({
				user: locals.user?.id, action: 'update', collection: 'landing_categories',
				record_id: id,
				description: `Categoría de catálogo web actualizada: ${name}`,
				old_data: '', new_data: JSON.stringify({ name })
			}).catch(() => {});

			return { success: true };
		} catch (err: unknown) {
			const e = err as { message?: string };
			return fail(400, { error: e.message ?? 'Error al actualizar categoría' });
		}
	},

	deleteCategory: async ({ request, locals }) => {
		if (locals.user?.role !== 'admin') return fail(403, { error: 'Sin permisos' });
		const data = await request.formData();
		const id = data.get('id')?.toString();
		if (!id) return fail(400, { error: 'ID requerido' });

		try {
			// Verificar que no tenga productos asociados
			const products = await locals.pb.collection('landing_products').getList(1, 1, {
				filter: `category = "${id}"`
			});
			if (products.totalItems > 0) {
				return fail(400, { error: 'No se puede eliminar: tiene productos asociados. Elimina los productos primero.' });
			}

			await locals.pb.collection('landing_categories').delete(id);

			await locals.pb.collection('audit_logs').create({
				user: locals.user?.id, action: 'delete', collection: 'landing_categories',
				record_id: id,
				description: 'Categoría de catálogo web eliminada',
				old_data: JSON.stringify({ id }), new_data: ''
			}).catch(() => {});

			return { success: true };
		} catch (err: unknown) {
			const e = err as { message?: string };
			return fail(400, { error: e.message ?? 'Error al eliminar categoría' });
		}
	},

	toggleCategory: async ({ request, locals }) => {
		if (locals.user?.role !== 'admin') return fail(403, { error: 'Sin permisos' });
		const data = await request.formData();
		const id = data.get('id')?.toString();
		const active = data.get('active') === 'true';
		if (!id) return fail(400, { error: 'ID requerido' });

		try {
			await locals.pb.collection('landing_categories').update(id, { active: !active });

			await locals.pb.collection('audit_logs').create({
				user: locals.user?.id, action: 'update', collection: 'landing_categories',
				record_id: id,
				description: `Categoría de catálogo web ${!active ? 'activada' : 'desactivada'}`,
				old_data: JSON.stringify({ active }), new_data: JSON.stringify({ active: !active })
			}).catch(() => {});

			return { success: true };
		} catch (err: unknown) {
			const e = err as { message?: string };
			return fail(400, { error: e.message ?? 'Error' });
		}
	},

	createProduct: async ({ request, locals }) => {
		if (locals.user?.role !== 'admin') return fail(403, { error: 'Sin permisos' });
		const data = await request.formData();
		const name = data.get('name')?.toString()?.trim();
		const category = data.get('category')?.toString();
		if (!name) return fail(400, { error: 'El nombre es requerido' });
		if (!category) return fail(400, { error: 'La categoría es requerida' });

		try {
			const formData = new FormData();
			formData.set('name', name);
			formData.set('description', data.get('description')?.toString() ?? '');
			formData.set('category', category);
			formData.set('order', data.get('order')?.toString() ?? '0');
			formData.set('active', 'true');

			const priceStr = data.get('price')?.toString();
			if (priceStr) formData.set('price', priceStr);

			const imageFile = data.get('image');
			if (imageFile instanceof File && imageFile.size > 0) {
				formData.set('image', imageFile);
			}

			const record = await locals.pb.collection('landing_products').create(formData);

			await locals.pb.collection('audit_logs').create({
				user: locals.user?.id, action: 'create', collection: 'landing_products',
				record_id: record.id,
				description: `Producto de catálogo web creado: ${name}`,
				old_data: '', new_data: JSON.stringify({ name, category, id: record.id })
			}).catch(() => {});

			return { success: true };
		} catch (err: unknown) {
			const e = err as { message?: string };
			return fail(400, { error: e.message ?? 'Error al crear producto' });
		}
	},

	updateProduct: async ({ request, locals }) => {
		if (locals.user?.role !== 'admin') return fail(403, { error: 'Sin permisos' });
		const data = await request.formData();
		const id = data.get('id')?.toString();
		const name = data.get('name')?.toString()?.trim();
		const category = data.get('category')?.toString();
		if (!id || !name) return fail(400, { error: 'ID y nombre son requeridos' });
		if (!category) return fail(400, { error: 'La categoría es requerida' });

		try {
			const formData = new FormData();
			formData.set('name', name);
			formData.set('description', data.get('description')?.toString() ?? '');
			formData.set('category', category);
			formData.set('order', data.get('order')?.toString() ?? '0');

			const priceStr = data.get('price')?.toString();
			if (priceStr) formData.set('price', priceStr);

			const imageFile = data.get('image');
			if (imageFile instanceof File && imageFile.size > 0) {
				formData.set('image', imageFile);
			}

			await locals.pb.collection('landing_products').update(id, formData);

			await locals.pb.collection('audit_logs').create({
				user: locals.user?.id, action: 'update', collection: 'landing_products',
				record_id: id,
				description: `Producto de catálogo web actualizado: ${name}`,
				old_data: '', new_data: JSON.stringify({ name, category })
			}).catch(() => {});

			return { success: true };
		} catch (err: unknown) {
			const e = err as { message?: string };
			return fail(400, { error: e.message ?? 'Error al actualizar producto' });
		}
	},

	deleteProduct: async ({ request, locals }) => {
		if (locals.user?.role !== 'admin') return fail(403, { error: 'Sin permisos' });
		const data = await request.formData();
		const id = data.get('id')?.toString();
		if (!id) return fail(400, { error: 'ID requerido' });

		try {
			await locals.pb.collection('landing_products').delete(id);

			await locals.pb.collection('audit_logs').create({
				user: locals.user?.id, action: 'delete', collection: 'landing_products',
				record_id: id,
				description: 'Producto de catálogo web eliminado',
				old_data: JSON.stringify({ id }), new_data: ''
			}).catch(() => {});

			return { success: true };
		} catch (err: unknown) {
			const e = err as { message?: string };
			return fail(400, { error: e.message ?? 'Error al eliminar producto' });
		}
	},

	toggleProduct: async ({ request, locals }) => {
		if (locals.user?.role !== 'admin') return fail(403, { error: 'Sin permisos' });
		const data = await request.formData();
		const id = data.get('id')?.toString();
		const active = data.get('active') === 'true';
		if (!id) return fail(400, { error: 'ID requerido' });

		try {
			await locals.pb.collection('landing_products').update(id, { active: !active });

			await locals.pb.collection('audit_logs').create({
				user: locals.user?.id, action: 'update', collection: 'landing_products',
				record_id: id,
				description: `Producto de catálogo web ${!active ? 'activado' : 'desactivado'}`,
				old_data: JSON.stringify({ active }), new_data: JSON.stringify({ active: !active })
			}).catch(() => {});

			return { success: true };
		} catch (err: unknown) {
			const e = err as { message?: string };
			return fail(400, { error: e.message ?? 'Error' });
		}
	}
};
