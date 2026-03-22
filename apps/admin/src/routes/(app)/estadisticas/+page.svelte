<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { formatCurrency } from '$lib/utils';

	let { data }: { data: PageData } = $props();

	let dateFrom = $state(data.dateFrom);
	let dateTo = $state(data.dateTo);
	let selectedCategory = $state(data.selectedCategory);

	function applyFilters() {
		const params = new URLSearchParams();
		if (dateFrom) params.set('from', dateFrom);
		if (dateTo) params.set('to', dateTo);
		if (selectedCategory) params.set('category', selectedCategory);
		goto(`/estadisticas?${params.toString()}`);
	}

	// ── Chart.js canvas refs ──
	let canvasByCat: HTMLCanvasElement;
	let canvasProducts: HTMLCanvasElement;
	let canvasYoY: HTMLCanvasElement;

	// Palette
	const PALETTE = [
		'#8B5E3C','#D4A853','#5E8B3C','#3C5E8B','#8B3C5E','#5E3C8B',
		'#3C8B5E','#8B8B3C','#3C8B8B','#8B3C3C','#6B7280','#D97706'
	];

	const MONTHS_ES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

	function monthLabel(key: string) {
		const [year, m] = key.split('-');
		return `${MONTHS_ES[parseInt(m) - 1]} ${year}`;
	}

	onMount(async () => {
		const { Chart, registerables } = await import('chart.js');
		Chart.register(...registerables);

		// ── 1. Sales by category per month ──
		const categoryIds = Array.from(
			new Set(
				Object.values(data.categoryTotals)
					.flatMap((entry) => Object.keys(entry))
			)
		);

		const catLabels = data.monthLabels.map(monthLabel);

		const catDatasets = categoryIds.map((catId, idx) => {
			const cat = (data.categories as unknown as { id: string; name: string }[]).find((c) => c.id === catId);
			return {
				label: cat?.name ?? 'Sin categoría',
				data: data.monthLabels.map((m) => data.categoryTotals[m]?.[catId] ?? 0),
				backgroundColor: PALETTE[idx % PALETTE.length] + 'CC',
				borderColor: PALETTE[idx % PALETTE.length],
				borderWidth: 2,
				borderRadius: 6
			};
		});

		new Chart(canvasByCat, {
			type: 'bar',
			data: { labels: catLabels, datasets: catDatasets },
			options: {
				responsive: true,
				plugins: {
					legend: { position: 'bottom', labels: { padding: 16, font: { size: 12 } } },
					tooltip: {
						callbacks: {
							label: (ctx) => ` ${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y ?? 0)}`
						}
					},
					title: {
						display: true,
						text: 'Ventas por categoría (en el rango seleccionado)',
						font: { size: 14, weight: 'bold' },
						color: '#2C2018',
						padding: { bottom: 16 }
					}
				},
				scales: {
					x: { stacked: false, grid: { display: false } },
					y: {
						stacked: false,
						ticks: { callback: (v) => formatCurrency(Number(v)) },
						grid: { color: '#E5E0D8' }
					}
				}
			}
		});

		// ── 2. Top products bar ──
		if (canvasProducts && data.topProducts.length > 0) {
			new Chart(canvasProducts, {
				type: 'bar',
				data: {
					labels: data.topProducts.map((p) => p.name),
					datasets: [
						{
							label: 'Total vendido ($)',
							data: data.topProducts.map((p) => p.total),
							backgroundColor: data.topProducts.map((_, i) => PALETTE[i % PALETTE.length] + 'CC'),
							borderColor: data.topProducts.map((_, i) => PALETTE[i % PALETTE.length]),
							borderWidth: 2,
							borderRadius: 6
						}
					]
				},
				options: {
					indexAxis: 'y' as const,
					responsive: true,
					plugins: {
						legend: { display: false },
						tooltip: {
							callbacks: {
								label: (ctx) => ` ${formatCurrency(ctx.parsed.x ?? 0)}`
							}
						},
						title: {
							display: true,
							text: selectedCategory
								? `Productos más vendidos — ${(data.categories as unknown as {id:string;name:string}[]).find((c) => c.id === selectedCategory)?.name ?? ''}`
								: 'Productos más vendidos (todas las categorías)',
							font: { size: 14, weight: 'bold' },
							color: '#2C2018',
							padding: { bottom: 16 }
						}
					},
					scales: {
						x: {
							ticks: { callback: (v) => formatCurrency(Number(v)) },
							grid: { color: '#E5E0D8' }
						},
						y: { grid: { display: false } }
					}
				}
			});
		}

		// ── 3. Year-over-year comparison ──
		const years = Object.keys(data.allYearlyData).sort();
		const yoyDatasets = years.map((year, idx) => ({
			label: year,
			data: Array.from({ length: 12 }, (_, m) => {
				const key = String(m + 1).padStart(2, '0');
				return data.allYearlyData[year]?.[key] ?? 0;
			}),
			borderColor: PALETTE[idx % PALETTE.length],
			backgroundColor: PALETTE[idx % PALETTE.length] + '33',
			fill: true,
			tension: 0.4,
			pointRadius: 5,
			pointHoverRadius: 8,
			borderWidth: 2.5
		}));

		new Chart(canvasYoY, {
			type: 'line',
			data: { labels: MONTHS_ES, datasets: yoyDatasets },
			options: {
				responsive: true,
				interaction: { mode: 'index', intersect: false },
				plugins: {
					legend: { position: 'bottom', labels: { padding: 16, font: { size: 12 } } },
					tooltip: {
						callbacks: {
							label: (ctx) => ` ${ctx.dataset.label}: ${formatCurrency(ctx.parsed.y ?? 0)}`
						}
					},
					title: {
						display: true,
						text: 'Comparativa de ventas por año (todos los meses)',
						font: { size: 14, weight: 'bold' },
						color: '#2C2018',
						padding: { bottom: 16 }
					}
				},
				scales: {
					x: { grid: { display: false } },
					y: {
						ticks: { callback: (v) => formatCurrency(Number(v)) },
						grid: { color: '#E5E0D8' }
					}
				}
			}
		});
	});
</script>

<svelte:head><title>Estadísticas de Ventas — Mueblería Herrera</title></svelte:head>

<div class="space-y-6">

	<!-- Header -->
	<div>
		<h1 class="text-xl font-bold text-[#2C2018]">Estadísticas de Ventas</h1>
		<p class="text-sm text-[#7A6652]">
			{data.totalVouchers} venta{data.totalVouchers !== 1 ? 's' : ''} completada{data.totalVouchers !== 1 ? 's' : ''} en el rango seleccionado
		</p>
	</div>

	<!-- Filters -->
	<div class="card p-4 flex flex-wrap gap-4 items-end">
		<div>
			<label class="label" for="stat-from">Desde</label>
			<input id="stat-from" class="input min-w-36" type="date" bind:value={dateFrom} />
		</div>
		<div>
			<label class="label" for="stat-to">Hasta</label>
			<input id="stat-to" class="input min-w-36" type="date" bind:value={dateTo} />
		</div>
		<div class="min-w-44">
			<label class="label" for="stat-cat">Categoría para detalle</label>
			<select id="stat-cat" class="input" bind:value={selectedCategory} onchange={applyFilters}>
				<option value="">Todas las categorías</option>
				{#each data.categories as cat}
					<option value={cat.id}>{cat.name}</option>
				{/each}
			</select>
		</div>
		<button onclick={applyFilters} class="btn-primary">Aplicar filtros</button>
		<a
			href={`/estadisticas?from=${new Date(new Date().getFullYear(), new Date().getMonth() - 2, 1).toISOString().split('T')[0]}&to=${new Date().toISOString().split('T')[0]}`}
			class="btn-secondary text-sm"
		>
			Últimos 3 meses
		</a>
	</div>

	<!-- Chart: Ventas por categoría -->
	<div class="card p-6">
		<div class="flex items-start gap-3 mb-4">
			<div class="w-10 h-10 rounded-xl bg-[#8B5E3C]/10 flex items-center justify-center shrink-0">
				<svg class="w-5 h-5 text-[#8B5E3C]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
				</svg>
			</div>
			<div>
				<h2 class="font-semibold text-[#2C2018]">Ventas por categoría</h2>
				<p class="text-xs text-[#7A6652]">Cuánto se vendió en cada categoría mes a mes</p>
			</div>
		</div>
		{#if data.monthLabels.length === 0 || Object.values(data.categoryTotals).every((m) => Object.keys(m).length === 0)}
			<div class="text-center py-16 text-[#7A6652]">
				<svg class="w-12 h-12 mx-auto mb-3 opacity-30" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"/>
				</svg>
				<p>No hay ventas en el rango seleccionado</p>
				<p class="text-sm mt-1">Cambia el rango de fechas o registra ventas completadas</p>
			</div>
		{:else}
			<canvas bind:this={canvasByCat} class="max-h-80"></canvas>
		{/if}
	</div>

	<!-- Chart: Top products -->
	<div class="card p-6">
		<div class="flex items-start gap-3 mb-4">
			<div class="w-10 h-10 rounded-xl bg-[#D4A853]/10 flex items-center justify-center shrink-0">
				<svg class="w-5 h-5 text-[#D4A853]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
				</svg>
			</div>
			<div class="flex-1">
				<h2 class="font-semibold text-[#2C2018]">Productos más vendidos</h2>
				<p class="text-xs text-[#7A6652]">
					{selectedCategory
						? `Mostrando productos de: ${(data.categories as unknown as {id:string;name:string}[]).find((c) => c.id === selectedCategory)?.name ?? ''}`
						: 'Todos los productos en el rango — seleccioná una categoría para ver el detalle'}
				</p>
			</div>
			<select
				class="input min-w-40 text-sm"
				bind:value={selectedCategory}
				onchange={applyFilters}
			>
				<option value="">Todas las categorías</option>
				{#each data.categories as cat}
					<option value={cat.id}>{cat.name}</option>
				{/each}
			</select>
		</div>

		{#if data.topProducts.length === 0}
			<div class="text-center py-16 text-[#7A6652]">
				<p>No hay productos vendidos en este período</p>
			</div>
		{:else}
			<canvas bind:this={canvasProducts} class="max-h-80"></canvas>

			<!-- Table under chart -->
			<div class="mt-4 overflow-x-auto">
				<table class="w-full text-sm">
					<thead class="bg-[#F5F0EB]">
						<tr>
							<th class="text-left px-3 py-2 font-medium text-[#7A6652]">#</th>
							<th class="text-left px-3 py-2 font-medium text-[#7A6652]">Producto</th>
							<th class="text-left px-3 py-2 font-medium text-[#7A6652]">Categoría</th>
							<th class="text-right px-3 py-2 font-medium text-[#7A6652]">Unidades</th>
							<th class="text-right px-3 py-2 font-medium text-[#7A6652]">Total</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-[#E5E0D8]">
						{#each data.topProducts as product, idx}
							<tr class="hover:bg-[#FAFAF8]">
								<td class="px-3 py-2 text-[#7A6652]">{idx + 1}</td>
								<td class="px-3 py-2 font-medium text-[#2C2018]">{product.name}</td>
								<td class="px-3 py-2 text-[#7A6652]">{product.category}</td>
								<td class="px-3 py-2 text-right text-[#2C2018]">{product.quantity}</td>
								<td class="px-3 py-2 text-right font-semibold text-[#8B5E3C]">{formatCurrency(product.total)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>

	<!-- Chart: Year-over-year -->
	<div class="card p-6">
		<div class="flex items-start gap-3 mb-4">
			<div class="w-10 h-10 rounded-xl bg-[#5E8B3C]/10 flex items-center justify-center shrink-0">
				<svg class="w-5 h-5 text-[#5E8B3C]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
					<path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
				</svg>
			</div>
			<div>
				<h2 class="font-semibold text-[#2C2018]">Comparativa anual</h2>
				<p class="text-xs text-[#7A6652]">Cómo se comparan las ventas de cada año, mes a mes</p>
			</div>
		</div>
		{#if Object.keys(data.allYearlyData).length === 0}
			<div class="text-center py-16 text-[#7A6652]">
				<p>No hay datos anuales disponibles aún</p>
			</div>
		{:else}
			<canvas bind:this={canvasYoY} class="max-h-80"></canvas>
		{/if}
	</div>

</div>
