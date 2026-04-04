<script lang="ts">
	import '../app.css';
	import { AppBar } from '@skeletonlabs/skeleton-svelte';
	import { page } from '$app/stores';

	let { children } = $props();
</script>

<svelte:head>
	<title>Language Learner</title>
</svelte:head>

<div class="flex flex-col h-screen">
	<AppBar>
		<AppBar.Toolbar>
			<AppBar.Lead>
				<a href="/" class="btn preset-filled-primary-500">LL</a>
			</AppBar.Lead>
			<AppBar.Headline>
				<nav class="flex gap-2">
					<a href="/" class="btn" class:preset-tonal-primary={$page.url.pathname === '/'}>Dashboard</a>
					<a href="/episodes" class="btn" class:preset-tonal-primary={$page.url.pathname.startsWith('/episodes')}>Episodes</a>
					<a href="/vocabulary" class="btn" class:preset-tonal-primary={$page.url.pathname === '/vocabulary'}>Vocabulary</a>
					<a href="/concepts" class="btn" class:preset-tonal-primary={$page.url.pathname === '/concepts'}>Concepts</a>
				</nav>
			</AppBar.Headline>
			<AppBar.Trail />
		</AppBar.Toolbar>
	</AppBar>

	<main class="flex-1 overflow-auto p-4">
		{@render children()}
	</main>
</div>
