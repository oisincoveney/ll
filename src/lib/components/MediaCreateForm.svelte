<script lang="ts">
	import { enhance } from '$app/forms';
	import { Button } from '$lib/components/ui/button';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Label } from '$lib/components/ui/label';
	import {
		Card,
		CardContent,
		CardDescription,
		CardFooter,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import YoutubeSearchPicker from './YoutubeSearchPicker.svelte';

	interface FormState {
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
		form?: FormState | null;
	} = $props();

	let saving = $state(false);
</script>

<div class="max-w-xl">
	<div class="mb-4 flex items-center gap-3">
		<Button href={backHref} variant="outline" size="sm">&larr;</Button>
		<span class="text-sm text-muted-foreground">{title}</span>
	</div>

	{#if form?.error}
		<Card class="mb-4 border-destructive/30 bg-destructive/10">
			<CardContent class="px-4 py-3 text-sm text-destructive">{form.error}</CardContent>
		</Card>
	{/if}

	<form
		method="POST"
		use:enhance={() => {
			saving = true;
			return async ({ update }) => {
				await update();
				saving = false;
			};
		}}
	>
		<Card>
			<CardHeader>
				<CardTitle>{title}</CardTitle>
				<CardDescription>Paste a YouTube URL or ID, or search by title.</CardDescription>
			</CardHeader>

			<CardContent class="space-y-5">
				<YoutubeSearchPicker
					initialQuery={form?.youtubeInput}
					initialSelectedId={form?.selectedYoutubeId}
					initialCandidates={form?.candidates}
				/>

				<div class="space-y-1.5">
					<Label for="teacherNotes">
						Teacher notes <span class="text-muted-foreground">(optional)</span>
					</Label>
					<Textarea
						id="teacherNotes"
						name="teacherNotes"
						rows={3}
						placeholder={notesPlaceholder}
						value={form?.teacherNotes ?? ''}
					/>
				</div>
			</CardContent>

			<CardFooter class="justify-end">
				<Button type="submit" disabled={saving}>
					{saving ? 'Saving…' : submitLabel}
				</Button>
			</CardFooter>
		</Card>
	</form>
</div>
