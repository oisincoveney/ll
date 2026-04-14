import { beforeEach, describe, expect, it, vi } from 'vitest';
import { searchYoutubeCandidates } from './youtube-search';

vi.mock('node:child_process', () => ({
	spawnSync: vi.fn()
}));

import { spawnSync } from 'node:child_process';

const mockedSpawnSync = vi.mocked(spawnSync);

describe('searchYoutubeCandidates', () => {
	beforeEach(() => {
		mockedSpawnSync.mockReset();
	});

	it('returns parsed and validated candidates from yt-dlp output', async () => {
		mockedSpawnSync.mockReturnValue({
			status: 0,
			stdout: [
				JSON.stringify({
					id: 'dQw4w9WgXcQ',
					title: 'Never Gonna Give You Up',
					uploader: 'Rick Astley',
					duration: 213
				}),
				JSON.stringify({
					id: 'm3XkU8Q8nKs',
					title: 'Never Gonna Give You Up Live',
					uploader: 'Rick Astley',
					duration: 257
				})
			].join('\n')
		} as ReturnType<typeof spawnSync>);

		const candidates = await searchYoutubeCandidates('rick astley', 5);
		expect(candidates).toHaveLength(2);
		expect(candidates[0]).toEqual({
			youtubeId: 'dQw4w9WgXcQ',
			title: 'Never Gonna Give You Up',
			channel: 'Rick Astley',
			durationSeconds: 213
		});
	});

	it('returns an empty array when yt-dlp fails', async () => {
		mockedSpawnSync.mockReturnValue({
			status: 1,
			stdout: '',
			error: new Error('failed')
		} as ReturnType<typeof spawnSync>);

		const candidates = await searchYoutubeCandidates('bad search', 5);
		expect(candidates).toEqual([]);
	});

	it('skips malformed and invalid rows', async () => {
		mockedSpawnSync.mockReturnValue({
			status: 0,
			stdout: [
				'not-json',
				JSON.stringify({ id: 'invalid-id', title: 'bad' }),
				JSON.stringify({
					id: 'dQw4w9WgXcQ',
					title: 'Never Gonna Give You Up',
					uploader: 'Rick Astley'
				})
			].join('\n')
		} as ReturnType<typeof spawnSync>);

		const candidates = await searchYoutubeCandidates('rick astley', 5);
		expect(candidates).toHaveLength(1);
		expect(candidates[0]?.youtubeId).toBe('dQw4w9WgXcQ');
	});
});
