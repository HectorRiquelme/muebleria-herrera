<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import { exportCategoriesCSV, exportCategoriesPDF } from '$lib/export';
	import { formatDateTime } from '$lib/utils';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	const isAdmin = $derived(data.user?.role === 'admin');
	let showModal = $state(false);
	let editCategory = $state<(typeof data.categories)[0] | null>(null);
	let deleteConfirm = $state<string | null>(null);
	let requestDeleteItem = $state<{ id: string; label: string } | null>(null);
	let requestDeleteNotes = $state('');
	let loading = $state(false);

	function openEdit(cat: (typeof data.categories)[0]) { editCategory = cat; showModal = true; }
	function closeModal() { showModal = false; editCategory = null; }

	function exportCsv() {
		exportCategoriesCSV(data.categories as unknown as Parameters<typeof exportCategoriesCSV>[0]);
	}

	async function exportPdf() {
		await exportCategoriesPDF(data.categories as unknown as Parameters<typeof exportCategoriesPDF>[0]);
	}
</script>

<svelte:head><title>Categorías — Mueblería Herrera</title></svelte:head>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-xl font-bold text-[#2C2018]">Categorías</h1>
			<p class="text-sm text-[#7A6652]">{data.categories.length} categorías</p>
		</div>
		<div class="flex items-center gap-2 flex-wrap">
			<button onclick={exportCsv} class="btn-secondary text-sm">Exportar CSV</button>
			<button onclick={exportPdf} class="btn-secondary text-sm">Exportar PDF</button>
			<button onclick={() => { editCategory = null; showModal = true; }} class="btn-primary">
				+ Nueva categoría
			</button>
		</div>
	</div>

	{#if form?.error}
		<div class="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{form.error}</div>
	{/if}

	<div class="card overflow-hidden">
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead class="bg-[#F5F0EB]">
					<tr>
						<th class="text-left px-4 py-3 font-medium text-[#7A6652]">Nombre</th>
						<th class="text-left px-4 py-3 font-medium text-[#7A6652]">Descripción</th>
						<th class="text-left px-4 py-3 font-medium text-[#7A6652]">Creada</th>
						<th class="text-right px-4 py-3 font-medium text-[#7A6652]">Acciones</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-[#E5E0D8]">
					{#each data.categories as cat}
						<tr class="hover:bg-[#FAFAF8]">
							<td class="px-4 py-3 font-medium text-[#2C2018]">{cat.name}</td>
							<td class="px-4 py-3 text-[#7A6652]">{cat.description ?? '—'}</td>
							<td class="px-4 py-3 text-[#7A6652]">{formatDateTime(cat.created)}</td>
							<td class="px-4 py-3">
								<div class="flex justify-end gap-2">
									<button onclick={() => openEdit(cat)} class="text-[#8B5E3C] hover:underline text-xs font-medium">Editar</button>
									{#if isAdmin}
										<button onclick={() => (deleteConfirm = cat.id)} class="text-red-600 hover:underline text-xs font-medium">Eliminar</button>
									{:else}
										<button onclick={() => { requestDeleteItem = { id: cat.id, label: cat.name }; requestDeleteNotes = ''; }} class="text-amber-600 hover:underline text-xs font-medium">Solicitar eliminación</button>
									{/if}
								</div>
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="4" class="px-4 py-12 text-center text-[#7A6652]">No hay categorías. Crea una para empezar.</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>

{#if showModal}
	<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
		<div class="bg-white rounded-xl shadow-xl w-full max-w-md">
			<div class="flex items-center justify-between p-6 border-b border-[#E5E0D8]">
				<h2 class="text-lg font-semibold text-[#2C2018]">
					{editCategory ? 'Editar categoría' : 'Nueva categoría'}
				</h2>
				<button onclick={closeModal} aria-label="Cerrar" class="text-[#7A6652] hover:text-[#2C2018]">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
					</svg>
				</button>
			</div>
			<form
				method="POST"
				action={editCategory ? '?/update' : '?/create'}
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
				{#if editCategory}<input type="hidden" name="id" value={editCategory.id} />{/if}
				<div>
					<label class="label" for="cat-name">Nombre *</label>
					<input id="cat-name" name="name" class="input" required value={editCategory?.name ?? ''} placeholder="Ej: Sillas, Mesas, Dormitorio..." />
				</div>
				<div>
					<label class="label" for="cat-desc">Descripción</label>
					<textarea id="cat-desc" name="description" class="input h-20 resize-none" placeholder="Descripción opcional...">{editCategory?.description ?? ''}</textarea>
				</div>
				<div class="flex gap-3 justify-end pt-2 border-t border-[#E5E0D8]">
					<button type="button" onclick={closeModal} class="btn-secondary">Cancelar</button>
					<button type="submit" class="btn-primary" disabled={loading}>
						{loading ? 'Guardando...' : editCategory ? 'Actualizar' : 'Crear'}
					</button>
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
					<label class="label" for="rd-notes-cat">Motivo (opcional)</label>
					<textarea id="rd-notes-cat" name="notes" class="input h-20 resize-none" placeholder="Explica el motivo..." bind:value={requestDeleteNotes}></textarea>
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
			<h3 class="text-lg font-semibold text-[#2C2018] mb-2">Eliminar categoría</h3>
			<p class="text-sm text-[#7A6652] mb-6">Los productos asociados quedarán sin categoría. ¿Confirmar?</p>
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
