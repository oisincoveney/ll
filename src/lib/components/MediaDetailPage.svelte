<script lang="ts">
	import { enhance } from '$app/forms';
	import { Popover, PopoverContent } from '$lib/components/ui/popover';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent } from '$lib/components/ui/card';
	import SongPlayer from '$lib/components/SongPlayer.svelte';
	import LyricsDisplay from '$lib/components/LyricsDisplay.svelte';

	interface MediaWord {
		id: number;
		spanish: string;
		english: string | null;
	}

	interface MediaLine {
		startMs: number;
		spanish: string;
		english: string | null;
	}

	interface AddedWord {
		spanish: string;
		english: string | null;
	}

	interface MediaFormState {
		added?: boolean;
		word?: AddedWord;
		addError?: string;
		reloadError?: string;
	}

	let {
		teacherNotes,
		youtubeId,
		words,
		lines,
		trackedWords,
		wordListLabel,
		textTrackLabel,
		emptyTextTrackMessage,
		reloadAction,
		reloadLabel,
		deleteAction,
		form
	}: {
		teacherNotes: string | null;
		youtubeId: string;
		words: MediaWord[];
		lines: MediaLine[];
		trackedWords: string[];
		wordListLabel: string;
		textTrackLabel: string;
		emptyTextTrackMessage: string;
		reloadAction: string;
		reloadLabel: string;
		deleteAction?: string;
		form?: MediaFormState | null;
	} = $props();

	let currentMs = $state(0);
	let pendingWord = $state('');
	let popoverOpen = $state(false);
	let anchorEl = $state<HTMLElement | null>(null);
	let reloading = $state(false);

	function handleWordClick(word: string, event: MouseEvent) {
		anchorEl = event.target as HTMLElement;
		pendingWord = word;
		popoverOpen = true;
	}

	function hidePopover() {
		popoverOpen = false;
		pendingWord = '';
	}

	function handleTimeUpdate(ms: number) {
		currentMs = ms;
	}
</script>

<div class="h-full overflow-hidden flex flex-col gap-4">
	{#if teacherNotes}
		<Card>
			<CardContent class="py-3 px-4 text-sm text-muted-foreground">{teacherNotes}</CardContent>
		</Card>
	{/if}

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

	<div class="flex-1 min-h-0 grid md:grid-cols-2 gap-4">
		<div class="flex flex-col gap-4 overflow-y-auto min-h-0">
			<SongPlayer {youtubeId} onTimeUpdate={handleTimeUpdate} />

			{#if words.length > 0}
				<Card>
					<CardContent class="py-4 px-4">
						<h3 class="mb-3 text-base font-semibold">{wordListLabel} ({words.length})</h3>
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
		</div>

		{#if lines.length > 0}
			<Card class="flex flex-col overflow-hidden">
				<div class="flex items-center justify-between p-4 pb-2">
					<h3 class="text-base font-semibold">{textTrackLabel}</h3>
					<div class="flex gap-2">
						<form
							method="POST"
							action={reloadAction}
							use:enhance={() => {
								reloading = true;
								return ({ update }) => {
									reloading = false;
									update();
								};
							}}
						>
							<Button type="submit" size="sm" variant="outline" disabled={reloading}>
								{reloading ? 'Reloading…' : reloadLabel}
							</Button>
						</form>
						{#if deleteAction}
							<form method="POST" action={deleteAction} use:enhance>
								<Button type="submit" size="sm" variant="destructive">Delete</Button>
							</form>
						{/if}
					</div>
				</div>
				{#if form?.reloadError}
					<p class="px-4 text-sm text-muted-foreground">{form.reloadError}</p>
				{/if}
				<div class="flex-1 overflow-y-auto">
					<LyricsDisplay {currentMs} {trackedWords} onWordClick={handleWordClick} {lines} />
				</div>
			</Card>
		{:else}
			<Card>
				<CardContent class="py-4 text-center text-muted-foreground">
					<p>{emptyTextTrackMessage}</p>
					<div class="flex justify-center gap-2 mt-2">
						<form
							method="POST"
							action={reloadAction}
							use:enhance={() => {
								reloading = true;
								return ({ update }) => {
									reloading = false;
									update();
								};
							}}
						>
							<Button type="submit" size="sm" variant="outline" disabled={reloading}>
								{reloading ? 'Reloading…' : reloadLabel}
							</Button>
						</form>
						{#if deleteAction}
							<form method="POST" action={deleteAction} use:enhance>
								<Button type="submit" size="sm" variant="destructive">Delete</Button>
							</form>
						{/if}
					</div>
					{#if form?.reloadError}
						<p class="mt-1 text-sm text-muted-foreground">{form.reloadError}</p>
					{/if}
				</CardContent>
			</Card>
		{/if}
	</div>
</div>

<Popover bind:open={popoverOpen} onOpenChange={(open) => { if (!open) hidePopover(); }}>
	<PopoverContent customAnchor={anchorEl} side="top">
		<p class="mb-2 font-bold">{pendingWord}</p>
		<form
			method="POST"
			action="?/addWord"
			use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'success' || result.type === 'redirect') hidePopover();
					await update();
				};
			}}
			class="flex gap-2"
		>
			<input type="hidden" name="term" value={pendingWord} />
			<Button type="submit" size="sm">Save word</Button>
			<Button type="button" size="sm" variant="outline" onclick={hidePopover}>Cancel</Button>
		</form>
	</PopoverContent>
</Popover>
