<script lang="ts">
	import { enhance } from '$app/forms';
	import { Popover, PopoverContent } from '$lib/components/ui/popover';
	import { Button } from '$lib/components/ui/button';

	let pendingWord = $state('');
	let popoverOpen = $state(false);
	let anchorEl = $state<HTMLElement | null>(null);

	export function select(word: string, el: HTMLElement) {
		anchorEl = el;
		pendingWord = word;
		popoverOpen = true;
	}

	function hide() {
		popoverOpen = false;
		pendingWord = '';
	}
</script>

<Popover bind:open={popoverOpen} onOpenChange={(open) => { if (!open) hide(); }}>
	<PopoverContent customAnchor={anchorEl} side="top">
		<p class="mb-2 font-bold">{pendingWord}</p>
		<form
			method="POST"
			action="?/addWord"
			use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'success' || result.type === 'redirect') hide();
					await update();
				};
			}}
			class="flex gap-2"
		>
			<input type="hidden" name="term" value={pendingWord} />
			<Button type="submit" size="sm">Save word</Button>
			<Button type="button" size="sm" variant="outline" onclick={hide}>Cancel</Button>
		</form>
	</PopoverContent>
</Popover>
