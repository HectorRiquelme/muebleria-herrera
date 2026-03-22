<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';
	import { exportUsersCSV, exportUsersPDF } from '$lib/export';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let showModal = $state(false);
	let editUser = $state<(typeof data.users)[0] | null>(null);
	let deleteConfirm = $state<string | null>(null);
	let loading = $state(false);

	function openEdit(u: (typeof data.users)[0]) { editUser = u; showModal = true; }
	function closeModal() { showModal = false; editUser = null; }

	function exportCsv() {
		exportUsersCSV(data.users as unknown as Parameters<typeof exportUsersCSV>[0]);
	}

	async function exportPdf() {
		await exportUsersPDF(data.users as unknown as Parameters<typeof exportUsersPDF>[0]);
	}
</script>

<svelte:head><title>Usuarios — Mueblería Herrera</title></svelte:head>

<div class="space-y-4">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-xl font-bold text-[#2C2018]">Usuarios</h1>
			<p class="text-sm text-[#7A6652]">{data.users.length} usuarios registrados</p>
		</div>
		<div class="flex items-center gap-2 flex-wrap">
			<button onclick={exportCsv} class="btn-secondary text-sm">Exportar CSV</button>
			<button onclick={exportPdf} class="btn-secondary text-sm">Exportar PDF</button>
			<button onclick={() => { editUser = null; showModal = true; }} class="btn-primary">+ Nuevo usuario</button>
		</div>
	</div>

	{#if form?.error}
		<div class="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{form.error}</div>
	{/if}

	<div class="card overflow-hidden">
		<table class="w-full text-sm">
			<thead class="bg-[#F5F0EB]">
				<tr>
					<th class="text-left px-4 py-3 font-medium text-[#7A6652]">Usuario</th>
					<th class="text-left px-4 py-3 font-medium text-[#7A6652]">Email</th>
					<th class="text-left px-4 py-3 font-medium text-[#7A6652]">Rol</th>
					<th class="text-right px-4 py-3 font-medium text-[#7A6652]">Acciones</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-[#E5E0D8]">
				{#each data.users as user}
					<tr class="hover:bg-[#FAFAF8]">
						<td class="px-4 py-3">
							<div class="flex items-center gap-3">
								<div class="w-8 h-8 rounded-full bg-[#8B5E3C] flex items-center justify-center">
									<span class="text-white text-xs font-bold uppercase">{user.name?.[0] ?? user.email[0]}</span>
								</div>
								<p class="font-medium text-[#2C2018]">{user.name ?? '—'}</p>
							</div>
						</td>
						<td class="px-4 py-3 text-[#7A6652]">{user.email}</td>
						<td class="px-4 py-3">
							{#if user.role === 'admin'}
								<span class="badge-admin">Administrador</span>
							{:else}
								<span class="badge-worker">Trabajador</span>
							{/if}
						</td>
						<td class="px-4 py-3">
							<div class="flex items-center justify-end gap-2">
								<button onclick={() => openEdit(user)} class="text-[#8B5E3C] hover:underline text-xs font-medium">Editar</button>
								{#if user.id !== data.user?.id}
									<button onclick={() => (deleteConfirm = user.id)} class="text-red-600 hover:underline text-xs font-medium">Eliminar</button>
								{/if}
							</div>
						</td>
					</tr>
				{:else}
					<tr><td colspan="4" class="px-4 py-12 text-center text-[#7A6652]">No hay usuarios</td></tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

{#if showModal}
	<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
		<div class="bg-white rounded-xl shadow-xl w-full max-w-md">
			<div class="flex items-center justify-between p-6 border-b border-[#E5E0D8]">
				<h2 class="text-lg font-semibold text-[#2C2018]">{editUser ? 'Editar usuario' : 'Nuevo usuario'}</h2>
				<button onclick={closeModal} class="text-[#7A6652] hover:text-[#2C2018]">
					<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>
				</button>
			</div>
			<form method="POST" action={editUser ? '?/update' : '?/create'}
				use:enhance={() => { loading = true; return async ({ update }) => { loading = false; await update(); if (!form?.error) closeModal(); }; }}
				class="p-6 space-y-4"
			>
				{#if editUser}<input type="hidden" name="id" value={editUser.id} />{/if}
				<div>
					<label class="label" for="u-name">Nombre</label>
					<input id="u-name" name="name" class="input" value={editUser?.name ?? ''} placeholder="Nombre completo" />
				</div>
				{#if !editUser}
					<div>
						<label class="label" for="u-email">Email *</label>
						<input id="u-email" name="email" type="email" class="input" required placeholder="usuario@muebleria.com" />
					</div>
					<div>
						<label class="label" for="u-password">Contraseña *</label>
						<input id="u-password" name="password" type="password" class="input" required minlength="8" placeholder="Mínimo 8 caracteres" />
					</div>
				{:else}
					<div>
						<label class="label" for="u-new-password">Nueva contraseña (dejar vacío para no cambiar)</label>
						<input id="u-new-password" name="new_password" type="password" class="input" minlength="8" placeholder="Mínimo 8 caracteres" />
					</div>
				{/if}
				<div>
					<label class="label" for="u-role">Rol</label>
					<select id="u-role" name="role" class="input">
						<option value="worker" selected={editUser?.role === 'worker'}>Trabajador</option>
						<option value="admin" selected={editUser?.role === 'admin'}>Administrador</option>
					</select>
				</div>
				<div class="flex gap-3 justify-end pt-2 border-t border-[#E5E0D8]">
					<button type="button" onclick={closeModal} class="btn-secondary">Cancelar</button>
					<button type="submit" class="btn-primary" disabled={loading}>{loading ? 'Guardando...' : editUser ? 'Actualizar' : 'Crear'}</button>
				</div>
			</form>
		</div>
	</div>
{/if}

{#if deleteConfirm}
	<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
		<div class="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
			<h3 class="text-lg font-semibold text-[#2C2018] mb-2">Eliminar usuario</h3>
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
