export type UserRole = 'admin' | 'worker';

export interface User {
	id: string;
	email: string;
	name: string;
	role: UserRole;
	avatar?: string;
	created: string;
	updated: string;
}

export interface Category {
	id: string;
	name: string;
	description?: string;
	created: string;
	updated: string;
}

export type ProductStatus = 'disponible' | 'vendido' | 'inventariado' | 'reservado';

export interface Product {
	id: string;
	name: string;
	description?: string;
	sku: string;
	barcode?: string;
	barcode_type: 'CODE128' | 'EAN13' | 'QR';
	price: number;
	cost?: number;
	status: ProductStatus;
	category: string;
	expand?: { category?: Category };
	photos: string[];
	invoice?: string;
	expand_invoice?: Invoice;
	inventoried: boolean;
	inventoried_at?: string;
	inventoried_by?: string;
	created: string;
	updated: string;
}

export interface Invoice {
	id: string;
	number: string;
	supplier: string;
	date: string;
	total: number;
	file?: string;
	notes?: string;
	created: string;
	updated: string;
}

export interface Client {
	id: string;
	name: string;
	email?: string;
	phone?: string;
	address?: string;
	notes?: string;
	is_frequent: boolean;
	created: string;
	updated: string;
}

export type VoucherStatus = 'pendiente' | 'completado' | 'cancelado';
export type PaymentMethod = 'efectivo' | 'transferencia' | 'tarjeta' | 'otro';

export interface Voucher {
	id: string;
	number: string;
	date: string;
	client?: string;
	expand?: { client?: Client; items?: VoucherItem[] };
	total: number;
	status: VoucherStatus;
	payment_method: PaymentMethod;
	images: string[];
	notes?: string;
	created: string;
	updated: string;
}

export interface VoucherItem {
	id: string;
	voucher: string;
	product: string;
	expand?: { product?: Product };
	quantity: number;
	unit_price: number;
	subtotal: number;
	created: string;
	updated: string;
}

export type AuditAction =
	| 'create'
	| 'update'
	| 'delete'
	| 'login'
	| 'logout'
	| 'inventory_check'
	| 'export';

export interface AuditLog {
	id: string;
	user: string;
	expand?: { user?: User };
	action: AuditAction;
	collection: string;
	record_id: string;
	description: string;
	old_data?: string;
	new_data?: string;
	created: string;
}

export interface LandingImage {
	id: string;
	title?: string;
	image: string;
	order: number;
	active: boolean;
	created: string;
	updated: string;
}

export interface LandingCategory {
	id: string;
	name: string;
	description?: string;
	image?: string;
	order: number;
	active: boolean;
	created: string;
	updated: string;
}

export interface LandingProduct {
	id: string;
	name: string;
	description?: string;
	image?: string;
	price?: number;
	category: string;
	expand?: { category?: LandingCategory };
	order: number;
	active: boolean;
	created: string;
	updated: string;
}

export interface PaginatedResult<T> {
	items: T[];
	page: number;
	perPage: number;
	totalItems: number;
	totalPages: number;
}
