import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { BACKUP_VERSION, FILE_FIELDS, IMPORT_ORDER, DELETE_ORDER, EXCLUDED_FIELDS } from '$lib/backup';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user?.role !== 'admin') throw redirect(303, '/dashboard');

	const recentBackups = await locals.pb.collection('audit_logs').getList(1, 20, {
		filter: 'collection = "system"',
		sort: '-created',
		expand: 'user'
	}).catch(() => ({ items: [] }));

	return { recentBackups: recentBackups.items };
};

export const actions: Actions = {
	importBackup: async ({ request, locals }) => {
		if (locals.user?.role !== 'admin') return fail(403, { error: 'Sin permisos' });

		const pb = locals.pb;
		const formData = await request.formData();
		const file = formData.get('file') as File | null;
		const clearExisting = formData.get('clearExisting') === 'on';

		if (!file || file.size === 0) {
			return fail(400, { error: 'Archivo de respaldo requerido' });
		}

		try {
			const JSZip = (await import('jszip')).default;
			const zip = await JSZip.loadAsync(await file.arrayBuffer());

			// Validate manifest
			const manifestFile = zip.file('manifest.json');
			if (!manifestFile) {
				return fail(400, { error: 'Archivo de respaldo inválido: falta manifest.json' });
			}
			const manifest = JSON.parse(await manifestFile.async('string'));
			if (manifest.version !== BACKUP_VERSION) {
				return fail(400, { error: `Versión de respaldo no compatible (v${manifest.version})` });
			}

			const imported: Record<string, number> = {};
			const errors: string[] = [];
			const skipped: string[] = [];

			// Clear existing data if requested
			if (clearExisting) {
				for (const collection of DELETE_ORDER) {
					try {
						const records = await pb.collection(collection).getFullList({ fields: 'id' });
						for (const record of records) {
							await pb.collection(collection).delete(record.id).catch(() => {});
						}
					} catch {
						// Collection might be empty or inaccessible
					}
				}
			}

			// Skip users — cannot import password hashes via SDK
			skipped.push('users: omitidos (las contraseñas no se pueden importar)');

			// Import collections in dependency order
			for (const collection of IMPORT_ORDER) {
				const dataFile = zip.file(`data/${collection}.json`);
				if (!dataFile) {
					imported[collection] = 0;
					continue;
				}

				const records = JSON.parse(await dataFile.async('string')) as Record<string, unknown>[];
				let count = 0;

				for (const record of records) {
					try {
						const fd = new FormData();

						// Set all scalar fields (including id to preserve references)
						for (const [key, value] of Object.entries(record)) {
							if (EXCLUDED_FIELDS.includes(key)) continue;
							const fileFields = FILE_FIELDS[collection];
							if (fileFields && fileFields.includes(key)) continue;
							if (value !== null && value !== undefined) {
								if (Array.isArray(value) && !FILE_FIELDS[collection]?.includes(key)) {
									// Skip array fields that aren't file fields — PB handles them as JSON
									fd.set(key, JSON.stringify(value));
								} else {
									fd.set(key, String(value));
								}
							}
						}

						// Attach files
						const fileFields = FILE_FIELDS[collection];
						if (fileFields) {
							for (const field of fileFields) {
								const filenames = Array.isArray(record[field])
									? (record[field] as string[])
									: [record[field] as string].filter(Boolean);

								for (const fname of filenames) {
									if (!fname) continue;
									const path = `files/${collection}/${record.id}/${fname}`;
									const fileEntry = zip.file(path);
									if (fileEntry) {
										const blob = await fileEntry.async('blob');
										fd.append(field, new File([blob], fname));
									}
								}
							}
						}

						await pb.collection(collection).create(fd);
						count++;
					} catch (err: unknown) {
						const e = err as { message?: string };
						const label = (record.name ?? record.number ?? record.id ?? 'desconocido') as string;
						errors.push(`${collection}/${label}: ${e.message ?? 'error desconocido'}`);
					}
				}

				imported[collection] = count;
			}

			const totalImported = Object.values(imported).reduce((a, b) => a + b, 0);

			// Audit log
			await pb.collection('audit_logs').create({
				user: locals.user?.id,
				action: 'create',
				collection: 'system',
				record_id: '',
				description: `Respaldo importado: ${totalImported} registros (${errors.length} errores)`,
				old_data: '',
				new_data: JSON.stringify({ imported, errors: errors.length, skipped })
			}).catch(() => {});

			return {
				success: true,
				imported,
				errors: errors.slice(0, 50), // Limit displayed errors
				skipped,
				totalImported
			};
		} catch (err: unknown) {
			const e = err as { message?: string };
			return fail(400, { error: e.message ?? 'Error al procesar el archivo de respaldo' });
		}
	}
};
