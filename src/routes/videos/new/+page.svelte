<script lang="ts">
	import MediaCreateForm from '$lib/components/MediaCreateForm.svelte';

	let { form } = $props();
</script>

<svelte:head>
	<title>Add Video — Language Learner</title>
</svelte:head>

<MediaCreateForm
	title="Add Video"
	backHref="/videos"
	submitLabel="Save Video"
	notesPlaceholder="Context or notes for students"
	{form}
/>
