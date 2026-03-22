import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export function formatDate(dateStr: string): string {
	if (!dateStr) return '-';
	const date = new Date(dateStr);
	return date.toLocaleDateString('es-CL', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric'
	});
}

export function formatDateTime(dateStr: string): string {
	if (!dateStr) return '-';
	const date = new Date(dateStr);
	return date.toLocaleString('es-CL', {
		day: '2-digit',
		month: '2-digit',
		year: 'numeric',
		hour: '2-digit',
		minute: '2-digit'
	});
}

export function formatCurrency(amount: number): string {
	return new Intl.NumberFormat('es-CL', {
		style: 'currency',
		currency: 'CLP'
	}).format(amount);
}

export function generateSKU(prefix: string = 'PROD'): string {
	const timestamp = Date.now().toString(36).toUpperCase();
	const random = Math.random().toString(36).substring(2, 5).toUpperCase();
	return `${prefix}-${timestamp}-${random}`;
}

export function slugify(str: string): string {
	return str
		.toLowerCase()
		.normalize('NFD')
		.replace(/[\u0300-\u036f]/g, '')
		.replace(/[^a-z0-9\s-]/g, '')
		.replace(/\s+/g, '-')
		.replace(/-+/g, '-')
		.trim();
}

export function debounce<T extends (...args: unknown[]) => void>(
	fn: T,
	delay: number
): (...args: Parameters<T>) => void {
	let timer: ReturnType<typeof setTimeout>;
	return (...args: Parameters<T>) => {
		clearTimeout(timer);
		timer = setTimeout(() => fn(...args), delay);
	};
}

export const PRODUCT_STATUS_LABELS: Record<string, string> = {
	disponible: 'Disponible',
	vendido: 'Vendido',
	inventariado: 'Inventariado',
	reservado: 'Reservado'
};

export const PRODUCT_STATUS_COLORS: Record<string, string> = {
	disponible: 'bg-green-100 text-green-800',
	vendido: 'bg-blue-100 text-blue-800',
	inventariado: 'bg-purple-100 text-purple-800',
	reservado: 'bg-yellow-100 text-yellow-800'
};

export const VOUCHER_STATUS_LABELS: Record<string, string> = {
	pendiente: 'Pendiente',
	completado: 'Completado',
	cancelado: 'Cancelado'
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
	efectivo: 'Efectivo',
	transferencia: 'Transferencia',
	tarjeta: 'Tarjeta',
	otro: 'Otro'
};

export const AUDIT_ACTION_LABELS: Record<string, string> = {
	create: 'Creado',
	update: 'Actualizado',
	delete: 'Eliminado',
	login: 'Inicio de sesión',
	logout: 'Cierre de sesión',
	inventory_check: 'Inventario',
	export: 'Exportación'
};
