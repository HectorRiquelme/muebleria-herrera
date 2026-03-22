<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { exportInventoryCSV, exportInventoryPDF } from '$lib/export';
	import { formatDate, formatCurrency, PRODUCT_STATUS_COLORS, PRODUCT_STATUS_LABELS } from '$lib/utils';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const isAdmin = $derived(data.user?.role === 'admin');
	let selected = $state<string[]>([]);
	let loading = $state(false);
	let searchInput = $state(data.filters.search);
	let inventoriedFilter = $state(data.filters.inventoried);
	let yearFilter = $state(data.filters.year);

	function toggleSelect(id: string) {
		if (selected.includes(id)) {
			selected = selected.filter((s) => s !== id);
		} else {
			selected = [...selected, id];
		}
	}

	function toggleAll() {
		if (selected.length === data.products.length) {
			selected = [];
		} else {
			selected = data.products.map((product) => product.id);
		}
	}

	function applyFilters() {
		const params = new URLSearchParams();
		if (searchInput) params.set('q', searchInput);
		if (inventoriedFilter) params.set('inventoried', inventoriedFilter);
		if (yearFilter) params.set('year', yearFilter);
		goto(params.size ? `/inventario?${params.toString()}` : '/inventario');
	}

	function pageHref(pageNumber: number) {
		const params = new URLSearchParams();
		if (data.filters.search) params.set('q', data.filters.search);
		if (data.filters.inventoried) params.set('inventoried', data.filters.inventoried);
		if (data.filters.year) params.set('year', data.filters.year);
		params.set('page', String(pageNumber));
		return `?${params.toString()}`;
	}

	function exportCsv() {
		exportInventoryCSV(data.products as unknown as Parameters<typeof exportInventoryCSV>[0]);
	}

	async function exportPdf() {
		await exportInventoryPDF(data.products as unknown as Parameters<typeof exportInventoryPDF>[0]);
	}
</script>

<svelte:head><title>Inventario — Mueblería Herrera</title></svelte:head>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-xl font-bold text-[#2C2018]">Inventario</h1>
			<p class="text-sm text-[#7A6652]">{data.totalItems} productos · {selected.length} seleccionados</p>
		</div>
		<div class="flex items-center gap-2 flex-wrap justify-end">
			<button onclick={exportCsv} class="btn-secondary text-sm">Exportar CSV</button>
			<button onclick={exportPdf} class="btn-secondary text-sm">Exportar PDF</button>
			{#if selected.length > 0}
				<form method="POST" action="?/markInventory"
					use:enhance={() => { loading = true; return async ({ update }) => { loading = false; selected = []; await update(); }; }}
				>
					{#each selected as id}
						<input type="hidden" name="ids[]" value={id} />
					{/each}
					<button type="submit" class="btn-primary" disabled={loading}>
						{loading ? 'Marcando...' : `Marcar como inventariado (${selected.length})`}
					</button>
				</form>
			{/if}
		</div>
	</div>

	{#if form?.error}
		<div class="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{form.error}</div>
	{/if}
	{#if form?.success}
		<div class="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
			{form.count} producto(s) marcados como inventariados correctamente
		</div>
	{/if}

	<!-- Filters -->
	<div class="card p-4 flex flex-wrap gap-3 items-end">
		<div class="flex-1 min-w-48">
			<label class="label">Buscar</label>
			<input class="input" type="search" placeholder="Nombre o SKU..." bind:value={searchInput} onkeydown={(e) => e.key === 'Enter' && applyFilters()} />
		</div>
		<div class="min-w-40">
			<label class="label">Estado inventario</label>
			<select class="input" bind:value={inventoriedFilter} onchange={applyFilters}>
				<option value="">Todos</option>
				<option value="yes">Inventariados</option>
				<option value="no">Sin inventariar</option>
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

	<div class="card overflow-hidden">
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead class="bg-[#F5F0EB]">
					<tr>
						<th class="px-4 py-3 w-10">
							<input type="checkbox" checked={selected.length === data.products.length && data.products.length > 0} onchange={toggleAll} class="rounded" />
						</th>
						<th class="text-left px-4 py-3 font-medium text-[#7A6652]">Producto</th>
						<th class="text-left px-4 py-3 font-medium text-[#7A6652]">SKU</th>
						<th class="text-left px-4 py-3 font-medium text-[#7A6652]">Categoría</th>
						<th class="text-left px-4 py-3 font-medium text-[#7A6652]">Estado</th>
						<th class="text-left px-4 py-3 font-medium text-[#7A6652]">Precio</th>
						<th class="text-left px-4 py-3 font-medium text-[#7A6652]">Inventario</th>
						{#if isAdmin}
							<th class="text-right px-4 py-3 font-medium text-[#7A6652]">Acciones</th>
						{/if}
					</tr>
				</thead>
				<tbody class="divide-y divide-[#E5E0D8]">
					{#each data.products as product}
						<tr class="hover:bg-[#FAFAF8] {selected.includes(product.id) ? 'bg-[#FFF8F0]' : ''}">
							<td class="px-4 py-3">
								<input
									type="checkbox"
									checked={selected.includes(product.id)}
									onchange={() => toggleSelect(product.id)}
									disabled={product.inventoried}
									class="rounded"
								/>
							</td>
							<td class="px-4 py-3 font-medium text-[#2C2018]">{product.name}</td>
							<td class="px-4 py-3 font-mono text-xs text-[#7A6652]">{product.sku}</td>
							<td class="px-4 py-3 text-[#2C2018]">{product.expand?.category?.name ?? '—'}</td>
							<td class="px-4 py-3">
								<span class="text-xs px-2 py-1 rounded-full {PRODUCT_STATUS_COLORS[product.status] ?? 'bg-gray-100 text-gray-700'}">
									{PRODUCT_STATUS_LABELS[product.status] ?? product.status}
								</span>
							</td>
							<td class="px-4 py-3 font-medium text-[#2C2018]">{formatCurrency(product.price)}</td>
							<td class="px-4 py-3">
								{#if product.inventoried}
									<div>
										<span class="text-xs bg-purple-100 text-purple-800 px-2 py-0.5 rounded">Inventariado</span>
										{#if product.inventoried_at}
											<p class="text-xs text-[#7A6652] mt-1">{formatDate(product.inventoried_at)}</p>
										{/if}
									</div>
								{:else}
									<span class="text-xs text-gray-400">Pendiente</span>
								{/if}
							</td>
							{#if isAdmin}
								<td class="px-4 py-3 text-right">
									{#if product.inventoried}
										<form method="POST" action="?/unmarkInventory" use:enhance={() => async ({ update }) => { await update(); }}>
											<input type="hidden" name="id" value={product.id} />
											<button type="submit" class="text-orange-600 hover:underline text-xs font-medium">
												Desmarcar
											</button>
										</form>
									{/if}
								</td>
							{/if}
						</tr>
					{:else}
						<tr><td colspan={isAdmin ? 8 : 7} class="px-4 py-12 text-center text-[#7A6652]">No se encontraron productos</td></tr>
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
