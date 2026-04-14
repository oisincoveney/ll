<script lang="ts">
	import MediaCreateForm from '$lib/components/MediaCreateForm.svelte';

	let { form } = $props();
</script>

<svelte:head>
	<title>Add Song — Language Learner</title>
</svelte:head>

<MediaCreateForm
	title="Add Song"
	backHref="/music"
	submitLabel="Save Song"
	notesPlaceholder="Anything your teacher said about this song"
	{form}
/>
