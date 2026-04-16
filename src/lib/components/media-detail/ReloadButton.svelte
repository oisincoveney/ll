<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';

	let { action, label, error }: { action: string; label: string; error?: string | null } = $props();

	let reloading = $state(false);
</script>

<form
	method="POST"
	{action}
	use:enhance={() => {
		reloading = true;
		return ({ update }) => {
			reloading = false;
			update();
		};
	}}
>
	<Button type="submit" size="sm" variant="outline" disabled={reloading}>
		{reloading ? 'Reloading…' : label}
	</Button>
</form>
{#if error}
	<p class="mt-1 text-sm text-muted-foreground">{error}</p>
{/if}
