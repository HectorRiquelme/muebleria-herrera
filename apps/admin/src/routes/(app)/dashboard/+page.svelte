<script lang="ts">
	import type { PageData } from './$types';
	import { formatCurrency, formatDate, PRODUCT_STATUS_COLORS, PRODUCT_STATUS_LABELS } from '$lib/utils';

	let { data }: { data: PageData } = $props();

	type Stats = {
		availableProducts: number;
		totalVouchers: number;
		totalClients: number;
		totalInvoices: number;
		monthTotal: number;
		pendingDeleteRequests: number;
	};
	const stats = $derived(data.stats as unknown as Stats);
	const recentVouchers = $derived(data.recentVouchers);
	const recentProducts = $derived(data.recentProducts);
</script>

<svelte:head>
	<title>Dashboard — Mueblería Herrera</title>
</svelte:head>

<div class="space-y-6">
	<!-- Stats -->
	<div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-4">
		<div class="card p-5">
			<p class="text-sm text-[#7A6652] mb-1">Productos disponibles</p>
			<p class="text-3xl font-bold text-[#2C2018]">{stats.availableProducts}</p>
		</div>
		<div class="card p-5">
			<p class="text-sm text-[#7A6652] mb-1">Ventas totales</p>
			<p class="text-3xl font-bold text-[#2C2018]">{stats.totalVouchers}</p>
		</div>
		<div class="card p-5">
			<p class="text-sm text-[#7A6652] mb-1">Clientes</p>
			<p class="text-3xl font-bold text-[#2C2018]">{stats.totalClients}</p>
		</div>
		<div class="card p-5">
			<p class="text-sm text-[#7A6652] mb-1">Facturas cargadas</p>
			<p class="text-3xl font-bold text-[#2C2018]">{stats.totalInvoices}</p>
		</div>
		<div class="card p-5 bg-[#8B5E3C] border-[#8B5E3C]">
			<p class="text-sm text-white/80 mb-1">Ventas este mes</p>
			<p class="text-2xl font-bold text-white">{formatCurrency(stats.monthTotal)}</p>
		</div>
		{#if data.user?.role === 'admin' && stats.pendingDeleteRequests > 0}
			<a href="/solicitudes" class="card p-5 bg-amber-500 border-amber-500 hover:bg-amber-600 transition-colors block">
				<p class="text-sm text-white/80 mb-1">Solicitudes de eliminación</p>
				<p class="text-2xl font-bold text-white">{stats.pendingDeleteRequests}</p>
				<p class="text-xs text-white/70 mt-1">Pendientes de revisión →</p>
			</a>
		{/if}
	</div>

	<!-- Recent content -->
	<div class="grid grid-cols-1 xl:grid-cols-2 gap-6">
		<!-- Recent vouchers -->
		<div class="card p-5">
			<div class="flex items-center justify-between mb-4">
				<h3 class="font-semibold text-[#2C2018]">Ventas recientes</h3>
				<a href="/ventas" class="text-sm text-[#8B5E3C] hover:underline">Ver todas</a>
			</div>
			{#if recentVouchers.length === 0}
				<p class="text-sm text-[#7A6652] text-center py-6">No hay ventas registradas</p>
			{:else}
				<div class="space-y-3">
					{#each recentVouchers as voucher}
						<div class="flex items-center justify-between py-2 border-b border-[#E5E0D8] last:border-0">
							<div>
								<p class="text-sm font-medium text-[#2C2018]">#{voucher.number}</p>
								<p class="text-xs text-[#7A6652]">
									{voucher.expand?.client?.name ?? 'Sin cliente'} · {formatDate(voucher.date)}
								</p>
							</div>
							<span class="text-sm font-semibold text-[#8B5E3C]">
								{formatCurrency(voucher.total)}
							</span>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- Recent products -->
		<div class="card p-5">
			<div class="flex items-center justify-between mb-4">
				<h3 class="font-semibold text-[#2C2018]">Productos recientes</h3>
				<a href="/productos" class="text-sm text-[#8B5E3C] hover:underline">Ver todos</a>
			</div>
			{#if recentProducts.length === 0}
				<p class="text-sm text-[#7A6652] text-center py-6">No hay productos cargados</p>
			{:else}
				<div class="space-y-3">
					{#each recentProducts as product}
						<div class="flex items-center justify-between py-2 border-b border-[#E5E0D8] last:border-0">
							<div>
								<p class="text-sm font-medium text-[#2C2018]">{product.name}</p>
								<p class="text-xs text-[#7A6652]">
									{product.expand?.category?.name ?? 'Sin categoría'} · {product.sku}
								</p>
							</div>
							<div class="flex items-center gap-2">
								<span class="text-xs px-2 py-0.5 rounded {PRODUCT_STATUS_COLORS[product.status] ?? 'bg-gray-100 text-gray-700'}">
									{PRODUCT_STATUS_LABELS[product.status] ?? product.status}
								</span>
								<span class="text-sm font-semibold text-[#8B5E3C]">
									{formatCurrency(product.price)}
								</span>
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>
	</div>

	<!-- Quick links -->
	<div class="card p-5">
		<h3 class="font-semibold text-[#2C2018] mb-4">Acciones rápidas</h3>
		<div class="flex flex-wrap gap-3">
			<a href="/productos?new=1" class="btn-primary text-sm">+ Nuevo producto</a>
			<a href="/ventas?new=1" class="btn-primary text-sm">+ Nueva venta</a>
			<a href="/clientes?new=1" class="btn-secondary text-sm">+ Nuevo cliente</a>
			<a href="/inventario" class="btn-secondary text-sm">Ir a inventario</a>
		</div>
	</div>
</div>
