<script lang="ts">
	let { data } = $props();
	let search = $state('');

	const filteredWords = $derived(
		data.words.filter(
			(w) =>
				w.spanish.toLowerCase().includes(search.toLowerCase()) ||
				w.english.toLowerCase().includes(search.toLowerCase())
		)
	);
</script>

<div class="flex flex-col gap-4 max-w-4xl mx-auto">
	<h1 class="h1">Vocabulary</h1>

	<input
		type="text"
		bind:value={search}
		placeholder="Search words..."
		class="input"
	/>

	<p>{filteredWords.length} words</p>

	{#if filteredWords.length > 0}
		<div class="table-wrap">
			<table class="table">
				<thead>
					<tr>
						<th>Spanish</th>
						<th>English</th>
						<th>Example</th>
						<th>Episode</th>
						<th>LingQ</th>
					</tr>
				</thead>
				<tbody>
					{#each filteredWords as word}
						<tr>
							<td>{word.spanish}</td>
							<td>{word.english}</td>
							<td>{word.example ?? ''}</td>
							<td>
								<a href="/episodes/{word.episodeNumber}" class="anchor">
									{word.episodeTitle}
								</a>
							</td>
							<td>
								{#if word.lingqStatus !== null}
									<span class="badge preset-filled-primary-500">{word.lingqStatus}</span>
								{:else}
									<span class="badge preset-filled-surface-100-900">-</span>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{:else}
		<p>No words tracked yet. Add words from episode pages.</p>
	{/if}
</div>
