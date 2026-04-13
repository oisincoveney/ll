<script lang="ts">
	import { enhance } from '$app/forms';
	import { Popover } from '@skeletonlabs/skeleton-svelte';
	import SongPlayer from '$lib/components/SongPlayer.svelte';
	import LyricsDisplay from '$lib/components/LyricsDisplay.svelte';

	let { data, form } = $props();

	let currentMs = $state(0);
	let pendingWord = $state('');
	let popoverOpen = $state(false);
	let anchorEl: HTMLElement | null = $state(null);
	let reloadingLyrics = $state(false);

	function handleWordClick(word: string, event: MouseEvent) {
		anchorEl = event.target as HTMLElement; // target is always an element in onclick
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

<svelte:head>
	<title>{data.song.title} — Language Learner</title>
</svelte:head>

<div class="flex flex-col gap-4 h-full overflow-hidden">
	<div class="flex items-center gap-3">
		<a href="/music" class="btn btn-sm preset-tonal">&larr;</a>
		<div class="flex-1">
			<p class="opacity-50"><a href="/music" class="anchor">Music</a></p>
			<h1 class="h2">{data.song.title}</h1>
			<p class="opacity-75">{data.song.artist}</p>
		</div>
	</div>

	{#if data.song.teacherNotes}
		<aside class="card preset-tonal p-3 text-sm opacity-75">{data.song.teacherNotes}</aside>
	{/if}

	{#if form?.added}
		<aside class="card preset-tonal-primary p-3">
			Added "{form.word.spanish}" &rarr; "{form.word.english}"
		</aside>
	{:else if form?.added === false}
		<aside class="card preset-tonal p-3">"{form.word.spanish}" already tracked</aside>
	{:else if form?.addError}
		<aside class="card preset-tonal-error p-3">{form.addError}</aside>
	{/if}

	<div class="flex-1 min-h-0 grid md:grid-cols-2 gap-4">
		<div class="flex flex-col gap-4 overflow-y-auto min-h-0">
			<SongPlayer youtubeId={data.song.youtubeId} onTimeUpdate={handleTimeUpdate} />

			{#if data.songWords.length > 0}
				<section class="card preset-tonal p-4">
					<h2 class="h4 mb-3">Saved words ({data.songWords.length})</h2>
					<ul class="flex flex-col gap-2">
						{#each data.songWords as word}
							<li class="flex items-center gap-2">
								<span class="flex-1">
									<span class="font-medium">{word.spanish}</span>
									{#if word.english}
										<span class="opacity-75"> &mdash; {word.english}</span>
									{/if}
								</span>
								<form method="POST" action="?/deleteWord" use:enhance>
									<input type="hidden" name="id" value={word.id} />
									<button type="submit" class="btn btn-sm preset-tonal-error">&times;</button>
								</form>
							</li>
						{/each}
					</ul>
				</section>
			{/if}
		</div>

		{#if data.lines.length > 0}
			<section class="card preset-tonal flex flex-col overflow-hidden">
				<div class="flex items-center justify-between p-4 pb-2">
					<h2 class="h4">Lyrics</h2>
					<form
						method="POST"
						action="?/reloadLyrics"
						use:enhance={() => {
							reloadingLyrics = true;
							return ({ update }) => {
								reloadingLyrics = false;
								update();
							};
						}}
					>
						<button type="submit" disabled={reloadingLyrics} class="btn btn-sm preset-tonal">
							{reloadingLyrics ? 'Reloading…' : 'Reload lyrics'}
						</button>
					</form>
				</div>
				{#if form?.reloadError}
					<p class="text-sm opacity-75 px-4">{form.reloadError}</p>
				{/if}
				<div class="flex-1 overflow-y-auto">
					<LyricsDisplay
						lines={data.lines.map((l) => ({ startMs: l.startMs, spanish: l.spanish, english: l.english ?? null }))}
						{currentMs}
						trackedWords={data.trackedWords}
						onWordClick={handleWordClick}
					/>
				</div>
			</section>
		{:else}
			<section class="card preset-tonal p-4 text-center opacity-60">
				<p>No lyrics added yet.</p>
				<form
					method="POST"
					action="?/reloadLyrics"
					use:enhance={() => {
						reloadingLyrics = true;
						return ({ update }) => {
							reloadingLyrics = false;
							update();
						};
					}}
					class="mt-2"
				>
					<button type="submit" disabled={reloadingLyrics} class="btn btn-sm preset-tonal">
						{reloadingLyrics ? 'Reloading…' : 'Reload lyrics'}
					</button>
				</form>
				{#if form?.reloadError}
					<p class="text-sm opacity-75 mt-1">{form.reloadError}</p>
				{/if}
			</section>
		{/if}
	</div>
</div>

<Popover
	open={popoverOpen}
	onOpenChange={(details: { open: boolean }) => { if (!details.open) hidePopover(); }}
	positioning={{ placement: 'top', flip: true, getAnchorElement: () => anchorEl }}
	closeOnInteractOutside={true}
>
	<Popover.Positioner>
		<Popover.Content class="card preset-filled-primary-500 p-3">
			<p class="font-bold mb-2">{pendingWord}</p>
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
				<button type="submit" class="btn btn-sm preset-filled-surface-100-900">Save word</button>
				<button type="button" class="btn btn-sm preset-tonal" onclick={hidePopover}>Cancel</button>
			</form>
		</Popover.Content>
	</Popover.Positioner>
</Popover>
