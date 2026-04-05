import { error } from '@sveltejs/kit';
import { createReadStream, statSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { Readable } from 'node:stream';

export async function GET({ params, request }) {
	const num = parseInt(params.number);
	if (isNaN(num) || num < 1 || num > 90) throw error(404, 'Episode not found');

	const padded = String(num).padStart(2, '0');
	const filePath = resolve(`language-transfer/Language Transfer - Complete Spanish - Lesson ${padded}.mp3`);

	if (!existsSync(filePath)) throw error(404, 'Audio file not found');

	const stat = statSync(filePath);
	const fileSize = stat.size;
	const range = request.headers.get('range');

	if (range) {
		const [startStr, endStr] = range.replace('bytes=', '').split('-');
		const start = parseInt(startStr, 10);
		const end = endStr ? parseInt(endStr, 10) : fileSize - 1;

		return new Response(
			Readable.toWeb(createReadStream(filePath, { start, end })) as ReadableStream,
			{
				status: 206,
				headers: {
					'Content-Range': `bytes ${start}-${end}/${fileSize}`,
					'Accept-Ranges': 'bytes',
					'Content-Length': String(end - start + 1),
					'Content-Type': 'audio/mpeg'
				}
			}
		);
	}

	return new Response(
		Readable.toWeb(createReadStream(filePath)) as ReadableStream,
		{
			headers: {
				'Accept-Ranges': 'bytes',
				'Content-Length': String(fileSize),
				'Content-Type': 'audio/mpeg'
			}
		}
	);
}
