<script lang="ts">
	import { SegmentedControl } from '@skeletonlabs/skeleton-svelte';

	let { data } = $props();
	let search = $state('');
	let statusFilter = $state('all');

	const filteredWords = $derived(
		data.words.filter((w) => {
			const matchesSearch =
				w.spanish.toLowerCase().includes(search.toLowerCase()) ||
				w.english.toLowerCase().includes(search.toLowerCase());
			const matchesStatus =
				statusFilter === 'all' ||
				(statusFilter === 'new' && (w.lingqStatus === null || w.lingqStatus === 0)) ||
				(statusFilter === 'learning' && w.lingqStatus !== null && w.lingqStatus > 0 && w.lingqStatus < 4) ||
				(statusFilter === 'known' && w.lingqStatus === 4);
			return matchesSearch && matchesStatus;
		})
	);

	function statusLabel(status: number | null): string {
		if (status === null || status === 0) return 'New';
		if (status === 1) return 'Recognized';
		if (status === 2) return 'Familiar';
		if (status === 3) return 'Learned';
		if (status === 4) return 'Known';
		return String(status);
	}

	function statusPreset(status: number | null): string {
		if (status === null || status === 0) return 'preset-tonal-error';
		if (status === 1 || status === 2) return 'preset-tonal';
		if (status === 3) return 'preset-tonal-secondary';
		return 'preset-tonal-primary';
	}
</script>

<div class="flex flex-col gap-4">
	<div class="flex items-center gap-4">
		<h1 class="h2 flex-1">Vocabulary</h1>
		<span class="badge preset-tonal-primary">{filteredWords.length} words</span>
	</div>

	<!-- Filters -->
	<div class="flex flex-col gap-3">
		<input
			type="text"
			bind:value={search}
			placeholder="Search words..."
			class="input"
		/>
		<SegmentedControl
			name="status"
			value={statusFilter}
			onValueChange={(details) => { statusFilter = details.value; }}
		>
			<SegmentedControl.Control>
				<SegmentedControl.Indicator />
				<SegmentedControl.Item value="all">
					<SegmentedControl.ItemText>All</SegmentedControl.ItemText>
					<SegmentedControl.ItemHiddenInput />
				</SegmentedControl.Item>
				<SegmentedControl.Item value="new">
					<SegmentedControl.ItemText>New</SegmentedControl.ItemText>
					<SegmentedControl.ItemHiddenInput />
				</SegmentedControl.Item>
				<SegmentedControl.Item value="learning">
					<SegmentedControl.ItemText>Learning</SegmentedControl.ItemText>
					<SegmentedControl.ItemHiddenInput />
				</SegmentedControl.Item>
				<SegmentedControl.Item value="known">
					<SegmentedControl.ItemText>Known</SegmentedControl.ItemText>
					<SegmentedControl.ItemHiddenInput />
				</SegmentedControl.Item>
			</SegmentedControl.Control>
		</SegmentedControl>
	</div>

	<!-- Word cards grid -->
	{#if filteredWords.length > 0}
		<div class="grid grid-cols-1 gap-3 md:grid-cols-3">
			{#each filteredWords as word}
				<div class="card p-4 flex flex-col gap-2">
					<div class="flex items-center gap-2">
						<span class="h4 flex-1">{word.spanish}</span>
						<span class="badge {statusPreset(word.lingqStatus)}">{statusLabel(word.lingqStatus)}</span>
					</div>
					<p>{word.english}</p>
					{#if word.example}
						<p class="opacity-50" style="font-style: italic;">{word.example}</p>
					{/if}
					<a href="/episodes/{word.episodeNumber}" class="chip preset-tonal anchor">
						Episode {word.episodeNumber}
					</a>
				</div>
			{/each}
		</div>
	{:else}
		<div class="card preset-tonal p-6 text-center">
			<p class="h4">No words found</p>
			<p class="opacity-50">
				{#if search || statusFilter !== 'all'}
					Try adjusting your filters.
				{:else}
					Add words from episode transcripts to start building your vocabulary.
				{/if}
			</p>
		</div>
	{/if}
</div>
