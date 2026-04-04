<script lang="ts">
	import { enhance } from '$app/forms';
	import { Progress } from '@skeletonlabs/skeleton-svelte';

	let { data, form } = $props();
	const progressPercent = $derived(Math.round((data.listenedCount / data.totalEpisodes) * 100));
</script>

<div class="flex flex-col gap-6 mx-auto max-w-4xl">
	<h1 class="h1">Dashboard</h1>

	<div class="card p-6">
		<h2 class="h3">Course Progress</h2>
		<div class="flex flex-col gap-2 mt-4">
			<div class="flex justify-between">
				<span>{data.listenedCount} / {data.totalEpisodes} episodes</span>
				<span>{progressPercent}%</span>
			</div>
			<Progress.Root value={progressPercent} max={100}>
				<Progress.Track>
					<Progress.Range />
				</Progress.Track>
			</Progress.Root>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-4 md:grid-cols-3">
		<div class="card p-6">
			<p class="h2">{data.listenedCount}</p>
			<p>Episodes Listened</p>
		</div>
		<div class="card p-6">
			<p class="h2">{data.wordCount}</p>
			<p>Words Tracked</p>
		</div>
		<div class="card p-6">
			<p class="h2">{data.conceptCount}</p>
			<p>Concepts Tracked</p>
		</div>
	</div>

	{#if data.recentEpisodes.length > 0}
		<div class="card p-6">
			<h2 class="h3">Recently Listened</h2>
			<div class="table-wrap mt-4">
				<table class="table">
					<thead>
						<tr>
							<th>#</th>
							<th>Title</th>
							<th>Listened</th>
						</tr>
					</thead>
					<tbody>
						{#each data.recentEpisodes as ep}
							<tr>
								<td>{ep.number}</td>
								<td><a href="/episodes/{ep.number}" class="anchor">{ep.title}</a></td>
								<td>{ep.listenedAt ?? ''}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}

	<div class="card p-6">
		<h2 class="h3">LingQ Sync</h2>
		{#if data.lastSync}
			<p>Last synced: {data.lastSync.syncedAt}</p>
			<p>{data.lastSync.cardsMatched} words matched of {data.lastSync.cardsProcessed} cards</p>
		{:else}
			<p>Not yet synced</p>
		{/if}
		{#if form?.synced}
			<p>{form.cardsMatched} matched of {form.cardsProcessed} cards</p>
		{/if}
		{#if form?.error}
			<p>Error: {form.error}</p>
		{/if}
		<form method="POST" action="?/sync" use:enhance class="mt-4">
			<button type="submit" class="btn preset-filled-primary-500">Sync with LingQ</button>
		</form>
	</div>
</div>
