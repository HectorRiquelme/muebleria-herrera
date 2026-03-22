<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import {
		exportProductsCSV,
		exportProductsPDF
	} from '$lib/export';
	import {
		formatCurrency,
		formatDate,
		generateSKU,
		PRODUCT_STATUS_LABELS,
		PRODUCT_STATUS_COLORS
	} from '$lib/utils';
	import { generateBarcodeDataUrl, generateAutoBarcode } from '$lib/barcode';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const user = $derived(data.user);
	const isAdmin = $derived(user?.role === 'admin');

	let showModal = $state($page.url.searchParams.get('new') === '1');
	let editProduct = $state<(typeof data.products)[0] | null>(null);
	let deleteConfirm = $state<string | null>(null);
	let requestDeleteItem = $state<{ id: string; label: string } | null>(null);
	let requestDeleteNotes = $state('');

	let loading = $state(false);
	let barcodePreview = $state('');
	let barcodeValue = $state('');
	let barcodeType = $state<'CODE128' | 'EAN13' | 'QR'>('CODE128');

	async function previewBarcode(value: string) {
		if (!value || typeof window === 'undefined') return;
		barcodePreview = await generateBarcodeDataUrl(value, barcodeType).catch(() => '');
	}

	function autoBarcode() {
		barcodeValue = generateAutoBarcode();
		previewBarcode(barcodeValue);
	}

	function openEdit(product: (typeof data.products)[0]) {
		editProduct = product;
		barcodeValue = product.barcode ?? '';
		barcodeType = (product.barcode_type as 'CODE128' | 'EAN13' | 'QR') ?? 'CODE128';
		if (barcodeValue) previewBarcode(barcodeValue);
	}

	function closeModal() {
		showModal = false;
		editProduct = null;
		barcodePreview = '';
		barcodeValue = '';
	}

	// Filters
	let searchInput = $state(data.filters.search);
	let statusFilter = $state(data.filters.status);
	let categoryFilter = $state(data.filters.category);
	let yearFilter = $state(data.filters.year);

	function applyFilters() {
		const params = new URLSearchParams();
		if (searchInput) params.set('q', searchInput);
		if (statusFilter) params.set('status', statusFilter);
		if (categoryFilter) params.set('category', categoryFilter);
		if (yearFilter) params.set('year', yearFilter);
		goto(params.size ? `/productos?${params.toString()}` : '/productos');
	}

	function pageHref(pageNumber: number) {
		const params = new URLSearchParams();
		if (data.filters.search) params.set('q', data.filters.search);
		if (data.filters.status) params.set('status', data.filters.status);
		if (data.filters.category) params.set('category', data.filters.category);
		if (data.filters.year) params.set('year', data.filters.year);
		params.set('page', String(pageNumber));
		return `?${params.toString()}`;
	}

	function exportCsv() {
		exportProductsCSV(data.products as unknown as Parameters<typeof exportProductsCSV>[0]);
	}

	async function exportPdf() {
		await exportProductsPDF(data.products as unknown as Parameters<typeof exportProductsPDF>[0]);
	}
</script>

<svelte:head>
	<title>Productos — Mueblería Herrera</title>
</svelte:head>

<div class="space-y-4">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-xl font-bold text-[#2C2018]">Productos</h1>
			<p class="text-sm text-[#7A6652]">{data.totalItems} productos registrados</p>
		</div>
		<div class="flex items-center gap-2 flex-wrap">
			<button onclick={exportCsv} class="btn-secondary text-sm">Exportar CSV</button>
			<button onclick={exportPdf} class="btn-secondary text-sm">Exportar PDF</button>
			<button onclick={() => (showModal = true)} class="btn-primary">+ Nuevo producto</button>
		</div>
	</div>

	{#if form?.error}
		<div class="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{form.error}</div>
	{/if}

	<!-- Filters -->
	<div class="card p-4 flex flex-wrap gap-3 items-end">
		<div class="flex-1 min-w-48">
			<label class="label">Buscar</label>
			<input
				class="input"
				type="search"
				placeholder="Nombre, SKU o código de barra..."
				bind:value={searchInput}
				onkeydown={(e) => e.key === 'Enter' && applyFilters()}
			/>
		</div>
		<div class="min-w-36">
			<label class="label">Estado</label>
			<select class="input" bind:value={statusFilter} onchange={applyFilters}>
				<option value="">Todos</option>
				{#each Object.entries(PRODUCT_STATUS_LABELS) as [val, label]}
					<option value={val}>{label}</option>
				{/each}
			</select>
		</div>
		<div class="min-w-36">
			<label class="label">Categoría</label>
			<select class="input" bind:value={categoryFilter} onchange={applyFilters}>
				<option value="">Todas</option>
				{#each data.categories as cat}
					<option value={cat.id}>{cat.name}</option>
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
		<button class="btn-primary" onclick={applyFilters}>Filtrar</button>
	</div>

	<!-- Table -->
	<div class="card overflow-hidden">
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead class="bg-[#F5F0EB]">
					<tr>
						<th class="text-left px-4 py-3 font-medium text-[#7A6652]">Producto</th>
						<th class="text-left px-4 py-3 font-medium text-[#7A6652]">SKU / Código</th>
						<th class="text-left px-4 py-3 font-medium text-[#7A6652]">Categoría</th>
						<th class="text-left px-4 py-3 font-medium text-[#7A6652]">Estado</th>
						<th class="text-left px-4 py-3 font-medium text-[#7A6652]">Precio</th>
						<th class="text-left px-4 py-3 font-medium text-[#7A6652]">Inventario</th>
						<th class="text-right px-4 py-3 font-medium text-[#7A6652]">Acciones</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-[#E5E0D8]">
					{#each data.products as product}
						<tr class="hover:bg-[#FAFAF8]">
							<td class="px-4 py-3">
								<div class="flex items-center gap-3">
									{#if product.photos?.length > 0}
										<img
											src={`${import.meta.env.VITE_PB_URL ?? 'http://localhost:8090'}/api/files/products/${product.id}/${product.photos[0]}?thumb=60x60`}
											alt={product.name}
											class="w-10 h-10 rounded-lg object-cover border border-[#E5E0D8]"
										/>
									{:else}
										<div class="w-10 h-10 rounded-lg bg-[#F5F0EB] flex items-center justify-center border border-[#E5E0D8]">
											<svg class="w-5 h-5 text-[#7A6652]" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" d="M21 19V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2z"/>
											</svg>
										</div>
									{/if}
									<div>
										<p class="font-medium text-[#2C2018]">{product.name}</p>
										{#if product.description}
											<p class="text-xs text-[#7A6652] line-clamp-1">{product.description}</p>
										{/if}
									</div>
								</div>
							</td>
							<td class="px-4 py-3">
								<p class="font-mono text-xs text-[#2C2018]">{product.sku}</p>
								{#if product.barcode}
									<p class="font-mono text-xs text-[#7A6652]">{product.barcode}</p>
								{/if}
							</td>
							<td class="px-4 py-3 text-[#2C2018]">
								{product.expand?.category?.name ?? '—'}
							</td>
							<td class="px-4 py-3">
								<span class="text-xs px-2 py-1 rounded-full {PRODUCT_STATUS_COLORS[product.status] ?? 'bg-gray-100 text-gray-700'}">
									{PRODUCT_STATUS_LABELS[product.status] ?? product.status}
								</span>
							</td>
							<td class="px-4 py-3 font-medium text-[#2C2018]">
								{formatCurrency(product.price)}
							</td>
							<td class="px-4 py-3">
								{#if product.inventoried}
									<span class="text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
										Inventariado {product.inventoried_at ? formatDate(product.inventoried_at) : ''}
									</span>
								{:else}
									<span class="text-xs text-gray-400">No inventariado</span>
								{/if}
							</td>
							<td class="px-4 py-3">
								<div class="flex items-center justify-end gap-2">
									<button
										onclick={() => openEdit(product)}
										class="text-[#8B5E3C] hover:underline text-xs font-medium"
									>
										Editar
									</button>
									<a
										href="/productos/{product.id}"
										class="text-[#8B5E3C] hover:underline text-xs font-medium"
									>
										Ver
									</a>
									{#if isAdmin}
										<button
											onclick={() => (deleteConfirm = product.id)}
											class="text-red-600 hover:underline text-xs font-medium"
										>
											Eliminar
										</button>
									{:else}
										<button
											onclick={() => { requestDeleteItem = { id: product.id, label: product.name }; requestDeleteNotes = ''; }}
											class="text-amber-600 hover:underline text-xs font-medium"
										>
											Solicitar eliminación
										</button>
									{/if}
								</div>
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="7" class="px-4 py-12 text-center text-[#7A6652]">
								No se encontraron productos
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Pagination -->
		{#if data.totalPages > 1}
			<div class="flex items-center justify-between px-4 py-3 border-t border-[#E5E0D8]">
				<p class="text-sm text-[#7A6652]">
					Página {data.currentPage} de {data.totalPages}
				</p>
				<div class="flex gap-2">
					{#if data.currentPage > 1}
						<a href={pageHref(data.currentPage - 1)} class="btn-secondary text-xs px-3 py-1.5">Anterior</a>
					{/if}
					{#if data.currentPage < data.totalPages}
						<a href={pageHref(data.currentPage + 1)} class="btn-secondary text-xs px-3 py-1.5">Siguiente</a>
					{/if}
				</div>
			</div>
		{/if}
	</div>
</div>

<!-- Create/Edit Modal -->
{#if showModal || editProduct}
	<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
		<div class="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
			<div class="flex items-center justify-between p-6 border-b border-[#E5E0D8]">
				<h2 class="text-lg font-semibold text-[#2C2018]">
					{editProduct ? 'Editar producto' : 'Nuevo producto'}
				</h2>
				<button onclick={closeModal} aria-label="Cerrar" class="text-[#7A6652] hover:text-[#2C2018]">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
					</svg>
				</button>
			</div>

			<form
				method="POST"
				action={editProduct ? '?/update' : '?/create'}
				enctype="multipart/form-data"
				use:enhance={() => {
					loading = true;
					return async ({ update }) => {
						loading = false;
						await update();
						if (!form?.error) closeModal();
					};
				}}
				class="p-6 space-y-4"
			>
				{#if editProduct}
					<input type="hidden" name="id" value={editProduct.id} />
				{/if}

				<div class="grid grid-cols-2 gap-4">
					<div class="col-span-2">
						<label class="label" for="name">Nombre del producto *</label>
						<input
							id="name"
							name="name"
							class="input"
							required
							value={editProduct?.name ?? ''}
							placeholder="Silla comedor tapizada"
						/>
					</div>

					<div>
						<label class="label" for="sku">SKU</label>
						<div class="flex gap-2">
							<input
								id="sku"
								name="sku"
								class="input"
								value={editProduct?.sku ?? generateSKU()}
								placeholder="MH-PROD-001"
							/>
						</div>
					</div>

					<div>
						<label class="label" for="price">Precio *</label>
						<input
							id="price"
							name="price"
							class="input"
							type="number"
							min="0"
							step="0.01"
							required
							value={editProduct?.price ?? ''}
							placeholder="0.00"
						/>
					</div>

					<div>
						<label class="label" for="cost">Costo</label>
						<input
							id="cost"
							name="cost"
							class="input"
							type="number"
							min="0"
							step="0.01"
							value={editProduct?.cost ?? ''}
							placeholder="0.00"
						/>
					</div>

					<div>
						<label class="label" for="category">Categoría *</label>
						<select id="category" name="category" class="input" required>
							<option value="">Seleccionar categoría</option>
							{#each data.categories as cat}
								<option value={cat.id} selected={editProduct?.category === cat.id}>
									{cat.name}
								</option>
							{/each}
						</select>
					</div>

					<div>
						<label class="label" for="status">Estado</label>
						<select id="status" name="status" class="input">
							{#each Object.entries(PRODUCT_STATUS_LABELS) as [val, label]}
								<option value={val} selected={editProduct?.status === val}>{label}</option>
							{/each}
						</select>
					</div>

					<div class="col-span-2">
						<label class="label">Código de barra</label>
						<div class="flex gap-2 mb-2">
							<select
								bind:value={barcodeType}
								name="barcode_type"
								class="input w-32"
								onchange={() => barcodeValue && previewBarcode(barcodeValue)}
							>
								<option value="CODE128">CODE128</option>
								<option value="EAN13">EAN13</option>
								<option value="QR">QR Code</option>
							</select>
							<input
								name="barcode"
								class="input flex-1"
								bind:value={barcodeValue}
								oninput={() => previewBarcode(barcodeValue)}
								placeholder="Ingresá o generá un código..."
							/>
							<button
								type="button"
								onclick={autoBarcode}
								class="btn-secondary whitespace-nowrap"
							>
								Auto
							</button>
						</div>
						{#if barcodePreview}
							<div class="mt-2 p-3 bg-white border border-[#E5E0D8] rounded-lg inline-block">
								<img src={barcodePreview} alt="Barcode preview" class="max-h-16" />
							</div>
						{/if}
					</div>

					<div class="col-span-2">
						<label class="label" for="description">Descripción</label>
						<textarea
							id="description"
							name="description"
							class="input h-20 resize-none"
							placeholder="Descripción del producto..."
						>{editProduct?.description ?? ''}</textarea>
					</div>

					<div class="col-span-2">
						<label class="label" for="photos">Fotos del producto</label>
						<input
							id="photos"
							name="photos"
							type="file"
							accept="image/*"
							multiple
							class="input"
						/>
						{#if editProduct && editProduct.photos && editProduct.photos.length > 0}
							<div class="flex gap-2 mt-2 flex-wrap">
								{#each editProduct.photos as photo}
									<img
										src={`${import.meta.env.VITE_PB_URL ?? 'http://localhost:8090'}/api/files/products/${editProduct?.id ?? ''}/${photo}?thumb=80x80`}
										alt="Foto del producto"
										class="w-16 h-16 rounded-lg object-cover border border-[#E5E0D8]"
									/>
								{/each}
							</div>
						{/if}
					</div>
				</div>

				<div class="flex gap-3 justify-end pt-2 border-t border-[#E5E0D8]">
					<button type="button" onclick={closeModal} class="btn-secondary">Cancelar</button>
					<button type="submit" class="btn-primary" disabled={loading}>
						{loading ? 'Guardando...' : editProduct ? 'Actualizar' : 'Crear producto'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Request Delete Modal (worker) -->
{#if requestDeleteItem}
	<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
		<div class="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
			<h3 class="text-lg font-semibold text-[#2C2018] mb-1">Solicitar eliminación</h3>
			<p class="text-sm text-[#7A6652] mb-4">
				Se enviará una solicitud al administrador para eliminar: <strong>{requestDeleteItem.label}</strong>
			</p>
			<form
				method="POST"
				action="?/requestDelete"
				use:enhance={() => {
					return async ({ update }) => {
						await update();
						requestDeleteItem = null;
						requestDeleteNotes = '';
					};
				}}
			>
				<input type="hidden" name="id" value={requestDeleteItem.id} />
				<input type="hidden" name="label" value={requestDeleteItem.label} />
				<div class="mb-4">
					<label class="label" for="rd-notes-prod">Motivo (opcional)</label>
					<textarea id="rd-notes-prod" name="notes" class="input h-20 resize-none" placeholder="Explica el motivo de la eliminación..." bind:value={requestDeleteNotes}></textarea>
				</div>
				<div class="flex gap-3 justify-end">
					<button type="button" onclick={() => (requestDeleteItem = null)} class="btn-secondary">Cancelar</button>
					<button type="submit" class="btn-primary">Enviar solicitud</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- Delete Confirm Modal -->
{#if deleteConfirm}
	<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
		<div class="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
			<h3 class="text-lg font-semibold text-[#2C2018] mb-2">Confirmar eliminación</h3>
			<p class="text-sm text-[#7A6652] mb-6">
				Esta acción no se puede deshacer. ¿Estás seguro de eliminar este producto?
			</p>
			<form
				method="POST"
				action="?/delete"
				use:enhance={() => {
					return async ({ update }) => {
						await update();
						deleteConfirm = null;
					};
				}}
				class="flex gap-3 justify-end"
			>
				<input type="hidden" name="id" value={deleteConfirm} />
				<button type="button" onclick={() => (deleteConfirm = null)} class="btn-secondary">
					Cancelar
				</button>
				<button type="submit" class="btn-danger">Eliminar</button>
			</form>
		</div>
	</div>
{/if}
