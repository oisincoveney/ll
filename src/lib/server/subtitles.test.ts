import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { writeFileSync, existsSync, unlinkSync } from 'node:fs';

vi.mock('../../logger', () => ({
	logger: { warn: vi.fn(), info: vi.fn(), error: vi.fn(), debug: vi.fn() }
}));

import { parseSrt, fetchSubtitles, subtitleFailureMessage } from './subtitles';
import { logger } from '../../logger';

const SAMPLE_SRT = `1
00:00:00,433 --> 00:00:10,477
♪   ♪

2
00:00:27,726 --> 00:00:29,129
♪ AAAAY ♪

3
00:00:41,207 --> 00:00:45,678
♪ SI... SABES QUE YA LLEVO
UN RATO MIRÁNDOTE ♪

4
00:01:00,827 --> 00:01:02,000
TENGO QUE BAILAR CONTIGO HOY
`;

// YouTube auto-generated SRTs embed karaoke-style timing tags within each cue
const SAMPLE_SRT_WITH_INLINE_TAGS = `1
00:00:04,799 --> 00:00:08,500
<00:00:04.799><c>caminando</c><00:00:05.620><c>caminando</c>
<00:00:05.620><c>caminando caminando caminando</c>

2
00:00:08,500 --> 00:00:12,000
<00:00:08.500><c>mi</c> <00:00:08.880><c>calle</c> <00:00:09.280><c>que</c>
`;

// Mirrors the real YouTube production format: pairs of cues ~10ms apart where
// the first is a short "base" cue and the second is the same text + upcoming words.
const SAMPLE_SRT_WITH_BASE_KARAOKE_PAIRS = `1
00:00:03,789 --> 00:00:06,749
caminando caminandote

2
00:00:03,799 --> 00:00:06,759
caminando caminandote mi<00:00:04.799><c> calle</c><00:00:05.520><c> que</c>

3
00:00:06,749 --> 00:00:09,000
mi calle que

4
00:00:06,759 --> 00:00:09,010
mi calle que quizás<00:00:07.759><c> yo</c><00:00:08.559><c> pueda</c>
`;

describe('parseSrt', () => {
	it('parses single-line cues with correct millisecond timing', () => {
		const lines = parseSrt(SAMPLE_SRT);
		const aaaay = lines.find((l) => l.text.includes('AAAAY'));
		expect(aaaay?.startMs).toBe(27_726);
	});

	it('joins multi-line cues into one text', () => {
		const lines = parseSrt(SAMPLE_SRT);
		const multiLine = lines.find((l) => l.text.includes('SABES QUE YA LLEVO'));
		expect(multiLine?.text).toContain('SABES QUE YA LLEVO');
		expect(multiLine?.text).toContain('RATO MIRÁNDOTE');
	});

	it('converts HH:MM:SS,mmm timestamps to milliseconds correctly', () => {
		const lines = parseSrt(SAMPLE_SRT);
		const bailar = lines.find((l) => l.text.includes('BAILAR'));
		// 00:01:00,827 = 60 * 1000 + 827 = 60827
		expect(bailar?.startMs).toBe(60_827);
	});

	it('returns lines sorted by startMs', () => {
		const lines = parseSrt(SAMPLE_SRT);
		for (let i = 1; i < lines.length; i++) {
			expect(lines[i].startMs).toBeGreaterThanOrEqual(lines[i - 1].startMs);
		}
	});

	it('returns empty array for empty input', () => {
		expect(parseSrt('')).toEqual([]);
	});

	it('includes cues with only music symbols (♪)', () => {
		const lines = parseSrt(SAMPLE_SRT);
		const musicOnly = lines.find((l) => l.text.includes('♪'));
		expect(musicOnly).toBeDefined();
	});
});

describe('parseSrt with YouTube inline karaoke tags', () => {
	it('strips inline timestamp tags like <00:00:04.799>', () => {
		const lines = parseSrt(SAMPLE_SRT_WITH_INLINE_TAGS);
		const hasTimestampTags = lines.some((l) => /<\d{2}:\d{2}:\d{2}\.\d{3}>/.test(l.text));
		expect(hasTimestampTags).toBe(false);
	});

	it('strips <c> and </c> karaoke class tags', () => {
		const lines = parseSrt(SAMPLE_SRT_WITH_INLINE_TAGS);
		const hasCTags = lines.some((l) => /<\/?c>/.test(l.text));
		expect(hasCTags).toBe(false);
	});

	it('preserves the actual word text after stripping tags', () => {
		const lines = parseSrt(SAMPLE_SRT_WITH_INLINE_TAGS);
		const first = lines[0];
		expect(first.text).toContain('caminando');
		expect(first.text).not.toMatch(/<[^>]+>/);
	});
});

describe('parseSrt deduplication of YouTube base/karaoke cue pairs', () => {
	it('drops the base cue when the next cue starts within 100ms and shares the same prefix', () => {
		const lines = parseSrt(SAMPLE_SRT_WITH_BASE_KARAOKE_PAIRS);
		// Should have 2 lines (the karaoke ones), not 4
		expect(lines).toHaveLength(2);
	});

	it('keeps the fuller karaoke cue and drops the shorter base cue', () => {
		const lines = parseSrt(SAMPLE_SRT_WITH_BASE_KARAOKE_PAIRS);
		expect(lines[0].text).toBe('caminando caminandote mi calle que');
		expect(lines[1].text).toBe('mi calle que quizás yo pueda');
	});

	it('uses the karaoke cue start time (T+10ms), not the base cue time', () => {
		const lines = parseSrt(SAMPLE_SRT_WITH_BASE_KARAOKE_PAIRS);
		expect(lines[0].startMs).toBe(3799);
		expect(lines[1].startMs).toBe(6759);
	});
});

vi.mock('node:child_process', async () => {
	const actual = await vi.importActual<typeof import('node:child_process')>('node:child_process');
	return { ...actual, spawnSync: vi.fn() };
});

import { spawnSync } from 'node:child_process';

const mockedSpawnSync = vi.mocked(spawnSync);

const MOCK_ID = 'mockVideoId1';
const MOCK_STEM = join(tmpdir(), `ll-subs-${MOCK_ID}`);

function cleanupMockFiles() {
	for (const ext of ['.es.srt', '.es.vtt', '.es-419.srt', '.es-419.vtt', '.es-orig.srt']) {
		const p = `${MOCK_STEM}${ext}`;
		if (existsSync(p)) {
			try { unlinkSync(p); } catch { /* ignore */ }
		}
	}
}

beforeEach(() => {
	cleanupMockFiles();
});

afterEach(() => {
	cleanupMockFiles();
	vi.clearAllMocks();
});

describe('subtitleFailureMessage', () => {
	it('returns a non-empty human-readable message for every failure reason', () => {
		const reasons = ['bad-id', 'no-subs', 'yt-dlp-error', 'parse-error'] as const;
		for (const reason of reasons) {
			const msg = subtitleFailureMessage(reason);
			expect(msg.length).toBeGreaterThan(0);
			expect(msg).not.toContain('undefined');
		}
	});

	it('distinguishes the no-subs message against the yt-dlp-error message', () => {
		expect(subtitleFailureMessage('no-subs')).toMatch(/no Spanish subtitles/i);
		expect(subtitleFailureMessage('yt-dlp-error')).toMatch(/yt-dlp/i);
	});
});

describe('fetchSubtitles (mocked yt-dlp)', () => {
	it('rejects malformed YouTube IDs without spawning yt-dlp', () => {
		const result = fetchSubtitles('not a valid id with spaces');
		expect(result).toEqual({ ok: false, reason: 'bad-id' });
		expect(mockedSpawnSync).not.toHaveBeenCalled();
	});

	it('returns yt-dlp-error with tail of stderr on non-zero exit', () => {
		mockedSpawnSync.mockReturnValue({
			status: 1,
			signal: null,
			stdout: Buffer.from(''),
			stderr: Buffer.from('ERROR: Sign in to confirm you are not a bot'),
			pid: 1,
			output: []
		});

		const result = fetchSubtitles(MOCK_ID);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.reason).toBe('yt-dlp-error');
		expect(result.detail).toContain('Sign in to confirm');
	});

	it('returns yt-dlp-error when spawnSync reports error (binary missing, timeout)', () => {
		mockedSpawnSync.mockReturnValue({
			status: null,
			signal: null,
			stdout: Buffer.from(''),
			stderr: Buffer.from(''),
			pid: 0,
			output: [],
			error: new Error('spawn yt-dlp ENOENT')
		});

		const result = fetchSubtitles(MOCK_ID);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.reason).toBe('yt-dlp-error');
		expect(result.detail).toContain('ENOENT');
	});

	it('returns no-subs when yt-dlp exits 0 but writes no subtitle file', () => {
		mockedSpawnSync.mockReturnValue({
			status: 0,
			signal: null,
			stdout: Buffer.from('[info] no subtitles'),
			stderr: Buffer.from(''),
			pid: 1,
			output: []
		});

		const result = fetchSubtitles(MOCK_ID);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.reason).toBe('no-subs');
	});

	it('parses the SRT file and returns ok=true with lang when yt-dlp succeeds', () => {
		mockedSpawnSync.mockImplementation(() => {
			writeFileSync(
				`${MOCK_STEM}.es.srt`,
				`1\n00:00:01,000 --> 00:00:02,000\nHola mundo\n`
			);
			return {
				status: 0, signal: null, stdout: Buffer.from(''),
				stderr: Buffer.from(''), pid: 1, output: []
			};
		});

		const result = fetchSubtitles(MOCK_ID);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.lang).toBe('es');
		expect(result.lines).toHaveLength(1);
		expect(result.lines[0].text).toBe('Hola mundo');
		expect(result.lines[0].startMs).toBe(1000);
	});

	it('picks whichever Spanish variant file yt-dlp wrote (e.g., es-419)', () => {
		mockedSpawnSync.mockImplementation(() => {
			writeFileSync(
				`${MOCK_STEM}.es-419.srt`,
				`1\n00:00:03,000 --> 00:00:04,000\nBuenos días\n`
			);
			return {
				status: 0, signal: null, stdout: Buffer.from(''),
				stderr: Buffer.from(''), pid: 1, output: []
			};
		});

		const result = fetchSubtitles(MOCK_ID);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.lang).toBe('es-419');
	});

	it('returns parse-error when the file is present but contains no cues', () => {
		mockedSpawnSync.mockImplementation(() => {
			writeFileSync(`${MOCK_STEM}.es.srt`, 'WEBVTT\n\n');
			return {
				status: 0, signal: null, stdout: Buffer.from(''),
				stderr: Buffer.from(''), pid: 1, output: []
			};
		});

		const result = fetchSubtitles(MOCK_ID);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.reason).toBe('parse-error');
	});

	it('invokes yt-dlp with the full flag set required in prod', () => {
		mockedSpawnSync.mockReturnValue({
			status: 0, signal: null, stdout: Buffer.from(''),
			stderr: Buffer.from(''), pid: 1, output: []
		});

		fetchSubtitles(MOCK_ID);

		expect(mockedSpawnSync).toHaveBeenCalledOnce();
		const [bin, rawArgs] = mockedSpawnSync.mock.calls[0];
		expect(bin).toBe('yt-dlp');
		const args = rawArgs ?? [];

		expect(args).toContain('--write-subs');
		expect(args).toContain('--write-auto-subs');
		expect(args).toContain('--skip-download');
		expect(args).toContain('--no-warnings');

		const langIdx = args.indexOf('--sub-langs');
		expect(args[langIdx + 1]).toBe('es.*');

		const fmtIdx = args.indexOf('--sub-format');
		expect(args[fmtIdx + 1]).toBe('srt/vtt/best');

		const jsIdx = args.indexOf('--js-runtimes');
		expect(args[jsIdx + 1]).toBe('node');

		expect(args).toContain(`https://www.youtube.com/watch?v=${MOCK_ID}`);
	});

	it('picks up a .vtt file when SRT is not available (ffmpeg absent / es-419 VTT-only)', () => {
		mockedSpawnSync.mockImplementation(() => {
			writeFileSync(
				`${MOCK_STEM}.es-419.vtt`,
				`WEBVTT\n\n00:00:10.000 --> 00:00:12.000\nHola\n`
			);
			return {
				status: 0, signal: null, stdout: Buffer.from(''),
				stderr: Buffer.from(''), pid: 1, output: []
			};
		});

		const result = fetchSubtitles(MOCK_ID);
		expect(result.ok).toBe(true);
		if (!result.ok) return;
		expect(result.lang).toBe('es-419');
		expect(result.lines).toHaveLength(1);
		expect(result.lines[0].text).toBe('Hola');
		expect(result.lines[0].startMs).toBe(10_000);
	});

	it('deletes a stale subtitle file from a previous run before invoking yt-dlp', () => {
		// Pre-seed a stale file for this video ID.
		const stalePath = `${MOCK_STEM}.es.srt`;
		writeFileSync(stalePath, 'stale content');
		expect(existsSync(stalePath)).toBe(true);

		let staleGoneBeforeSpawn = false;
		mockedSpawnSync.mockImplementation(() => {
			// By the time yt-dlp "runs", the stale file should already be gone.
			staleGoneBeforeSpawn = !existsSync(stalePath);
			return {
				status: 0, signal: null, stdout: Buffer.from(''),
				stderr: Buffer.from(''), pid: 1, output: []
			};
		});

		fetchSubtitles(MOCK_ID);

		expect(staleGoneBeforeSpawn).toBe(true);
	});

	it('logs at warn level with youtubeId and stderr when yt-dlp exits non-zero', () => {
		mockedSpawnSync.mockReturnValue({
			status: 1, signal: null,
			stdout: Buffer.from(''),
			stderr: Buffer.from('ERROR: 403 Forbidden'),
			pid: 1, output: []
		});

		fetchSubtitles(MOCK_ID);

		expect(logger.warn).toHaveBeenCalledOnce();
		const [fields, msg] = vi.mocked(logger.warn).mock.calls[0];
		expect(fields).toMatchObject({ youtubeId: MOCK_ID, status: 1 });
		expect(fields).toHaveProperty('stderr');
		expect((fields as { stderr: string }).stderr).toContain('403 Forbidden');
		expect(msg).toBe('yt-dlp non-zero exit');
	});

	it('logs at info level with stderr when yt-dlp exits 0 but writes no subtitle', () => {
		mockedSpawnSync.mockReturnValue({
			status: 0, signal: null,
			stdout: Buffer.from(''),
			stderr: Buffer.from('[info] There are no subtitles for the requested languages'),
			pid: 1, output: []
		});

		fetchSubtitles(MOCK_ID);

		expect(logger.info).toHaveBeenCalledOnce();
		const [fields, msg] = vi.mocked(logger.info).mock.calls[0];
		expect(fields).toMatchObject({ youtubeId: MOCK_ID });
		expect((fields as { stderr: string }).stderr).toContain('no subtitles for the requested');
		expect(msg).toBe('yt-dlp found no Spanish subtitles');
	});

	it('does not log for the happy path', () => {
		mockedSpawnSync.mockImplementation(() => {
			writeFileSync(`${MOCK_STEM}.es.srt`, `1\n00:00:01,000 --> 00:00:02,000\nHola\n`);
			return {
				status: 0, signal: null, stdout: Buffer.from(''),
				stderr: Buffer.from(''), pid: 1, output: []
			};
		});

		fetchSubtitles(MOCK_ID);

		expect(logger.warn).not.toHaveBeenCalled();
		expect(logger.info).not.toHaveBeenCalled();
	});

	it('tails stderr to at most 500 chars in yt-dlp-error detail', () => {
		const longStderr = 'x'.repeat(2000) + 'END-MARKER';
		mockedSpawnSync.mockReturnValue({
			status: 1, signal: null,
			stdout: Buffer.from(''),
			stderr: Buffer.from(longStderr),
			pid: 1, output: []
		});

		const result = fetchSubtitles(MOCK_ID);
		expect(result.ok).toBe(false);
		if (result.ok) return;
		expect(result.reason).toBe('yt-dlp-error');
		expect(result.detail?.length).toBeLessThanOrEqual(500);
		expect(result.detail).toContain('END-MARKER');
	});
});
