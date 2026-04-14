import { db } from '$lib/server/db';
import { videos } from '$lib/server/db/schema';
import { fail, redirect } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import { extractYoutubeId } from '$lib/lrc';
import { fetchVideoMetadata, saveVideoLines } from '$lib/server/videos';
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

		let metadata: { title: string; channel: string };
		try {
			metadata = await fetchVideoMetadata(youtubeId);
		} catch {
			return fail(400, { error: 'Could not fetch video info from YouTube', youtubeInput, teacherNotes });
		}

		const video = db
			.insert(videos)
			.values({
				title: metadata.title,
				channel: metadata.channel,
				youtubeId,
				teacherNotes: teacherNotes || null,
				createdAt: new Date().toISOString()
			})
			.returning()
			.get();

		const hasSubs = await saveVideoLines(video.id, youtubeId);
		if (!hasSubs) {
			db.delete(videos).where(eq(videos.id, video.id)).run();
			return fail(400, {
				error: 'No Spanish subtitles found for this video. Try a different video.',
				youtubeInput,
				teacherNotes
			});
		}

		redirect(303, `/videos/${video.id}`);
	}
};
