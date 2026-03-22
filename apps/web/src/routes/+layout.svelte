<script lang="ts">
	import '../app.css';
	let { children } = $props();
</script>

<svelte:head>
	<title>Mueblería Herrera</title>
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<meta name="description" content="Mueblería Herrera — Muebles de calidad para tu hogar" />
</svelte:head>

{@render children()}
