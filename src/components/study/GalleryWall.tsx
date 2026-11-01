import { useLayoutEffect, useMemo, useRef } from 'react';
import {
	CanvasTexture,
	Color,
	ExtrudeGeometry,
	InstancedMesh,
	LinearSRGBColorSpace,
	MeshStandardMaterial,
	Object3D,
	Path,
	RepeatWrapping,
	Shape,
	Vector2,
} from 'three';
import { ROOM, WINDOW } from './layout';
import { fern, leaf, spray, type Painter } from './prints';
import { toTexture } from './textures';

/*
 * A salon hang of ornate gilt frames, after the reference: carved scrolls
 * around the outer edge, a beaded inner rim, and a mix of portrait,
 * landscape and round frames in gold from antique bronze to bright gilt.
 */

type Kind = 'portrait' | 'landscape' | 'round';

interface Hanging {
	kind: Kind;
	/** Outer size in metres (diameter for round frames). */
	size: [number, number];
	/** Centre on the wall, relative to the gallery's anchor. */
	at: [number, number];
	gold: string;
	/** Portrait frames can carry a carved crest on top. */
	crest?: boolean;
	paint: Painter;
}

/** Anchor: the hang's right column sits a hand's width off the window casing. */
const ANCHOR_X = WINDOW.x - WINDOW.width / 2 - 0.36;

const HANGING: Hanging[] = [
	{ kind: 'portrait', size: [0.3, 0.4], at: [0, 2.04], gold: '#8a6a34', crest: true, paint: fern('Polypodium vulgare') },
	{ kind: 'round', size: [0.3, 0.3], at: [-0.4, 2.08], gold: '#9a7638', paint: spray('Rosa canina', 'rgba(150, 60, 50, 0.55)') },
	{ kind: 'landscape', size: [0.32, 0.24], at: [0.01, 1.6], gold: '#c19a3c', paint: leaf('Quercus robur', 4) },
	{ kind: 'portrait', size: [0.26, 0.34], at: [-0.4, 1.6], gold: '#7c5f30', paint: spray('Digitalis purpurea', 'rgba(130, 70, 110, 0.5)') },
	{ kind: 'round', size: [0.25, 0.25], at: [0, 1.24], gold: '#a98236', paint: fern('Dryopteris filix-mas', -0.8) },
	{ kind: 'landscape', size: [0.3, 0.22], at: [-0.4, 1.24], gold: '#8f6d35', paint: leaf('Acer campestre', 2.5) },
];

const DEPTH = 0.022;
const BEVEL = 0.009;

/* ---------------------------------------------------------------- */
/* Outlines                                                          */
/* ---------------------------------------------------------------- */

/** Width of the carved border, as a fraction of the frame's short side. */
const BORDER = 0.24;

/**
 * Outer edge of a rectangular frame: scalloped scrollwork lobes all round,
 * swelling at the corners, with an optional cartouche crest at the top.
 */
function rectOutline(w: number, h: number, crest: boolean): Vector2[] {
	const points: Vector2[] = [];
	const perimeter = 2 * (w + h);
	const steps = 220;
	const lobe = 0.035;
	for (let i = 0; i < steps; i++) {
		const d = (i / steps) * perimeter;
		let x: number;
		let y: number;
		let nx: number;
		let ny: number;
		if (d < w) {
			[x, y, nx, ny] = [-w / 2 + d, -h / 2, 0, -1];
		} else if (d < w + h) {
			[x, y, nx, ny] = [w / 2, -h / 2 + (d - w), 1, 0];
		} else if (d < 2 * w + h) {
			[x, y, nx, ny] = [w / 2 - (d - w - h), h / 2, 0, 1];
		} else {
			[x, y, nx, ny] = [-w / 2, h / 2 - (d - 2 * w - h), -1, 0];
		}
		// Scalloped lobes, larger toward each corner.
		const toCorner = Math.hypot(Math.abs(x) - w / 2, Math.abs(y) - h / 2);
		const cornerSwell = Math.exp(-toCorner / 0.03) * 0.018;
		let out = Math.pow(Math.abs(Math.sin((d / lobe) * Math.PI)), 0.6) * 0.007 + cornerSwell;
		// A carved crest rising from the top rail.
		if (crest && ny === 1) out += Math.exp(-Math.pow(x / (w * 0.16), 2)) * h * 0.13;
		points.push(new Vector2(x + nx * out, y + ny * out));
	}
	return points;
}

function roundOutline(r: number): Vector2[] {
	const points: Vector2[] = [];
	const steps = 180;
	for (let i = 0; i < steps; i++) {
		const a = (i / steps) * Math.PI * 2;
		// Twelve scroll lobes, each with a smaller curl beside it.
		const rr = r + Math.pow(Math.abs(Math.sin(a * 6)), 0.7) * r * 0.08 + Math.sin(a * 18) * r * 0.012;
		points.push(new Vector2(Math.cos(a) * rr, Math.sin(a) * rr));
	}
	return points;
}

function opening(hanging: Hanging): { points: Vector2[]; w: number; h: number } {
	const [w, h] = hanging.size;
	if (hanging.kind === 'round') {
		const r = (w / 2) * (1 - BORDER * 0.95);
		const points = Array.from({ length: 96 }, (_, i) => {
			const a = (i / 96) * Math.PI * 2;
			return new Vector2(Math.cos(a) * r, Math.sin(a) * r);
		});
		return { points, w: r * 2, h: r * 2 };
	}
	const border = Math.min(w, h) * BORDER;
	const iw = w - border * 2;
	const ih = h - border * 2;
	return {
		points: [new Vector2(-iw / 2, -ih / 2), new Vector2(iw / 2, -ih / 2), new Vector2(iw / 2, ih / 2), new Vector2(-iw / 2, ih / 2)],
		w: iw,
		h: ih,
	};
}

/* ---------------------------------------------------------------- */
/* Carved relief                                                     */
/* ---------------------------------------------------------------- */

/** Rocaille relief as a bump map: tight scrolls, acanthus curls and pitting. */
function carvingTexture() {
	const size = 256;
	const el = document.createElement('canvas');
	el.width = el.height = size;
	const ctx = el.getContext('2d')!;
	// Mid grey is the flat ground; light strokes stand proud, dark pits sink in.
	ctx.fillStyle = '#5a5a5a';
	ctx.fillRect(0, 0, size, size);
	let seed = 7;
	const rand = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;
	ctx.lineCap = 'round';
	for (let i = 0; i < 70; i++) {
		const cx = rand() * size;
		const cy = rand() * size;
		const turns = 1.2 + rand() * 1.3;
		const r0 = 4 + rand() * 14;
		const dir = rand() < 0.5 ? 1 : -1;
		ctx.lineWidth = 2 + rand() * 3;
		ctx.strokeStyle = `rgba(255,255,255,${0.5 + rand() * 0.4})`;
		ctx.beginPath();
		for (let t = 0; t <= 1; t += 0.02) {
			const a = dir * t * turns * Math.PI * 2;
			const r = r0 * (1 - t * 0.85);
			const x = cx + Math.cos(a) * r;
			const y = cy + Math.sin(a) * r;
			if (t === 0) ctx.moveTo(x, y);
			else ctx.lineTo(x, y);
		}
		ctx.stroke();
	}
	for (let i = 0; i < 400; i++) {
		ctx.fillStyle = `rgba(0,0,0,${rand() * 0.35})`;
		ctx.beginPath();
		ctx.arc(rand() * size, rand() * size, rand() * 2.2, 0, Math.PI * 2);
		ctx.fill();
	}
	const texture = new CanvasTexture(el);
	texture.colorSpace = LinearSRGBColorSpace;
	texture.wrapS = texture.wrapT = RepeatWrapping;
	// Extruded UVs are in metres: a scroll pattern every 9 cm.
	texture.repeat.set(11, 11);
	return texture;
}

/* ---------------------------------------------------------------- */
/* A frame                                                           */
/* ---------------------------------------------------------------- */

function OrnateFrame({ hanging, carving }: { hanging: Hanging; carving: CanvasTexture }) {
	const beads = useRef<InstancedMesh>(null);
	const { geometry, hole, gilt, art } = useMemo(() => {
		const [w, h] = hanging.size;
		const outline = hanging.kind === 'round' ? roundOutline(w / 2) : rectOutline(w, h, !!hanging.crest);
		const hole = opening(hanging);
		const shape = new Shape(outline);
		shape.holes.push(new Path(hole.points));
		const geometry = new ExtrudeGeometry(shape, {
			depth: DEPTH,
			bevelEnabled: true,
			bevelThickness: BEVEL,
			bevelSize: BEVEL * 0.9,
			bevelSegments: 4,
			curveSegments: 24,
		});
		const gold = new Color(hanging.gold);
		// Part metal, with a faint warm self-light: fully metallic gold only
		// shows its colour against bright reflections, and the study is dim.
		const gilt = new MeshStandardMaterial({
			color: gold.clone().offsetHSL(0, 0.05, 0.12),
			metalness: 0.65,
			roughness: 0.42,
			emissive: gold,
			emissiveIntensity: 0.12,
			bumpMap: carving,
			bumpScale: 2.2,
		});

		// The plate inside: painted at the opening's proportions.
		const el = document.createElement('canvas');
		el.width = 320;
		el.height = Math.round((320 * hole.h) / hole.w);
		const ctx = el.getContext('2d')!;
		ctx.fillStyle = '#e8dcc0';
		ctx.fillRect(0, 0, el.width, el.height);
		// A soft shadow cast by the frame onto the plate's edges.
		const shade = ctx.createRadialGradient(el.width / 2, el.height / 2, Math.min(el.width, el.height) * 0.3, el.width / 2, el.height / 2, Math.max(el.width, el.height) * 0.7);
		shade.addColorStop(0, 'rgba(90, 60, 30, 0)');
		shade.addColorStop(1, 'rgba(90, 60, 30, 0.35)');
		hanging.paint(ctx, el.width, el.height);
		ctx.fillStyle = shade;
		ctx.fillRect(0, 0, el.width, el.height);
		const art = new MeshStandardMaterial({ map: toTexture(el), roughness: 0.9 });
		return { geometry, hole, gilt, art };
	}, [hanging, carving]);

	// Beaded rim just outside the opening, as on the reference frames.
	const beadPositions = useMemo(() => {
		const out: [number, number][] = [];
		const spacing = 0.011;
		if (hanging.kind === 'round') {
			const r = hole.w / 2 + 0.008;
			const count = Math.floor((Math.PI * 2 * r) / spacing);
			for (let i = 0; i < count; i++) {
				const a = (i / count) * Math.PI * 2;
				out.push([Math.cos(a) * r, Math.sin(a) * r]);
			}
		} else {
			const hw = hole.w / 2 + 0.008;
			const hh = hole.h / 2 + 0.008;
			for (const [x0, y0, x1, y1] of [
				[-hw, -hh, hw, -hh],
				[hw, -hh, hw, hh],
				[hw, hh, -hw, hh],
				[-hw, hh, -hw, -hh],
			]) {
				const length = Math.hypot(x1 - x0, y1 - y0);
				const count = Math.floor(length / spacing);
				for (let i = 0; i < count; i++) out.push([x0 + ((x1 - x0) * i) / count, y0 + ((y1 - y0) * i) / count]);
			}
		}
		return out;
	}, [hanging, hole]);

	useLayoutEffect(() => {
		if (!beads.current) return;
		const dummy = new Object3D();
		beadPositions.forEach(([x, y], i) => {
			dummy.position.set(x, y, DEPTH + BEVEL * 0.6);
			dummy.updateMatrix();
			beads.current!.setMatrixAt(i, dummy.matrix);
		});
		beads.current.instanceMatrix.needsUpdate = true;
	}, [beadPositions]);

	const [x, y] = hanging.at;
	return (
		<group position={[ANCHOR_X + x, y, ROOM.back + 0.005]}>
			<mesh geometry={geometry} material={gilt} castShadow receiveShadow />
			<instancedMesh ref={beads} args={[undefined, gilt, beadPositions.length]}>
				<sphereGeometry args={[0.0042, 8, 6]} />
			</instancedMesh>
			{/* The plate, set back in the rebate behind the carving. */}
			<mesh material={art} position={[0, 0, 0.006]}>
				{hanging.kind === 'round' ? (
					<circleGeometry args={[hole.w / 2 + 0.004, 64]} />
				) : (
					<planeGeometry args={[hole.w + 0.008, hole.h + 0.008]} />
				)}
			</mesh>
		</group>
	);
}

export function GalleryWall() {
	const carving = useMemo(carvingTexture, []);
	return (
		<group>
			{HANGING.map((hanging, i) => (
				<OrnateFrame key={i} hanging={hanging} carving={carving} />
			))}
		</group>
	);
}
