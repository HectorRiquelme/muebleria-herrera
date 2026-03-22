import type { AuditLog, Category, Client, Invoice, Product, User, Voucher, VoucherItem } from './types';
import {
	AUDIT_ACTION_LABELS,
	formatCurrency,
	formatDate,
	formatDateTime,
	PAYMENT_METHOD_LABELS,
	PRODUCT_STATUS_LABELS,
	VOUCHER_STATUS_LABELS
} from './utils';

type ExportCell = string | number | boolean | null | undefined;
type ExportRow = Record<string, ExportCell>;

function downloadBlob(blob: Blob, filename: string) {
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	link.click();
	URL.revokeObjectURL(url);
}

function escapeCsvCell(value: ExportCell) {
	const text = value == null ? '' : String(value);
	if (text.includes(',') || text.includes('"') || text.includes('\n')) {
		return `"${text.replace(/"/g, '""')}"`;
	}
	return text;
}

function rowsToCsv(rows: ExportRow[]) {
	if (!rows.length) return '';

	const headers = Object.keys(rows[0]);
	const lines = [
		headers.map(escapeCsvCell).join(','),
		...rows.map((row) => headers.map((header) => escapeCsvCell(row[header])).join(','))
	];

	return lines.join('\n');
}

async function exportRowsAsPdf(title: string, rows: ExportRow[], filename: string) {
	const { jsPDF } = await import('jspdf');
	const orientation = rows[0] && Object.keys(rows[0]).length > 5 ? 'landscape' : 'portrait';
	const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation });
	const headers = rows.length ? Object.keys(rows[0]) : [];
	const margin = 12;
	const pageWidth = doc.internal.pageSize.getWidth();
	const pageHeight = doc.internal.pageSize.getHeight();
	const usableWidth = pageWidth - margin * 2;
	const colWidth = headers.length ? usableWidth / headers.length : usableWidth;
	let y = 18;

	const drawHeader = () => {
		doc.setFillColor(139, 94, 60);
		doc.rect(0, 0, pageWidth, 20, 'F');
		doc.setTextColor(255, 255, 255);
		doc.setFont('helvetica', 'bold');
		doc.setFontSize(14);
		doc.text(title, margin, 12);
		y = 28;

		if (!headers.length) return;

		doc.setFillColor(245, 240, 235);
		doc.setTextColor(44, 32, 24);
		doc.rect(margin, y - 5, usableWidth, 8, 'F');
		doc.setFontSize(8);
		headers.forEach((header, index) => {
			doc.text(header, margin + index * colWidth + 1.5, y);
		});
		y += 8;
	};

	drawHeader();
	doc.setFont('helvetica', 'normal');
	doc.setFontSize(8);

	for (const row of rows) {
		const cells = headers.map((header) => doc.splitTextToSize(String(row[header] ?? '-'), colWidth - 3));
		const rowHeight = Math.max(...cells.map((cell) => Math.max(1, cell.length))) * 4 + 2;

		if (y + rowHeight > pageHeight - 12) {
			doc.addPage();
			drawHeader();
			doc.setFont('helvetica', 'normal');
			doc.setFontSize(8);
		}

		cells.forEach((cell, index) => {
			doc.text(cell, margin + index * colWidth + 1.5, y);
		});
		y += rowHeight;
	}

	doc.save(filename);
}

function exportRowsAsCsv(rows: ExportRow[], filename: string) {
	const csv = rowsToCsv(rows);
	const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
	downloadBlob(blob, filename);
}

function productRows(products: Product[]) {
	return products.map((product) => ({
		SKU: product.sku,
		Nombre: product.name,
		Categoria: product.expand?.category?.name ?? '-',
		Estado: PRODUCT_STATUS_LABELS[product.status] ?? product.status,
		Precio: formatCurrency(product.price),
		Costo: product.cost != null ? formatCurrency(product.cost) : '-',
		'Codigo de barra': product.barcode ?? '-',
		Inventariado: product.inventoried ? 'Si' : 'No',
		'Fecha inventario': product.inventoried_at ? formatDate(product.inventoried_at) : '-',
		Creado: formatDateTime(product.created)
	}));
}

function categoryRows(categories: Category[]) {
	return categories.map((category) => ({
		Nombre: category.name,
		Descripcion: category.description ?? '-',
		Creado: formatDateTime(category.created)
	}));
}

function invoiceRows(invoices: Invoice[]) {
	return invoices.map((invoice) => ({
		'Numero factura': invoice.number,
		Proveedor: invoice.supplier,
		Fecha: formatDate(invoice.date),
		Total: formatCurrency(invoice.total),
		Archivo: invoice.file ? 'Si' : 'No',
		Creado: formatDateTime(invoice.created)
	}));
}

function voucherRows(vouchers: Voucher[]) {
	return vouchers.map((voucher) => ({
		Comprobante: voucher.number,
		Fecha: formatDate(voucher.date),
		Cliente: voucher.expand?.client?.name ?? '-',
		Pago: PAYMENT_METHOD_LABELS[voucher.payment_method] ?? voucher.payment_method,
		Total: formatCurrency(voucher.total),
		Estado: VOUCHER_STATUS_LABELS[voucher.status] ?? voucher.status,
		Creado: formatDateTime(voucher.created)
	}));
}

function userRows(users: User[]) {
	return users.map((user) => ({
		Nombre: user.name ?? '-',
		Email: user.email,
		Rol: user.role === 'admin' ? 'Administrador' : 'Trabajador',
		Creado: formatDateTime(user.created)
	}));
}

function auditRows(logs: AuditLog[]) {
	return logs.map((log) => ({
		Fecha: formatDateTime(log.created),
		Usuario: log.expand?.user?.name ?? log.expand?.user?.email ?? '-',
		Accion: AUDIT_ACTION_LABELS[log.action] ?? log.action,
		Modulo: log.collection,
		Descripcion: log.description
	}));
}

// ─────────────────────────────────────────────
// PDF Export
// ─────────────────────────────────────────────

export async function exportVoucherPDF(
	voucher: Voucher,
	items: VoucherItem[],
	client?: Client
): Promise<void> {
	const { jsPDF } = await import('jspdf');
	const doc = new jsPDF({ unit: 'mm', format: 'a4' });

	const pageW = doc.internal.pageSize.getWidth();
	let y = 20;

	// Header
	doc.setFillColor(139, 94, 60);
	doc.rect(0, 0, pageW, 35, 'F');
	doc.setTextColor(255, 255, 255);
	doc.setFontSize(22);
	doc.setFont('helvetica', 'bold');
	doc.text('Mueblería Herrera', 20, 16);
	doc.setFontSize(11);
	doc.setFont('helvetica', 'normal');
	doc.text(`Comprobante #${voucher.number}`, 20, 27);
	doc.text(formatDate(voucher.date), pageW - 20, 27, { align: 'right' });

	y = 50;
	doc.setTextColor(44, 32, 24);

	// Client info
	if (client) {
		doc.setFontSize(10);
		doc.setFont('helvetica', 'bold');
		doc.text('Cliente:', 20, y);
		doc.setFont('helvetica', 'normal');
		doc.text(client.name, 45, y);
		y += 6;
		if (client.phone) {
			doc.text('Teléfono:', 20, y);
			doc.text(client.phone, 45, y);
			y += 6;
		}
		if (client.email) {
			doc.text('Email:', 20, y);
			doc.text(client.email, 45, y);
			y += 6;
		}
	}

	y += 4;

	// Payment info
	doc.setFont('helvetica', 'bold');
	doc.text('Método de pago:', 20, y);
	doc.setFont('helvetica', 'normal');
	doc.text(PAYMENT_METHOD_LABELS[voucher.payment_method] ?? voucher.payment_method, 60, y);
	y += 10;

	// Items table header
	doc.setFillColor(232, 224, 216);
	doc.rect(20, y - 5, pageW - 40, 8, 'F');
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(9);
	doc.text('Producto', 22, y);
	doc.text('Cant.', 120, y);
	doc.text('P. Unit.', 140, y);
	doc.text('Subtotal', 170, y);
	y += 6;

	doc.setFont('helvetica', 'normal');
	let subtotalCheck = 0;

	for (const item of items) {
		const product = item.expand?.product;
		const name = product?.name ?? item.product;
		const lines = doc.splitTextToSize(name, 90);

		if (y > 260) {
			doc.addPage();
			y = 20;
		}

		doc.text(lines, 22, y);
		doc.text(String(item.quantity), 120, y);
		doc.text(formatCurrency(item.unit_price), 140, y);
		doc.text(formatCurrency(item.subtotal), 170, y);
		y += lines.length * 5 + 2;
		subtotalCheck += item.subtotal;
	}

	y += 4;
	doc.setDrawColor(200, 190, 180);
	doc.line(20, y, pageW - 20, y);
	y += 8;

	// Total
	doc.setFont('helvetica', 'bold');
	doc.setFontSize(12);
	doc.text('TOTAL:', 140, y);
	doc.text(formatCurrency(voucher.total), 170, y);

	y += 10;
	if (voucher.notes) {
		doc.setFont('helvetica', 'italic');
		doc.setFontSize(9);
		doc.text(`Notas: ${voucher.notes}`, 20, y);
	}

	// Footer
	doc.setFontSize(8);
	doc.setTextColor(150);
	doc.text('Mueblería Herrera — Gracias por su compra', pageW / 2, 285, { align: 'center' });

	doc.save(`comprobante-${voucher.number}.pdf`);
}

export async function exportMultipleVouchersPDF(
	vouchers: Voucher[]
): Promise<void> {
	const { jsPDF } = await import('jspdf');
	const doc = new jsPDF({ unit: 'mm', format: 'a4' });
	const pageW = doc.internal.pageSize.getWidth();

	let isFirst = true;

	for (const voucher of vouchers) {
		if (!isFirst) doc.addPage();
		isFirst = false;

		let y = 20;

		doc.setFillColor(139, 94, 60);
		doc.rect(0, 0, pageW, 30, 'F');
		doc.setTextColor(255, 255, 255);
		doc.setFontSize(16);
		doc.setFont('helvetica', 'bold');
		doc.text(`Comprobante #${voucher.number}`, 20, 14);
		doc.setFontSize(10);
		doc.setFont('helvetica', 'normal');
		doc.text(formatDate(voucher.date), pageW - 20, 14, { align: 'right' });
		doc.text(PAYMENT_METHOD_LABELS[voucher.payment_method] ?? '', 20, 24);
		doc.text(formatCurrency(voucher.total), pageW - 20, 24, { align: 'right' });

		y = 45;
		doc.setTextColor(44, 32, 24);
		doc.setFontSize(10);

		const client = voucher.expand?.client;
		if (client) {
			doc.text(`Cliente: ${client.name}`, 20, y);
			y += 7;
		}

		if (voucher.notes) {
			doc.setFont('helvetica', 'italic');
			doc.text(`Notas: ${voucher.notes}`, 20, y);
		}
	}

	doc.save(`comprobantes-${formatDate(new Date().toISOString())}.pdf`);
}

// ─────────────────────────────────────────────
// Excel Export
// ─────────────────────────────────────────────

export async function exportVouchersExcel(
	vouchers: Voucher[],
	filename: string = 'ventas'
): Promise<void> {
	const XLSX = await import('xlsx');

	const data = vouchers.map((v) => ({
		'N° Comprobante': v.number,
		Fecha: formatDate(v.date),
		Cliente: v.expand?.client?.name ?? '-',
		'Método de pago': PAYMENT_METHOD_LABELS[v.payment_method] ?? v.payment_method,
		Total: v.total,
		Estado: v.status,
		Notas: v.notes ?? ''
	}));

	const ws = XLSX.utils.json_to_sheet(data);
	const wb = XLSX.utils.book_new();

	// Column widths
	ws['!cols'] = [
		{ wch: 16 },
		{ wch: 12 },
		{ wch: 24 },
		{ wch: 18 },
		{ wch: 14 },
		{ wch: 12 },
		{ wch: 30 }
	];

	XLSX.utils.book_append_sheet(wb, ws, 'Ventas');
	XLSX.writeFile(wb, `${filename}-${Date.now()}.xlsx`);
}

export async function exportProductsExcel(
	products: Product[],
	filename: string = 'productos'
): Promise<void> {
	const XLSX = await import('xlsx');

	const data = products.map((p) => ({
		SKU: p.sku,
		Nombre: p.name,
		Categoría: p.expand?.category?.name ?? '-',
		Estado: p.status,
		Precio: p.price,
		Costo: p.cost ?? '',
		'Código de barra': p.barcode ?? '',
		Inventariado: p.inventoried ? 'Sí' : 'No',
		'Fecha inventario': p.inventoried_at ? formatDate(p.inventoried_at) : '-',
		Descripción: p.description ?? '',
		Creado: formatDateTime(p.created)
	}));

	const ws = XLSX.utils.json_to_sheet(data);
	const wb = XLSX.utils.book_new();

	ws['!cols'] = [
		{ wch: 16 }, { wch: 28 }, { wch: 16 }, { wch: 14 },
		{ wch: 12 }, { wch: 12 }, { wch: 18 }, { wch: 12 },
		{ wch: 16 }, { wch: 30 }, { wch: 20 }
	];

	XLSX.utils.book_append_sheet(wb, ws, 'Productos');
	XLSX.writeFile(wb, `${filename}-${Date.now()}.xlsx`);
}

export async function exportClientsExcel(
	clients: { id: string; name: string; email?: string; phone?: string; address?: string; is_frequent: boolean; created: string }[],
	filename: string = 'clientes'
): Promise<void> {
	const XLSX = await import('xlsx');

	const data = clients.map((c) => ({
		Nombre: c.name,
		Email: c.email ?? '-',
		Teléfono: c.phone ?? '-',
		Dirección: c.address ?? '-',
		'Cliente frecuente': c.is_frequent ? 'Sí' : 'No',
		'Fecha registro': formatDate(c.created)
	}));

	const ws = XLSX.utils.json_to_sheet(data);
	const wb = XLSX.utils.book_new();
	XLSX.utils.book_append_sheet(wb, ws, 'Clientes');
	XLSX.writeFile(wb, `${filename}-${Date.now()}.xlsx`);
}

export function exportProductsCSV(products: Product[], filename: string = 'productos.csv') {
	exportRowsAsCsv(productRows(products), filename);
}

export async function exportProductsPDF(products: Product[], filename: string = 'productos.pdf') {
	await exportRowsAsPdf('Productos', productRows(products), filename);
}

export function exportInventoryCSV(products: Product[], filename: string = 'inventario.csv') {
	exportRowsAsCsv(productRows(products), filename);
}

export async function exportInventoryPDF(products: Product[], filename: string = 'inventario.pdf') {
	await exportRowsAsPdf('Inventario', productRows(products), filename);
}

export function exportCategoriesCSV(categories: Category[], filename: string = 'categorias.csv') {
	exportRowsAsCsv(categoryRows(categories), filename);
}

export async function exportCategoriesPDF(categories: Category[], filename: string = 'categorias.pdf') {
	await exportRowsAsPdf('Categorias', categoryRows(categories), filename);
}

export function exportInvoicesCSV(invoices: Invoice[], filename: string = 'facturas.csv') {
	exportRowsAsCsv(invoiceRows(invoices), filename);
}

export async function exportInvoicesPDF(invoices: Invoice[], filename: string = 'facturas.pdf') {
	await exportRowsAsPdf('Facturas', invoiceRows(invoices), filename);
}

export function exportVouchersCSV(vouchers: Voucher[], filename: string = 'ventas.csv') {
	exportRowsAsCsv(voucherRows(vouchers), filename);
}

export async function exportVouchersPDF(vouchers: Voucher[], filename: string = 'ventas.pdf') {
	await exportRowsAsPdf('Ventas', voucherRows(vouchers), filename);
}

export function exportUsersCSV(users: User[], filename: string = 'usuarios.csv') {
	exportRowsAsCsv(userRows(users), filename);
}

export async function exportUsersPDF(users: User[], filename: string = 'usuarios.pdf') {
	await exportRowsAsPdf('Usuarios', userRows(users), filename);
}

export function exportAuditLogsCSV(logs: AuditLog[], filename: string = 'auditoria.csv') {
	exportRowsAsCsv(auditRows(logs), filename);
}

export async function exportAuditLogsPDF(logs: AuditLog[], filename: string = 'auditoria.pdf') {
	await exportRowsAsPdf('Auditoria', auditRows(logs), filename);
}
