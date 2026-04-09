<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData } from './$types';
	import type { LandingCategory, LandingProduct } from '$lib/types';

	let { data }: { data: PageData } = $props();

	const PB_URL = import.meta.env.VITE_PB_URL ?? 'http://localhost:8090';

	let categories = $derived((data.categories ?? []) as unknown as LandingCategory[]);
	let products = $derived((data.products ?? []) as unknown as LandingProduct[]);

	// Tab state
	let activeTab = $state<'categories' | 'products'>('categories');

	// Category modal
	let showCatModal = $state(false);
	let editingCat = $state<LandingCategory | null>(null);

	// Product modal
	let showProdModal = $state(false);
	let editingProd = $state<LandingProduct | null>(null);

	// Confirm delete
	let confirmDelete = $state<{ type: 'category' | 'product'; id: string; name: string } | null>(null);

	// Filter products by category
	let filterCategory = $state('');
	let filteredProducts = $derived(
		filterCategory ? products.filter(p => p.category === filterCategory) : products
	);

	function openCreateCat() {
		editingCat = null;
		showCatModal = true;
	}
	function openEditCat(cat: LandingCategory) {
		editingCat = cat;
		showCatModal = true;
	}
	function openCreateProd() {
		editingProd = null;
		showProdModal = true;
	}
	function openEditProd(prod: LandingProduct) {
		editingProd = prod;
		showProdModal = true;
	}

	function getCatImage(cat: LandingCategory): string {
		if (!cat.image) return '';
		return `${PB_URL}/api/files/landing_categories/${cat.id}/${cat.image}?thumb=200x200`;
	}
	function getProdImage(prod: LandingProduct): string {
		if (!prod.image) return '';
		return `${PB_URL}/api/files/landing_products/${prod.id}/${prod.image}?thumb=200x200`;
	}
	function getCatName(categoryId: string): string {
		return categories.find(c => c.id === categoryId)?.name ?? 'Sin categoría';
	}
	function formatPrice(price?: number): string {
		if (!price) return '';
		return price.toLocaleString('es-CL', { style: 'currency', currency: 'CLP' });
	}
</script>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold text-[#2C2018]">Catálogo Web</h1>
			<p class="text-sm text-[#7A6652] mt-1">Administra las categorías y productos que se muestran en la página web pública</p>
		</div>
	</div>

	<!-- Tabs -->
	<div class="flex gap-1 bg-[#F5F0EB] p-1 rounded-xl w-fit">
		<button
			onclick={() => (activeTab = 'categories')}
			class="px-5 py-2 rounded-lg text-sm font-medium transition-all {activeTab === 'categories' ? 'bg-white text-[#2C2018] shadow-sm' : 'text-[#7A6652] hover:text-[#2C2018]'}"
		>
			Categorías ({categories.length})
		</button>
		<button
			onclick={() => (activeTab = 'products')}
			class="px-5 py-2 rounded-lg text-sm font-medium transition-all {activeTab === 'products' ? 'bg-white text-[#2C2018] shadow-sm' : 'text-[#7A6652] hover:text-[#2C2018]'}"
		>
			Productos ({products.length})
		</button>
	</div>

	<!-- ─── CATEGORÍAS TAB ──────────────────────────────── -->
	{#if activeTab === 'categories'}
		<div class="flex justify-end">
			<button onclick={openCreateCat}
				class="flex items-center gap-2 bg-[#8B5E3C] hover:bg-[#6B4425] text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm">
				<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
				Nueva categoría
			</button>
		</div>

		{#if categories.length === 0}
			<div class="text-center py-16 bg-white rounded-2xl border border-[#E5E0D8]">
				<svg class="w-12 h-12 mx-auto text-[#E5E0D8] mb-3" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 7.125C2.25 6.504 2.754 6 3.375 6h6c.621 0 1.125.504 1.125 1.125v3.75c0 .621-.504 1.125-1.125 1.125h-6A1.125 1.125 0 012.25 10.875v-3.75zM14.25 8.625c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v8.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-8.25zM3.75 16.125c0-.621.504-1.125 1.125-1.125h5.25c.621 0 1.125.504 1.125 1.125v2.25c0 .621-.504 1.125-1.125 1.125h-5.25a1.125 1.125 0 01-1.125-1.125v-2.25z"/></svg>
				<p class="text-[#7A6652]">No hay categorías aún. Crea la primera para empezar.</p>
			</div>
		{:else}
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{#each categories as cat}
					<div class="bg-white rounded-2xl border border-[#E5E0D8] overflow-hidden hover:shadow-md transition-shadow group">
						<!-- Image -->
						<div class="relative aspect-video bg-stone-100">
							{#if cat.image}
								<img src={getCatImage(cat)} alt={cat.name} class="w-full h-full object-cover" />
							{:else}
								<div class="w-full h-full flex items-center justify-center text-[#E5E0D8]">
									<svg class="w-12 h-12" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M18 7.5h.008v.008H18V7.5z"/></svg>
								</div>
							{/if}
							<!-- Status badge -->
							<span class="absolute top-2 right-2 px-2 py-0.5 rounded-full text-xs font-semibold {cat.active ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-200 text-stone-500'}">
								{cat.active ? 'Activa' : 'Inactiva'}
							</span>
						</div>
						<!-- Info -->
						<div class="p-4">
							<h3 class="font-semibold text-[#2C2018]">{cat.name}</h3>
							{#if cat.description}
								<p class="text-sm text-[#7A6652] mt-1 line-clamp-2">{cat.description}</p>
							{/if}
							<p class="text-xs text-[#7A6652] mt-2">
								{products.filter(p => p.category === cat.id).length} producto(s) · Orden: {cat.order}
							</p>
							<!-- Actions -->
							<div class="flex gap-2 mt-3 pt-3 border-t border-[#E5E0D8]">
								<button onclick={() => openEditCat(cat)}
									class="flex-1 text-sm px-3 py-1.5 rounded-lg bg-[#F5F0EB] text-[#8B5E3C] hover:bg-[#8B5E3C] hover:text-white transition-colors font-medium">
									Editar
								</button>
								<form method="POST" action="?/toggleCategory" use:enhance>
									<input type="hidden" name="id" value={cat.id} />
									<input type="hidden" name="active" value={String(cat.active)} />
									<button type="submit"
										class="text-sm px-3 py-1.5 rounded-lg border border-[#E5E0D8] text-[#7A6652] hover:bg-stone-50 transition-colors">
										{cat.active ? 'Desactivar' : 'Activar'}
									</button>
								</form>
								<button onclick={() => (confirmDelete = { type: 'category', id: cat.id, name: cat.name })}
									class="text-sm px-3 py-1.5 rounded-lg text-red-500 hover:bg-red-50 transition-colors">
									<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
								</button>
							</div>
						</div>
					</div>
				{/each}
			</div>
		{/if}
	{/if}

	<!-- ─── PRODUCTOS TAB ──────────────────────────────── -->
	{#if activeTab === 'products'}
		<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
			<!-- Filter -->
			<select bind:value={filterCategory}
				class="border border-[#E5E0D8] rounded-xl px-3 py-2 text-sm bg-white text-[#2C2018] focus:ring-2 focus:ring-[#D4A853] focus:border-[#D4A853] outline-none">
				<option value="">Todas las categorías</option>
				{#each categories as cat}
					<option value={cat.id}>{cat.name}</option>
				{/each}
			</select>
			<button onclick={openCreateProd}
				disabled={categories.length === 0}
				class="flex items-center gap-2 bg-[#8B5E3C] hover:bg-[#6B4425] text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
				<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4"/></svg>
				Nuevo producto
			</button>
		</div>

		{#if categories.length === 0}
			<div class="text-center py-16 bg-white rounded-2xl border border-[#E5E0D8]">
				<p class="text-[#7A6652]">Crea al menos una categoría antes de agregar productos.</p>
			</div>
		{:else if filteredProducts.length === 0}
			<div class="text-center py-16 bg-white rounded-2xl border border-[#E5E0D8]">
				<svg class="w-12 h-12 mx-auto text-[#E5E0D8] mb-3" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/></svg>
				<p class="text-[#7A6652]">No hay productos{filterCategory ? ' en esta categoría' : ''}. Agrega el primero.</p>
			</div>
		{:else}
			<div class="bg-white rounded-2xl border border-[#E5E0D8] overflow-hidden">
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="border-b border-[#E5E0D8] bg-[#FAFAF8]">
								<th class="text-left px-4 py-3 font-semibold text-[#2C2018]">Imagen</th>
								<th class="text-left px-4 py-3 font-semibold text-[#2C2018]">Nombre</th>
								<th class="text-left px-4 py-3 font-semibold text-[#2C2018] hidden sm:table-cell">Categoría</th>
								<th class="text-left px-4 py-3 font-semibold text-[#2C2018] hidden md:table-cell">Precio</th>
								<th class="text-left px-4 py-3 font-semibold text-[#2C2018]">Estado</th>
								<th class="text-right px-4 py-3 font-semibold text-[#2C2018]">Acciones</th>
							</tr>
						</thead>
						<tbody>
							{#each filteredProducts as prod}
								<tr class="border-b border-[#E5E0D8] last:border-0 hover:bg-[#FAFAF8] transition-colors">
									<td class="px-4 py-3">
										{#if prod.image}
											<img src={getProdImage(prod)} alt={prod.name} class="w-12 h-12 rounded-lg object-cover" />
										{:else}
											<div class="w-12 h-12 rounded-lg bg-stone-100 flex items-center justify-center text-[#E5E0D8]">
												<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="1.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M18 7.5h.008v.008H18V7.5z"/></svg>
											</div>
										{/if}
									</td>
									<td class="px-4 py-3">
										<p class="font-medium text-[#2C2018]">{prod.name}</p>
										{#if prod.description}
											<p class="text-xs text-[#7A6652] line-clamp-1 mt-0.5">{prod.description}</p>
										{/if}
									</td>
									<td class="px-4 py-3 hidden sm:table-cell">
										<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#F5F0EB] text-[#8B5E3C]">
											{getCatName(prod.category)}
										</span>
									</td>
									<td class="px-4 py-3 hidden md:table-cell text-[#2C2018]">
										{prod.price ? formatPrice(prod.price) : '—'}
									</td>
									<td class="px-4 py-3">
										<span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold {prod.active ? 'bg-emerald-100 text-emerald-700' : 'bg-stone-200 text-stone-500'}">
											{prod.active ? 'Activo' : 'Inactivo'}
										</span>
									</td>
									<td class="px-4 py-3 text-right">
										<div class="flex items-center justify-end gap-1">
											<button onclick={() => openEditProd(prod)}
												class="p-1.5 rounded-lg hover:bg-[#F5F0EB] text-[#8B5E3C] transition-colors" title="Editar">
												<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/></svg>
											</button>
											<form method="POST" action="?/toggleProduct" use:enhance class="inline">
												<input type="hidden" name="id" value={prod.id} />
												<input type="hidden" name="active" value={String(prod.active)} />
												<button type="submit"
													class="p-1.5 rounded-lg hover:bg-stone-100 text-[#7A6652] transition-colors" title={prod.active ? 'Desactivar' : 'Activar'}>
													{#if prod.active}
														<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/><path stroke-linecap="round" stroke-linejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/></svg>
													{:else}
														<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"/></svg>
													{/if}
												</button>
											</form>
											<button onclick={() => (confirmDelete = { type: 'product', id: prod.id, name: prod.name })}
												class="p-1.5 rounded-lg hover:bg-red-50 text-red-400 hover:text-red-600 transition-colors" title="Eliminar">
												<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
											</button>
										</div>
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}
	{/if}
</div>

<!-- ─── MODAL CATEGORÍA ──────────────────────────────── -->
{#if showCatModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<div class="absolute inset-0 bg-black/40 backdrop-blur-sm" onclick={() => (showCatModal = false)}></div>
		<div class="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
			<h3 class="text-lg font-bold text-[#2C2018] mb-4">{editingCat ? 'Editar categoría' : 'Nueva categoría'}</h3>
			<form method="POST" action={editingCat ? '?/updateCategory' : '?/createCategory'} enctype="multipart/form-data"
				use:enhance={() => { return async ({ update }) => { showCatModal = false; await update(); }; }}>
				{#if editingCat}
					<input type="hidden" name="id" value={editingCat.id} />
				{/if}
				<div class="space-y-4">
					<div>
						<label for="cat-name" class="block text-sm font-medium text-[#2C2018] mb-1">Nombre *</label>
						<input id="cat-name" name="name" type="text" required
							value={editingCat?.name ?? ''}
							class="w-full border border-[#E5E0D8] rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-[#D4A853] focus:border-[#D4A853] outline-none" />
					</div>
					<div>
						<label for="cat-desc" class="block text-sm font-medium text-[#2C2018] mb-1">Descripción</label>
						<textarea id="cat-desc" name="description" rows="3"
							class="w-full border border-[#E5E0D8] rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-[#D4A853] focus:border-[#D4A853] outline-none resize-none"
						>{editingCat?.description ?? ''}</textarea>
					</div>
					<div>
						<label for="cat-image" class="block text-sm font-medium text-[#2C2018] mb-1">Imagen</label>
						<input id="cat-image" name="image" type="file" accept="image/jpeg,image/png,image/webp"
							class="w-full border border-[#E5E0D8] rounded-xl px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[#F5F0EB] file:text-[#8B5E3C] file:px-3 file:py-1 file:text-sm file:font-medium" />
						{#if editingCat?.image}
							<p class="text-xs text-[#7A6652] mt-1">Ya tiene imagen. Sube una nueva para reemplazarla.</p>
						{/if}
					</div>
					<div>
						<label for="cat-order" class="block text-sm font-medium text-[#2C2018] mb-1">Orden</label>
						<input id="cat-order" name="order" type="number" min="0"
							value={editingCat?.order ?? 0}
							class="w-full border border-[#E5E0D8] rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-[#D4A853] focus:border-[#D4A853] outline-none" />
					</div>
				</div>
				<div class="flex justify-end gap-2 mt-6">
					<button type="button" onclick={() => (showCatModal = false)}
						class="px-4 py-2 rounded-xl border border-[#E5E0D8] text-sm font-medium text-[#7A6652] hover:bg-stone-50 transition-colors">
						Cancelar
					</button>
					<button type="submit"
						class="px-4 py-2 rounded-xl bg-[#8B5E3C] hover:bg-[#6B4425] text-white text-sm font-medium transition-colors shadow-sm">
						{editingCat ? 'Guardar cambios' : 'Crear categoría'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- ─── MODAL PRODUCTO ──────────────────────────────── -->
{#if showProdModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<div class="absolute inset-0 bg-black/40 backdrop-blur-sm" onclick={() => (showProdModal = false)}></div>
		<div class="relative bg-white rounded-2xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
			<h3 class="text-lg font-bold text-[#2C2018] mb-4">{editingProd ? 'Editar producto' : 'Nuevo producto'}</h3>
			<form method="POST" action={editingProd ? '?/updateProduct' : '?/createProduct'} enctype="multipart/form-data"
				use:enhance={() => { return async ({ update }) => { showProdModal = false; await update(); }; }}>
				{#if editingProd}
					<input type="hidden" name="id" value={editingProd.id} />
				{/if}
				<div class="space-y-4">
					<div>
						<label for="prod-name" class="block text-sm font-medium text-[#2C2018] mb-1">Nombre *</label>
						<input id="prod-name" name="name" type="text" required
							value={editingProd?.name ?? ''}
							class="w-full border border-[#E5E0D8] rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-[#D4A853] focus:border-[#D4A853] outline-none" />
					</div>
					<div>
						<label for="prod-desc" class="block text-sm font-medium text-[#2C2018] mb-1">Descripción</label>
						<textarea id="prod-desc" name="description" rows="3"
							class="w-full border border-[#E5E0D8] rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-[#D4A853] focus:border-[#D4A853] outline-none resize-none"
						>{editingProd?.description ?? ''}</textarea>
					</div>
					<div>
						<label for="prod-cat" class="block text-sm font-medium text-[#2C2018] mb-1">Categoría *</label>
						<select id="prod-cat" name="category" required
							class="w-full border border-[#E5E0D8] rounded-xl px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-[#D4A853] focus:border-[#D4A853] outline-none">
							<option value="">Seleccionar categoría</option>
							{#each categories as cat}
								<option value={cat.id} selected={editingProd?.category === cat.id}>{cat.name}</option>
							{/each}
						</select>
					</div>
					<div>
						<label for="prod-price" class="block text-sm font-medium text-[#2C2018] mb-1">Precio (CLP)</label>
						<input id="prod-price" name="price" type="number" min="0"
							value={editingProd?.price ?? ''}
							class="w-full border border-[#E5E0D8] rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-[#D4A853] focus:border-[#D4A853] outline-none" />
					</div>
					<div>
						<label for="prod-image" class="block text-sm font-medium text-[#2C2018] mb-1">Imagen</label>
						<input id="prod-image" name="image" type="file" accept="image/jpeg,image/png,image/webp"
							class="w-full border border-[#E5E0D8] rounded-xl px-3 py-2 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-[#F5F0EB] file:text-[#8B5E3C] file:px-3 file:py-1 file:text-sm file:font-medium" />
						{#if editingProd?.image}
							<p class="text-xs text-[#7A6652] mt-1">Ya tiene imagen. Sube una nueva para reemplazarla.</p>
						{/if}
					</div>
					<div>
						<label for="prod-order" class="block text-sm font-medium text-[#2C2018] mb-1">Orden</label>
						<input id="prod-order" name="order" type="number" min="0"
							value={editingProd?.order ?? 0}
							class="w-full border border-[#E5E0D8] rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-[#D4A853] focus:border-[#D4A853] outline-none" />
					</div>
				</div>
				<div class="flex justify-end gap-2 mt-6">
					<button type="button" onclick={() => (showProdModal = false)}
						class="px-4 py-2 rounded-xl border border-[#E5E0D8] text-sm font-medium text-[#7A6652] hover:bg-stone-50 transition-colors">
						Cancelar
					</button>
					<button type="submit"
						class="px-4 py-2 rounded-xl bg-[#8B5E3C] hover:bg-[#6B4425] text-white text-sm font-medium transition-colors shadow-sm">
						{editingProd ? 'Guardar cambios' : 'Crear producto'}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

<!-- ─── CONFIRM DELETE ──────────────────────────────── -->
{#if confirmDelete}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4">
		<div class="absolute inset-0 bg-black/40 backdrop-blur-sm" onclick={() => (confirmDelete = null)}></div>
		<div class="relative bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
			<div class="w-12 h-12 mx-auto mb-3 rounded-full bg-red-100 flex items-center justify-center">
				<svg class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"/></svg>
			</div>
			<h3 class="text-lg font-bold text-[#2C2018] mb-1">Eliminar {confirmDelete.type === 'category' ? 'categoría' : 'producto'}</h3>
			<p class="text-sm text-[#7A6652] mb-5">
				¿Eliminar <strong>{confirmDelete.name}</strong>? Esta acción no se puede deshacer.
			</p>
			<div class="flex gap-2 justify-center">
				<button onclick={() => (confirmDelete = null)}
					class="px-4 py-2 rounded-xl border border-[#E5E0D8] text-sm font-medium text-[#7A6652] hover:bg-stone-50 transition-colors">
					Cancelar
				</button>
				<form method="POST" action={confirmDelete.type === 'category' ? '?/deleteCategory' : '?/deleteProduct'}
					use:enhance={() => { return async ({ update }) => { confirmDelete = null; await update(); }; }}>
					<input type="hidden" name="id" value={confirmDelete.id} />
					<button type="submit"
						class="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-medium transition-colors">
						Eliminar
					</button>
				</form>
			</div>
		</div>
	</div>
{/if}
