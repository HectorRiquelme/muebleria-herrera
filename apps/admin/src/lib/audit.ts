import { pb } from './pb';
import type { AuditAction } from './types';

export async function logAction(
	action: AuditAction,
	collection: string,
	recordId: string,
	description: string,
	oldData?: unknown,
	newData?: unknown
): Promise<void> {
	try {
		const userId = pb.authStore.model?.id;
		if (!userId) return;

		await pb.collection('audit_logs').create({
			user: userId,
			action,
			collection,
			record_id: recordId,
			description,
			old_data: oldData ? JSON.stringify(oldData) : '',
			new_data: newData ? JSON.stringify(newData) : ''
		});
	} catch (err) {
		// Audit logging should never break the main flow
		console.error('Audit log error:', err);
	}
}
