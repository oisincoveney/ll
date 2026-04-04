<script lang="ts">
	import { enhance } from '$app/forms';
	import { Tabs, Switch } from '@skeletonlabs/skeleton-svelte';

	let { data, form } = $props();
	let activeTab = $state('transcript');
	let pendingWord = $state('');
</script>

<div class="flex flex-col gap-4 mx-auto max-w-4xl">
	<div class="flex items-center gap-4">
		<a href="/episodes" class="btn preset-tonal">&larr; Episodes</a>
		<h1 class="h1 flex-1">{data.episode.title}</h1>
		<form method="POST" action="?/toggleListened" use:enhance>
			<input type="hidden" name="number" value={data.episode.number} />
			<input type="hidden" name="listened" value={String(!data.episode.listened)} />
			<Switch checked={data.episode.listened} onCheckedChange={() => {}}>
				<Switch.Control>
					<Switch.Thumb />
				</Switch.Control>
				<Switch.Label>{data.episode.listened ? 'Listened' : 'Not listened'}</Switch.Label>
				<Switch.HiddenInput name="_switch" />
			</Switch>
			<noscript><button type="submit" class="btn btn-sm">Toggle</button></noscript>
		</form>
	</div>

	{#if form?.added === true}
		<aside class="card preset-tonal-primary p-3">
			Added "{form.word.spanish}" &rarr; "{form.word.english}"
		</aside>
	{/if}
	{#if form?.added === false}
		<aside class="card preset-tonal p-3">
			"{form.word.spanish}" already tracked
		</aside>
	{/if}
	{#if form?.addError}
		<aside class="card preset-tonal-error p-3">{form.addError}</aside>
	{/if}

	<Tabs value={activeTab} onValueChange={(details) => (activeTab = details.value)}>
		<Tabs.List>
			<Tabs.Trigger value="transcript">Transcript</Tabs.Trigger>
			<Tabs.Trigger value="words">Words ({data.words.length})</Tabs.Trigger>
			<Tabs.Trigger value="concepts">Concepts ({data.concepts.length})</Tabs.Trigger>
			<Tabs.Indicator />
		</Tabs.List>

		<Tabs.Content value="transcript">
			<div class="card p-6 mt-4">
				{#if data.transcript.length > 0}
					{#if pendingWord}
						<div class="card preset-filled-primary-500 p-3 mb-4">
							<form method="POST" action="?/addWord" use:enhance class="flex items-center gap-4">
								<input type="hidden" name="term" value={pendingWord} />
								<input type="hidden" name="episodeNumber" value={data.episode.number} />
								<span class="flex-1">Add "{pendingWord}" to LingQ?</span>
								<button type="submit" class="btn preset-filled-surface-100-900">Confirm</button>
								<button type="button" class="btn preset-tonal" onclick={() => { pendingWord = ''; }}>Cancel</button>
							</form>
						</div>
					{/if}

					{#each data.transcript as turn}
						<div class="mb-4">
							{#if turn.speaker === 'T'}
								<span class="badge preset-filled-primary-500">T</span>
							{:else if turn.speaker === 'S'}
								<span class="badge preset-filled-secondary-500">S</span>
							{/if}
							{#each turn.words as token}
								{#if token.clean}
									{#if data.savedWords.includes(token.clean)}
										<button type="button" class="chip preset-filled-primary-500" onclick={() => { pendingWord = token.clean; }}>{token.display}</button>
									{:else}
										<button type="button" onclick={() => { pendingWord = token.clean; }}>{token.display}</button>
									{/if}
								{:else}
									{token.display}
								{/if}
							{/each}
						</div>
					{/each}
				{:else}
					<p>No transcript available for this lesson.</p>
				{/if}
			</div>
		</Tabs.Content>

		<Tabs.Content value="words">
			<div class="flex flex-col gap-4 mt-4">
				{#if data.words.length > 0}
					<div class="table-wrap">
						<table class="table">
							<thead>
								<tr>
									<th>Spanish</th>
									<th>English</th>
									<th>LingQ</th>
									<th></th>
								</tr>
							</thead>
							<tbody>
								{#each data.words as word}
									<tr>
										<td>{word.spanish}</td>
										<td>{word.english}</td>
										<td>
											{#if word.lingqStatus !== null}
												<span class="badge preset-filled-primary-500">{word.lingqStatus}</span>
											{:else}
												<span class="badge">-</span>
											{/if}
										</td>
										<td>
											<form method="POST" action="?/deleteWord" use:enhance>
												<input type="hidden" name="id" value={word.id} />
												<button type="submit" class="btn btn-sm preset-filled-error-500">Delete</button>
											</form>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{:else}
					<p>No words added yet.</p>
				{/if}
			</div>
		</Tabs.Content>

		<Tabs.Content value="concepts">
			<div class="flex flex-col gap-4 mt-4">
				{#if data.episodeSummary}
					<div class="card preset-tonal p-4">
						<p>{data.episodeSummary}</p>
					</div>
				{/if}

				{#if data.concepts.length > 0}
					{#each data.concepts as concept}
						<div class="card p-4 flex flex-col gap-3">
							<div class="flex items-center gap-2">
								<a href="/concepts#{concept.slug}" class="h4 anchor">{concept.name}</a>
								<span class="badge preset-filled-primary-500">{concept.role}</span>
								{#if concept.category}
									<span class="badge preset-tonal">{concept.category}</span>
								{/if}
							</div>

							{#if concept.summary}
								<p>{concept.summary}</p>
							{/if}

							{#if concept.rule}
								<div class="card preset-tonal-primary p-3">
									<p class="font-bold">{concept.rule}</p>
								</div>
							{/if}

							{#if concept.examples.length > 0}
								<div class="table-wrap">
									<table class="table">
										<tbody>
											{#each concept.examples as ex}
												<tr>
													<td class="font-bold">{ex.spanish}</td>
													<td>{ex.english}</td>
												</tr>
											{/each}
										</tbody>
									</table>
								</div>
							{/if}

							{#if concept.notes}
								<p class="opacity-75">{concept.notes}</p>
							{/if}
						</div>
					{/each}
				{:else}
					<p>No concepts linked to this episode.</p>
				{/if}

				{#if data.vocabulary.length > 0}
					<h3 class="h3">Vocabulary</h3>
					<div class="table-wrap">
						<table class="table">
							<thead>
								<tr>
									<th>Spanish</th>
									<th>English</th>
									<th>Derivation</th>
								</tr>
							</thead>
							<tbody>
								{#each data.vocabulary as v}
									<tr>
										<td class="font-bold">{v.spanish}</td>
										<td>{v.english}</td>
										<td class="opacity-75">{v.derivation ?? ''}</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</div>
		</Tabs.Content>
	</Tabs>
</div>
