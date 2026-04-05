<script lang="ts">
	import '../app.css';
	import { Navigation } from '@skeletonlabs/skeleton-svelte';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import { afterNavigate } from '$app/navigation';
	import MobileAppBar from '$lib/components/MobileAppBar.svelte';
	import NavDrawer from '$lib/components/NavDrawer.svelte';

	let { children } = $props();
	let drawerOpen = $state(false);

	afterNavigate(() => {
		drawerOpen = false;
	});
</script>

{#snippet navContent()}
	<Navigation layout="sidebar">
		<Navigation.Header>
			<div class="p-4">
				<a href="/" class="h3 anchor">LL</a>
				<p class="opacity-50">Language Transfer</p>
			</div>
		</Navigation.Header>

		<Navigation.Menu>
			<Navigation.Group>
				<Navigation.Label>Learn</Navigation.Label>
				<Navigation.TriggerAnchor
					href="/"
					class={$page.url.pathname === '/' ? 'preset-tonal-primary' : ''}
				>
					<Navigation.TriggerText>Dashboard</Navigation.TriggerText>
				</Navigation.TriggerAnchor>
				<Navigation.TriggerAnchor
					href="/episodes"
					class={$page.url.pathname.startsWith('/episodes') ? 'preset-tonal-primary' : ''}
				>
					<Navigation.TriggerText>Episodes</Navigation.TriggerText>
				</Navigation.TriggerAnchor>
			</Navigation.Group>

			<Navigation.Group>
				<Navigation.Label>Review</Navigation.Label>
				<Navigation.TriggerAnchor
					href="/vocabulary"
					class={$page.url.pathname === '/vocabulary' ? 'preset-tonal-primary' : ''}
				>
					<Navigation.TriggerText>Vocabulary</Navigation.TriggerText>
				</Navigation.TriggerAnchor>
				<Navigation.TriggerAnchor
					href="/concepts"
					class={$page.url.pathname === '/concepts' ? 'preset-tonal-primary' : ''}
				>
					<Navigation.TriggerText>Concepts</Navigation.TriggerText>
				</Navigation.TriggerAnchor>
			</Navigation.Group>
		</Navigation.Menu>

		<Navigation.Footer>
			<div class="p-4">
				<form method="POST" action="/?/sync" use:enhance>
					<button type="submit" class="btn preset-tonal w-full">Sync LingQ</button>
				</form>
			</div>
		</Navigation.Footer>
	</Navigation>
{/snippet}

<svelte:head>
	<title>Language Learner</title>
</svelte:head>

<div class="flex flex-col md:flex-row h-screen">
	<div class="md:hidden">
		<MobileAppBar onMenuClick={() => { drawerOpen = true }} />
	</div>

	<NavDrawer bind:open={drawerOpen}>
		{@render navContent()}
	</NavDrawer>

	<div class="hidden md:block">
		{@render navContent()}
	</div>

	<main class="flex-1 overflow-auto p-3 md:p-6">
		<div class="mx-auto max-w-5xl">
			{@render children()}
		</div>
	</main>
</div>
