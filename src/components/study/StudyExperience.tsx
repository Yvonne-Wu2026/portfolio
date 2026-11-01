import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { chapters, shelfBooks } from '../../data/library';
import { lookAt, resetOnRestore, toggleLighting } from './actions';
import { presets } from './lighting';
import { LightingControls } from './LightingControls';
import { StudyFallback } from './StudyFallback';
import { getState, useStudy } from './store';
import type { Quality } from './StudyScene';
import './study.css';

// three.js and the scene arrive in their own chunk, after the frame is up.
const StudyScene = lazy(() => import('./StudyScene').then((m) => ({ default: m.StudyScene })));

type Mode = '3d' | 'flat';
const MODE_KEY = 'study-mode';

function supportsWebGL() {
	try {
		return !!document.createElement('canvas').getContext('webgl2');
	} catch {
		return false;
	}
}

/** A conservative first guess; the scene steps down further if frames drop. */
function initialQuality(): Quality {
	const nav = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
	const small = Math.min(window.innerWidth, window.innerHeight) < 600;
	const weak = (nav.hardwareConcurrency ?? 8) <= 4 || (nav.deviceMemory ?? 8) <= 4;
	return small || weak || nav.connection?.saveData ? 'low' : 'high';
}

function initialMode(webgl: boolean): Mode {
	if (!webgl) return 'flat';
	try {
		return localStorage.getItem(MODE_KEY) === 'flat' ? 'flat' : '3d';
	} catch {
		return '3d';
	}
}

/** Polite status line for screen readers: lighting changes and departures. */
function useAnnouncement() {
	const preset = useStudy((s) => s.preset);
	const activeBook = useStudy((s) => s.activeBook);
	const turningTo = useStudy((s) => s.turningTo);
	const [message, setMessage] = useState('');
	useEffect(() => {
		if (getState().ready) setMessage(`Lighting set to ${presets[preset].label}.`);
	}, [preset]);
	useEffect(() => {
		const book = shelfBooks.find((b) => b.slug === activeBook);
		if (book) setMessage(`Opening ${book.title}…`);
	}, [activeBook]);
	useEffect(() => {
		const chapter = chapters.find((c) => c.href === turningTo);
		if (chapter) setMessage(`Turning to ${chapter.label}…`);
	}, [turningTo]);
	return message;
}

function Loader({ visible }: { visible: boolean }) {
	return (
		<div className={`study-loader${visible ? '' : ' is-done'}`} aria-hidden={!visible}>
			<div className="study-loader__card">
				<span className="study-loader__flame" />
				<p className="study-loader__text">Lighting the lamp…</p>
				<span className="study-loader__bar" />
			</div>
		</div>
	);
}

export default function StudyExperience() {
	const [webgl] = useState(supportsWebGL);
	const [mode, setMode] = useState<Mode>(() => initialMode(webgl));
	const [quality] = useState<Quality>(initialQuality);
	const ready = useStudy((s) => s.ready);
	const view = useStudy((s) => s.view);
	const controlsOpen = useStudy((s) => s.controlsOpen);
	const busy = useStudy((s) => s.activeBook !== null || s.turningTo !== null);
	const message = useAnnouncement();
	const labels = useRef<HTMLDivElement>(null);

	useEffect(resetOnRestore, []);

	const switchMode = (next: Mode) => {
		setMode(next);
		try {
			localStorage.setItem(MODE_KEY, next);
		} catch {
			/* Not remembered; fine. */
		}
	};

	return (
		<div className="study" data-mode={mode} data-view={view}>
			<header className="study-bar">
				<a className="study-bar__mark" href="/">
					Yvonne Wu
					<span className="study-bar__role">UX &amp; UI Designer</span>
				</a>
				<nav aria-label="Primary" className="study-bar__nav">
					<ul>
						{chapters
							.filter((chapter) => chapter.href !== '/')
							.map((chapter) => (
								<li key={chapter.href}>
									<a href={chapter.href}>{chapter.label}</a>
								</li>
							))}
					</ul>
				</nav>
				<div className="study-bar__tools">
					<button
						type="button"
						className="study-bar__tool"
						aria-expanded={controlsOpen}
						aria-controls="lighting-controls"
						onClick={() => toggleLighting()}
					>
						Lighting
					</button>
					{webgl && (
						<button
							type="button"
							className="study-bar__tool"
							aria-pressed={mode === 'flat'}
							onClick={() => switchMode(mode === '3d' ? 'flat' : '3d')}
						>
							Simple view
						</button>
					)}
				</div>
			</header>

			<main className="study-stage">
				<h1 className="sr-only">The study of Yvonne Wu, UX and UI designer</h1>
				{mode === '3d' ? (
					<>
						<div className="study-canvas">
							<Suspense fallback={null}>
								<StudyScene initialQuality={quality} labels={labels} />
							</Suspense>
						</div>
						<div ref={labels} className="study-labels" />
						{!busy && (
							<div className="study-glance">
								{view === 'shelf' ? (
									<button type="button" className="study-glance__btn" onClick={() => lookAt('desk')}>
										← Back to the desk
									</button>
								) : (
									<button type="button" className="study-glance__btn" onClick={() => lookAt('shelf')}>
										Look at the shelf →
									</button>
								)}
							</div>
						)}
						<Loader visible={!ready} />
					</>
				) : (
					<StudyFallback />
				)}
				<LightingControls />
				<p className="sr-only" role="status" aria-live="polite">
					{message}
				</p>
			</main>
		</div>
	);
}
