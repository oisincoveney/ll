<script lang="ts">
	import type { Snippet } from 'svelte';

	let {
		deleteButton,
		feedback,
		left,
		right,
		popover
	}: {
		deleteButton?: Snippet;
		feedback?: Snippet;
		left: Snippet;
		right: Snippet;
		popover: Snippet;
	} = $props();
</script>

<div class="h-full overflow-hidden flex flex-col gap-4">
	{#if deleteButton}
		<div class="flex justify-end">
			{@render deleteButton()}
		</div>
	{/if}

	{#if feedback}
		{@render feedback()}
	{/if}

	<div class="flex-1 min-h-0 grid md:grid-cols-2 gap-4">
		<div class="flex flex-col gap-4 overflow-y-auto min-h-0">
			{@render left()}
		</div>
		<div class="flex flex-col min-h-0">
			{@render right()}
		</div>
	</div>
</div>

{@render popover()}
