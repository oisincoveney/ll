import { json } from '@sveltejs/kit';
import { searchYoutubeCandidates } from '$lib/server/youtube-search';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const query = url.searchParams.get('q') ?? '';
	const candidates = await searchYoutubeCandidates(query);
	return json({ candidates });
};
