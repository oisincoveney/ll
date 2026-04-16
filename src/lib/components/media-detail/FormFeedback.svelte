<script lang="ts">
	import { Card, CardContent } from '$lib/components/ui/card';
	import type { MediaFormState } from './types';

	let { form }: { form?: MediaFormState | null } = $props();
</script>

{#if form?.added}
	<Card>
		<CardContent class="py-3 px-4">Added "{form.word?.spanish}" &rarr; "{form.word?.english ?? ''}"</CardContent>
	</Card>
{:else if form?.added === false}
	<Card>
		<CardContent class="py-3 px-4">"{form.word?.spanish}" already tracked</CardContent>
	</Card>
{:else if form?.addError}
	<Card>
		<CardContent class="py-3 px-4 text-destructive">{form.addError}</CardContent>
	</Card>
{/if}
