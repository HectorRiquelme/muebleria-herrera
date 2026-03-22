<script lang="ts">
	import type { ActionData } from './$types';
	import { enhance } from '$app/forms';

	let { form }: { form: ActionData } = $props();
	let loading = $state(false);
</script>

<svelte:head>
	<title>Iniciar Sesión — Mueblería Herrera</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center bg-[#FAFAF8]">
	<div class="w-full max-w-md px-4">
		<!-- Logo / Header -->
		<div class="text-center mb-8">
			<div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#8B5E3C] mb-4">
			<svg class="w-9 h-9 text-white" fill="currentColor" viewBox="0 0 24 24">
				<path d="M7 2h2v8H7zm8 0h2v8h-2zM4 11h16v2H4zm2 3h2v6H6zm10 0h2v6h-2zM8 17h8v2H8z"/>
			</svg>
			</div>
			<h1 class="text-2xl font-bold text-[#2C2018]">Mueblería Herrera</h1>
			<p class="text-sm text-[#7A6652] mt-1">Panel de administración</p>
		</div>

		<!-- Login Card -->
		<div class="card p-8">
			<h2 class="text-lg font-semibold text-[#2C2018] mb-6">Iniciar Sesión</h2>

			{#if form?.error}
				<div class="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
					{form.error}
				</div>
			{/if}

			<form
				method="POST"
				use:enhance={() => {
					loading = true;
					return async ({ update }) => {
						loading = false;
						await update();
					};
				}}
				class="space-y-4"
			>
				<div>
					<label for="email" class="label">Correo electrónico</label>
					<input
						type="email"
						id="email"
						name="email"
						class="input"
						placeholder="usuario@muebleria.com"
						required
						autocomplete="email"
					/>
				</div>

				<div>
					<label for="password" class="label">Contraseña</label>
					<input
						type="password"
						id="password"
						name="password"
						class="input"
						placeholder="••••••••"
						required
						autocomplete="current-password"
					/>
				</div>

				<button
					type="submit"
					class="btn-primary w-full flex items-center justify-center gap-2 py-2.5"
					disabled={loading}
				>
					{#if loading}
						<svg class="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"/>
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
						</svg>
						Ingresando...
					{:else}
						Ingresar
					{/if}
				</button>
			</form>
		</div>

		<p class="text-center text-xs text-[#7A6652] mt-6">
			Mueblería Herrera &copy; {new Date().getFullYear()}
		</p>
	</div>
</div>
