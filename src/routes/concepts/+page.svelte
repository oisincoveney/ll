<script lang="ts">
	import { Progress } from '@skeletonlabs/skeleton-svelte';

	let { data } = $props();
	const overallPercent = $derived(
		data.totalConcepts > 0 ? Math.round((data.totalMastered / data.totalConcepts) * 100) : 0
	);
</script>

<div class="flex flex-col gap-6">
	<!-- Header -->
	<div class="flex items-center gap-4">
		<div class="flex-1">
			<h1 class="h2">Concepts</h1>
			<p class="opacity-50">{data.totalMastered} of {data.totalConcepts} mastered</p>
		</div>
		<span class="badge preset-tonal-primary h4">{overallPercent}%</span>
	</div>

	<Progress value={overallPercent} max={100}>
		<Progress.Track>
			<Progress.Range />
		</Progress.Track>
	</Progress>

	<!-- Category cards -->
	<div class="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
		{#each data.categories as cat}
			{@const percent = cat.conceptCount > 0 ? Math.round((cat.masteredCount / cat.conceptCount) * 100) : 0}
			<a href="/concepts/{cat.slug}" class="card p-5 flex flex-col gap-3">
				<div class="flex items-center gap-2">
					<h2 class="h4 flex-1">{cat.name}</h2>
					{#if percent === 100}
						<span class="badge preset-filled-primary-500">Complete</span>
					{:else if percent > 0}
						<span class="badge preset-tonal-primary">{percent}%</span>
					{/if}
				</div>

				<Progress value={percent} max={100}>
					<Progress.Track>
						<Progress.Range />
					</Progress.Track>
				</Progress>

				<div class="flex gap-3">
					<span class="badge preset-tonal">{cat.conceptCount} concepts</span>
					{#if cat.episodeLinkCount > 0}
						<span class="badge preset-tonal">{cat.episodeLinkCount} episode links</span>
					{/if}
				</div>
			</a>
		{/each}
	</div>

	{#if data.categories.length === 0}
		<div class="card preset-tonal p-6 text-center">
			<p class="h4">No concepts extracted yet</p>
			<p class="opacity-50">Concepts are automatically extracted from episode transcripts.</p>
		</div>
	{/if}
</div>
