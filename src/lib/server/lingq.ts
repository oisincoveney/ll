import { LINGQ_API_KEY } from '$env/static/private';

const BASE = 'https://www.lingq.com/api/v2';
const LANG = 'es';

interface LingQHint {
	id: number;
	locale: string;
	text: string;
	term: string;
	popularity: number;
	is_google_translate: boolean;
}

export interface LingQCard {
	pk: number;
	term: string;
	fragment: string;
	hints: LingQHint[];
	status: number;
	tags: string[];
}

interface LingQResponse {
	results: LingQCard[];
	next: string | null;
}

function headers() {
	return {
		Authorization: `Token ${LINGQ_API_KEY}`,
		'Content-Type': 'application/json'
	};
}

export async function fetchAllCards(): Promise<LingQCard[]> {
	const cards: LingQCard[] = [];
	let url: string | null = `${BASE}/${LANG}/cards/?page_size=100`;

	while (url) {
		const res = await fetch(url, { headers: headers() });
		if (!res.ok) throw new Error(`LingQ API error: ${res.status} ${res.statusText}`);
		const data: LingQResponse = await res.json();
		cards.push(...data.results);
		url = data.next;
	}

	return cards;
}

export async function createCard(term: string, fragment: string): Promise<LingQCard> {
	const res = await fetch(`${BASE}/${LANG}/cards/`, {
		method: 'POST',
		headers: headers(),
		body: JSON.stringify({
			term,
			fragment,
			hints: []
		})
	});

	if (!res.ok) {
		const text = await res.text();
		throw new Error(`LingQ create error: ${res.status} ${text}`);
	}

	return res.json();
}

export async function lookupCard(term: string): Promise<LingQCard | null> {
	const res = await fetch(`${BASE}/${LANG}/cards/?search=${encodeURIComponent(term)}&page_size=5`, {
		headers: headers()
	});

	if (!res.ok) return null;

	const data: LingQResponse = await res.json();
	const match = data.results.find((c) => c.term.toLowerCase() === term.toLowerCase());
	return match ?? null;
}
