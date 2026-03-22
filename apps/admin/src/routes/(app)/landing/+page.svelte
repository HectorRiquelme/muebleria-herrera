<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let loading = $state(false);
	let deleteConfirm = $state<string | null>(null);

	const PB_URL = import.meta.env.VITE_PB_URL ?? 'http://localhost:8090';

	function imageUrl(img: (typeof data.images)[0]) {
		return `${PB_URL}/api/files/landing_images/${img.id}/${img.image}?thumb=400x300`;
	}
</script>

<svelte:head><title>Landing Web — Mueblería Herrera</title></svelte:head>

<div class="space-y-6">
	<div>
		<h1 class="text-xl font-bold text-[#2C2018]">Gestión de Landing Web</h1>
		<p class="text-sm text-[#7A6652]">
			Administrá las imágenes que se muestran en la página pública.
			{data.images.filter((i) => i.active).length} imágenes activas.
		</p>
	</div>

	{#if form?.error}
		<div class="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{form.error}</div>
	{/if}
	{#if form?.success}
		<div class="p-3 rounded-lg bg-green-50 border border-green-200 text-green-700 text-sm">Operación realizada con éxito</div>
	{/if}

	<!-- Upload form -->
	<div class="card p-6">
		<h2 class="font-semibold text-[#2C2018] mb-4">Subir nuevas imágenes</h2>
		<form method="POST" action="?/upload" enctype="multipart/form-data"
			use:enhance={() => { loading = true; return async ({ update }) => { loading = false; await update(); }; }}
			class="space-y-4"
		>
			<div class="grid grid-cols-2 gap-4">
				<div>
					<label class="label" for="img-title">Título (opcional)</label>
					<input id="img-title" name="title" class="input" placeholder="Ej: Colección sillas 2025" />
				</div>
				<div>
					<label class="label" for="img-order">Orden</label>
					<input id="img-order" name="order" type="number" class="input" value="0" min="0" />
				</div>
			</div>
			<div>
				<label class="label" for="img-files">Imágenes *</label>
				<input id="img-files" name="images" type="file" accept="image/*" multiple required class="input" />
				<p class="text-xs text-[#7A6652] mt-1">Podés seleccionar múltiples imágenes (JPG, PNG, WEBP)</p>
			</div>
			<button type="submit" class="btn-primary" disabled={loading}>
				{loading ? 'Subiendo...' : 'Subir imágenes'}
			</button>
		</form>
	</div>

	<!-- Image grid -->
	<div class="card p-6">
		<h2 class="font-semibold text-[#2C2018] mb-4">Imágenes del landing</h2>
		{#if data.images.length === 0}
			<div class="text-center py-12 text-[#7A6652]">
				<svg class="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
				</svg>
				<p>No hay imágenes cargadas</p>
			</div>
		{:else}
			<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
				{#each data.images as img}
					<div class="group relative rounded-xl overflow-hidden border-2 {img.active ? 'border-[#8B5E3C]' : 'border-[#E5E0D8]'} transition-all">
						<img
							src={imageUrl(img)}
							alt={img.title ?? 'Imagen landing'}
							class="w-full aspect-square object-cover"
						/>
						<!-- Overlay -->
						<div class="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
							<form method="POST" action="?/toggleActive" use:enhance={() => async ({ update }) => { await update(); }}>
								<input type="hidden" name="id" value={img.id} />
								<input type="hidden" name="active" value={img.active.toString()} />
								<button type="submit" class="text-xs px-3 py-1.5 rounded-lg w-full {img.active ? 'bg-yellow-500 text-white' : 'bg-green-500 text-white'}">
									{img.active ? 'Desactivar' : 'Activar'}
								</button>
							</form>
							<button onclick={() => (deleteConfirm = img.id)} class="text-xs bg-red-500 text-white px-3 py-1.5 rounded-lg w-full">
								Eliminar
							</button>
						</div>
						<!-- Status badge -->
						<div class="absolute top-2 right-2">
							<span class="text-xs px-1.5 py-0.5 rounded {img.active ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}">
								{img.active ? 'Activa' : 'Inactiva'}
							</span>
						</div>
						{#if img.title}
							<div class="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1.5 truncate">
								{img.title}
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>
</div>

{#if deleteConfirm}
	<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
		<div class="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
			<h3 class="text-lg font-semibold text-[#2C2018] mb-2">Eliminar imagen</h3>
			<p class="text-sm text-[#7A6652] mb-6">Esta imagen se eliminará del landing. ¿Confirmar?</p>
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
