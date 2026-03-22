<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { exportInvoicesCSV, exportInvoicesPDF } from '$lib/export';
	import { formatDate, formatCurrency } from '$lib/utils';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const isAdmin = $derived(data.user?.role === 'admin');
	let showModal = $state(false);
	let editInvoice = $state<(typeof data.invoices)[0] | null>(null);
	let deleteConfirm = $state<string | null>(null);
	let requestDeleteItem = $state<{ id: string; label: string } | null>(null);
	let requestDeleteNotes = $state('');
	let loading = $state(false);
	let searchInput = $state(data.filters.search);
	let yearFilter = $state(data.filters.year);

	function openEdit(inv: (typeof data.invoices)[0]) { editInvoice = inv; showModal = true; }
	function closeModal() { showModal = false; editInvoice = null; }

	function applyFilters() {
		const params = new URLSearchParams();
		if (searchInput) params.set('q', searchInput);
		if (yearFilter) params.set('year', yearFilter);
		goto(params.size ? `/facturas?${params.toString()}` : '/facturas');
	}

	function pageHref(pageNumber: number) {
		const params = new URLSearchParams();
		if (data.filters.search) params.set('q', data.filters.search);
		if (data.filters.year) params.set('year', data.filters.year);
		params.set('page', String(pageNumber));
		return `?${params.toString()}`;
	}

	function exportCsv() {
		exportInvoicesCSV(data.invoices as unknown as Parameters<typeof exportInvoicesCSV>[0]);
	}

	async function exportPdf() {
		await exportInvoicesPDF(data.invoices as unknown as Parameters<typeof exportInvoicesPDF>[0]);
	}
</script>

<svelte:head><title>Facturas — Mueblería Herrera</title></svelte:head>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-xl font-bold text-[#2C2018]">Facturas</h1>
			<p class="text-sm text-[#7A6652]">{data.totalItems} facturas cargadas</p>
		</div>
		<div class="flex items-center gap-2 flex-wrap">
			<button onclick={exportCsv} class="btn-secondary text-sm">Exportar CSV</button>
			<button onclick={exportPdf} class="btn-secondary text-sm">Exportar PDF</button>
			<button onclick={() => { editInvoice = null; showModal = true; }} class="btn-primary">+ Nueva factura</button>
		</div>
	</div>

	{#if form?.error}
		<div class="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{form.error}</div>
	{/if}

	<div class="card p-4 flex flex-wrap gap-3 items-end">
		<div class="flex-1 min-w-48">
			<label class="label">Buscar</label>
			<input
				class="input"
				type="search"
				placeholder="N° de factura o proveedor..."
				bind:value={searchInput}
				onkeydown={(e) => e.key === 'Enter' && applyFilters()}
			/>
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
						<th class="text-left px-4 py-3 font-medium text-[#7A6652]">N° Factura</th>
						<th class="text-left px-4 py-3 font-medium text-[#7A6652]">Proveedor</th>
						<th class="text-left px-4 py-3 font-medium text-[#7A6652]">Fecha</th>
						<th class="text-left px-4 py-3 font-medium text-[#7A6652]">Total</th>
						<th class="text-left px-4 py-3 font-medium text-[#7A6652]">Archivo</th>
						<th class="text-right px-4 py-3 font-medium text-[#7A6652]">Acciones</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-[#E5E0D8]">
					{#each data.invoices as inv}
						<tr class="hover:bg-[#FAFAF8]">
							<td class="px-4 py-3 font-mono font-medium text-[#2C2018]">#{inv.number}</td>
							<td class="px-4 py-3 text-[#2C2018]">{inv.supplier}</td>
							<td class="px-4 py-3 text-[#7A6652]">{formatDate(inv.date)}</td>
							<td class="px-4 py-3 font-medium text-[#2C2018]">{formatCurrency(inv.total)}</td>
							<td class="px-4 py-3">
								{#if inv.file}
									<a
										href={`${import.meta.env.VITE_PB_URL ?? 'http://localhost:8090'}/api/files/invoices/${inv.id}/${inv.file}`}
										target="_blank"
										class="text-[#8B5E3C] hover:underline text-xs"
									>
										Ver archivo
									</a>
								{:else}
									<span class="text-xs text-gray-400">Sin archivo</span>
								{/if}
							</td>
							<td class="px-4 py-3">
								<div class="flex items-center justify-end gap-2">
									<button onclick={() => openEdit(inv)} class="text-[#8B5E3C] hover:underline text-xs font-medium">Editar</button>
									{#if isAdmin}
										<button onclick={() => (deleteConfirm = inv.id)} class="text-red-600 hover:underline text-xs font-medium">Eliminar</button>
									{:else}
										<button onclick={() => { requestDeleteItem = { id: inv.id, label: `#${inv.number} — ${inv.supplier}` }; requestDeleteNotes = ''; }} class="text-amber-600 hover:underline text-xs font-medium">Solicitar elim.</button>
									{/if}
								</div>
							</td>
						</tr>
					{:else}
						<tr><td colspan="6" class="px-4 py-12 text-center text-[#7A6652]">No hay facturas cargadas</td></tr>
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

{#if showModal}
	<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
		<div class="bg-white rounded-xl shadow-xl w-full max-w-lg">
			<div class="flex items-center justify-between p-6 border-b border-[#E5E0D8]">
				<h2 class="text-lg font-semibold text-[#2C2018]">{editInvoice ? 'Editar factura' : 'Nueva factura'}</h2>
				<button onclick={closeModal} aria-label="Cerrar" class="text-[#7A6652] hover:text-[#2C2018]">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
				</button>
			</div>
			<form method="POST" action={editInvoice ? '?/update' : '?/create'} enctype="multipart/form-data"
				use:enhance={() => { loading = true; return async ({ update }) => { loading = false; await update(); if (!form?.error) closeModal(); }; }}
				class="p-6 space-y-4"
			>
				{#if editInvoice}<input type="hidden" name="id" value={editInvoice.id} />{/if}
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label class="label" for="inv-number">N° Factura *</label>
						<input id="inv-number" name="number" class="input" required value={editInvoice?.number ?? ''} placeholder="0001" />
					</div>
					<div>
						<label class="label" for="inv-date">Fecha *</label>
						<input id="inv-date" name="date" type="date" class="input" required value={editInvoice?.date?.split(' ')[0] ?? ''} />
					</div>
					<div class="col-span-2">
						<label class="label" for="inv-supplier">Proveedor *</label>
						<input id="inv-supplier" name="supplier" class="input" required value={editInvoice?.supplier ?? ''} placeholder="Nombre del proveedor" />
					</div>
					<div>
						<label class="label" for="inv-total">Total *</label>
						<input id="inv-total" name="total" type="number" min="0" step="0.01" class="input" required value={editInvoice?.total ?? ''} placeholder="0.00" />
					</div>
					<div>
						<label class="label" for="inv-file">Archivo (PDF/imagen)</label>
						<input id="inv-file" name="file" type="file" accept=".pdf,image/*" class="input" />
					</div>
					<div class="col-span-2">
						<label class="label" for="inv-notes">Notas</label>
						<textarea id="inv-notes" name="notes" class="input h-20 resize-none" placeholder="Observaciones...">{editInvoice?.notes ?? ''}</textarea>
					</div>
				</div>
				<div class="flex gap-3 justify-end pt-2 border-t border-[#E5E0D8]">
					<button type="button" onclick={closeModal} class="btn-secondary">Cancelar</button>
					<button type="submit" class="btn-primary" disabled={loading}>{loading ? 'Guardando...' : editInvoice ? 'Actualizar' : 'Crear'}</button>
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
					<label class="label" for="rd-notes-inv">Motivo (opcional)</label>
					<textarea id="rd-notes-inv" name="notes" class="input h-20 resize-none" placeholder="Explica el motivo..." bind:value={requestDeleteNotes}></textarea>
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
			<h3 class="text-lg font-semibold text-[#2C2018] mb-2">Eliminar factura</h3>
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
