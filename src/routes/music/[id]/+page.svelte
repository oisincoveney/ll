<script lang="ts">
	import MediaDetailPage from '$lib/components/MediaDetailPage.svelte';

	let { data, form } = $props();
</script>

<svelte:head>
	<title>{data.song.title} — Language Learner</title>
</svelte:head>

<MediaDetailPage
	title={data.song.title}
	subtitle={data.song.artist}
	teacherNotes={data.song.teacherNotes}
	youtubeId={data.song.youtubeId}
	words={data.songWords}
	lines={data.lines.map((l) => ({ startMs: l.startMs, spanish: l.spanish, english: l.english ?? null }))}
	trackedWords={data.trackedWords}
	wordListLabel="Saved words"
	textTrackLabel="Lyrics"
	emptyTextTrackMessage="No lyrics added yet."
	reloadAction="?/reloadLyrics"
	reloadLabel="Reload lyrics"
	{form}
/>
