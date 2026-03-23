export const BACKUP_VERSION = 1;

/** Collections with file fields and their field names */
export const FILE_FIELDS: Record<string, string[]> = {
	products: ['photos'],
	invoices: ['file'],
	vouchers: ['images'],
	landing_images: ['image']
};

/** Import order — parents before children to satisfy FK constraints */
export const IMPORT_ORDER = [
	'categories',
	'clients',
	'invoices',
	'landing_images',
	'products',
	'vouchers',
	'voucher_items',
	'delete_requests',
	'user_permissions',
	'module_access',
	'audit_logs'
] as const;

/** All 12 collections (users + import order) */
export const ALL_COLLECTIONS = ['users', ...IMPORT_ORDER] as const;

/** Deletion order — children first to avoid FK violations */
export const DELETE_ORDER = [
	'voucher_items',
	'vouchers',
	'products',
	'invoices',
	'categories',
	'clients',
	'landing_images',
	'delete_requests',
	'user_permissions',
	'module_access',
	'audit_logs'
] as const;

/** PocketBase internal fields to exclude from import */
export const EXCLUDED_FIELDS = ['collectionId', 'collectionName', 'expand', 'updated'];
