<script lang="ts">
	import type { ActionData, PageData } from './$types';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { exportAuditLogsCSV, exportAuditLogsPDF } from '$lib/export';
	import { formatDateTime, AUDIT_ACTION_LABELS } from '$lib/utils';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let actionFilter = $state(data.filters.action);
	let collectionFilter = $state(data.filters.collection);
	let dateFrom = $state(data.filters.dateFrom);
	let dateTo = $state(data.filters.dateTo);
	let yearFilter = $state(data.filters.year);
	let clearConfirm = $state(false);

	function applyFilters() {
		const params = new URLSearchParams();
		if (actionFilter) params.set('action', actionFilter);
		if (collectionFilter) params.set('collection', collectionFilter);
		if (dateFrom) params.set('from', dateFrom);
		if (dateTo) params.set('to', dateTo);
		if (yearFilter) params.set('year', yearFilter);
		goto(params.size ? `/auditoria?${params.toString()}` : '/auditoria');
	}

	function pageHref(pageNumber: number) {
		const params = new URLSearchParams();
		if (data.filters.action) params.set('action', data.filters.action);
		if (data.filters.collection) params.set('collection', data.filters.collection);
		if (data.filters.dateFrom) params.set('from', data.filters.dateFrom);
		if (data.filters.dateTo) params.set('to', data.filters.dateTo);
		if (data.filters.year) params.set('year', data.filters.year);
		params.set('page', String(pageNumber));
		return `?${params.toString()}`;
	}

	function exportCsv() {
		exportAuditLogsCSV(data.logs as unknown as Parameters<typeof exportAuditLogsCSV>[0]);
	}

	async function exportPdf() {
		await exportAuditLogsPDF(data.logs as unknown as Parameters<typeof exportAuditLogsPDF>[0]);
	}

	const actionColors: Record<string, string> = {
		create: 'bg-green-100 text-green-800',
		update: 'bg-blue-100 text-blue-800',
		delete: 'bg-red-100 text-red-800',
		login: 'bg-purple-100 text-purple-800',
		logout: 'bg-gray-100 text-gray-700',
		inventory_check: 'bg-yellow-100 text-yellow-800',
		export: 'bg-indigo-100 text-indigo-800'
	};

	const collections: Record<string, string> = {
		products: 'Productos',
		categories: 'Categorías',
		invoices: 'Facturas',
		vouchers: 'Ventas',
		voucher_items: 'Items de venta',
		clients: 'Clientes',
		users: 'Usuarios',
		landing_images: 'Landing'
	};
</script>

<svelte:head><title>Auditoría — Mueblería Herrera</title></svelte:head>

<div class="space-y-4">
	<div>
		<div class="flex items-center justify-between gap-3 flex-wrap">
			<div>
				<h1 class="text-xl font-bold text-[#2C2018]">Registro de Auditoría</h1>
				<p class="text-sm text-[#7A6652]">{data.totalItems} eventos registrados</p>
			</div>
			<div class="flex items-center gap-2 flex-wrap">
				<button onclick={exportCsv} class="btn-secondary text-sm">Exportar CSV</button>
				<button onclick={exportPdf} class="btn-secondary text-sm">Exportar PDF</button>
				<button onclick={() => (clearConfirm = true)} class="btn-danger text-sm">Limpiar auditoría</button>
			</div>
		</div>
	</div>

	{#if form?.error}
		<div class="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{form.error}</div>
	{/if}
	{#if form?.success}
		<div class="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
			Se limpiaron {form.cleared ?? 0} registros de auditoría.
		</div>
	{/if}

	<!-- Filters -->
	<div class="card p-4 flex flex-wrap gap-3 items-end">
		<div class="min-w-36">
			<label class="label">Acción</label>
			<select class="input" bind:value={actionFilter} onchange={applyFilters}>
				<option value="">Todas</option>
				{#each Object.entries(AUDIT_ACTION_LABELS) as [val, label]}
					<option value={val}>{label}</option>
				{/each}
			</select>
		</div>
		<div class="min-w-36">
			<label class="label">Colección</label>
			<select class="input" bind:value={collectionFilter} onchange={applyFilters}>
				<option value="">Todas</option>
				{#each Object.entries(collections) as [val, label]}
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

	<!-- Logs -->
	<div class="card overflow-hidden">
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead class="bg-[#F5F0EB]">
					<tr>
						<th class="text-left px-4 py-3 font-medium text-[#7A6652]">Fecha y hora</th>
						<th class="text-left px-4 py-3 font-medium text-[#7A6652]">Usuario</th>
						<th class="text-left px-4 py-3 font-medium text-[#7A6652]">Acción</th>
						<th class="text-left px-4 py-3 font-medium text-[#7A6652]">Módulo</th>
						<th class="text-left px-4 py-3 font-medium text-[#7A6652]">Descripción</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-[#E5E0D8]">
					{#each data.logs as log}
						<tr class="hover:bg-[#FAFAF8]">
							<td class="px-4 py-3 text-[#7A6652] whitespace-nowrap">
								{formatDateTime(log.created)}
							</td>
							<td class="px-4 py-3">
								<div>
									<p class="font-medium text-[#2C2018]">{log.expand?.user?.name ?? log.expand?.user?.email ?? '—'}</p>
									<p class="text-xs text-[#7A6652]">{log.expand?.user?.email ?? ''}</p>
								</div>
							</td>
							<td class="px-4 py-3">
								<span class="text-xs px-2 py-1 rounded-full {actionColors[log.action] ?? 'bg-gray-100 text-gray-700'}">
									{AUDIT_ACTION_LABELS[log.action] ?? log.action}
								</span>
							</td>
							<td class="px-4 py-3 text-[#7A6652]">
								{collections[log.collection] ?? log.collection}
							</td>
							<td class="px-4 py-3 text-[#2C2018]">{log.description}</td>
						</tr>
					{:else}
						<tr><td colspan="5" class="px-4 py-12 text-center text-[#7A6652]">No hay eventos registrados</td></tr>
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

{#if clearConfirm}
	<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
		<div class="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
			<h3 class="text-lg font-semibold text-[#2C2018] mb-2">Limpiar auditoría</h3>
			<p class="text-sm text-[#7A6652] mb-6">Se eliminarán todos los registros. ¿Estás seguro?</p>
			<form method="POST" action="?/clear"
				use:enhance={() => async ({ update }) => { await update(); clearConfirm = false; }}
				class="flex gap-3 justify-end"
			>
				<button type="button" onclick={() => (clearConfirm = false)} class="btn-secondary">Cancelar</button>
				<button type="submit" class="btn-danger">Sí, limpiar</button>
			</form>
		</div>
	</div>
{/if}
