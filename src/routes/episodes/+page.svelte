<script lang="ts">
	import { enhance } from '$app/forms';
	import { Switch } from '@skeletonlabs/skeleton-svelte';

	let { data } = $props();
</script>

<div class="flex flex-col gap-4 mx-auto max-w-4xl">
	<h1 class="h1">Episodes</h1>

	<div class="table-wrap">
		<table class="table">
			<thead>
				<tr>
					<th>#</th>
					<th>Title</th>
					<th>Listened</th>
					<th>Words</th>
					<th>Concepts</th>
				</tr>
			</thead>
			<tbody>
				{#each data.episodes as ep}
					<tr>
						<td>{ep.number}</td>
						<td>
							<a href="/episodes/{ep.number}" class="anchor">{ep.title}</a>
						</td>
						<td>
							<form method="POST" action="?/toggle" use:enhance>
								<input type="hidden" name="number" value={ep.number} />
								<input type="hidden" name="listened" value={String(!ep.listened)} />
								<Switch checked={ep.listened} onCheckedChange={() => {}}>
									<Switch.Control>
										<Switch.Thumb />
									</Switch.Control>
									<Switch.HiddenInput name="_switch" />
								</Switch>
								<noscript><button type="submit" class="btn btn-sm">Toggle</button></noscript>
							</form>
						</td>
						<td>
							<span class="badge">{ep.wordCount}</span>
						</td>
						<td>
							<span class="badge">{ep.conceptCount}</span>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>
