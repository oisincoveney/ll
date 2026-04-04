<script lang="ts">
	import { enhance } from '$app/forms';
	import { SegmentedControl } from '@skeletonlabs/skeleton-svelte';

	let { data } = $props();

	const grouped = $derived(() => {
		const groups = new Map<string, typeof data.concepts>();
		for (const concept of data.concepts) {
			const cat = concept.category || 'Uncategorized';
			const existing = groups.get(cat) ?? [];
			existing.push(concept);
			groups.set(cat, existing);
		}
		return groups;
	});

	const masteryLabels: Record<number, string> = { 0: 'Not started', 1: 'Introduced', 2: 'Practicing', 3: 'Solid' };
</script>

<div class="flex flex-col gap-4 mx-auto max-w-4xl">
	<h1 class="h1">Concepts</h1>

	{#each [...grouped().entries()] as [category, categoryConcepts]}
		<div class="flex flex-col gap-2">
			<h2 class="h3">{category}</h2>
			{#each categoryConcepts as concept}
				<div class="card p-4" id={concept.slug}>
					<div class="flex items-center gap-4">
						<div class="flex-1">
							<h3 class="h4">{concept.name}</h3>
						</div>
						<form method="POST" action="?/updateMastery" use:enhance>
							<input type="hidden" name="id" value={concept.id} />
							<SegmentedControl
								name="mastery"
								value={String(concept.mastery)}
								onValueChange={() => {}}
							>
								<SegmentedControl.Control>
									<SegmentedControl.Indicator />
									{#each [0, 1, 2, 3] as level}
										<SegmentedControl.Item value={String(level)}>
											<SegmentedControl.ItemText>{masteryLabels[level]}</SegmentedControl.ItemText>
											<SegmentedControl.ItemHiddenInput />
										</SegmentedControl.Item>
									{/each}
								</SegmentedControl.Control>
							</SegmentedControl>
							<noscript><button type="submit" class="btn btn-sm">Save</button></noscript>
						</form>
					</div>

					{#if concept.episodes.length > 0}
						<div class="flex flex-col gap-3 mt-4">
							{#each concept.episodes as ep}
								<div class="card preset-tonal p-3 flex flex-col gap-2">
									<div class="flex items-center gap-2">
										<a href="/episodes/{ep.episodeNumber}" class="anchor font-bold">{ep.episodeTitle}</a>
										<span class="badge preset-filled-primary-500">{ep.role}</span>
									</div>

									{#if ep.summary}
										<p>{ep.summary}</p>
									{/if}

									{#if ep.rule}
										<div class="card preset-tonal-primary p-2">
											<p class="font-bold">{ep.rule}</p>
										</div>
									{/if}

									{#if ep.examples.length > 0}
										<div class="table-wrap">
											<table class="table">
												<tbody>
													{#each ep.examples as ex}
														<tr>
															<td class="font-bold">{ex.spanish}</td>
															<td>{ex.english}</td>
														</tr>
													{/each}
												</tbody>
											</table>
										</div>
									{/if}

									{#if ep.notes}
										<p class="opacity-75">{ep.notes}</p>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/each}

	{#if data.concepts.length === 0}
		<p>No concepts extracted yet.</p>
	{/if}
</div>
