import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { chapters, shelfBooks, type Chapter } from '../../data/library';
import { studyPhoto, type Box, type Point, type Quad } from '../../data/studyPhoto';
import { toggleLighting } from './actions';
import { presets, type PresetName } from './lighting';
import { LightingControls } from './LightingControls';
import { dismissHint, getState, setHovered, setState, useStudy, type Hint, type Target } from './store';
import './study.css';
import './photo.css';

/*
 * The study as a photograph, after the reference site: one still per lighting
 * preset crossfading underneath, with real HTML laid over the objects — the
 * contents printed onto the open book in perspective, and buttons on the
 * shelf books and the lamp. A "camera" layer pans and zooms over the photo
 * for the transitions.
 */

const ASPECT = studyPhoto.width / studyPhoto.height;
/** Design size of a book page's overlay before it is projected onto the photo. */
const PAGE = { w: 600, h: 820 };

/** Times for each transition before the next page loads, in ms. */
const TIMING = { pageTurn: 1000, shelf: 1300, book: 1900 };

/* ---------------------------------------------------------------- */
/* Geometry                                                          */
/* ---------------------------------------------------------------- */

interface Stage {
	/** Viewport size. */
	vw: number;
	vh: number;
	/** The photo's on-screen size: always covers the viewport. */
	w: number;
	h: number;
}

const px = (stage: Stage, [x, y]: Point): Point => [(x / 100) * stage.w, (y / 100) * stage.h];

/**
 * CSS matrix3d that maps a `w`×`h` element onto a quad (Heckbert's
 * square-to-quad projection), so flat HTML lies on the photographed page.
 */
function quadTransform(w: number, h: number, quad: Point[]) {
	const [[x0, y0], [x1, y1], [x2, y2], [x3, y3]] = quad;
	const dx1 = x1 - x2;
	const dx2 = x3 - x2;
	const dx3 = x0 - x1 + x2 - x3;
	const dy1 = y1 - y2;
	const dy2 = y3 - y2;
	const dy3 = y0 - y1 + y2 - y3;
	let g = 0;
	let k = 0;
	if (Math.abs(dx3) > 1e-9 || Math.abs(dy3) > 1e-9) {
		const det = dx1 * dy2 - dx2 * dy1;
		g = (dx3 * dy2 - dx2 * dy3) / det;
		k = (dx1 * dy3 - dx3 * dy1) / det;
	}
	const a = x1 - x0 + g * x1;
	const b = x3 - x0 + k * x3;
	const d = y1 - y0 + g * y1;
	const e = y3 - y0 + k * y3;
	return `matrix3d(${a / w},${d / w},0,${g / w},${b / h},${e / h},0,${k / h},0,0,1,0,${x0},${y0},0,1)`;
}

function boxCenter([l, t, r, b]: Box): Point {
	return [(l + r) / 2, (t + b) / 2];
}

function quadBox(...quads: Quad[]): Box {
	const points = quads.flat();
	return [
		Math.min(...points.map((p) => p[0])),
		Math.min(...points.map((p) => p[1])),
		Math.max(...points.map((p) => p[0])),
		Math.max(...points.map((p) => p[1])),
	];
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/* ---------------------------------------------------------------- */
/* Printed pages                                                     */
/* ---------------------------------------------------------------- */

function ProjectedPage({ stage, quad, className, children }: { stage: Stage; quad: Quad; className?: string; children: ReactNode }) {
	const transform = quadTransform(PAGE.w, PAGE.h, quad.map((p) => px(stage, p)));
	return (
		<div className={`photo-page ${className ?? ''}`} style={{ width: PAGE.w, height: PAGE.h, transform }}>
			{children}
		</div>
	);
}

function Frontispiece() {
	return (
		<div className="photo-print photo-print--front" aria-hidden="true">
			<p className="photo-print__kicker">The study of</p>
			<p className="photo-print__name">Yvonne Wu</p>
			<p className="photo-print__fleuron">— ❦ —</p>
			<p className="photo-print__role">UX &amp; UI Designer</p>
			<p className="photo-print__blurb">Being a collection of human-centred work, notes, and correspondence, kept in Boston.</p>
			<p className="photo-print__year">MMXXVI</p>
		</div>
	);
}

function Contents({ onOpen, inert }: { onOpen?: (chapter: Chapter) => void; inert?: boolean }) {
	const hovered = useStudy((s) => s.hovered);
	return (
		<nav className="photo-print photo-print--contents" aria-label={inert ? undefined : 'Contents'} aria-hidden={inert || undefined}>
			<p className="photo-print__heading">Contents</p>
			<ol>
				{chapters.map((chapter) => {
					const target: Target = `chapter:${chapter.href}`;
					return (
						<li key={chapter.href}>
							<a
								href={chapter.href}
								tabIndex={inert ? -1 : undefined}
								className={hovered === target && !inert ? 'is-active' : undefined}
								aria-current={chapter.href === '/' ? 'page' : undefined}
								onPointerEnter={() => setHovered(target)}
								onPointerLeave={() => setHovered(null)}
								onFocus={() => setHovered(target)}
								onBlur={() => setHovered(null)}
								onClick={(event) => {
									if (!onOpen || event.metaKey || event.ctrlKey || event.shiftKey) return;
									event.preventDefault();
									onOpen(chapter);
								}}
							>
								<span className="photo-print__num">{chapter.number}</span>
								<span className="photo-print__label">{chapter.label}</span>
								<span className="photo-print__dots" aria-hidden="true" />
								<span className="photo-print__pg" aria-hidden="true">
									{chapter.page}
								</span>
							</a>
						</li>
					);
				})}
			</ol>
			<p className="photo-print__foot">Select a chapter to turn to it</p>
		</nav>
	);
}

function ChapterOpening({ chapter }: { chapter: Chapter }) {
	return (
		<div className="photo-print photo-print--opening" aria-hidden="true">
			<p className="photo-print__kicker">Chapter {chapter.number}</p>
			<p className="photo-print__chapter">{chapter.label}</p>
			<p className="photo-print__fleuron">❦</p>
		</div>
	);
}

/* ---------------------------------------------------------------- */
/* Hotspots                                                          */
/* ---------------------------------------------------------------- */

function boxStyle(stage: Stage, [l, t, r, b]: Box): CSSProperties {
	return { left: (l / 100) * stage.w, top: (t / 100) * stage.h, width: ((r - l) / 100) * stage.w, height: ((b - t) / 100) * stage.h };
}

interface HotspotProps {
	stage: Stage;
	box: Box;
	target: Target;
	label: string;
	description: string;
	onActivate: () => void;
	expanded?: boolean;
	controls?: string;
	disabled?: boolean;
	children?: ReactNode;
}

/** A real button over an object in the photo, with a glowing marker and a label chip. */
function Hotspot({ stage, box, target, label, description, onActivate, expanded, controls, disabled, children }: HotspotProps) {
	const active = useStudy((s) => s.hovered === target);
	return (
		<button
			type="button"
			className={`photo-hotspot${active ? ' is-active' : ''}`}
			style={boxStyle(stage, box)}
			aria-label={`${label}. ${description}`}
			aria-expanded={expanded}
			aria-controls={controls}
			disabled={disabled}
			onPointerEnter={() => setHovered(target)}
			onPointerLeave={() => setHovered(null)}
			onFocus={() => setHovered(target)}
			onBlur={() => setHovered(null)}
			onClick={onActivate}
		>
			{children}
			<span className="photo-hotspot__dot" aria-hidden="true" />
			<span className="photo-hotspot__label" aria-hidden="true">
				{label}
			</span>
		</button>
	);
}

/**
 * The spine itself, cut from the photo, so hovering can tip it out of the
 * shelf toward the visitor rather than just tinting it.
 */
function SpineLift({ stage, box, image }: { stage: Stage; box: Box; image: string }) {
	const [l, t] = box;
	return (
		<span
			className="photo-spine"
			aria-hidden="true"
			style={{
				backgroundImage: `url(${image})`,
				backgroundSize: `${stage.w}px ${stage.h}px`,
				backgroundPosition: `${(-l / 100) * stage.w}px ${(-t / 100) * stage.h}px`,
			}}
		/>
	);
}

/** What each hint points at; the hint steps aside while that object's own label shows. */
const HINT_TARGETS: Record<Hint, string> = { book: 'chapter:', lamp: 'lamp' };

function PhotoHint({ stage, at, hint, children }: { stage: Stage; at: Point; hint: Hint; children: string }) {
	const visible = useStudy(
		(s) => s.ready && !s.hintsDismissed[hint] && !s.hovered?.startsWith(HINT_TARGETS[hint]),
	);
	const [x, y] = px(stage, at);
	return (
		<p className={`scene-hint photo-hint${visible ? ' is-visible' : ''}`} style={{ left: x, top: y }} aria-hidden="true">
			<span className="scene-hint__dot" />
			{children}
		</p>
	);
}

/**
 * A brass museum tag on the shelf under the case studies: always there, so
 * it's clear the two books are the way into the work. Brightens while either
 * book is under the hand. Decorative; the books themselves are the buttons.
 */
function ShelfTag({ stage, at }: { stage: Stage; at: Point }) {
	const lit = useStudy((s) => s.hovered?.startsWith('book:') ?? false);
	const [x, y] = px(stage, at);
	return (
		<p className={`photo-tag${lit ? ' is-lit' : ''}`} style={{ left: x, top: y }} aria-hidden="true">
			<span className="photo-tag__arrow">↑</span>
			<span className="photo-tag__title">Case Studies</span>
			<span className="photo-tag__hint">Select a book to read</span>
		</p>
	);
}

/* ---------------------------------------------------------------- */
/* Calibration (?calibrate): click to read coordinates               */
/* ---------------------------------------------------------------- */

function Calibrator({ stage }: { stage: Stage }) {
	const [last, setLast] = useState<string>('Click the photo to read a coordinate');
	return (
		<div
			className="photo-calibrate"
			onClick={(event) => {
				const rect = event.currentTarget.getBoundingClientRect();
				const x = (((event.clientX - rect.left) / rect.width) * 100).toFixed(2);
				const y = (((event.clientY - rect.top) / rect.height) * 100).toFixed(2);
				const text = `[${x}, ${y}]`;
				setLast(text);
				console.log('study point', text);
			}}
		>
			{[studyPhoto.lamp, studyPhoto.shelf, ...Object.values(studyPhoto.books)].map((box, i) => (
				<span key={i} className="photo-calibrate__box" style={boxStyle(stage, box)} />
			))}
			<p className="photo-calibrate__read">{last}</p>
		</div>
	);
}

/* ---------------------------------------------------------------- */
/* The study                                                         */
/* ---------------------------------------------------------------- */

type Leaving =
	| { kind: 'chapter'; chapter: Chapter }
	| { kind: 'shelf' }
	| { kind: 'book'; slug: string }
	| null;

export default function PhotoStudy() {
	const viewport = useRef<HTMLDivElement>(null);
	const parallax = useRef<HTMLDivElement>(null);
	const [size, setSize] = useState({ vw: 0, vh: 0 });
	const [loaded, setLoaded] = useState(false);
	const [view, setView] = useState<'desk' | 'shelf'>('desk');
	const [leaving, setLeaving] = useState<Leaving>(null);
	const preset = useStudy((s) => s.preset);
	const controlsOpen = useStudy((s) => s.controlsOpen);
	const reducedMotion = useStudy((s) => s.reducedMotion);
	const calibrate = useMemo(() => new URLSearchParams(window.location.search).has('calibrate'), []);
	const [message, setMessage] = useState('');

	useLayoutEffect(() => {
		const el = viewport.current;
		if (!el) return;
		const observer = new ResizeObserver(([entry]) => setSize({ vw: entry.contentRect.width, vh: entry.contentRect.height }));
		observer.observe(el);
		return () => observer.disconnect();
	}, []);

	// The photo always covers the viewport; on narrow screens it overflows sideways.
	const stage: Stage = useMemo(() => {
		const w = Math.max(size.vw, size.vh * ASPECT);
		return { vw: size.vw, vh: size.vh, w, h: w / ASPECT };
	}, [size]);
	const overflowing = stage.w - stage.vw > stage.vw * 0.25;

	// Pan so the focus point is centred where the photo is wider than the screen.
	const offset = useMemo(() => {
		const [fx, fy] = studyPhoto.focus[view];
		return {
			x: clamp(stage.vw / 2 - (fx / 100) * stage.w, stage.vw - stage.w, 0),
			y: clamp(stage.vh / 2 - (fy / 100) * stage.h, stage.vh - stage.h, 0),
		};
	}, [stage, view]);

	// Where the camera moves in for each departure.
	const zoomBox: Box | null =
		leaving?.kind === 'book'
			? studyPhoto.books[leaving.slug]
			: leaving?.kind === 'shelf'
				? studyPhoto.shelf
				: leaving?.kind === 'chapter'
					? quadBox(studyPhoto.pages.left, studyPhoto.pages.right)
					: null;

	const camera = useMemo(() => {
		if (!zoomBox) return 'translate(0px, 0px) scale(1)';
		const [l, t, r, b] = zoomBox;
		const boxW = ((r - l) / 100) * stage.w;
		const boxH = ((b - t) / 100) * stage.h;
		const fill = leaving?.kind === 'book' ? 0.55 : 0.92;
		const s = clamp(Math.min(stage.vw / boxW, stage.vh / boxH) * fill, 1, 4.5);
		const [cx, cy] = px(stage, boxCenter(zoomBox));
		const tx = stage.vw / 2 - s * (offset.x + cx);
		const ty = stage.vh / 2 - s * (offset.y + cy);
		return `translate(${tx}px, ${ty}px) scale(${s})`;
	}, [zoomBox, stage, offset, leaving]);

	// Gentle parallax under the pointer, written straight to the DOM.
	useEffect(() => {
		if (reducedMotion) return;
		let frame = 0;
		const onMove = (event: PointerEvent) => {
			cancelAnimationFrame(frame);
			frame = requestAnimationFrame(() => {
				const x = event.clientX / window.innerWidth - 0.5;
				const y = event.clientY / window.innerHeight - 0.5;
				parallax.current?.style.setProperty('--px', `${(-x * 14).toFixed(2)}px`);
				parallax.current?.style.setProperty('--py', `${(-y * 9).toFixed(2)}px`);
			});
		};
		window.addEventListener('pointermove', onMove);
		return () => {
			window.removeEventListener('pointermove', onMove);
			cancelAnimationFrame(frame);
		};
	}, [reducedMotion]);

	// Back/forward from the bfcache: put the study back as it was.
	useEffect(() => {
		const onShow = (event: PageTransitionEvent) => {
			if (event.persisted) {
				setLeaving(null);
				setView('desk');
				setState({ hovered: null, controlsOpen: false });
			}
		};
		window.addEventListener('pageshow', onShow);
		return () => window.removeEventListener('pageshow', onShow);
	}, []);

	useEffect(() => {
		if (getState().ready) setMessage(`Lighting set to ${presets[preset].label}.`);
	}, [preset]);

	const depart = useCallback(
		(next: Leaving, href: string, ms: number) => {
			if (leaving) return;
			setState({ controlsOpen: false, hovered: null });
			if (reducedMotion) {
				window.location.assign(href);
				return;
			}
			setLeaving(next);
			window.setTimeout(() => window.location.assign(href), ms);
		},
		[leaving, reducedMotion],
	);

	const openChapter = (chapter: Chapter) => {
		dismissHint('book');
		if (chapter.href === '/') {
			setView('desk');
			return;
		}
		if (chapter.href === '/work') {
			setMessage('Turning to the shelf…');
			depart({ kind: 'shelf' }, chapter.href, TIMING.shelf);
			return;
		}
		setMessage(`Turning to ${chapter.label}…`);
		depart({ kind: 'chapter', chapter }, chapter.href, TIMING.pageTurn);
	};

	const openBook = (slug: string) => {
		const book = shelfBooks.find((b) => b.slug === slug)!;
		setMessage(`Opening ${book.title}…`);
		depart({ kind: 'book', slug }, `/work/${slug}`, TIMING.book);
	};

	// Presets without their own photo are graded from the golden-hour one.
	const photos = Object.entries(studyPhoto.images) as [PresetName, string][];
	const shown: PresetName = studyPhoto.images[preset] ? preset : 'golden';
	const graded = shown !== preset ? preset : undefined;
	const image = studyPhoto.images[shown]!;
	const ready = loaded && size.vw > 0;
	useEffect(() => {
		if (ready) setState({ ready: true });
	}, [ready]);

	const turning = leaving?.kind === 'chapter' ? leaving.chapter : null;
	const opening = leaving?.kind === 'book' ? shelfBooks.find((b) => b.slug === leaving.slug) : null;

	return (
		<div className="study" data-leaving={leaving?.kind ?? undefined}>
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
				</div>
			</header>

			<main className="study-stage">
				<h1 className="sr-only">The study of Yvonne Wu, UX and UI designer</h1>
				<div ref={viewport} className="photo-viewport">
					<div className="photo-camera" style={{ transform: camera, transitionDuration: leaving?.kind === 'book' ? '1.1s' : undefined }}>
						<div ref={parallax} className="photo-parallax">
							<div
								className="photo-stage"
								data-preset={preset}
								data-grade={graded}
								style={{ width: stage.w, height: stage.h, transform: `translate(${offset.x}px, ${offset.y}px)` }}
							>
								{photos.map(([name, src]) => (
									<img
										key={name}
										className={`photo-image${name === shown ? ' is-on' : ''}`}
										src={src}
										alt=""
										width={studyPhoto.width}
										height={studyPhoto.height}
										fetchPriority={name === 'golden' ? 'high' : 'low'}
										onLoad={name === 'golden' ? () => setLoaded(true) : undefined}
										draggable={false}
									/>
								))}
								{/* Light for the graded presets: dusk in the window, the lamp's glow and pool. */}
								<div className="photo-dusk" style={boxStyle(stage, studyPhoto.window)} aria-hidden="true" />
								<div
									className="photo-lamplight"
									style={{ left: px(stage, studyPhoto.lampShade)[0], top: px(stage, studyPhoto.lampShade)[1] }}
									aria-hidden="true"
								/>
								<div
									className="photo-lamplight photo-lamplight--pool"
									style={{ left: px(stage, studyPhoto.lampPool)[0], top: px(stage, studyPhoto.lampPool)[1] }}
									aria-hidden="true"
								/>
								<div className="photo-grade" aria-hidden="true" />

								{stage.w > 0 && (
									<>
										<ProjectedPage stage={stage} quad={studyPhoto.pages.left}>
											<Frontispiece />
										</ProjectedPage>
										<ProjectedPage stage={stage} quad={studyPhoto.pages.right} className={turning ? 'is-turning' : ''}>
											{turning ? <ChapterOpening chapter={turning} /> : <Contents onOpen={openChapter} />}
											{turning && (
												<div className="photo-leaf" aria-hidden="true">
													<div className="photo-leaf__front">
														<Contents inert />
													</div>
													<div className="photo-leaf__back" />
												</div>
											)}
										</ProjectedPage>

										{shelfBooks.map((book) => (
											<Hotspot
												key={book.slug}
												stage={stage}
												box={studyPhoto.books[book.slug]}
												target={`book:${book.slug}`}
												label={book.title}
												description={`Case study: ${book.subtitle}. Opens the book`}
												disabled={!!leaving}
												onActivate={() => openBook(book.slug)}
											>
												<SpineLift stage={stage} box={studyPhoto.books[book.slug]} image={image} />
											</Hotspot>
										))}
										<Hotspot
											stage={stage}
											box={studyPhoto.lamp}
											target="lamp"
											label="Lighting"
											description="Change the study's lighting"
											expanded={controlsOpen}
											controls="lighting-controls"
											onActivate={() => toggleLighting()}
										/>

										<PhotoHint stage={stage} hint="book" at={[50, 64]}>
											Explore the study — the book is your guide
										</PhotoHint>
										<ShelfTag stage={stage} at={studyPhoto.shelfTag} />
										<PhotoHint stage={stage} hint="lamp" at={[26.5, 45]}>
											Adjust the lighting
										</PhotoHint>
										{calibrate && <Calibrator stage={stage} />}
									</>
								)}
							</div>
						</div>
					</div>
				</div>

				{/* Taking a book down: the title page comes up to meet the reader. */}
				{opening && (
					<div className="photo-titlepage" aria-hidden="true">
						<p className="photo-titlepage__kicker">A case study</p>
						<p className="photo-titlepage__title">{opening.title}</p>
						<p className="photo-titlepage__subtitle">{opening.subtitle}</p>
						<p className="photo-titlepage__fleuron">❦</p>
					</div>
				)}

				{overflowing && !leaving && (
					<div className="study-glance">
						<button type="button" className="study-glance__btn" onClick={() => setView(view === 'shelf' ? 'desk' : 'shelf')}>
							{view === 'shelf' ? '← Back to the desk' : 'Look at the shelf →'}
						</button>
					</div>
				)}

				<div className={`study-loader${ready ? ' is-done' : ''}`} aria-hidden={ready}>
					<div className="study-loader__card">
						<span className="study-loader__flame" />
						<p className="study-loader__text">Lighting the lamp…</p>
						<span className="study-loader__bar" />
					</div>
				</div>

				<LightingControls />
				<p className="sr-only" role="status" aria-live="polite">
					{message}
				</p>
			</main>
		</div>
	);
}
