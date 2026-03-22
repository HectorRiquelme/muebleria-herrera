<script lang="ts">
	import type { PageData } from './$types';
	import { formatCurrency, formatDate, formatDateTime, PRODUCT_STATUS_LABELS, PRODUCT_STATUS_COLORS } from '$lib/utils';
	import { generateBarcodeDataUrl } from '$lib/barcode';
	import { onMount } from 'svelte';

	let { data }: { data: PageData } = $props();

	const product = $derived(data.product);
	const voucherItems = $derived(data.voucherItems);
	const PB_URL = import.meta.env.VITE_PB_URL ?? 'http://localhost:8090';

	let barcodeDataUrl = $state('');

	onMount(async () => {
		if (product.barcode && product.barcode_type) {
			barcodeDataUrl = await generateBarcodeDataUrl(
				product.barcode,
				product.barcode_type as 'CODE128' | 'EAN13' | 'QR'
			).catch(() => '');
		}
	});
</script>

<svelte:head>
	<title>{product.name} — Mueblería Herrera</title>
</svelte:head>

<div class="space-y-6 max-w-4xl">

	<!-- Back -->
	<a href="/productos" class="inline-flex items-center gap-1.5 text-sm text-[#7A6652] hover:text-[#2C2018] transition-colors">
		<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
			<path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/>
		</svg>
		Volver a Productos
	</a>

	<!-- Header -->
	<div class="flex items-start justify-between gap-4 flex-wrap">
		<div>
			<h1 class="text-xl font-bold text-[#2C2018]">{product.name}</h1>
			<p class="text-sm text-[#7A6652] mt-0.5">SKU: <span class="font-mono">{product.sku}</span></p>
		</div>
		<div class="flex items-center gap-3">
			<span class="text-xs px-2 py-1 rounded-full {PRODUCT_STATUS_COLORS[product.status] ?? 'bg-gray-100 text-gray-700'}">
				{PRODUCT_STATUS_LABELS[product.status] ?? product.status}
			</span>
			<a href="/productos?q={encodeURIComponent(product.sku)}" class="btn-secondary text-sm">Editar</a>
		</div>
	</div>

	<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

		<!-- Fotos y código de barras -->
		<div class="space-y-4">
			{#if product.photos?.length > 0}
				<div class="card overflow-hidden">
					<img
						src="{PB_URL}/api/files/products/{product.id}/{product.photos[0]}?thumb=600x600"
						alt={product.name}
						class="w-full aspect-square object-cover"
					/>
					{#if product.photos.length > 1}
						<div class="p-3 flex gap-2 flex-wrap">
							{#each product.photos.slice(1) as photo}
								<img
									src="{PB_URL}/api/files/products/{product.id}/{photo}?thumb=80x80"
									alt="Foto adicional"
									class="w-14 h-14 rounded-lg object-cover border border-[#E5E0D8]"
								/>
							{/each}
						</div>
					{/if}
				</div>
			{:else}
				<div class="card p-8 flex flex-col items-center justify-center text-[#7A6652]">
					<svg class="w-12 h-12 opacity-30 mb-2" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" d="M21 19V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2z"/>
					</svg>
					<p class="text-sm">Sin fotos</p>
				</div>
			{/if}

			{#if barcodeDataUrl}
				<div class="card p-4">
					<p class="text-xs font-medium text-[#7A6652] mb-2">Código de barras ({product.barcode_type})</p>
					<img src={barcodeDataUrl} alt="Código de barras" class="max-w-full" />
					<p class="font-mono text-xs text-center text-[#7A6652] mt-1">{product.barcode}</p>
				</div>
			{/if}
		</div>

		<!-- Datos del producto -->
		<div class="lg:col-span-2 space-y-4">
			<div class="card p-5">
				<h2 class="font-semibold text-[#2C2018] mb-4">Información del producto</h2>
				<dl class="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
					<div>
						<dt class="text-[#7A6652]">Categoría</dt>
						<dd class="font-medium text-[#2C2018]">{product.expand?.category?.name ?? '—'}</dd>
					</div>
					<div>
						<dt class="text-[#7A6652]">Estado</dt>
						<dd>
							<span class="text-xs px-2 py-0.5 rounded-full {PRODUCT_STATUS_COLORS[product.status] ?? 'bg-gray-100'}">
								{PRODUCT_STATUS_LABELS[product.status] ?? product.status}
							</span>
						</dd>
					</div>
					<div>
						<dt class="text-[#7A6652]">Precio de venta</dt>
						<dd class="font-bold text-[#2C2018] text-base">{formatCurrency(product.price)}</dd>
					</div>
					{#if product.cost}
						<div>
							<dt class="text-[#7A6652]">Costo</dt>
							<dd class="font-medium text-[#2C2018]">{formatCurrency(product.cost)}</dd>
						</div>
					{/if}
					<div>
						<dt class="text-[#7A6652]">SKU</dt>
						<dd class="font-mono text-[#2C2018]">{product.sku}</dd>
					</div>
					{#if product.barcode}
						<div>
							<dt class="text-[#7A6652]">Código de barras</dt>
							<dd class="font-mono text-[#2C2018]">{product.barcode}</dd>
						</div>
					{/if}
					<div>
						<dt class="text-[#7A6652]">Fecha de ingreso</dt>
						<dd class="text-[#2C2018]">{formatDateTime(product.created)}</dd>
					</div>
					<div>
						<dt class="text-[#7A6652]">Última modificación</dt>
						<dd class="text-[#2C2018]">{formatDateTime(product.updated)}</dd>
					</div>
					{#if product.expand?.invoice}
						<div class="col-span-2">
							<dt class="text-[#7A6652]">Factura de compra</dt>
							<dd class="font-medium text-[#2C2018]">
								#{product.expand.invoice.number} — {product.expand.invoice.supplier}
							</dd>
						</div>
					{/if}
				</dl>
				{#if product.description}
					<div class="mt-4 pt-4 border-t border-[#E5E0D8]">
						<p class="text-xs text-[#7A6652] mb-1">Descripción</p>
						<p class="text-sm text-[#2C2018]">{product.description}</p>
					</div>
				{/if}
			</div>

			<!-- Inventario -->
			<div class="card p-5">
				<h2 class="font-semibold text-[#2C2018] mb-3">Estado de inventario</h2>
				{#if product.inventoried}
					<div class="flex items-center gap-3">
						<span class="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full font-medium">Inventariado</span>
						<div class="text-sm text-[#7A6652]">
							{#if product.inventoried_at}
								el {formatDate(product.inventoried_at)}
							{/if}
							{#if product.expand?.inventoried_by}
								por <span class="font-medium text-[#2C2018]">{product.expand.inventoried_by.name ?? product.expand.inventoried_by.email}</span>
							{/if}
						</div>
					</div>
				{:else}
					<p class="text-sm text-[#7A6652]">Este producto no ha sido inventariado aún.</p>
				{/if}
			</div>

			<!-- Historial de ventas -->
			<div class="card overflow-hidden">
				<div class="px-5 py-4 border-b border-[#E5E0D8]">
					<h2 class="font-semibold text-[#2C2018]">Historial de ventas</h2>
					<p class="text-xs text-[#7A6652] mt-0.5">
						{(voucherItems as unknown[]).length === 0 ? 'Este producto no ha sido vendido' : `Aparece en ${(voucherItems as unknown[]).length} comprobante(s)`}
					</p>
				</div>
				{#if (voucherItems as unknown[]).length === 0}
					<div class="px-5 py-8 text-center text-[#7A6652] text-sm">Sin ventas registradas</div>
				{:else}
					<div class="divide-y divide-[#E5E0D8]">
						{#each voucherItems as item}
							{@const voucher = (item as Record<string, unknown>).expand as Record<string, unknown> | undefined}
							{@const v = voucher?.voucher as Record<string, unknown> | undefined}
							<div class="px-5 py-3 flex items-center justify-between text-sm">
								<div>
									<p class="font-medium text-[#2C2018]">
										Comprobante #{(v?.number as string) ?? '—'}
									</p>
									<p class="text-xs text-[#7A6652]">
										{v?.date ? formatDate(v.date as string) : '—'}
										{#if (v?.expand as Record<string, unknown>)?.client}
											· {((v?.expand as Record<string, unknown>).client as Record<string, unknown>).name as string}
										{/if}
									</p>
								</div>
								<div class="text-right">
									<p class="font-medium text-[#2C2018]">{formatCurrency((item as Record<string, unknown>).subtotal as number)}</p>
									<p class="text-xs text-[#7A6652]">
										{(item as Record<string, unknown>).quantity as number} × {formatCurrency((item as Record<string, unknown>).unit_price as number)}
									</p>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		</div>
	</div>
</div>
