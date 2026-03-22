<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let selectedWorker = $state(data.workers[0]?.id ?? '');
	let loading = $state(false);

	const currentPerms = $derived(
		selectedWorker ? (data.permMap[selectedWorker] ?? {}) : {}
	);

	const selectedWorkerData = $derived(
		(data.workers as { id: string; name: string; email: string }[]).find((w) => w.id === selectedWorker)
	);

	// Group permissions into sections
	const groups = [
		{
			label: 'Productos',
			icon: 'M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z',
			perms: ['can_create_products', 'can_edit_products']
		},
		{
			label: 'Ventas',
			icon: 'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0',
			perms: ['can_create_vouchers', 'can_edit_vouchers']
		},
		{
			label: 'Clientes',
			icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M9 7a4 4 0 110 8 4 4 0 010-8z',
			perms: ['can_create_clients', 'can_edit_clients']
		},
		{
			label: 'Facturas',
			icon: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8m8 4H8m2-8H8',
			perms: ['can_create_invoices', 'can_edit_invoices']
		},
		{
			label: 'Otros',
			icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
			perms: ['can_create_categories', 'can_manage_inventory']
		}
	];

	function getPermLabel(key: string): string {
		return (data.permFields as { key: string; label: string }[]).find((p) => p.key === key)?.label ?? key;
	}
</script>

<svelte:head><title>Permisos de Empleados — Mueblería Herrera</title></svelte:head>

<div class="space-y-6">

	<div>
		<h1 class="text-xl font-bold text-[#2C2018]">Permisos de Empleados</h1>
		<p class="text-sm text-[#7A6652]">
			Configurá qué acciones puede realizar cada trabajador. Los trabajadores nunca pueden eliminar registros directamente.
		</p>
	</div>

	{#if form?.error}
		<div class="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{form.error}</div>
	{/if}
	{#if form?.success}
		<div class="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">Permisos guardados correctamente</div>
	{/if}

	{#if data.workers.length === 0}
		<div class="card p-12 text-center text-[#7A6652]">
			<svg class="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 110 8 4 4 0 010-8z"/>
			</svg>
			<p class="font-medium">No hay empleados registrados</p>
			<p class="text-sm mt-1">Crea un usuario con rol "Trabajador" desde el módulo Usuarios</p>
			<a href="/usuarios" class="btn-primary inline-block mt-4 text-sm">Ir a Usuarios</a>
		</div>
	{:else}
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

			<!-- Worker selector -->
			<div class="card p-5">
				<h2 class="font-semibold text-[#2C2018] mb-4">Seleccionar empleado</h2>
				<div class="space-y-2">
					{#each data.workers as worker}
						<button
							onclick={() => selectedWorker = worker.id}
							class="w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left
								{selectedWorker === worker.id ? 'bg-[#8B5E3C] text-white' : 'hover:bg-[#F5F0EB] text-[#2C2018]'}"
						>
							<div class="w-9 h-9 rounded-full bg-[#8B5E3C]/20 flex items-center justify-center shrink-0
								{selectedWorker === worker.id ? 'bg-white/20' : ''}">
								<span class="text-sm font-bold uppercase text-[#8B5E3C]
									{selectedWorker === worker.id ? '!text-white' : ''}">
									{worker.name?.[0] ?? worker.email[0]}
								</span>
							</div>
							<div class="overflow-hidden">
								<p class="text-sm font-medium truncate">{worker.name ?? worker.email}</p>
								<p class="text-xs truncate opacity-70">{worker.email}</p>
							</div>
						</button>
					{/each}
				</div>
			</div>

			<!-- Permissions form -->
			<div class="lg:col-span-2">
				{#if selectedWorkerData}
					<div class="card p-5">
						<div class="flex items-center gap-3 mb-6 pb-4 border-b border-[#E5E0D8]">
							<div class="w-10 h-10 rounded-full bg-[#8B5E3C] flex items-center justify-center shrink-0">
								<span class="text-white font-bold uppercase">{selectedWorkerData.name?.[0] ?? selectedWorkerData.email[0]}</span>
							</div>
							<div>
								<p class="font-semibold text-[#2C2018]">{selectedWorkerData.name ?? selectedWorkerData.email}</p>
								<p class="text-sm text-[#7A6652]">{selectedWorkerData.email}</p>
							</div>
							<span class="ml-auto badge-worker text-xs">Trabajador</span>
						</div>

						<form method="POST" action="?/save"
							use:enhance={() => {
								loading = true;
								return async ({ update }) => {
									loading = false;
									await update({ reset: false });
								};
							}}
						>
							<input type="hidden" name="user_id" value={selectedWorker} />

							<div class="space-y-4">
								{#each groups as group}
									<div class="bg-[#FAFAF8] rounded-xl p-4">
										<div class="flex items-center gap-2 mb-3">
											<svg class="w-4 h-4 text-[#8B5E3C]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" d={group.icon} />
											</svg>
											<h3 class="text-sm font-semibold text-[#2C2018]">{group.label}</h3>
										</div>
										<div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
											{#each group.perms as permKey}
												<label class="flex items-center gap-3 p-2 rounded-lg hover:bg-white cursor-pointer">
													<input
														type="checkbox"
														name={permKey}
														checked={Boolean(currentPerms[permKey])}
														class="w-4 h-4 rounded accent-[#8B5E3C]"
													/>
													<span class="text-sm text-[#2C2018]">{getPermLabel(permKey)}</span>
												</label>
											{/each}
										</div>
									</div>
								{/each}
							</div>

							<!-- Warning -->
							<div class="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-2">
								<svg class="w-4 h-4 text-amber-600 shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
								</svg>
								<p class="text-xs text-amber-700">
									Los trabajadores <strong>nunca pueden eliminar</strong> registros directamente. Deben generar una <strong>solicitud de eliminación</strong> que el administrador aprueba o rechaza.
								</p>
							</div>

							<div class="flex justify-end mt-4">
								<button type="submit" class="btn-primary" disabled={loading}>
									{loading ? 'Guardando...' : 'Guardar permisos'}
								</button>
							</div>
						</form>
					</div>
				{/if}
			</div>

		</div>
	{/if}
</div>
