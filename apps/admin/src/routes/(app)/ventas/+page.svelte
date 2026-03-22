<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { formatDate, formatCurrency, VOUCHER_STATUS_LABELS, PAYMENT_METHOD_LABELS } from '$lib/utils';
	import {
		exportMultipleVouchersPDF,
		exportVoucherPDF,
		exportVouchersCSV,
		exportVouchersPDF
	} from '$lib/export';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const isAdmin = $derived(data.user?.role === 'admin');

	let showModal = $state($page.url.searchParams.get('new') === '1');
	let editVoucher = $state<(typeof data.vouchers)[0] | null>(null);
	let deleteConfirm = $state<string | null>(null);
	let requestDeleteItem = $state<{ id: string; label: string } | null>(null);
	let requestDeleteNotes = $state('');
	let loading = $state(false);

	// New voucher items
	let cartItems = $state<{ product_id: string; name: string; price: number; quantity: number }[]>([]);
	let selectedProduct = $state('');
	let barcodeSearch = $state('');
	let barcodeError = $state('');

	function addToCart() {
		const product = data.products.find((product) => product.id === selectedProduct);
		if (!product) return;
		if (cartItems.find((i) => i.product_id === product.id)) return;
		cartItems = [...cartItems, { product_id: product.id, name: product.name, price: product.price, quantity: 1 }];
		selectedProduct = '';
	}

	function addByBarcode() {
		const code = barcodeSearch.trim();
		if (!code) return;
		const product = data.products.find(
			(p) => p.barcode === code || p.sku === code
		);
		barcodeError = '';
		if (!product) {
			barcodeError = `No se encontró ningún producto disponible con el código "${code}"`;
			barcodeSearch = '';
			return;
		}
		if (cartItems.find((i) => i.product_id === product.id)) {
			barcodeError = `"${product.name}" ya está en el carrito`;
			barcodeSearch = '';
			return;
		}
		cartItems = [...cartItems, { product_id: product.id, name: product.name, price: product.price, quantity: 1 }];
		barcodeSearch = '';
	}

	function removeFromCart(pid: string) {
		cartItems = cartItems.filter((i) => i.product_id !== pid);
	}

	const cartTotal = $derived(cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0));

	function closeModal() { showModal = false; editVoucher = null; cartItems = []; }

	// Filters
	let searchInput = $state(data.filters.search);
	let statusFilter = $state(data.filters.status);
	let dateFrom = $state(data.filters.dateFrom);
	let dateTo = $state(data.filters.dateTo);
	let yearFilter = $state(data.filters.year);

	function applyFilters() {
		const params = new URLSearchParams();
		if (searchInput) params.set('q', searchInput);
		if (statusFilter) params.set('status', statusFilter);
		if (dateFrom) params.set('from', dateFrom);
		if (dateTo) params.set('to', dateTo);
		if (yearFilter) params.set('year', yearFilter);
		goto(params.size ? `/ventas?${params.toString()}` : '/ventas');
	}

	function pageHref(pageNumber: number) {
		const params = new URLSearchParams();
		if (data.filters.search) params.set('q', data.filters.search);
		if (data.filters.status) params.set('status', data.filters.status);
		if (data.filters.dateFrom) params.set('from', data.filters.dateFrom);
		if (data.filters.dateTo) params.set('to', data.filters.dateTo);
		if (data.filters.clientId) params.set('client', data.filters.clientId);
		if (data.filters.year) params.set('year', data.filters.year);
		params.set('page', String(pageNumber));
		return `?${params.toString()}`;
	}

	// Selection for bulk export
	let selectedIds = $state<string[]>([]);

	function toggleSelect(id: string) {
		selectedIds = selectedIds.includes(id) ? selectedIds.filter((s) => s !== id) : [...selectedIds, id];
	}

	async function exportSelectedPDF() {
		const selected = data.vouchers.filter((voucher) => selectedIds.includes(voucher.id));
		await exportMultipleVouchersPDF(selected as unknown as Parameters<typeof exportMultipleVouchersPDF>[0]);
	}

	function exportCsv() {
		exportVouchersCSV(data.vouchers as unknown as Parameters<typeof exportVouchersCSV>[0]);
	}

	async function exportPdf() {
		await exportVouchersPDF(data.vouchers as unknown as Parameters<typeof exportVouchersPDF>[0]);
	}

	async function exportSinglePDF(voucher: (typeof data.vouchers)[0]) {
		const items = await fetch(`/api/voucher-items/${voucher.id}`).then((r) => r.json()).catch(() => []);
		await exportVoucherPDF(
			voucher as unknown as Parameters<typeof exportVoucherPDF>[0],
			items,
			voucher.expand?.client as unknown as Parameters<typeof exportVoucherPDF>[2]
		);
	}
</script>

<svelte:head><title>Ventas — Mueblería Herrera</title></svelte:head>

<div class="space-y-4">
	<div class="flex items-center justify-between flex-wrap gap-3">
		<div>
			<h1 class="text-xl font-bold text-[#2C2018]">Ventas</h1>
			<p class="text-sm text-[#7A6652]">{data.totalItems} ventas registradas</p>
		</div>
		<div class="flex items-center gap-2 flex-wrap">
			{#if selectedIds.length > 0}
				<button onclick={exportSelectedPDF} class="btn-secondary text-sm">
					PDF seleccionados ({selectedIds.length})
				</button>
			{/if}
			<button onclick={exportCsv} class="btn-secondary text-sm">Exportar CSV</button>
			<button onclick={exportPdf} class="btn-secondary text-sm">Exportar PDF</button>
			<button onclick={() => { editVoucher = null; showModal = true; }} class="btn-primary">+ Nueva venta</button>
		</div>
	</div>

	{#if form?.error}
		<div class="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{form.error}</div>
	{/if}

	<!-- Filters -->
	<div class="card p-4 flex flex-wrap gap-3 items-end">
		<div class="flex-1 min-w-40">
			<label class="label">N° Comprobante</label>
			<input class="input" type="search" placeholder="Buscar..." bind:value={searchInput} onkeydown={(e) => e.key === 'Enter' && applyFilters()} />
		</div>
		<div class="min-w-36">
			<label class="label">Estado</label>
			<select class="input" bind:value={statusFilter} onchange={applyFilters}>
				<option value="">Todos</option>
				{#each Object.entries(VOUCHER_STATUS_LABELS) as [val, label]}
					<option value={val}>{label}</option>
				{/each}
			</select>
		</div>
		<div class="min-w-32">
			<label class="label">Año</label>
			<select class="input" bind:value={yearFilter} onchange={applyFilters}>
				<option value="">Todos</option>
				{#each data.years as year}
					<option value={year}>{year}</option>
				{/each}
			</select>
		</div>
		<div class="min-w-32">
			<label class="label">Desde</label>
			<input class="input" type="date" bind:value={dateFrom} onchange={applyFilters} />
		</div>
		<div class="min-w-32">
			<label class="label">Hasta</label>
			<input class="input" type="date" bind:value={dateTo} onchange={applyFilters} />
		</div>
		<button class="btn-primary" onclick={applyFilters}>Filtrar</button>
	</div>

	<!-- Table -->
	<div class="card overflow-hidden">
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead class="bg-[#F5F0EB]">
					<tr>
						<th class="px-4 py-3 w-10"></th>
						<th class="text-left px-4 py-3 font-medium text-[#7A6652]">Comprobante</th>
						<th class="text-left px-4 py-3 font-medium text-[#7A6652]">Fecha</th>
						<th class="text-left px-4 py-3 font-medium text-[#7A6652]">Cliente</th>
						<th class="text-left px-4 py-3 font-medium text-[#7A6652]">Pago</th>
						<th class="text-left px-4 py-3 font-medium text-[#7A6652]">Total</th>
						<th class="text-left px-4 py-3 font-medium text-[#7A6652]">Estado</th>
						<th class="text-right px-4 py-3 font-medium text-[#7A6652]">Acciones</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-[#E5E0D8]">
					{#each data.vouchers as voucher}
						<tr class="hover:bg-[#FAFAF8] {selectedIds.includes(voucher.id) ? 'bg-[#FFF8F0]' : ''}">
							<td class="px-4 py-3">
								<input type="checkbox" checked={selectedIds.includes(voucher.id)} onchange={() => toggleSelect(voucher.id)} class="rounded" />
							</td>
							<td class="px-4 py-3 font-mono font-medium text-[#2C2018]">#{voucher.number}</td>
							<td class="px-4 py-3 text-[#7A6652]">{formatDate(voucher.date)}</td>
							<td class="px-4 py-3 text-[#2C2018]">{voucher.expand?.client?.name ?? '—'}</td>
							<td class="px-4 py-3 text-[#7A6652]">{PAYMENT_METHOD_LABELS[voucher.payment_method] ?? voucher.payment_method}</td>
							<td class="px-4 py-3 font-medium text-[#2C2018]">{formatCurrency(voucher.total)}</td>
							<td class="px-4 py-3">
								<span class="text-xs px-2 py-0.5 rounded {voucher.status === 'completado' ? 'bg-green-100 text-green-800' : voucher.status === 'cancelado' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}">
									{VOUCHER_STATUS_LABELS[voucher.status] ?? voucher.status}
								</span>
							</td>
							<td class="px-4 py-3">
								<div class="flex items-center justify-end gap-2">
									<button onclick={() => exportSinglePDF(voucher)} class="text-[#8B5E3C] hover:underline text-xs font-medium">PDF</button>
									<button onclick={() => { editVoucher = voucher; showModal = true; }} class="text-[#8B5E3C] hover:underline text-xs font-medium">Editar</button>
									{#if isAdmin}
										<button onclick={() => (deleteConfirm = voucher.id)} class="text-red-600 hover:underline text-xs font-medium">Eliminar</button>
									{:else}
										<button onclick={() => { requestDeleteItem = { id: voucher.id, label: `#${voucher.number}` }; requestDeleteNotes = ''; }} class="text-amber-600 hover:underline text-xs font-medium">Solicitar elim.</button>
									{/if}
								</div>
							</td>
						</tr>
					{:else}
						<tr><td colspan="8" class="px-4 py-12 text-center text-[#7A6652]">No hay ventas registradas</td></tr>
					{/each}
				</tbody>
			</table>
		</div>
		{#if data.totalPages > 1}
			<div class="flex items-center justify-between px-4 py-3 border-t border-[#E5E0D8]">
				<p class="text-sm text-[#7A6652]">Página {data.currentPage} de {data.totalPages}</p>
				<div class="flex gap-2">
					{#if data.currentPage > 1}<a href={pageHref(data.currentPage - 1)} class="btn-secondary text-xs px-3 py-1.5">Anterior</a>{/if}
					{#if data.currentPage < data.totalPages}<a href={pageHref(data.currentPage + 1)} class="btn-secondary text-xs px-3 py-1.5">Siguiente</a>{/if}
				</div>
			</div>
		{/if}
	</div>
</div>

<!-- New/Edit Voucher Modal -->
{#if showModal}
	<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
		<div class="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
			<div class="flex items-center justify-between p-6 border-b border-[#E5E0D8]">
				<h2 class="text-lg font-semibold text-[#2C2018]">{editVoucher ? 'Editar venta' : 'Nueva venta'}</h2>
				<button onclick={closeModal} aria-label="Cerrar" class="text-[#7A6652] hover:text-[#2C2018]">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
				</button>
			</div>
			<form
				method="POST"
				action={editVoucher ? '?/update' : '?/create'}
				enctype="multipart/form-data"
				use:enhance={({ formData }) => {
					if (!editVoucher && cartItems.length > 0) {
						formData.set('items', JSON.stringify(cartItems.map((i) => ({
							product: i.product_id,
							quantity: i.quantity,
							unit_price: i.price
						}))));
						formData.set('total', String(cartTotal));
					}
					loading = true;
					return async ({ update }) => {
						loading = false;
						await update();
						if (!form?.error) closeModal();
					};
				}}
				class="p-6 space-y-4"
			>
				{#if editVoucher}<input type="hidden" name="id" value={editVoucher.id} />{/if}

				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="label" for="v-number">N° Comprobante *</label>
						<input id="v-number" name="number" class="input" required value={editVoucher?.number ?? ''} placeholder="0001" />
					</div>
					<div>
						<label class="label" for="v-date">Fecha *</label>
						<input id="v-date" name="date" type="date" class="input" required value={editVoucher?.date?.split(' ')[0] ?? new Date().toISOString().split('T')[0]} />
					</div>
					<div>
						<label class="label" for="v-client">Cliente</label>
						<select id="v-client" name="client" class="input">
							<option value="">Sin cliente</option>
							{#each data.clients as client}
								<option value={client.id} selected={editVoucher?.client === client.id}>{client.name}</option>
							{/each}
						</select>
					</div>
					<div>
						<label class="label" for="v-payment">Método de pago *</label>
						<select id="v-payment" name="payment_method" class="input" required>
							{#each Object.entries(PAYMENT_METHOD_LABELS) as [val, label]}
								<option value={val} selected={editVoucher?.payment_method === val}>{label}</option>
							{/each}
						</select>
					</div>
					<div>
						<label class="label" for="v-status">Estado</label>
						<select id="v-status" name="status" class="input">
							{#each Object.entries(VOUCHER_STATUS_LABELS) as [val, label]}
								<option value={val} selected={editVoucher?.status === val}>{label}</option>
							{/each}
						</select>
					</div>
					<div>
						<label class="label" for="v-images">Imágenes de voucher</label>
						<input id="v-images" name="images" type="file" accept="image/*" multiple class="input" />
					</div>
				</div>

				{#if !editVoucher}
					<!-- Cart / Products -->
					<div class="border-t border-[#E5E0D8] pt-4">
						<h3 class="font-medium text-[#2C2018] mb-3">Productos</h3>

						<!-- Barcode / SKU search -->
						<div class="flex gap-2 mb-2">
							<div class="relative flex-1">
								<svg class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A6652]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" d="M4 6h1M4 10h1M4 14h1M4 18h1M8 6h1M8 18h1M12 6h4M12 18h4M18 6h1M18 10h1M18 14h1M18 18h1"/>
								</svg>
								<input
									type="text"
									class="input pl-9"
									placeholder="Escanear o ingresar código de barras / SKU..."
									bind:value={barcodeSearch}
									onkeydown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addByBarcode(); } }}
									autocomplete="off"
								/>
							</div>
							<button type="button" onclick={addByBarcode} class="btn-secondary px-4 whitespace-nowrap">Buscar</button>
						</div>
						{#if barcodeError}
							<p class="text-xs text-red-600 mb-2">{barcodeError}</p>
						{/if}

						<!-- Manual select -->
						<div class="flex gap-2 mb-3">
							<select class="input flex-1" bind:value={selectedProduct}>
								<option value="">O seleccionar por nombre...</option>
								{#each data.products as product}
									<option value={product.id}>{product.name} — {formatCurrency(product.price)}</option>
								{/each}
							</select>
							<button type="button" onclick={addToCart} class="btn-primary px-4">Agregar</button>
						</div>
						{#if cartItems.length === 0}
							<p class="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
								Agregá al menos un producto para poder registrar la venta.
							</p>
						{:else}
							<div class="space-y-2">
								{#each cartItems as item}
									<div class="flex items-center gap-3 bg-[#FAFAF8] rounded-lg p-3">
										<div class="flex-1">
											<p class="text-sm font-medium text-[#2C2018]">{item.name}</p>
											<p class="text-xs text-[#7A6652]">{formatCurrency(item.price)} c/u</p>
										</div>
										<input
											type="number"
											min="1"
											bind:value={item.quantity}
											class="input w-16 text-center"
										/>
										<p class="text-sm font-medium w-24 text-right">{formatCurrency(item.price * item.quantity)}</p>
										<button type="button" onclick={() => removeFromCart(item.product_id)} class="text-red-500 hover:text-red-700">
											<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
										</button>
									</div>
								{/each}
								<div class="flex justify-end pt-2">
									<p class="text-lg font-bold text-[#2C2018]">Total: {formatCurrency(cartTotal)}</p>
								</div>
							</div>
						{/if}
					</div>
				{:else}
					<div>
						<label class="label" for="v-total">Total</label>
						<input id="v-total" name="total" type="number" min="0" step="0.01" class="input" value={editVoucher.total} />
					</div>
				{/if}

				<div>
					<label class="label" for="v-notes">Notas</label>
					<textarea id="v-notes" name="notes" class="input h-20 resize-none" placeholder="Observaciones...">{editVoucher?.notes ?? ''}</textarea>
				</div>

				<div class="flex gap-3 justify-end pt-2 border-t border-[#E5E0D8]">
					<button type="button" onclick={closeModal} class="btn-secondary">Cancelar</button>
					<button
						type="submit"
						class="btn-primary"
						disabled={loading || (!editVoucher && cartItems.length === 0)}
					>
						{loading ? 'Guardando...' : editVoucher ? 'Actualizar' : 'Registrar venta'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

{#if requestDeleteItem}
	<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
		<div class="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
			<h3 class="text-lg font-semibold text-[#2C2018] mb-1">Solicitar eliminación</h3>
			<p class="text-sm text-[#7A6652] mb-4">Se enviará una solicitud al administrador para eliminar: <strong>{requestDeleteItem.label}</strong></p>
			<form method="POST" action="?/requestDelete"
				use:enhance={() => async ({ update }) => { await update(); requestDeleteItem = null; requestDeleteNotes = ''; }}
			>
				<input type="hidden" name="id" value={requestDeleteItem.id} />
				<input type="hidden" name="label" value={requestDeleteItem.label} />
				<div class="mb-4">
					<label class="label" for="rd-notes-vou">Motivo (opcional)</label>
					<textarea id="rd-notes-vou" name="notes" class="input h-20 resize-none" placeholder="Explica el motivo..." bind:value={requestDeleteNotes}></textarea>
				</div>
				<div class="flex gap-3 justify-end">
					<button type="button" onclick={() => (requestDeleteItem = null)} class="btn-secondary">Cancelar</button>
					<button type="submit" class="btn-primary">Enviar solicitud</button>
				</div>
			</form>
		</div>
	</div>
{/if}

{#if deleteConfirm}
	<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
		<div class="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
			<h3 class="text-lg font-semibold text-[#2C2018] mb-2">Eliminar venta</h3>
			<p class="text-sm text-[#7A6652] mb-6">¿Confirmar eliminación?</p>
			<form method="POST" action="?/delete"
				use:enhance={() => async ({ update }) => { await update(); deleteConfirm = null; }}
				class="flex gap-3 justify-end"
			>
				<input type="hidden" name="id" value={deleteConfirm} />
				<button type="button" onclick={() => (deleteConfirm = null)} class="btn-secondary">Cancelar</button>
				<button type="submit" class="btn-danger">Eliminar</button>
			</form>
		</div>
	</div>
{/if}
