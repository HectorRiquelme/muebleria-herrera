<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const PB_URL = import.meta.env.VITE_PB_URL ?? 'http://localhost:8090';

	// Imágenes estáticas por defecto
	const staticSlides = [
		{ src: '/slide1.jpg', title: 'Sofás y Living' },
		{ src: '/slide2.jpg', title: 'Ambientes Modernos' },
		{ src: '/slide3.jpg', title: 'Dormitorios' }
	];

	type LandingImg = { id: string; image: string; title?: string; active: boolean };
	const allImages = $derived((data.images ?? []) as unknown as LandingImg[]);
	let pbImages = $derived(allImages.filter((i) => i.active));

	let slides = $derived(
		pbImages.length > 0
			? pbImages.map((img) => ({
					src: `${PB_URL}/api/files/landing_images/${img.id}/${img.image}`,
					title: img.title ?? 'Mueblería Herrera'
				}))
			: staticSlides
	);

	let currentSlide = $state(0);

	function nextSlide() { currentSlide = (currentSlide + 1) % slides.length; }
	function prevSlide() { currentSlide = (currentSlide - 1 + slides.length) % slides.length; }

	$effect(() => {
		if (slides.length > 1) {
			const interval = setInterval(nextSlide, 5000);
			return () => clearInterval(interval);
		}
	});

	const whatsappNumber = '+56443674412';
	const instagramUrl = 'https://instagram.com/muebleria.herrera';
	const facebookUrl = 'https://facebook.com/muebleriaherrera';
	const whatsappUrl = `https://wa.me/${whatsappNumber.replace(/\D/g, '')}`;

	// Mobile menu
	let menuOpen = $state(false);
</script>

<svelte:head>
	<title>Mueblería Herrera — Muebles para tu hogar</title>
	<meta name="description" content="Mueblería Herrera, Parral. Muebles de calidad para tu hogar. Living, dormitorio, comedor y más." />
</svelte:head>

<!-- ─── NAVBAR ─────────────────────────────────────────────── -->
<nav class="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-lg border-b border-stone-100 shadow-sm">
	<div class="max-w-6xl mx-auto px-4 sm:px-8 flex items-center justify-between h-16">
		<!-- Logo -->
		<a href="/" class="flex items-center gap-2.5 group">
			<div class="w-9 h-9 rounded-xl bg-gradient-to-br from-[#8B5E3C] to-[#6B4425] flex items-center justify-center shadow-md group-hover:shadow-lg transition-shadow">
				<svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
					<path d="M7 2h2v8H7zm8 0h2v8h-2zM4 11h16v2H4zm2 3h2v6H6zm10 0h2v6h-2zM8 17h8v2H8z"/>
				</svg>
			</div>
			<div>
				<span class="font-bold text-[#2C2018] text-base leading-none block">Mueblería Herrera</span>
				<span class="text-[10px] text-[#8B5E3C] font-medium tracking-wider uppercase">Parral, Maule</span>
			</div>
		</a>

		<!-- Desktop nav -->
		<div class="hidden md:flex items-center gap-8">
			<a href="#inicio" class="text-sm font-medium text-stone-600 hover:text-[#8B5E3C] transition-colors">Inicio</a>
			<a href="#nosotros" class="text-sm font-medium text-stone-600 hover:text-[#8B5E3C] transition-colors">Nosotros</a>
			<a href="#galeria" class="text-sm font-medium text-stone-600 hover:text-[#8B5E3C] transition-colors">Galería</a>
			<a href="#contacto" class="text-sm font-medium text-stone-600 hover:text-[#8B5E3C] transition-colors">Contacto</a>
		</div>

		<div class="flex items-center gap-3">
			<a href={whatsappUrl} target="_blank"
				class="hidden sm:flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5c] text-white text-sm font-semibold px-4 py-2 rounded-xl shadow-sm hover:shadow-md transition-all">
				<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
					<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
				</svg>
				WhatsApp
			</a>
			<!-- Mobile menu btn -->
			<button onclick={() => (menuOpen = !menuOpen)} class="md:hidden w-9 h-9 flex items-center justify-center rounded-lg hover:bg-stone-100">
				<svg class="w-5 h-5 text-stone-700" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
					{#if menuOpen}
						<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/>
					{:else}
						<path stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 12h16M4 18h16"/>
					{/if}
				</svg>
			</button>
		</div>
	</div>

	<!-- Mobile menu -->
	{#if menuOpen}
		<div class="md:hidden border-t border-stone-100 bg-white px-4 pb-4 pt-2 space-y-1">
			{#each [['#inicio','Inicio'],['#nosotros','Nosotros'],['#galeria','Galería'],['#contacto','Contacto']] as [href, label]}
				<a {href} onclick={() => (menuOpen = false)}
					class="block px-3 py-2.5 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-50 hover:text-[#8B5E3C]">
					{label}
				</a>
			{/each}
			<a href={whatsappUrl} target="_blank"
				class="flex items-center gap-2 mt-2 bg-[#25D366] text-white px-4 py-2.5 rounded-xl text-sm font-semibold justify-center">
				WhatsApp
			</a>
		</div>
	{/if}
</nav>

<!-- ─── HERO / SLIDER ────────────────────────────────────────── -->
<section id="inicio" class="pt-16">
	<div class="relative h-[75vh] min-h-[480px] overflow-hidden bg-stone-900">
		{#each slides as slide, i}
			<div class="absolute inset-0 transition-all duration-1000 ease-in-out {i === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105'}">
				<img src={slide.src} alt={slide.title} class="w-full h-full object-cover" />
				<div class="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
			</div>
		{/each}

		<!-- Hero text -->
		<div class="absolute inset-0 flex flex-col items-center justify-end pb-20 px-4 text-center text-white">
			<div class="max-w-2xl">
				<p class="text-[#D4A853] text-sm font-semibold tracking-widest uppercase mb-3">Parral · Región del Maule</p>
				<h1 class="text-4xl sm:text-6xl font-bold leading-tight mb-4">
					Mueblería<br class="sm:hidden" /> <span class="text-[#D4A853]">Herrera</span>
				</h1>
				<p class="text-white/80 text-lg sm:text-xl mb-8">Muebles de calidad para tu hogar</p>
				<div class="flex flex-wrap gap-3 justify-center">
					<a href={whatsappUrl} target="_blank"
						class="flex items-center gap-2 bg-[#25D366] hover:bg-[#1ebe5c] text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all text-sm">
						<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
							<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
						</svg>
						Contáctanos
					</a>
					<a href="#galeria"
						class="flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm text-white font-semibold px-6 py-3 rounded-xl border border-white/30 transition-all text-sm">
						Ver galería
						<svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
							<path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7"/>
						</svg>
					</a>
				</div>
			</div>
		</div>

		<!-- Slider controls -->
		{#if slides.length > 1}
			<button onclick={prevSlide}
				class="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm text-white flex items-center justify-center transition-all border border-white/20">
				<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>
			</button>
			<button onclick={nextSlide}
				class="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm text-white flex items-center justify-center transition-all border border-white/20">
				<svg class="w-5 h-5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg>
			</button>
			<div class="absolute bottom-8 left-0 right-0 flex justify-center gap-2">
				{#each slides as _, idx}
					<button onclick={() => (currentSlide = idx)}
						class="transition-all duration-300 rounded-full bg-white {idx === currentSlide ? 'w-8 h-2 opacity-100' : 'w-2 h-2 opacity-50 hover:opacity-75'}">
					</button>
				{/each}
			</div>
		{/if}
	</div>
</section>

<!-- ─── VALUE PROPS ──────────────────────────────────────────── -->
<section class="py-12 bg-[#8B5E3C]">
	<div class="max-w-6xl mx-auto px-4 sm:px-8">
		<div class="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center text-white">
			{#each [
				{ icon: '🛋️', title: 'Gran variedad', desc: 'Living, dormitorio, comedor y más' },
				{ icon: '✅', title: 'Calidad garantizada', desc: 'Productos duraderos y estéticos' },
				{ icon: '💬', title: 'Asesoría personalizada', desc: 'Te ayudamos a elegir' },
				{ icon: '📍', title: 'Parral, Maule', desc: 'Aníbal Pinto 253' }
			] as item}
				<div class="flex flex-col items-center gap-2">
					<span class="text-3xl">{item.icon}</span>
					<p class="font-bold text-sm sm:text-base">{item.title}</p>
					<p class="text-white/70 text-xs sm:text-sm">{item.desc}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- ─── GALERÍA ──────────────────────────────────────────────── -->
<section id="galeria" class="py-20 bg-stone-50">
	<div class="max-w-6xl mx-auto px-4 sm:px-8">
		<div class="text-center mb-12">
			<p class="text-[#8B5E3C] text-sm font-semibold tracking-widest uppercase mb-2">Nuestros muebles</p>
			<h2 class="text-3xl sm:text-4xl font-bold text-[#2C2018]">Nuestra galería</h2>
			<div class="w-16 h-1 bg-[#D4A853] mx-auto mt-4 rounded-full"></div>
		</div>
		<div class="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
			{#each slides as slide, i}
				<div class="group relative overflow-hidden rounded-2xl shadow-md hover:shadow-xl transition-all duration-500 {i === 0 ? 'sm:col-span-1 sm:row-span-1' : ''}">
					<img src={slide.src} alt={slide.title}
						class="w-full aspect-video sm:aspect-square object-cover group-hover:scale-110 transition-transform duration-700" />
					<div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-4">
						<p class="text-white font-semibold">{slide.title}</p>
					</div>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- ─── QUIÉNES SOMOS ────────────────────────────────────────── -->
<section id="nosotros" class="py-20 bg-white">
	<div class="max-w-6xl mx-auto px-4 sm:px-8">
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
			<div>
				<p class="text-[#8B5E3C] text-sm font-semibold tracking-widest uppercase mb-3">Quiénes somos</p>
				<h2 class="text-3xl sm:text-4xl font-bold text-[#2C2018] mb-2">Más de 50 años de <span class="text-[#8B5E3C]">experiencia</span></h2>
				<div class="w-16 h-1 bg-[#D4A853] rounded-full mb-6"></div>
				<p class="text-stone-600 leading-relaxed mb-4 text-lg">
					Mueblería Herrera es una empresa familiar con años de experiencia en la venta de muebles de calidad. Nos especializamos en ofrecer soluciones para tu hogar con productos duraderos y estéticos.
				</p>
				<p class="text-stone-600 leading-relaxed mb-6">
					Contamos con una amplia variedad de muebles para living, comedor, dormitorio y más. Nuestro equipo está siempre disponible para asesorarte y ayudarte a encontrar los muebles perfectos.
				</p>
				<a href={whatsappUrl} target="_blank"
					class="inline-flex items-center gap-2 bg-[#8B5E3C] hover:bg-[#6B4425] text-white font-semibold px-6 py-3 rounded-xl shadow-md hover:shadow-lg transition-all text-sm">
					<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
						<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
					</svg>
					Consultar por WhatsApp
				</a>
			</div>
			<div class="grid grid-cols-2 gap-4">
				{#each [
					{ icon: '🏠', label: 'Experiencia en muebles', color: 'bg-amber-50 border-amber-100' },
					{ icon: '👥', label: 'Clientes satisfechos', color: 'bg-emerald-50 border-emerald-100' },
					{ icon: '✅', label: 'Calidad garantizada', color: 'bg-blue-50 border-blue-100' },
					{ icon: '💳', label: 'Financiación disponible', color: 'bg-purple-50 border-purple-100' }
				] as item}
					<div class="rounded-2xl border-2 {item.color} p-6 flex flex-col items-center text-center gap-3 hover:scale-105 transition-transform">
						<span class="text-4xl">{item.icon}</span>
						<p class="text-sm font-semibold text-[#2C2018] leading-snug">{item.label}</p>
					</div>
				{/each}
			</div>
		</div>
	</div>
</section>

<!-- ─── CONTACTO ─────────────────────────────────────────────── -->
<section id="contacto" class="py-20 bg-stone-50">
	<div class="max-w-6xl mx-auto px-4 sm:px-8">
		<div class="text-center mb-12">
			<p class="text-[#8B5E3C] text-sm font-semibold tracking-widest uppercase mb-2">Estamos para ayudarte</p>
			<h2 class="text-3xl sm:text-4xl font-bold text-[#2C2018]">Contacto y ubicación</h2>
			<div class="w-16 h-1 bg-[#D4A853] mx-auto mt-4 rounded-full"></div>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-5 gap-8">
			<!-- Contact info -->
			<div class="lg:col-span-2 space-y-4">

				<!-- WhatsApp CTA -->
				<a href={whatsappUrl} target="_blank"
					class="flex items-center gap-4 bg-[#25D366] hover:bg-[#1ebe5c] text-white p-5 rounded-2xl shadow-md hover:shadow-lg transition-all">
					<div class="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
						<svg class="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
							<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
						</svg>
					</div>
					<div>
						<p class="font-bold text-lg">Escribinos por WhatsApp</p>
						<p class="text-white/80 text-sm">{whatsappNumber}</p>
					</div>
					<svg class="w-5 h-5 ml-auto opacity-70" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/>
					</svg>
				</a>

				<!-- Info cards -->
				<div class="bg-white border border-stone-200 rounded-2xl p-5 space-y-4">
					<h3 class="font-bold text-[#2C2018]">Información de contacto</h3>

					<div class="flex items-start gap-3">
						<div class="w-9 h-9 bg-[#8B5E3C]/10 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
							<svg class="w-4 h-4 text-[#8B5E3C]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
								<path stroke-linecap="round" stroke-linejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
							</svg>
						</div>
						<div>
							<p class="text-xs font-semibold text-[#8B5E3C] uppercase tracking-wide">Dirección</p>
							<p class="text-stone-700 text-sm font-medium">Aníbal Pinto 253</p>
							<p class="text-stone-500 text-sm">Parral, Región del Maule</p>
						</div>
					</div>

					<div class="flex items-start gap-3">
						<div class="w-9 h-9 bg-[#8B5E3C]/10 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
							<svg class="w-4 h-4 text-[#8B5E3C]" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
							</svg>
						</div>
						<div>
							<p class="text-xs font-semibold text-[#8B5E3C] uppercase tracking-wide">Horario</p>
							<p class="text-stone-700 text-sm font-medium">Lun–Vie: 9:30 – 18:30</p>
							<p class="text-stone-500 text-sm">Sábado: 10:00 – 13:00</p>
						</div>
					</div>
				</div>

				<!-- Social links -->
				<div class="bg-white border border-stone-200 rounded-2xl p-5">
					<h3 class="font-bold text-[#2C2018] mb-3">Seguinos en redes</h3>
					<div class="flex gap-3">
						<a href={instagramUrl} target="_blank"
							class="flex-1 flex items-center justify-center gap-2 bg-gradient-to-br from-purple-600 to-pink-500 text-white px-3 py-2.5 rounded-xl hover:opacity-90 transition-opacity text-sm font-semibold">
							<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
							Instagram
						</a>
						<a href={facebookUrl} target="_blank"
							class="flex-1 flex items-center justify-center gap-2 bg-[#1877f2] hover:bg-[#1464d9] text-white px-3 py-2.5 rounded-xl transition-colors text-sm font-semibold">
							<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
							Facebook
						</a>
					</div>
				</div>
			</div>

			<!-- Map -->
			<div class="lg:col-span-3">
				<div class="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-sm" style="height: 420px;">
					<iframe
						src="https://maps.google.com/maps?q=An%C3%ADbal+Pinto+253%2C+Parral%2C+Regi%C3%B3n+del+Maule%2C+Chile&output=embed&z=17"
						width="100%"
						height="100%"
						style="border:0;"
						allowfullscreen
						loading="lazy"
						referrerpolicy="no-referrer-when-downgrade"
						title="Ubicación Mueblería Herrera"
					></iframe>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- ─── FOOTER ───────────────────────────────────────────────── -->
<footer class="bg-[#1a130d] text-white">
	<!-- Top footer -->
	<div class="max-w-6xl mx-auto px-4 sm:px-8 py-12">
		<div class="grid grid-cols-1 sm:grid-cols-3 gap-8">
			<!-- Brand -->
			<div>
				<div class="flex items-center gap-2.5 mb-4">
					<div class="w-9 h-9 rounded-xl bg-[#8B5E3C] flex items-center justify-center">
						<svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
							<path d="M7 2h2v8H7zm8 0h2v8h-2zM4 11h16v2H4zm2 3h2v6H6zm10 0h2v6h-2zM8 17h8v2H8z"/>
						</svg>
					</div>
					<div>
						<p class="font-bold text-sm">Mueblería Herrera</p>
						<p class="text-[#D4A853] text-xs">Parral, Maule</p>
					</div>
				</div>
				<p class="text-stone-400 text-sm leading-relaxed">
					Tu mueblería de confianza en Parral. Calidad, variedad y atención personalizada.
				</p>
			</div>

			<!-- Links -->
			<div>
				<h3 class="font-semibold text-sm mb-4 text-[#D4A853]">Navegación</h3>
				<ul class="space-y-2">
					{#each [['#inicio','Inicio'],['#galeria','Galería'],['#nosotros','Quiénes somos'],['#contacto','Contacto']] as [href, label]}
						<li><a {href} class="text-stone-400 hover:text-white text-sm transition-colors">{label}</a></li>
					{/each}
				</ul>
			</div>

			<!-- Contact -->
			<div>
				<h3 class="font-semibold text-sm mb-4 text-[#D4A853]">Contacto</h3>
				<ul class="space-y-2 text-sm text-stone-400">
					<li class="flex items-center gap-2">
						<span>📍</span>
						<span>Aníbal Pinto 253, Parral</span>
					</li>
					<li class="flex items-center gap-2">
						<span>🕐</span>
						<span>Lun–Vie 9:30–18:30 | Sáb 10:00–13:00</span>
					</li>
					<li>
						<a href={whatsappUrl} target="_blank" class="flex items-center gap-2 hover:text-white transition-colors">
							<span>💬</span>
							<span>{whatsappNumber}</span>
						</a>
					</li>
				</ul>
			</div>
		</div>
	</div>

	<!-- Bottom bar -->
	<div class="border-t border-white/5">
		<div class="max-w-6xl mx-auto px-4 sm:px-8 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-stone-500 text-xs">
			<p>&copy; {new Date().getFullYear()} Mueblería Herrera — Todos los derechos reservados</p>
			<div class="flex gap-4">
				<a href={instagramUrl} target="_blank" class="hover:text-white transition-colors">Instagram</a>
				<a href={facebookUrl} target="_blank" class="hover:text-white transition-colors">Facebook</a>
				<a href={whatsappUrl} target="_blank" class="hover:text-white transition-colors">WhatsApp</a>
			</div>
		</div>
	</div>
</footer>
