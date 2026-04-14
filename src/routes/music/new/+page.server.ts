import { db } from '$lib/server/db';
import { songs } from '$lib/server/db/schema';
import { fail, redirect } from '@sveltejs/kit';
import { extractYoutubeId } from '$lib/lrc';
import { fetchYoutubeMetadata, saveSongLines } from '$lib/server/music';
import { searchYoutubeCandidates } from '$lib/server/youtube-search';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	return {};
};

export const actions: Actions = {
	default: async ({ request }) => {
		const formData = await request.formData();
		const youtubeInput = String(formData.get('youtubeUrl') ?? '').trim();
		const teacherNotes = String(formData.get('teacherNotes') ?? '').trim();
		const selectedYoutubeId = String(formData.get('selectedYoutubeId') ?? '').trim();
		const intent = String(formData.get('intent') ?? '').trim();

		let youtubeId = extractYoutubeId(youtubeInput) ?? extractYoutubeId(selectedYoutubeId);
		if (!youtubeId) {
			const candidates = await searchYoutubeCandidates(youtubeInput);
			if (candidates.length === 0) {
				return fail(400, {
					error: 'No matching YouTube videos found. Try a more specific query.',
					youtubeInput,
					teacherNotes
				});
			}
			return fail(400, {
				error: intent === 'useSelected' ? 'Select a video to continue.' : undefined,
				youtubeInput,
				teacherNotes,
				candidates,
				selectedYoutubeId
			});
		}

		let metadata: { title: string; artist: string };
		try {
			metadata = await fetchYoutubeMetadata(youtubeId);
		} catch {
			return fail(400, { error: 'Could not fetch video info from YouTube', youtubeInput, teacherNotes });
		}

		const song = db
			.insert(songs)
			.values({
				title: metadata.title,
				artist: metadata.artist,
				youtubeId,
				lrcText: null,
				teacherNotes: teacherNotes || null,
				createdAt: new Date().toISOString()
			})
			.returning()
			.get();

		const hasSubs = await saveSongLines(song.id, youtubeId);
		if (!hasSubs) {
			return fail(400, {
				error: 'No Spanish subtitles found for this video. Try a different video.',
				youtubeInput,
				teacherNotes
			});
		}

		redirect(303, `/music/${song.id}`);
	}
};
