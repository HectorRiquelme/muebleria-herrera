<script lang="ts">
	import { enhance } from '$app/forms';

	let { data, form } = $props();

	let exporting = $state(false);
	let importing = $state(false);
	let showConfirm = $state(false);
	let selectedFile = $state<File | null>(null);
	let clearExisting = $state(false);

	function handleFileSelect(e: Event) {
		const input = e.target as HTMLInputElement;
		selectedFile = input.files?.[0] ?? null;
	}

	async function handleExport() {
		exporting = true;
		try {
			const res = await fetch('/api/backup/export');
			if (!res.ok) throw new Error('Error al generar respaldo');
			const blob = await res.blob();
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = `respaldo-muebleria-${new Date().toISOString().slice(0, 10)}.zip`;
			a.click();
			URL.revokeObjectURL(url);
		} catch {
			alert('Error al generar el respaldo');
		} finally {
			exporting = false;
		}
	}
</script>

<svelte:head>
	<title>Respaldos | Mueblería Herrera</title>
</svelte:head>

<div class="p-6 space-y-6 max-w-4xl">
	<h1 class="text-2xl font-bold text-[#2C2018]">Respaldos</h1>
	<p class="text-[#7A6652]">Exporta e importa toda la base de datos incluyendo imágenes y archivos adjuntos.</p>

	<!-- Export Card -->
	<div class="bg-white rounded-lg border border-[#E5E0D8] p-6">
		<h2 class="text-lg font-semibold text-[#2C2018] mb-2">Exportar respaldo</h2>
		<p class="text-sm text-[#7A6652] mb-4">
			Descarga un archivo ZIP con todos los datos del sistema: productos, ventas, clientes, facturas, categorías,
			inventario, imágenes y archivos adjuntos. Los usuarios se incluyen como referencia pero sus contraseñas no se exportan.
		</p>
		<button
			onclick={handleExport}
			disabled={exporting}
			class="px-4 py-2 bg-[#8B5E3C] text-white rounded-md hover:bg-[#7A5235] disabled:opacity-50 transition-colors flex items-center gap-2"
		>
			{#if exporting}
				<svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
					<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" class="opacity-25"></circle>
					<path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" class="opacity-75"></path>
				</svg>
				Generando respaldo...
			{:else}
				<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
				</svg>
				Descargar respaldo completo
			{/if}
		</button>
	</div>

	<!-- Import Card -->
	<div class="bg-white rounded-lg border border-[#E5E0D8] p-6">
		<h2 class="text-lg font-semibold text-[#2C2018] mb-2">Importar respaldo</h2>
		<p class="text-sm text-[#7A6652] mb-4">
			Restaura datos desde un archivo ZIP generado por este sistema. Los usuarios no se importan (debes crearlos manualmente).
		</p>

		{#if form?.error}
			<div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
				{form.error}
			</div>
		{/if}

		{#if form?.success}
			<div class="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
				<p class="text-green-700 font-medium mb-2">Respaldo importado exitosamente</p>
				<p class="text-green-600 text-sm mb-2">{form.totalImported} registros importados</p>

				{#if form.imported}
					<div class="text-sm text-green-600 space-y-1">
						{#each Object.entries(form.imported) as [col, count]}
							{#if count > 0}
								<span class="inline-block mr-3">{col}: {count}</span>
							{/if}
						{/each}
					</div>
				{/if}

				{#if form.skipped?.length > 0}
					<div class="mt-2 text-sm text-amber-600">
						<p class="font-medium">Omitidos:</p>
						{#each form.skipped as msg}
							<p>— {msg}</p>
						{/each}
					</div>
				{/if}

				{#if form.errors?.length > 0}
					<details class="mt-2">
						<summary class="text-sm text-red-600 cursor-pointer">{form.errors.length} errores</summary>
						<ul class="mt-1 text-xs text-red-500 space-y-1 max-h-40 overflow-y-auto">
							{#each form.errors as err}
								<li>— {err}</li>
							{/each}
						</ul>
					</details>
				{/if}
			</div>
		{/if}

		<form
			method="POST"
			action="?/importBackup"
			enctype="multipart/form-data"
			use:enhance={() => {
				importing = true;
				return async ({ update }) => {
					importing = false;
					showConfirm = false;
					await update();
				};
			}}
		>
			<div class="space-y-4">
				<div>
					<label class="block text-sm font-medium text-[#2C2018] mb-1" for="backup-file">Archivo ZIP</label>
					<input
						id="backup-file"
						name="file"
						type="file"
						accept=".zip"
						onchange={handleFileSelect}
						class="w-full text-sm text-[#7A6652] file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-[#8B5E3C]/10 file:text-[#8B5E3C] hover:file:bg-[#8B5E3C]/20"
					/>
				</div>

				<label class="flex items-center gap-2 text-sm text-[#2C2018]">
					<input type="checkbox" name="clearExisting" bind:checked={clearExisting} class="rounded" />
					Reemplazar datos existentes
				</label>

				{#if clearExisting}
					<p class="text-xs text-red-600 bg-red-50 p-2 rounded">
						Esto eliminará TODOS los datos actuales antes de importar. Esta acción no se puede deshacer.
					</p>
				{/if}

				<button
					type="button"
					onclick={() => (showConfirm = true)}
					disabled={!selectedFile || importing}
					class="px-4 py-2 bg-[#D4A853] text-white rounded-md hover:bg-[#C49A48] disabled:opacity-50 transition-colors flex items-center gap-2"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
					</svg>
					Importar respaldo
				</button>
			</div>

			<!-- Confirmation Modal -->
			{#if showConfirm}
				<div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
					<div class="bg-white rounded-lg p-6 max-w-md mx-4">
						<h3 class="text-lg font-semibold text-[#2C2018] mb-2">Confirmar importación</h3>
						<p class="text-sm text-[#7A6652] mb-1">
							Archivo: <strong>{selectedFile?.name}</strong>
						</p>
						{#if clearExisting}
							<p class="text-sm text-red-600 font-medium mb-4">
								Se eliminarán todos los datos existentes antes de importar.
							</p>
						{:else}
							<p class="text-sm text-[#7A6652] mb-4">
								Los datos se agregarán a los existentes. Pueden ocurrir errores si hay IDs duplicados.
							</p>
						{/if}
						<div class="flex gap-3 justify-end">
							<button
								type="button"
								onclick={() => (showConfirm = false)}
								class="px-4 py-2 border border-[#E5E0D8] rounded-md text-[#7A6652] hover:bg-gray-50"
							>
								Cancelar
							</button>
							<button
								type="submit"
								disabled={importing}
								class="px-4 py-2 bg-[#8B5E3C] text-white rounded-md hover:bg-[#7A5235] disabled:opacity-50 flex items-center gap-2"
							>
								{#if importing}
									<svg class="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
										<circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" class="opacity-25"></circle>
										<path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" class="opacity-75"></path>
									</svg>
									Importando...
								{:else}
									Confirmar importación
								{/if}
							</button>
						</div>
					</div>
				</div>
			{/if}
		</form>
	</div>

	<!-- History Card -->
	<div class="bg-white rounded-lg border border-[#E5E0D8] p-6">
		<h2 class="text-lg font-semibold text-[#2C2018] mb-4">Historial de respaldos</h2>

		{#if data.recentBackups.length === 0}
			<p class="text-sm text-[#7A6652]">No hay respaldos registrados.</p>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-[#E5E0D8]">
							<th class="text-left py-2 px-3 text-[#7A6652] font-medium">Fecha</th>
							<th class="text-left py-2 px-3 text-[#7A6652] font-medium">Acción</th>
							<th class="text-left py-2 px-3 text-[#7A6652] font-medium">Descripción</th>
							<th class="text-left py-2 px-3 text-[#7A6652] font-medium">Usuario</th>
						</tr>
					</thead>
					<tbody>
						{#each data.recentBackups as log}
							<tr class="border-b border-[#E5E0D8]/50 hover:bg-[#FAFAF8]">
								<td class="py-2 px-3 text-[#2C2018]">
									{new Date(log.created).toLocaleDateString('es-CL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
								</td>
								<td class="py-2 px-3">
									<span class="px-2 py-0.5 rounded text-xs font-medium {log.action === 'export' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}">
										{log.action === 'export' ? 'Exportación' : 'Importación'}
									</span>
								</td>
								<td class="py-2 px-3 text-[#7A6652]">{log.description}</td>
								<td class="py-2 px-3 text-[#7A6652]">{log.expand?.user?.name ?? log.user}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>
