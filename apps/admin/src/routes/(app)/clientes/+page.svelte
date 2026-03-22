<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { formatDate } from '$lib/utils';
	import { exportClientsExcel } from '$lib/export';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const isAdmin = $derived(data.user?.role === 'admin');
	let showModal = $state($page.url.searchParams.get('new') === '1');
	let editClient = $state<(typeof data.clients)[0] | null>(null);
	let deleteConfirm = $state<string | null>(null);
	let requestDeleteItem = $state<{ id: string; label: string } | null>(null);
	let requestDeleteNotes = $state('');
	let viewClient = $state<(typeof data.clients)[0] | null>(null);
	let loading = $state(false);

	function openEdit(c: (typeof data.clients)[0]) { editClient = c; showModal = true; }
	function closeModal() { showModal = false; editClient = null; }

	let searchInput = $state(data.filters.search);
	let frequentFilter = $state(data.filters.frequent);
	let yearFilter = $state(data.filters.year);

	function applyFilters() {
		const params = new URLSearchParams();
		if (searchInput) params.set('q', searchInput);
		if (frequentFilter) params.set('frequent', frequentFilter);
		if (yearFilter) params.set('year', yearFilter);
		goto(params.size ? `/clientes?${params.toString()}` : '/clientes');
	}

	function pageHref(pageNumber: number) {
		const params = new URLSearchParams();
		if (data.filters.search) params.set('q', data.filters.search);
		if (data.filters.frequent) params.set('frequent', data.filters.frequent);
		if (data.filters.year) params.set('year', data.filters.year);
		params.set('page', String(pageNumber));
		return `?${params.toString()}`;
	}

	async function exportExcel() {
		await exportClientsExcel(data.clients as unknown as Parameters<typeof exportClientsExcel>[0]);
	}
</script>

<svelte:head><title>Clientes — Mueblería Herrera</title></svelte:head>

<div class="space-y-4">
	<div class="flex items-center justify-between flex-wrap gap-3">
		<div>
			<h1 class="text-xl font-bold text-[#2C2018]">Clientes</h1>
			<p class="text-sm text-[#7A6652]">{data.totalItems} clientes registrados</p>
		</div>
		<div class="flex gap-2">
			<button onclick={exportExcel} class="btn-secondary text-sm">Exportar Excel</button>
			<button onclick={() => { editClient = null; showModal = true; }} class="btn-primary">+ Nuevo cliente</button>
		</div>
	</div>

	{#if form?.error}
		<div class="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{form.error}</div>
	{/if}

	<div class="card p-4 flex flex-wrap gap-3 items-end">
		<div class="flex-1 min-w-48">
			<label class="label">Buscar</label>
			<input class="input" type="search" placeholder="Nombre, email o teléfono..." bind:value={searchInput} onkeydown={(e) => e.key === 'Enter' && applyFilters()} />
		</div>
		<div class="min-w-40">
			<label class="label">Tipo</label>
			<select class="input" bind:value={frequentFilter} onchange={applyFilters}>
				<option value="">Todos</option>
				<option value="yes">Solo frecuentes</option>
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

	<div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
		{#each data.clients as client}
			<div class="card p-5">
				<div class="flex items-start justify-between mb-3">
					<div class="flex items-center gap-3">
						<div class="w-10 h-10 rounded-full bg-[#8B5E3C] flex items-center justify-center shrink-0">
							<span class="text-white font-bold text-sm uppercase">{client.name[0]}</span>
						</div>
						<div>
							<p class="font-semibold text-[#2C2018]">{client.name}</p>
							{#if client.is_frequent}
								<span class="text-xs bg-[#D4A853] text-white px-2 py-0.5 rounded">Frecuente</span>
							{/if}
						</div>
					</div>
				</div>
				{#if client.phone}
					<p class="text-sm text-[#7A6652] flex items-center gap-1 mb-1">
						<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/></svg>
						{client.phone}
					</p>
				{/if}
				{#if client.email}
					<p class="text-sm text-[#7A6652] flex items-center gap-1 mb-1">
						<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>
						{client.email}
					</p>
				{/if}
				{#if client.address}
					<p class="text-xs text-[#7A6652] mt-1 line-clamp-1">{client.address}</p>
				{/if}
				<p class="text-xs text-gray-400 mt-2">Registrado {formatDate(client.created)}</p>
				<div class="flex gap-2 mt-4">
					<button onclick={() => openEdit(client)} class="btn-secondary text-xs px-3 py-1.5 flex-1">Editar</button>
					<button onclick={() => (viewClient = client)} class="btn-secondary text-xs px-3 py-1.5">Historial</button>
					{#if isAdmin}
						<button onclick={() => (deleteConfirm = client.id)} class="text-red-600 text-xs border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50">Eliminar</button>
					{:else}
						<button onclick={() => { requestDeleteItem = { id: client.id, label: client.name }; requestDeleteNotes = ''; }} class="text-amber-600 text-xs border border-amber-200 px-3 py-1.5 rounded-lg hover:bg-amber-50">Solicitar elim.</button>
					{/if}
				</div>
			</div>
		{:else}
			<div class="col-span-full text-center py-12 text-[#7A6652]">No hay clientes registrados</div>
		{/each}
	</div>

	{#if data.totalPages > 1}
		<div class="flex items-center justify-between">
			<p class="text-sm text-[#7A6652]">Página {data.currentPage} de {data.totalPages}</p>
			<div class="flex gap-2">
				{#if data.currentPage > 1}<a href={pageHref(data.currentPage - 1)} class="btn-secondary text-xs px-3 py-1.5">Anterior</a>{/if}
				{#if data.currentPage < data.totalPages}<a href={pageHref(data.currentPage + 1)} class="btn-secondary text-xs px-3 py-1.5">Siguiente</a>{/if}
			</div>
		</div>
	{/if}
</div>

{#if showModal}
	<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
		<div class="bg-white rounded-xl shadow-xl w-full max-w-lg">
			<div class="flex items-center justify-between p-6 border-b border-[#E5E0D8]">
				<h2 class="text-lg font-semibold text-[#2C2018]">{editClient ? 'Editar cliente' : 'Nuevo cliente'}</h2>
				<button onclick={closeModal} aria-label="Cerrar" class="text-[#7A6652] hover:text-[#2C2018]">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
				</button>
			</div>
			<form method="POST" action={editClient ? '?/update' : '?/create'}
				use:enhance={() => { loading = true; return async ({ update }) => { loading = false; await update(); if (!form?.error) closeModal(); }; }}
				class="p-6 space-y-4"
			>
				{#if editClient}<input type="hidden" name="id" value={editClient.id} />{/if}
				<div class="grid grid-cols-2 gap-4">
					<div class="col-span-2">
						<label class="label" for="c-name">Nombre *</label>
						<input id="c-name" name="name" class="input" required value={editClient?.name ?? ''} placeholder="Nombre completo" />
					</div>
					<div>
						<label class="label" for="c-phone">Teléfono</label>
						<input id="c-phone" name="phone" class="input" value={editClient?.phone ?? ''} placeholder="+54 9 11 ..." />
					</div>
					<div>
						<label class="label" for="c-email">Email</label>
						<input id="c-email" name="email" type="email" class="input" value={editClient?.email ?? ''} placeholder="email@ejemplo.com" />
					</div>
					<div class="col-span-2">
						<label class="label" for="c-address">Dirección</label>
						<input id="c-address" name="address" class="input" value={editClient?.address ?? ''} placeholder="Dirección completa" />
					</div>
					<div class="col-span-2">
						<label class="label" for="c-notes">Notas</label>
						<textarea id="c-notes" name="notes" class="input h-20 resize-none" placeholder="Observaciones...">{editClient?.notes ?? ''}</textarea>
					</div>
					<div class="col-span-2 flex items-center gap-2">
						<input id="c-frequent" name="is_frequent" type="checkbox" checked={editClient?.is_frequent ?? false} class="rounded" />
						<label for="c-frequent" class="text-sm font-medium text-[#2C2018]">Marcar como cliente frecuente</label>
					</div>
				</div>
				<div class="flex gap-3 justify-end pt-2 border-t border-[#E5E0D8]">
					<button type="button" onclick={closeModal} class="btn-secondary">Cancelar</button>
					<button type="submit" class="btn-primary" disabled={loading}>{loading ? 'Guardando...' : editClient ? 'Actualizar' : 'Crear'}</button>
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
					<label class="label" for="rd-notes-cli">Motivo (opcional)</label>
					<textarea id="rd-notes-cli" name="notes" class="input h-20 resize-none" placeholder="Explica el motivo..." bind:value={requestDeleteNotes}></textarea>
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
			<h3 class="text-lg font-semibold text-[#2C2018] mb-2">Eliminar cliente</h3>
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
