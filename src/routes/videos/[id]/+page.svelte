<script lang="ts">
	import MediaDetailPage from '$lib/components/MediaDetailPage.svelte';

	let { data, form } = $props();
</script>

<svelte:head>
	<title>{data.video.title} — Language Learner</title>
</svelte:head>

<MediaDetailPage
	teacherNotes={data.video.teacherNotes}
	youtubeId={data.video.youtubeId}
	words={data.videoWords}
	lines={data.lines.map((l) => ({ startMs: l.startMs, spanish: l.spanish, english: l.english ?? null }))}
	trackedWords={data.trackedWords}
	wordListLabel="Saved words"
	textTrackLabel="Subtitles"
	emptyTextTrackMessage="No subtitles added yet."
	reloadAction="?/reloadSubtitles"
	reloadLabel="Reload subtitles"
	{form}
/>
