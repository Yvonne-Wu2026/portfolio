import { useEffect, useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useCursor } from '@react-three/drei';
import {
	BackSide,
	BufferGeometry,
	CanvasTexture,
	DoubleSide,
	Float32BufferAttribute,
	FrontSide,
	MeshStandardMaterial,
	RepeatWrapping,
	SRGBColorSpace,
	Vector3,
	type Group,
} from 'three';
import { chapters } from '../../data/library';
import { openChapter, TIMING } from './actions';
import { BOOK_STAND, DESK } from './layout';
import { useMaterials } from './materials';
import { SceneHint, SceneLabel } from './SceneLabel';
import { setHovered, useStudy } from './store';
import {
	contentsRows,
	pageCanvas,
	paintBlankPage,
	paintChapterOpening,
	paintContents,
	paintFrontispiece,
} from './textures';

/** Page size in metres: each page of the spread, bottom edge at z = 0. */
const W = 0.27;
const H = 0.37;
/** Height of the page block at the outer edges. */
const LIFT = 0.022;
const SEGMENTS = 36;

/** The curve of an open page: steep out of the gutter, then nearly flat. */
function pageHeight(u: number) {
	return LIFT * (1 - Math.exp(-u * 7)) - 0.004 * u;
}

/** Angle of the resting page's surface at u, in radians from flat. */
function pageSlope(u: number) {
	return Math.atan((LIFT * 7 * Math.exp(-u * 7) - 0.004) / W);
}

/**
 * A page as a strip of quads across its width. `profile(u)` returns the
 * [x, y] of the point a fraction u of the way from the gutter.
 */
function pageGeometry(profile: (u: number) => [number, number], mirrored = false) {
	const positions: number[] = [];
	const uvs: number[] = [];
	const indices: number[] = [];
	for (let i = 0; i <= SEGMENTS; i++) {
		const u = i / SEGMENTS;
		const [x, y] = profile(u);
		positions.push(x, y, 0, x, y, -H);
		// The mirrored (left) page's outer edge is the canvas's left edge.
		const uu = mirrored ? 1 - u : u;
		uvs.push(uu, 0, uu, 1);
		if (i < SEGMENTS) {
			const a = i * 2;
			// A page running toward -x needs the opposite winding to face up.
			if (mirrored) indices.push(a, a + 1, a + 2, a + 2, a + 1, a + 3);
			else indices.push(a, a + 2, a + 1, a + 2, a + 3, a + 1);
		}
	}
	const geometry = new BufferGeometry();
	geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
	geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2));
	geometry.setIndex(indices);
	geometry.computeVertexNormals();
	return geometry;
}

function canvasTexture(canvas: HTMLCanvasElement, mirror = false) {
	const texture = new CanvasTexture(canvas);
	texture.colorSpace = SRGBColorSpace;
	texture.anisotropy = 16;
	if (mirror) {
		texture.wrapS = RepeatWrapping;
		texture.repeat.x = -1;
	}
	return texture;
}

const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** The leaf that turns: rotates about the gutter, its outer edge dragging behind. */
function TurningLeaf({ front, back }: { front: CanvasTexture; back: CanvasTexture }) {
	const turningTo = useStudy((s) => s.turningTo);
	const started = useRef<number | null>(null);
	const group = useRef<Group>(null);
	const geometry = useMemo(() => pageGeometry((u) => [u * W, pageHeight(u) + 0.001]), []);
	const materials = useMemo(
		() => [
			new MeshStandardMaterial({ map: front, roughness: 0.9, side: FrontSide }),
			new MeshStandardMaterial({ map: back, roughness: 0.9, side: BackSide }),
		],
		[front, back],
	);

	useEffect(() => {
		started.current = null;
	}, [turningTo]);

	useFrame((state) => {
		if (!group.current) return;
		group.current.visible = turningTo !== null;
		if (!turningTo) return;
		if (started.current === null) started.current = state.clock.elapsedTime;
		const p = easeInOut(Math.min(1, (state.clock.elapsedTime - started.current) / (TIMING.pageTurn / 1000 - 0.1)));
		const drag = Math.sin(p * Math.PI) * 0.75;
		const position = geometry.attributes.position as Float32BufferAttribute;
		let x = 0;
		let y = 0.001;
		for (let i = 0; i <= SEGMENTS; i++) {
			const u = i / SEGMENTS;
			// Start on the right page's curve, end mirrored onto the left one,
			// with the outer edge lagging the spine by `drag` radians mid-turn.
			const rest = pageSlope(u);
			const angle = rest + (Math.PI - 2 * rest) * p - drag * u * u;
			position.setXYZ(i * 2, x, y, 0);
			position.setXYZ(i * 2 + 1, x, y, -H);
			x += (Math.cos(angle) * W) / SEGMENTS;
			y += (Math.sin(angle) * W) / SEGMENTS;
		}
		position.needsUpdate = true;
		geometry.computeVertexNormals();
	});

	return (
		<group ref={group} visible={false}>
			<mesh geometry={geometry} material={materials[0]} castShadow />
			<mesh geometry={geometry} material={materials[1]} />
		</group>
	);
}

function ChapterHitArea({ index, href, label }: { index: number; href: string; label: string }) {
	const row = contentsRows(chapters.length)[index];
	const left = 0.1;
	const right = 0.9;
	const z = -H * (1 - row.y - row.height / 2) + 0.004;
	const x = W * ((left + right) / 2);
	const u = (left + right) / 2;
	return (
		<mesh
			position={[x, pageHeight(u) + 0.004, z]}
			rotation={[-Math.PI / 2, 0, 0]}
			onPointerOver={(event: ThreeEvent<PointerEvent>) => {
				event.stopPropagation();
				setHovered(`chapter:${href}`);
			}}
			onPointerOut={() => setHovered(null)}
			onClick={(event: ThreeEvent<MouseEvent>) => {
				event.stopPropagation();
				openChapter(href);
			}}
			name={`chapter-${label}`}
		>
			<planeGeometry args={[W * (right - left), H * row.height]} />
			<meshBasicMaterial transparent opacity={0} depthWrite={false} />
		</mesh>
	);
}

export function OpenNavigationBook() {
	const { walnut, brass, pageEdge } = useMaterials();
	const hovered = useStudy((s) => s.hovered);
	const turningTo = useStudy((s) => s.turningTo);
	useCursor(hovered?.startsWith('chapter:') ?? false);

	const pages = useMemo(() => {
		const left = pageCanvas();
		paintFrontispiece(left.ctx);
		const right = pageCanvas();
		const leafFront = pageCanvas();
		const leafBack = pageCanvas();
		paintBlankPage(leafBack.ctx, 53);
		return {
			right,
			leafFront,
			leftTexture: canvasTexture(left.el),
			rightTexture: canvasTexture(right.el),
			leafFrontTexture: canvasTexture(leafFront.el),
			leafBackTexture: canvasTexture(leafBack.el, true),
		};
	}, []);

	const highlighted = chapters.findIndex((chapter) => hovered === `chapter:${chapter.href}`);

	// Repaint the contents with the hovered row inked in, or the chapter being turned to.
	useEffect(() => {
		const destination = chapters.find((chapter) => chapter.href === turningTo);
		if (destination) {
			// Freeze the contents onto the leaf, and put the chapter opening beneath it.
			paintContents(pages.leafFront.ctx, chapters, chapters.indexOf(destination));
			pages.leafFrontTexture.needsUpdate = true;
			paintChapterOpening(pages.right.ctx, destination.number, destination.label);
		} else {
			paintContents(pages.right.ctx, chapters, highlighted);
		}
		pages.rightTexture.needsUpdate = true;
	}, [pages, highlighted, turningTo]);

	const geometries = useMemo(
		() => ({
			left: pageGeometry((u) => [-u * W, pageHeight(u)], true),
			right: pageGeometry((u) => [u * W, pageHeight(u)]),
		}),
		[],
	);
	const leftMaterial = useMemo(() => new MeshStandardMaterial({ map: pages.leftTexture, roughness: 0.9 }), [pages]);
	const rightMaterial = useMemo(() => new MeshStandardMaterial({ map: pages.rightTexture, roughness: 0.9 }), [pages]);
	// The stand's hinged brass prop, from under the board's top edge to the desk.
	const prop = useMemo(() => {
		const tilt = BOOK_STAND.tilt;
		const top = new Vector3(0, -0.02, -0.3).applyAxisAngle(new Vector3(1, 0, 0), tilt);
		const foot = new Vector3(0, -0.012, top.z - 0.08);
		const mid = top.clone().add(foot).multiplyScalar(0.5);
		const length = top.distanceTo(foot);
		const angle = Math.atan2(top.z - foot.z, top.y - foot.y);
		return { mid, length, angle };
	}, []);

	return (
		<group position={[BOOK_STAND.x, DESK.top + 0.012 * BOOK_STAND.scale, BOOK_STAND.z + 0.18]} scale={BOOK_STAND.scale}>
			{/* Reading stand: a walnut base, lip and brass props. */}
			<mesh material={walnut} position={[0, -0.006, -0.12]} castShadow receiveShadow>
				<boxGeometry args={[0.5, 0.012, 0.3]} />
			</mesh>
			{[-0.22, 0.22].map((x) => (
				<mesh
					key={x}
					material={brass}
					position={[x, prop.mid.y, prop.mid.z]}
					rotation={[prop.angle, 0, 0]}
					castShadow
				>
					<cylinderGeometry args={[0.004, 0.004, prop.length, 8]} />
				</mesh>
			))}

			<group rotation={[BOOK_STAND.tilt, 0, 0]}>
				<mesh material={walnut} position={[0, -0.016, -0.2]} castShadow receiveShadow>
					<boxGeometry args={[0.6, 0.012, 0.42]} />
				</mesh>
				<mesh material={walnut} position={[0, -0.002, 0.012]} castShadow>
					<boxGeometry args={[0.6, 0.032, 0.014]} />
				</mesh>

				{/* Covers: burgundy leather boards, just proud of the pages. */}
				<mesh position={[0, -0.006, -H / 2]} castShadow receiveShadow>
					<boxGeometry args={[W * 2 + 0.016, 0.006, H + 0.012]} />
					<meshStandardMaterial color="#4a1c18" roughness={0.65} />
				</mesh>
				{/* Page block edges at the outer sides. */}
				{[-1, 1].map((side) => (
					<mesh key={side} material={pageEdge} position={[side * W * 0.72, 0.006, -H / 2]} castShadow>
						<boxGeometry args={[W * 0.56, 0.014, H - 0.002]} />
					</mesh>
				))}
				<mesh geometry={geometries.left} material={leftMaterial} receiveShadow castShadow />
				<mesh geometry={geometries.right} material={rightMaterial} receiveShadow castShadow />
				<TurningLeaf front={pages.leafFrontTexture} back={pages.leafBackTexture} />

				{/* Silk ribbon marker trailing out over the foot of the pages. */}
				<mesh position={[0.012, 0.003, 0.03]} rotation={[-Math.PI / 2 + 0.25, 0, 0.08]}>
					<planeGeometry args={[0.008, 0.08]} />
					<meshStandardMaterial color="#6f2b2a" roughness={0.5} side={DoubleSide} />
				</mesh>

				{chapters.map((chapter, i) => (
					<ChapterHitArea key={chapter.href} index={i} href={chapter.href} label={chapter.label} />
				))}
				{chapters.map((chapter, i) => {
					const row = contentsRows(chapters.length)[i];
					return (
						<SceneLabel
							key={chapter.href}
							target={`chapter:${chapter.href}`}
							position={[W * 1.08, LIFT, -H * (1 - row.y - row.height / 2)]}
							label={`${chapter.number} ${chapter.label}`}
							description={chapter.href === '/' ? 'You are here' : `Turn to ${chapter.label}`}
							onActivate={() => openChapter(chapter.href)}
						/>
					);
				})}
				<SceneHint hint="book" position={[-W / 2, LIFT + 0.02, -H - 0.04]}>
					Explore the study — the book is your guide
				</SceneHint>
			</group>
		</group>
	);
}
