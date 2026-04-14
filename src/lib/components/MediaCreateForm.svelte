<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Label } from '$lib/components/ui/label';
	import { Card, CardContent } from '$lib/components/ui/card';

	interface MediaCreateFormState {
		error?: string;
		youtubeInput?: string;
	}

	let {
		title,
		backHref,
		submitLabel,
		notesPlaceholder,
		form
	}: {
		title: string;
		backHref: string;
		submitLabel: string;
		notesPlaceholder: string;
		form?: MediaCreateFormState | null;
	} = $props();
</script>

<div class="max-w-xl">
	<div class="mb-2 flex items-center gap-3">
		<Button href={backHref} variant="outline" size="sm">&larr;</Button>
		<span class="text-sm text-muted-foreground">{title}</span>
	</div>

	{#if form?.error}
		<Card class="mb-4">
			<CardContent class="px-4 py-3 text-destructive">{form.error}</CardContent>
		</Card>
	{/if}

	<form method="POST" use:enhance class="flex flex-col gap-4">
		<div class="flex flex-col gap-1.5">
			<Label for="youtubeUrl">YouTube URL or ID</Label>
			<Input
				id="youtubeUrl"
				name="youtubeUrl"
				type="text"
				placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ"
				value={form?.youtubeInput ?? ''}
				required
			/>
		</div>

		<div class="flex flex-col gap-1.5">
			<Label for="teacherNotes">Teacher notes (optional)</Label>
			<Textarea id="teacherNotes" name="teacherNotes" rows={3} placeholder={notesPlaceholder} />
		</div>

		<Button type="submit">{submitLabel}</Button>
	</form>
</div>
