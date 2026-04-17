import { z } from 'zod';
import { db } from '$lib/server/db';
import { videoLines } from '$lib/server/db/schema';
import { fetchSubtitles, translateLines, type SubtitleFailureReason } from './subtitles';
import { eq } from 'drizzle-orm';

export type SaveVideoLinesResult =
	| { ok: true }
	| { ok: false; reason: SubtitleFailureReason; detail?: string };

const oEmbedSchema = z.object({
	title: z.string(),
	author_name: z.string()
});

export async function fetchVideoMetadata(youtubeId: string): Promise<{ title: string; channel: string }> {
	const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${youtubeId}&format=json`;
	const res = await fetch(url);
	if (!res.ok) throw new Error('Could not fetch YouTube metadata');
	const data = oEmbedSchema.parse(await res.json());
	return { title: data.title, channel: data.author_name };
}

export async function saveVideoLines(videoId: number, youtubeId: string): Promise<SaveVideoLinesResult> {
	const result = fetchSubtitles(youtubeId);
	if (!result.ok) return { ok: false, reason: result.reason, detail: result.detail };

	const { lines } = result;
	const translations = await translateLines(lines.map((l) => l.text));

	db.delete(videoLines).where(eq(videoLines.videoId, videoId)).run();
	db.insert(videoLines)
		.values(
			lines.map((line, i) => ({
				videoId,
				lineNumber: i,
				startMs: line.startMs,
				spanish: line.text,
				english: translations[i] ?? null
			}))
		)
		.run();

	return { ok: true };
}
