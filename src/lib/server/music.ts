import { z } from 'zod';
import getArtistTitle from 'get-artist-title';
import { db } from '$lib/server/db';
import { songLines } from '$lib/server/db/schema';
import { fetchSubtitles, translateLines, type SubtitleFailureReason } from './subtitles';
import { eq } from 'drizzle-orm';

export type SaveSongLinesResult =
	| { ok: true }
	| { ok: false; reason: SubtitleFailureReason; detail?: string };

const oEmbedSchema = z.object({
	title: z.string(),
	author_name: z.string()
});

export async function fetchYoutubeMetadata(youtubeId: string): Promise<{ title: string; artist: string }> {
	const url = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${youtubeId}&format=json`;
	const res = await fetch(url);
	if (!res.ok) throw new Error('Could not fetch YouTube metadata');
	const data = oEmbedSchema.parse(await res.json());

	const parsed = getArtistTitle(data.title, { defaultArtist: data.author_name });
	if (!parsed) throw new Error(`Could not parse artist/title from: ${data.title}`);
	const [artist, title] = parsed;
	return { artist, title };
}

export async function saveSongLines(songId: number, youtubeId: string): Promise<SaveSongLinesResult> {
	const result = fetchSubtitles(youtubeId);
	if (!result.ok) return { ok: false, reason: result.reason, detail: result.detail };

	const { lines } = result;
	const translations = await translateLines(lines.map((l) => l.text));

	db.delete(songLines).where(eq(songLines.songId, songId)).run();
	db.insert(songLines)
		.values(
			lines.map((line, i) => ({
				songId,
				lineNumber: i,
				startMs: line.startMs,
				spanish: line.text,
				english: translations[i] ?? null
			}))
		)
		.run();

	return { ok: true };
}
