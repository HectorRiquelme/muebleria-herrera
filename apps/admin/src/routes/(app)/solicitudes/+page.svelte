<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import { formatDateTime } from '$lib/utils';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const collectionLabels: Record<string, string> = {
		products: 'Productos',
		categories: 'Categorías',
		invoices: 'Facturas',
		vouchers: 'Ventas',
		clients: 'Clientes'
	};
</script>

<svelte:head><title>Solicitudes de Eliminación — Mueblería Herrera</title></svelte:head>

<div class="space-y-6">

	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-xl font-bold text-[#2C2018]">Solicitudes de Eliminación</h1>
			<p class="text-sm text-[#7A6652]">
				{(data.pending as unknown[]).length} solicitud{(data.pending as unknown[]).length !== 1 ? 'es' : ''} pendiente{(data.pending as unknown[]).length !== 1 ? 's' : ''}
			</p>
		</div>
	</div>

	{#if form?.error}
		<div class="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{form.error}</div>
	{/if}
	{#if form?.success}
		<div class="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
			Solicitud {form.action === 'approved' ? 'aprobada — el elemento fue eliminado' : 'rechazada — el elemento fue restaurado'}
		</div>
	{/if}

	<!-- Pending requests -->
	<div class="card overflow-hidden">
		<div class="px-4 py-3 border-b border-[#E5E0D8] flex items-center gap-2">
			<div class="w-2 h-2 rounded-full bg-amber-500"></div>
			<h2 class="font-semibold text-[#2C2018]">Pendientes de revisión</h2>
			{#if (data.pending as unknown[]).length > 0}
				<span class="ml-auto bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-0.5 rounded-full">
					{(data.pending as unknown[]).length}
				</span>
			{/if}
		</div>

		{#if (data.pending as unknown[]).length === 0}
			<div class="text-center py-12 text-[#7A6652]">
				<svg class="w-10 h-10 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
				</svg>
				<p>No hay solicitudes pendientes</p>
				<p class="text-sm mt-1">Cuando un trabajador pida eliminar algo, aparecerá aquí</p>
			</div>
		{:else}
			<div class="divide-y divide-[#E5E0D8]">
				{#each data.pending as req}
					<div class="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
						<div class="flex-1">
							<div class="flex items-center gap-2 mb-1">
								<span class="text-xs font-medium bg-amber-100 text-amber-800 px-2 py-0.5 rounded">
									{collectionLabels[req.collection_name] ?? req.collection_name}
								</span>
								<span class="text-xs text-[#7A6652]">{formatDateTime(req.created)}</span>
							</div>
							<p class="font-medium text-[#2C2018]">{req.record_label}</p>
							{#if req.notes}
								<p class="text-sm text-[#7A6652] mt-0.5">"{req.notes}"</p>
							{/if}
							<p class="text-xs text-[#7A6652] mt-1">
								Solicitado por:
								<span class="font-medium text-[#2C2018]">
									{req.expand?.requested_by?.name ?? req.expand?.requested_by?.email ?? '—'}
								</span>
							</p>
						</div>
						<div class="flex gap-2 shrink-0">
							<form method="POST" action="?/reject"
								use:enhance={() => async ({ update }) => { await update(); }}
							>
								<input type="hidden" name="request_id" value={req.id} />
								<button type="submit" class="btn-secondary text-sm px-4">
									Rechazar
								</button>
							</form>
							<form method="POST" action="?/approve"
								use:enhance={() => async ({ update }) => { await update(); }}
							>
								<input type="hidden" name="request_id" value={req.id} />
								<button type="submit" class="btn-danger text-sm px-4">
									Aprobar y eliminar
								</button>
							</form>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Resolved requests -->
	{#if (data.resolved as unknown[]).length > 0}
		<div class="card overflow-hidden">
			<div class="px-4 py-3 border-b border-[#E5E0D8]">
				<h2 class="font-semibold text-[#2C2018]">Historial de solicitudes resueltas</h2>
			</div>
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead class="bg-[#F5F0EB]">
						<tr>
							<th class="text-left px-4 py-3 font-medium text-[#7A6652]">Registro</th>
							<th class="text-left px-4 py-3 font-medium text-[#7A6652]">Módulo</th>
							<th class="text-left px-4 py-3 font-medium text-[#7A6652]">Solicitado por</th>
							<th class="text-left px-4 py-3 font-medium text-[#7A6652]">Fecha solicitud</th>
							<th class="text-left px-4 py-3 font-medium text-[#7A6652]">Resultado</th>
							<th class="text-left px-4 py-3 font-medium text-[#7A6652]">Resuelto por</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-[#E5E0D8]">
						{#each data.resolved as req}
							<tr class="hover:bg-[#FAFAF8]">
								<td class="px-4 py-3 font-medium text-[#2C2018]">{req.record_label}</td>
								<td class="px-4 py-3 text-[#7A6652]">
									{collectionLabels[req.collection_name] ?? req.collection_name}
								</td>
								<td class="px-4 py-3 text-[#7A6652]">
									{req.expand?.requested_by?.name ?? req.expand?.requested_by?.email ?? '—'}
								</td>
								<td class="px-4 py-3 text-[#7A6652] whitespace-nowrap">{formatDateTime(req.created)}</td>
								<td class="px-4 py-3">
									{#if req.status === 'approved'}
										<span class="text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full font-medium">Eliminado</span>
									{:else}
										<span class="text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-medium">Rechazado</span>
									{/if}
								</td>
								<td class="px-4 py-3 text-[#7A6652]">
									{req.expand?.resolved_by?.name ?? req.expand?.resolved_by?.email ?? '—'}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}

</div>
