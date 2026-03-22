<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	type Worker = { id: string; name?: string; email: string };
	type ModuleDef = { href: string; label: string; icon: string };

	const workers = $derived(data.workers as unknown as Worker[]);
	const workerModules = $derived(data.workerModules as readonly ModuleDef[]);
	const accessMap = $derived(data.accessMap as Record<string, Record<string, boolean>>);

	let selectedWorker = $state(workers[0]?.id ?? '');
	let loading = $state(false);

	// Local toggle state — initialized from server data, keyed by userId
	let localAccess = $state<Record<string, boolean>>({});

	// When selected worker changes, sync local state from server data
	$effect(() => {
		const serverAccess = accessMap[selectedWorker] ?? {};
		const newAccess: Record<string, boolean> = {};
		for (const mod of workerModules) {
			// Default: enabled if no record exists (opt-out model)
			newAccess[mod.href] = serverAccess[mod.href] !== undefined
				? serverAccess[mod.href]
				: true;
		}
		localAccess = newAccess;
	});

	const selectedWorkerData = $derived(workers.find((w) => w.id === selectedWorker));

	const enabledCount = $derived(Object.values(localAccess).filter(Boolean).length);

	const icons: Record<string, string> = {
		grid: 'M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z',
		package: 'M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z',
		tag: 'M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01',
		'file-text': 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8m8 4H8m2-8H8',
		'clipboard-list': 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01m-.01 4h.01',
		'shopping-bag': 'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0',
		users: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M9 7a4 4 0 110 8 4 4 0 010-8z',
	};

	function toggleAll(enable: boolean) {
		const updated: Record<string, boolean> = {};
		for (const mod of workerModules) {
			updated[mod.href] = enable;
		}
		localAccess = updated;
	}
</script>

<svelte:head><title>Control de Acceso — Mueblería Herrera</title></svelte:head>

<div class="space-y-6">

	<!-- Header -->
	<div>
		<h1 class="text-xl font-bold text-[#2C2018]">Control de Acceso</h1>
		<p class="text-sm text-[#7A6652]">
			Definí qué módulos del menú puede ver cada trabajador. Los módulos desactivados no aparecen en su sidebar.
		</p>
	</div>

	{#if form?.error}
		<div class="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{form.error}</div>
	{/if}
	{#if form?.success}
		<div class="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">
			Acceso actualizado correctamente para <strong>{selectedWorkerData?.name ?? selectedWorkerData?.email}</strong>
		</div>
	{/if}

	{#if workers.length === 0}
		<div class="card p-12 text-center text-[#7A6652]">
			<svg class="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 110 8 4 4 0 010-8z"/>
			</svg>
			<p class="font-medium">No hay trabajadores registrados</p>
			<p class="text-sm mt-1">Crea un usuario con rol "Trabajador" desde el módulo Usuarios</p>
			<a href="/usuarios" class="btn-primary inline-block mt-4 text-sm">Ir a Usuarios</a>
		</div>
	{:else}
		<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

			<!-- Worker list -->
			<div class="card p-5">
				<h2 class="font-semibold text-[#2C2018] mb-1">Trabajadores</h2>
				<p class="text-xs text-[#7A6652] mb-4">Seleccioná uno para configurar su acceso</p>
				<div class="space-y-2">
					{#each workers as worker}
						{@const workerAccess = accessMap[worker.id] ?? {}}
						{@const enabled = workerModules.filter((m) =>
							workerAccess[m.href] !== undefined ? workerAccess[m.href] : true
						).length}
						<button
							onclick={() => { selectedWorker = worker.id; }}
							class="w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left
								{selectedWorker === worker.id
									? 'bg-[#8B5E3C] text-white ring-2 ring-[#8B5E3C] ring-offset-1'
									: 'hover:bg-[#F5F0EB] text-[#2C2018]'}"
						>
							<div class="w-9 h-9 rounded-full flex items-center justify-center shrink-0 font-bold uppercase text-sm
								{selectedWorker === worker.id ? 'bg-white/20 text-white' : 'bg-[#8B5E3C]/10 text-[#8B5E3C]'}">
								{(worker.name ?? worker.email)[0]}
							</div>
							<div class="overflow-hidden flex-1">
								<p class="text-sm font-medium truncate">{worker.name ?? worker.email}</p>
								<p class="text-xs truncate {selectedWorker === worker.id ? 'opacity-70' : 'text-[#7A6652]'}">{worker.email}</p>
							</div>
							<div class="text-right shrink-0">
								<p class="text-xs font-semibold {selectedWorker === worker.id ? 'text-white/80' : 'text-[#8B5E3C]'}">
									{enabled}/{workerModules.length}
								</p>
								<p class="text-[10px] {selectedWorker === worker.id ? 'text-white/60' : 'text-[#7A6652]'}">módulos</p>
							</div>
						</button>
					{/each}
				</div>
			</div>

			<!-- Module toggles -->
			<div class="lg:col-span-2">
				{#if selectedWorkerData}
					<div class="card p-5">

						<!-- Worker header -->
						<div class="flex items-center gap-3 pb-4 mb-5 border-b border-[#E5E0D8]">
							<div class="w-10 h-10 rounded-full bg-[#8B5E3C] flex items-center justify-center shrink-0">
								<span class="text-white font-bold uppercase text-sm">
									{(selectedWorkerData.name ?? selectedWorkerData.email)[0]}
								</span>
							</div>
							<div class="flex-1">
								<p class="font-semibold text-[#2C2018]">{selectedWorkerData.name ?? selectedWorkerData.email}</p>
								<p class="text-sm text-[#7A6652]">{selectedWorkerData.email}</p>
							</div>
							<div class="text-right">
								<p class="text-2xl font-bold text-[#8B5E3C]">{enabledCount}<span class="text-base font-normal text-[#7A6652]">/{workerModules.length}</span></p>
								<p class="text-xs text-[#7A6652]">módulos activos</p>
							</div>
						</div>

						<!-- Quick actions -->
						<div class="flex gap-2 mb-5">
							<button
								type="button"
								onclick={() => toggleAll(true)}
								class="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-green-100 text-green-700 hover:bg-green-200 transition-colors"
							>
								<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/>
								</svg>
								Habilitar todo
							</button>
							<button
								type="button"
								onclick={() => toggleAll(false)}
								class="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
							>
								<svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
								</svg>
								Deshabilitar todo
							</button>
						</div>

						<!-- Module toggles grid -->
						<form
							method="POST"
							action="?/save"
							use:enhance={() => {
								loading = true;
								return async ({ update }) => {
									loading = false;
									await update({ reset: false });
								};
							}}
						>
							<input type="hidden" name="user_id" value={selectedWorker} />

							<!-- Hidden inputs for enabled modules -->
							{#each workerModules as mod}
								{#if localAccess[mod.href]}
									<input type="hidden" name="modules" value={mod.href} />
								{/if}
							{/each}

							<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
								{#each workerModules as mod}
									{@const isEnabled = localAccess[mod.href] ?? true}
									<button
										type="button"
										onclick={() => { localAccess = { ...localAccess, [mod.href]: !localAccess[mod.href] }; }}
										class="flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left
											{isEnabled
												? 'border-[#8B5E3C] bg-[#8B5E3C]/5 shadow-sm'
												: 'border-stone-200 bg-stone-50 opacity-60'}"
									>
										<!-- Module icon -->
										<div class="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors
											{isEnabled ? 'bg-[#8B5E3C] text-white' : 'bg-stone-200 text-stone-400'}">
											<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
												<path stroke-linecap="round" stroke-linejoin="round" d={icons[mod.icon] ?? ''} />
											</svg>
										</div>

										<!-- Label -->
										<div class="flex-1">
											<p class="font-semibold text-sm {isEnabled ? 'text-[#2C2018]' : 'text-stone-400'}">{mod.label}</p>
											<p class="text-xs {isEnabled ? 'text-[#7A6652]' : 'text-stone-400'}">
												{isEnabled ? 'Visible en el menú' : 'Oculto para el trabajador'}
											</p>
										</div>

										<!-- Toggle -->
										<div class="shrink-0">
											<div class="w-11 h-6 rounded-full transition-colors relative
												{isEnabled ? 'bg-[#8B5E3C]' : 'bg-stone-300'}">
												<div class="w-4 h-4 rounded-full bg-white shadow-sm absolute top-1 transition-all
													{isEnabled ? 'left-6' : 'left-1'}"></div>
											</div>
										</div>
									</button>
								{/each}
							</div>

							<!-- Info note -->
							<div class="p-3 bg-blue-50 border border-blue-200 rounded-xl flex gap-2 mb-5">
								<svg class="w-4 h-4 text-blue-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
									<path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
								</svg>
								<p class="text-xs text-blue-700">
									Los módulos desactivados desaparecen del menú del trabajador en tiempo real. Aunque acceda directo a la URL, verá una redirección al dashboard.
								</p>
							</div>

							<div class="flex justify-end">
								<button type="submit" class="btn-primary" disabled={loading}>
									{loading ? 'Guardando...' : 'Guardar acceso'}
								</button>
							</div>
						</form>
					</div>
				{/if}
			</div>
		</div>
	{/if}
</div>
