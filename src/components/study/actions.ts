import { dismissHint, getState, setState } from './store';

/** How long each cinematic beat runs before the page changes, in ms. */
export const TIMING = {
	pageTurn: 900,
	shelfZoom: 1300,
	bookOpen: 2600,
};

let pending: number | undefined;

function leave(href: string) {
	window.location.assign(href);
}

function after(ms: number, fn: () => void) {
	window.clearTimeout(pending);
	pending = window.setTimeout(fn, getState().reducedMotion ? 0 : ms);
}

/** A table-of-contents entry: turn the page, then go there. */
export function openChapter(href: string) {
	dismissHint('book');
	if (getState().activeBook || getState().turningTo) return;
	if (href === '/') {
		// Already home: settle back at the desk.
		setState({ view: 'desk', controlsOpen: false });
		return;
	}
	if (href === '/work') {
		// Work lives on the shelf: look across to it before leaving.
		setState({ view: 'shelf', controlsOpen: false });
		dismissHint('shelf');
		after(TIMING.shelfZoom, () => leave(href));
		return;
	}
	setState({ turningTo: href, view: 'book', controlsOpen: false });
	after(TIMING.pageTurn, () => leave(href));
}

/** A shelf book: slide it out, bring it to the reader, open it, then go to the case study. */
export function openBook(slug: string) {
	dismissHint('shelf');
	if (getState().activeBook) return;
	setState({ activeBook: slug, view: 'reading', controlsOpen: false, hovered: null });
	after(TIMING.bookOpen, () => leave(`/work/${slug}`));
}

export function toggleLighting(open?: boolean) {
	dismissHint('lamp');
	setState((s) => ({ controlsOpen: open ?? !s.controlsOpen }));
}

export function lookAt(view: 'desk' | 'shelf') {
	if (getState().activeBook) return;
	setState({ view });
}

/**
 * Back/forward can restore this page from the bfcache mid-animation, with a
 * book still held up to the camera. Put the study back as it was.
 */
export function resetOnRestore() {
	const onShow = (event: PageTransitionEvent) => {
		if (!event.persisted) return;
		window.clearTimeout(pending);
		setState({ activeBook: null, turningTo: null, view: 'desk', hovered: null, controlsOpen: false });
	};
	window.addEventListener('pageshow', onShow);
	return () => window.removeEventListener('pageshow', onShow);
}
