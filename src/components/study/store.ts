import { useSyncExternalStore } from 'react';
import type { PresetName } from './lighting';

/** Objects that can be hovered or keyboard-focused in the study. */
export type Target = `chapter:${string}` | `book:${string}` | 'lamp';

export type Hint = 'book' | 'lamp';

export interface StudyState {
	preset: PresetName;
	hovered: Target | null;
	controlsOpen: boolean;
	/** The photo has loaded; hides the loading card. */
	ready: boolean;
	hintsDismissed: Record<Hint, boolean>;
	reducedMotion: boolean;
}

const HINTS_KEY = 'study-hints';

function loadHints(): Record<Hint, boolean> {
	const none = { book: false, lamp: false };
	try {
		return { ...none, ...JSON.parse(localStorage.getItem(HINTS_KEY) ?? '{}') };
	} catch {
		return none;
	}
}

let state: StudyState = {
	preset: 'golden',
	hovered: null,
	controlsOpen: false,
	ready: false,
	hintsDismissed: typeof window === 'undefined' ? { book: true, lamp: true } : loadHints(),
	reducedMotion: typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
};

const listeners = new Set<() => void>();

export function getState() {
	return state;
}

export function setState(patch: Partial<StudyState> | ((s: StudyState) => Partial<StudyState>)) {
	const next = typeof patch === 'function' ? patch(state) : patch;
	state = { ...state, ...next };
	listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
	listeners.add(listener);
	return () => listeners.delete(listener);
}

/** Subscribe to one slice; re-renders only when that slice changes. */
export function useStudy<T>(select: (s: StudyState) => T): T {
	return useSyncExternalStore(
		subscribe,
		() => select(state),
		() => select(state),
	);
}

export function dismissHint(hint: Hint) {
	if (state.hintsDismissed[hint]) return;
	const hintsDismissed = { ...state.hintsDismissed, [hint]: true };
	setState({ hintsDismissed });
	try {
		localStorage.setItem(HINTS_KEY, JSON.stringify(hintsDismissed));
	} catch {
		/* Private mode: hints simply return next visit. */
	}
}

export function setHovered(target: Target | null) {
	if (state.hovered !== target) setState({ hovered: target });
}
