<script lang="ts">
	import { goto, beforeNavigate } from '$app/navigation';
	import { onDestroy } from 'svelte';

	let {
		episodeNumber,
		playbackPosition = 0,
		nextEpisodeNumber = null,
		onListenedChange
	}: {
		episodeNumber: number;
		playbackPosition: number;
		nextEpisodeNumber: number | null;
		onListenedChange?: () => void;
	} = $props();

	let audioEl: HTMLAudioElement | undefined = $state();
	let isPlaying = $state(false);
	let currentTime = $state(0);
	$effect(() => { currentTime = playbackPosition; });
	let duration = $state(0);
	let markedListened = $state(false);
	let saveTimer: ReturnType<typeof setInterval> | undefined;
	let userSeeked = $state(false);

	function formatTime(secs: number): string {
		const m = Math.floor(secs / 60);
		const s = Math.floor(secs % 60);
		return `${m}:${String(s).padStart(2, '0')}`;
	}

	function savePosition() {
		if (!audioEl || audioEl.currentTime === 0) return;
		fetch(`/api/episodes/${episodeNumber}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ playbackPosition: Math.floor(audioEl.currentTime) })
		});
	}

	function markListened() {
		if (markedListened) return;
		markedListened = true;
		fetch(`/api/episodes/${episodeNumber}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ listened: true })
		});
		onListenedChange?.();
	}

	function startSaveTimer() {
		stopSaveTimer();
		saveTimer = setInterval(savePosition, 10_000);
	}

	function stopSaveTimer() {
		if (saveTimer) {
			clearInterval(saveTimer);
			saveTimer = undefined;
		}
	}

	function handleLoadedMetadata() {
		if (!audioEl) return;
		duration = audioEl.duration;
		if (playbackPosition > 0 && playbackPosition < duration) {
			audioEl.currentTime = playbackPosition;
		}
	}

	function handleTimeUpdate() {
		if (!audioEl) return;
		currentTime = audioEl.currentTime;
		if (duration > 0 && currentTime / duration >= 0.95) {
			markListened();
		}
	}

	function handleEnded() {
		stopSaveTimer();
		fetch(`/api/episodes/${episodeNumber}`, {
			method: 'PATCH',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ playbackPosition: 0, listened: true })
		});
		if (!markedListened) onListenedChange?.();
		if (nextEpisodeNumber && !userSeeked) {
			goto(`/episodes/${nextEpisodeNumber}`);
		}
	}

	function togglePlay() {
		if (!audioEl) return;
		if (audioEl.paused) {
			audioEl.play();
		} else {
			audioEl.pause();
		}
	}

	function seek(value: number) {
		if (!audioEl) return;
		userSeeked = true;
		audioEl.currentTime = value;
		currentTime = value;
	}

	function handleBeforeUnload() {
		if (audioEl && audioEl.currentTime > 0) {
			navigator.sendBeacon(
				`/api/episodes/${episodeNumber}`,
				new Blob(
					[JSON.stringify({ playbackPosition: Math.floor(audioEl.currentTime) })],
					{ type: 'application/json' }
				)
			);
		}
	}

	beforeNavigate(() => {
		savePosition();
	});

	$effect(() => {
		window.addEventListener('beforeunload', handleBeforeUnload);
		return () => window.removeEventListener('beforeunload', handleBeforeUnload);
	});

	onDestroy(() => {
		stopSaveTimer();
	});
</script>

<div class="card preset-tonal p-4">
	<audio
		bind:this={audioEl}
		src="/api/audio/{episodeNumber}"
		preload="metadata"
		onplay={() => { isPlaying = true; startSaveTimer(); }}
		onpause={() => { isPlaying = false; savePosition(); stopSaveTimer(); }}
		ontimeupdate={handleTimeUpdate}
		onloadedmetadata={handleLoadedMetadata}
		onended={handleEnded}
	></audio>

	<div class="flex items-center gap-3">
		<button class="btn-icon preset-filled-primary-500" onclick={togglePlay}>
			{#if isPlaying}
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
					<path fill-rule="evenodd" d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25Zm7.5 0A.75.75 0 0 1 15 4.5h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H15a.75.75 0 0 1-.75-.75V5.25Z" clip-rule="evenodd" />
				</svg>
			{:else}
				<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
					<path fill-rule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clip-rule="evenodd" />
				</svg>
			{/if}
		</button>

		<span class="font-mono text-sm">{formatTime(currentTime)}</span>

		<input
			type="range"
			class="flex-1"
			min="0"
			max={duration}
			step="1"
			value={currentTime}
			oninput={(e) => seek(e.currentTarget.valueAsNumber)}
		/>

		<span class="font-mono text-sm">{formatTime(duration)}</span>

		{#if nextEpisodeNumber}
			<a href="/episodes/{nextEpisodeNumber}" class="btn btn-sm preset-tonal">
				Next &rarr;
			</a>
		{/if}
	</div>
</div>
