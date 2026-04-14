<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Label } from '$lib/components/ui/label';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Item, ItemContent, ItemTitle, ItemDescription } from '$lib/components/ui/item';
	import { ToggleGroup, ToggleGroupItem } from '$lib/components/ui/toggle-group';

	interface MediaCreateFormState {
		error?: string;
		youtubeInput?: string;
		teacherNotes?: string;
		selectedYoutubeId?: string;
		candidates?: Array<{
			youtubeId: string;
			title: string;
			channel: string;
			durationSeconds: number | null;
		}>;
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
	let selectedYoutubeId = $state('');

	$effect(() => {
		if (form?.selectedYoutubeId) {
			selectedYoutubeId = form.selectedYoutubeId;
		}
	});

	function formatDuration(durationSeconds: number | null): string {
		if (durationSeconds === null) return 'Unknown length';
		const minutes = Math.floor(durationSeconds / 60);
		const seconds = durationSeconds % 60;
		return `${minutes}:${String(seconds).padStart(2, '0')}`;
	}
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
			<Label for="youtubeUrl">YouTube URL, ID, or search query</Label>
			<Input
				id="youtubeUrl"
				name="youtubeUrl"
				type="text"
				placeholder="e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ or juanes la camisa negra"
				value={form?.youtubeInput ?? ''}
				required
			/>
		</div>

		<div class="flex flex-col gap-1.5">
			<Label for="teacherNotes">Teacher notes (optional)</Label>
			<Textarea
				id="teacherNotes"
				name="teacherNotes"
				rows={3}
				placeholder={notesPlaceholder}
				value={form?.teacherNotes ?? ''}
			/>
		</div>

		{#if form?.candidates && form.candidates.length > 0}
			<div class="space-y-2">
				<Label>Select the correct video</Label>
				<input type="hidden" name="selectedYoutubeId" value={selectedYoutubeId} />
				<ToggleGroup type="single" bind:value={selectedYoutubeId} orientation="vertical" class="w-full">
					{#each form.candidates as candidate}
						<ToggleGroupItem
							value={candidate.youtubeId}
							variant="outline"
							class="h-auto w-full justify-start p-3 text-left"
						>
							<Item size="sm" variant="default" class="border-0 p-0">
								<ItemContent>
									<ItemTitle>{candidate.title}</ItemTitle>
									<ItemDescription>
										{candidate.channel} · {formatDuration(candidate.durationSeconds)}
									</ItemDescription>
								</ItemContent>
							</Item>
						</ToggleGroupItem>
					{/each}
				</ToggleGroup>
			</div>

			<div class="flex gap-2">
				<Button type="submit" name="intent" value="search" variant="outline">Search again</Button>
				<Button type="submit" name="intent" value="useSelected">Use selected video</Button>
			</div>
		{:else}
			<Button type="submit" name="intent" value="search">{submitLabel}</Button>
		{/if}
	</form>
</div>
