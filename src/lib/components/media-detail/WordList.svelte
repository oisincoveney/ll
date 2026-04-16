<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import type { MediaWord } from './types';

	let { words, label }: { words: MediaWord[]; label: string } = $props();
</script>

{#if words.length > 0}
	<Card>
		<CardContent class="py-4 px-4">
			<h3 class="mb-3 text-base font-semibold">{label} ({words.length})</h3>
			<ul class="flex flex-col gap-2">
				{#each words as word}
					<li class="flex items-center gap-2">
						<span class="flex-1">
							<span class="font-medium">{word.spanish}</span>
							{#if word.english}
								<span class="text-muted-foreground"> &mdash; {word.english}</span>
							{/if}
						</span>
						<form method="POST" action="?/deleteWord" use:enhance>
							<input type="hidden" name="id" value={word.id} />
							<Button type="submit" size="sm" variant="destructive">&times;</Button>
						</form>
					</li>
				{/each}
			</ul>
		</CardContent>
	</Card>
{/if}
