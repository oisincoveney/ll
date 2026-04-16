export interface AddedWord {
	spanish: string;
	english: string | null;
}

export interface MediaFormState {
	added?: boolean;
	word?: AddedWord;
	addError?: string;
	reloadError?: string;
}

export interface MediaWord {
	id: number;
	spanish: string;
	english: string | null;
}

export interface MediaLine {
	startMs: number;
	spanish: string;
	english: string | null;
}
