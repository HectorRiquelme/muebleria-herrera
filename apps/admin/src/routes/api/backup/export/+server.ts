import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { ALL_COLLECTIONS, FILE_FIELDS, BACKUP_VERSION, EXCLUDED_FIELDS } from '$lib/backup';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user || locals.user.role !== 'admin') {
		throw error(403, 'Sin permisos');
	}

	const pb = locals.pb;
	const JSZip = (await import('jszip')).default;
	const zip = new JSZip();

	const collectionCounts: Record<string, number> = {};
	let totalFiles = 0;

	// Fetch all collections sequentially
	for (const collection of ALL_COLLECTIONS) {
		const records = await pb.collection(collection).getFullList({ sort: '-created' }).catch(() => []);
		collectionCounts[collection] = records.length;

		// Clean records: remove PB internal fields
		const cleanRecords = records.map((record) => {
			const clean: Record<string, unknown> = {};
			for (const [key, value] of Object.entries(record)) {
				if (EXCLUDED_FIELDS.includes(key)) continue;
				clean[key] = value;
			}
			return clean;
		});

		zip.file(`data/${collection}.json`, JSON.stringify(cleanRecords, null, 2));

		// Download files for collections that have file fields
		const fileFields = FILE_FIELDS[collection];
		if (fileFields) {
			for (const record of records) {
				for (const field of fileFields) {
					const filenames = Array.isArray(record[field])
						? (record[field] as string[])
						: [record[field] as string].filter(Boolean);

					for (const filename of filenames) {
						if (!filename) continue;
						try {
							const fileUrl = pb.files.getURL(record, filename);
							const response = await fetch(fileUrl);
							if (response.ok) {
								const buffer = await response.arrayBuffer();
								zip.file(`files/${collection}/${record.id}/${filename}`, buffer);
								totalFiles++;
							}
						} catch {
							// Skip files that fail to download
						}
					}
				}
			}
		}
	}

	// Create manifest
	const now = new Date();
	const manifest = {
		version: BACKUP_VERSION,
		created: now.toISOString(),
		created_by: locals.user.email,
		collections: collectionCounts,
		totalFiles
	};
	zip.file('manifest.json', JSON.stringify(manifest, null, 2));

	// Generate ZIP
	const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });

	// Audit log
	await pb.collection('audit_logs').create({
		user: locals.user.id,
		action: 'export',
		collection: 'system',
		record_id: '',
		description: `Respaldo completo exportado (${Object.values(collectionCounts).reduce((a, b) => a + b, 0)} registros, ${totalFiles} archivos)`,
		old_data: '',
		new_data: JSON.stringify(manifest)
	}).catch(() => {});

	const dateStr = now.toISOString().slice(0, 10);
	return new Response(zipBuffer, {
		headers: {
			'Content-Type': 'application/zip',
			'Content-Disposition': `attachment; filename="respaldo-muebleria-${dateStr}.zip"`,
			'Content-Length': String(zipBuffer.length)
		}
	});
};
