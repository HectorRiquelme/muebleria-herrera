<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: import('svelte').Snippet } = $props();

	const user = $derived(data.user);
	const isAdmin = $derived(user?.role === 'admin');

	let sidebarOpen = $state(true);
	let mobileMenuOpen = $state(false);

	const navItems = $derived([
		{
			label: 'Dashboard',
			href: '/dashboard',
			icon: 'grid',
			roles: ['admin', 'worker']
		},
		{
			label: 'Productos',
			href: '/productos',
			icon: 'package',
			roles: ['admin', 'worker']
		},
		{
			label: 'Categorías',
			href: '/categorias',
			icon: 'tag',
			roles: ['admin', 'worker']
		},
		{
			label: 'Facturas',
			href: '/facturas',
			icon: 'file-text',
			roles: ['admin', 'worker']
		},
		{
			label: 'Inventario',
			href: '/inventario',
			icon: 'clipboard-list',
			roles: ['admin', 'worker']
		},
		{
			label: 'Ventas',
			href: '/ventas',
			icon: 'shopping-bag',
			roles: ['admin', 'worker']
		},
		{
			label: 'Clientes',
			href: '/clientes',
			icon: 'users',
			roles: ['admin', 'worker']
		},
		{
			label: 'Estadísticas',
			href: '/estadisticas',
			icon: 'bar-chart',
			roles: ['admin']
		},
		{
			label: 'Acceso',
			href: '/acceso',
			icon: 'toggle',
			roles: ['admin']
		},
		{
			label: 'Auditoría',
			href: '/auditoria',
			icon: 'shield',
			roles: ['admin']
		},
		{
			label: 'Permisos',
			href: '/permisos',
			icon: 'key',
			roles: ['admin']
		},
		{
			label: 'Solicitudes',
			href: '/solicitudes',
			icon: 'inbox',
			roles: ['admin']
		},
		{
			label: 'Usuarios',
			href: '/usuarios',
			icon: 'user-cog',
			roles: ['admin']
		},
		{
			label: 'Landing Web',
			href: '/landing',
			icon: 'image',
			roles: ['admin']
		},
		{
			label: 'Respaldos',
			href: '/respaldos',
			icon: 'database',
			roles: ['admin']
		}
	]);

	const allowedModules = $derived(data.allowedModules as string[] ?? []);

	const visibleNavItems = $derived(
		navItems.filter((item) => {
			// Must match role
			if (!item.roles.includes(user?.role ?? 'worker')) return false;
			// For workers, also check module_access
			if (user?.role === 'worker') return allowedModules.includes(item.href);
			return true;
		})
	);

	const pendingDeleteRequests = $derived(data.pendingDeleteRequests ?? 0);

	function isActive(href: string): boolean {
		return $page.url.pathname === href || $page.url.pathname.startsWith(href + '/');
	}

	async function logout() {
		await fetch('/api/logout', { method: 'POST' });
		goto('/login');
	}

	// Icon map (inline SVG paths)
	const icons: Record<string, string> = {
		grid: 'M3 3h7v7H3V3zm11 0h7v7h-7V3zM3 14h7v7H3v-7zm11 0h7v7h-7v-7z',
		package: 'M16.5 9.4l-9-5.19M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16zM3.27 6.96L12 12.01l8.73-5.05M12 22.08V12',
		tag: 'M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82zM7 7h.01',
		'file-text': 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8m8 4H8m2-8H8',
		'clipboard-list': 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01m-.01 4h.01',
		'shopping-bag': 'M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4zM3 6h18M16 10a4 4 0 01-8 0',
		users: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M9 7a4 4 0 110 8 4 4 0 010-8z',
		shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z',
		'user-cog': 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8zM19 8v6M22 11h-6',
		image: 'M21 19V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2zM8.5 13.5l2.5 3 3.5-4.5 4.5 6H5l3.5-4.5z',
		'log-out': 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9',
		'bar-chart': 'M18 20V10M12 20V4M6 20v-6',
		key: 'M21 2l-2 2m-7.61 7.61a5.5 5.5 0 11-7.778 7.778 5.5 5.5 0 017.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4',
		inbox: 'M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 12H2',
		toggle: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
		database: 'M12 2C6.48 2 2 3.79 2 6v12c0 2.21 4.48 4 10 4s10-1.79 10-4V6c0-2.21-4.48-4-10-4zM2 10c0 2.21 4.48 4 10 4s10-1.79 10-4M2 14c0 2.21 4.48 4 10 4s10-1.79 10-4'
	};
</script>

<div class="flex h-screen overflow-hidden bg-[#FAFAF8]">
	<!-- Sidebar -->
	<aside
		class="flex flex-col bg-[#2C2018] text-white transition-all duration-300 {sidebarOpen ? 'w-64' : 'w-16'} shrink-0"
	>
		<!-- Logo -->
		<div class="flex items-center gap-3 px-4 py-5 border-b border-white/10">
			<div class="w-8 h-8 rounded-lg bg-[#8B5E3C] flex items-center justify-center shrink-0">
				<svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
					<path d="M7 2h2v8H7zm8 0h2v8h-2zM4 11h16v2H4zm2 3h2v6H6zm10 0h2v6h-2zM8 17h8v2H8z"/>
				</svg>
			</div>
			{#if sidebarOpen}
				<div class="overflow-hidden">
					<p class="text-sm font-bold leading-tight">Mueblería</p>
					<p class="text-xs text-[#D4A853] font-semibold">Herrera</p>
				</div>
			{/if}
		</div>

		<!-- Navigation -->
		<nav class="flex-1 py-4 overflow-y-auto">
			{#each visibleNavItems as item}
				<a
					href={item.href}
					class="flex items-center gap-3 px-4 py-2.5 mx-2 rounded-lg transition-colors
						{isActive(item.href)
							? 'bg-[#8B5E3C] text-white'
							: 'text-white/70 hover:bg-white/10 hover:text-white'}"
				>
					<div class="relative shrink-0">
						<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" d={icons[item.icon]} />
						</svg>
						{#if item.href === '/solicitudes' && pendingDeleteRequests > 0}
							<span class="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-400 text-[#2C2018] text-[9px] font-bold rounded-full flex items-center justify-center leading-none">
								{pendingDeleteRequests > 9 ? '9+' : pendingDeleteRequests}
							</span>
						{/if}
					</div>
					{#if sidebarOpen}
						<span class="text-sm font-medium truncate flex-1">{item.label}</span>
						{#if item.href === '/solicitudes' && pendingDeleteRequests > 0}
							<span class="bg-amber-400 text-[#2C2018] text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
								{pendingDeleteRequests}
							</span>
						{/if}
					{/if}
				</a>
			{/each}
		</nav>

		<!-- User section -->
		<div class="border-t border-white/10 p-4">
			{#if sidebarOpen}
				<div class="flex items-center gap-3 mb-3">
					<div class="w-8 h-8 rounded-full bg-[#8B5E3C] flex items-center justify-center shrink-0">
						<span class="text-xs font-bold text-white uppercase">
							{user?.name?.[0] ?? user?.email?.[0] ?? 'U'}
						</span>
					</div>
					<div class="overflow-hidden flex-1">
						<p class="text-sm font-medium truncate">{user?.name ?? user?.email}</p>
						<p class="text-xs text-[#D4A853] capitalize">{user?.role === 'admin' ? 'Administrador' : 'Trabajador'}</p>
					</div>
				</div>
			{/if}
			<button
				onclick={logout}
				aria-label="Cerrar sesión"
				class="flex items-center gap-2 text-white/60 hover:text-white text-sm transition-colors w-full"
			>
				<svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" d={icons['log-out']} />
				</svg>
				{#if sidebarOpen}
					<span>Cerrar sesión</span>
				{/if}
			</button>
		</div>

		<!-- Toggle sidebar -->
		<button
			onclick={() => (sidebarOpen = !sidebarOpen)}
			aria-label="Alternar barra lateral"
			class="absolute left-0 bottom-16 bg-[#8B5E3C] rounded-r-md p-1 text-white hidden lg:block"
			style="left: {sidebarOpen ? '256px' : '64px'}; transition: left 0.3s;"
		>
			<svg class="w-3 h-3" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
				<path stroke-linecap="round" stroke-linejoin="round" d={sidebarOpen ? 'M15 19l-7-7 7-7' : 'M9 5l7 7-7 7'} />
			</svg>
		</button>
	</aside>

	<!-- Main content -->
	<div class="flex-1 flex flex-col overflow-hidden">
		<!-- Top bar -->
		<header class="bg-white border-b border-[#E5E0D8] px-6 py-3 flex items-center justify-between shrink-0">
			<div class="flex items-center gap-4">
				<h2 class="font-semibold text-[#2C2018]">
					{visibleNavItems.find((i) => isActive(i.href))?.label ?? 'Panel'}
				</h2>
			</div>
			<div class="flex items-center gap-3">
				{#if isAdmin}
					<span class="badge-admin">Administrador</span>
				{:else}
					<span class="badge-worker">Trabajador</span>
				{/if}
			</div>
		</header>

		<!-- Page content -->
		<main class="flex-1 overflow-y-auto p-6">
			{@render children()}
		</main>
	</div>
</div>
