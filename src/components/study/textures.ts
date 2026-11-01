/**
 * Procedural textures, painted on canvases at load so the study needs no
 * image downloads: wood grain, plaster, paper, book cloth, and the printed
 * pages of the navigation book.
 */
import {
	CanvasTexture,
	ClampToEdgeWrapping,
	LinearSRGBColorSpace,
	RepeatWrapping,
	SRGBColorSpace,
	type Texture,
} from 'three';
import type { ShelfBook } from '../../data/library';

/* ---------------------------------------------------------------- */
/* Helpers                                                           */
/* ---------------------------------------------------------------- */

function mulberry32(seed: number) {
	return () => {
		seed |= 0;
		seed = (seed + 0x6d2b79f5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/** Smooth 2D value noise, tileable horizontally over `period` cells. */
function makeNoise(seed: number, period = 256) {
	const rand = mulberry32(seed);
	const table = new Float32Array(period * period).map(() => rand());
	const at = (x: number, y: number) =>
		table[(((y % period) + period) % period) * period + (((x % period) + period) % period)];
	const fade = (t: number) => t * t * (3 - 2 * t);
	const noise = (x: number, y: number) => {
		const xi = Math.floor(x);
		const yi = Math.floor(y);
		const xf = fade(x - xi);
		const yf = fade(y - yi);
		const a = at(xi, yi) + (at(xi + 1, yi) - at(xi, yi)) * xf;
		const b = at(xi, yi + 1) + (at(xi + 1, yi + 1) - at(xi, yi + 1)) * xf;
		return a + (b - a) * yf;
	};
	return (x: number, y: number, octaves = 3) => {
		let sum = 0;
		let amp = 0.5;
		let freq = 1;
		for (let i = 0; i < octaves; i++) {
			sum += noise(x * freq, y * freq) * amp;
			amp *= 0.5;
			freq *= 2;
		}
		return sum;
	};
}

function canvas(width: number, height: number) {
	const el = document.createElement('canvas');
	el.width = width;
	el.height = height;
	const ctx = el.getContext('2d')!;
	return { el, ctx };
}

function hexToRgb(hex: string): [number, number, number] {
	const n = parseInt(hex.slice(1), 16);
	return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function toTexture(el: HTMLCanvasElement, { color = true, repeat = false } = {}) {
	const texture = new CanvasTexture(el);
	texture.colorSpace = color ? SRGBColorSpace : LinearSRGBColorSpace;
	texture.wrapS = texture.wrapT = repeat ? RepeatWrapping : ClampToEdgeWrapping;
	texture.anisotropy = 8;
	return texture;
}

/* ---------------------------------------------------------------- */
/* Wood                                                              */
/* ---------------------------------------------------------------- */

export interface WoodOptions {
	dark: string;
	light: string;
	seed?: number;
	width?: number;
	height?: number;
	/** Rings per texture height; higher is a tighter grain. */
	rings?: number;
	/** Draw plank seams this many times across the height (floors). */
	planks?: number;
}

/** Flat-sawn grain running along x, with pores and the odd darker streak. */
export function woodTextures({
	dark,
	light,
	seed = 1,
	width = 1024,
	height = 512,
	rings = 9,
	planks = 0,
}: WoodOptions): { map: Texture; bump: Texture } {
	const fbm = makeNoise(seed);
	const pores = makeNoise(seed + 7, 512);
	const c0 = hexToRgb(dark);
	const c1 = hexToRgb(light);
	const color = canvas(width, height);
	const bump = canvas(width, height);
	const colorData = color.ctx.createImageData(width, height);
	const bumpData = bump.ctx.createImageData(width, height);
	const plankHeight = planks ? height / planks : height;

	for (let y = 0; y < height; y++) {
		const plank = Math.floor(y / plankHeight);
		const plankShift = plank * 173.3;
		const plankTone = planks ? (mulberry32(seed + plank * 31)() - 0.5) * 0.22 : 0;
		const seam = planks ? Math.min(y % plankHeight, plankHeight - (y % plankHeight)) : 99;
		for (let x = 0; x < width; x++) {
			// Long, gently wavering grain lines rather than swirls.
			const warp = fbm(x * 0.0018 + plankShift, y * 0.012, 3) * 1.6;
			const ringPos = (y / height) * rings + warp + plank * 0.37;
			const ring = ringPos - Math.floor(ringPos);
			// Sharp latewood line, soft earlywood fade.
			let t = Math.pow(1 - Math.abs(ring * 2 - 1), 3.2);
			const streak = fbm(x * 0.0012 + plankShift, y * 0.08, 2);
			t = t * 0.7 + streak * 0.45 - 0.12 + plankTone;
			const pore = pores(x * 0.9, y * 2.4, 1) > 0.78 ? 0.25 : 0;
			t = Math.min(1, Math.max(0, t - pore * 0.6));
			const shade = seam < 1.5 ? 0.35 : 1;
			const i = (y * width + x) * 4;
			colorData.data[i] = (c1[0] + (c0[0] - c1[0]) * t) * shade;
			colorData.data[i + 1] = (c1[1] + (c0[1] - c1[1]) * t) * shade;
			colorData.data[i + 2] = (c1[2] + (c0[2] - c1[2]) * t) * shade;
			colorData.data[i + 3] = 255;
			const b = (1 - t * 0.5 - pore) * 255 * (seam < 1.5 ? 0.2 : 1);
			bumpData.data[i] = bumpData.data[i + 1] = bumpData.data[i + 2] = b;
			bumpData.data[i + 3] = 255;
		}
	}
	color.ctx.putImageData(colorData, 0, 0);
	bump.ctx.putImageData(bumpData, 0, 0);
	return { map: toTexture(color.el, { repeat: true }), bump: toTexture(bump.el, { color: false, repeat: true }) };
}

/* ---------------------------------------------------------------- */
/* Plaster and paper                                                 */
/* ---------------------------------------------------------------- */

/** Mottled lime plaster for the upper walls. */
export function plasterTexture(base: string, seed = 3) {
	const size = 512;
	const fbm = makeNoise(seed, 128);
	const [r, g, b] = hexToRgb(base);
	const { el, ctx } = canvas(size, size);
	const data = ctx.createImageData(size, size);
	for (let y = 0; y < size; y++) {
		for (let x = 0; x < size; x++) {
			const n = fbm(x * 0.02, y * 0.02, 5) - 0.5;
			const k = 1 + n * 0.22;
			const i = (y * size + x) * 4;
			data.data[i] = r * k;
			data.data[i + 1] = g * k;
			data.data[i + 2] = b * k;
			data.data[i + 3] = 255;
		}
	}
	ctx.putImageData(data, 0, 0);
	return toTexture(el, { repeat: true });
}

/** Paint aged paper into a context: cream ground, fibres, foxed edges. */
function paintPaper(ctx: CanvasRenderingContext2D, w: number, h: number, seed: number, base = '#efe3c8') {
	const rand = mulberry32(seed);
	ctx.fillStyle = base;
	ctx.fillRect(0, 0, w, h);
	for (let i = 0; i < 1800; i++) {
		ctx.fillStyle = `rgba(120, 90, 50, ${rand() * 0.05})`;
		ctx.fillRect(rand() * w, rand() * h, rand() * 3 + 0.5, rand() * 1.2 + 0.3);
	}
	for (let i = 0; i < 14; i++) {
		const x = rand() * w;
		const y = rand() * h;
		const r = rand() * 26 + 6;
		const spot = ctx.createRadialGradient(x, y, 0, x, y, r);
		spot.addColorStop(0, 'rgba(150, 105, 55, 0.07)');
		spot.addColorStop(1, 'rgba(150, 105, 55, 0)');
		ctx.fillStyle = spot;
		ctx.fillRect(x - r, y - r, r * 2, r * 2);
	}
	const edge = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
	edge.addColorStop(0, 'rgba(160, 115, 60, 0)');
	edge.addColorStop(1, 'rgba(160, 115, 60, 0.22)');
	ctx.fillStyle = edge;
	ctx.fillRect(0, 0, w, h);
}

export function paperTexture(seed = 11, base?: string) {
	const { el, ctx } = canvas(512, 512);
	paintPaper(ctx, 512, 512, seed, base);
	return toTexture(el);
}

/** Fine horizontal lines for the edges of a page block. */
export function pageEdgeTexture() {
	const { el, ctx } = canvas(64, 256);
	const rand = mulberry32(5);
	ctx.fillStyle = '#e8dbbd';
	ctx.fillRect(0, 0, 64, 256);
	for (let y = 0; y < 256; y += 2) {
		ctx.fillStyle = `rgba(110, 80, 45, ${0.08 + rand() * 0.18})`;
		ctx.fillRect(0, y, 64, 1);
	}
	return toTexture(el, { repeat: true });
}

/* ---------------------------------------------------------------- */
/* The view through the window                                       */
/* ---------------------------------------------------------------- */

/** A late-afternoon garden, softly out of focus, kept dim enough not to compete with the desk. */
export function outsideTexture() {
	const w = 1024;
	const h = 1024;
	const { el, ctx } = canvas(w, h);
	const sky = ctx.createLinearGradient(0, 0, 0, h);
	sky.addColorStop(0, '#f6d6a0');
	sky.addColorStop(0.45, '#fbe2b4');
	sky.addColorStop(0.7, '#e9b77a');
	sky.addColorStop(1, '#8f6a3c');
	ctx.fillStyle = sky;
	ctx.fillRect(0, 0, w, h);

	const sun = ctx.createRadialGradient(w * 0.3, h * 0.5, 0, w * 0.3, h * 0.5, w * 0.45);
	sun.addColorStop(0, 'rgba(255, 246, 220, 1)');
	sun.addColorStop(0.25, 'rgba(255, 226, 170, 0.7)');
	sun.addColorStop(1, 'rgba(255, 210, 150, 0)');
	ctx.fillStyle = sun;
	ctx.fillRect(0, 0, w, h);

	const rand = mulberry32(21);
	ctx.filter = 'blur(18px)';
	// Distant tree line, then nearer canopy at the edges.
	for (let i = 0; i < 40; i++) {
		const x = rand() * w;
		const y = h * (0.6 + rand() * 0.12);
		const r = 60 + rand() * 90;
		ctx.fillStyle = `rgba(${90 + rand() * 30}, ${80 + rand() * 25}, ${40 + rand() * 15}, 0.55)`;
		ctx.beginPath();
		ctx.arc(x, y, r, 0, Math.PI * 2);
		ctx.fill();
	}
	for (let i = 0; i < 26; i++) {
		const side = rand() > 0.5 ? w * (0.85 + rand() * 0.2) : w * (rand() * 0.15 - 0.05);
		const y = rand() * h * 0.7;
		const r = 70 + rand() * 120;
		ctx.fillStyle = `rgba(${70 + rand() * 30}, ${66 + rand() * 25}, ${34 + rand() * 12}, 0.6)`;
		ctx.beginPath();
		ctx.arc(side, y, r, 0, Math.PI * 2);
		ctx.fill();
	}
	ctx.fillStyle = 'rgba(70, 52, 28, 0.85)';
	ctx.fillRect(0, h * 0.82, w, h * 0.2);
	ctx.filter = 'none';
	return toTexture(el);
}

/* ---------------------------------------------------------------- */
/* Book cloth, spines and covers                                     */
/* ---------------------------------------------------------------- */

function paintCloth(ctx: CanvasRenderingContext2D, w: number, h: number, color: string, seed: number) {
	const rand = mulberry32(seed);
	ctx.fillStyle = color;
	ctx.fillRect(0, 0, w, h);
	// Weave: faint crossing threads.
	for (let y = 0; y < h; y += 2) {
		ctx.fillStyle = `rgba(0, 0, 0, ${0.03 + rand() * 0.05})`;
		ctx.fillRect(0, y, w, 1);
	}
	for (let x = 0; x < w; x += 2) {
		ctx.fillStyle = `rgba(255, 240, 210, ${rand() * 0.035})`;
		ctx.fillRect(x, 0, 1, h);
	}
	// Wear: lighter rubbing toward the edges.
	const wear = ctx.createLinearGradient(0, 0, 0, h);
	wear.addColorStop(0, 'rgba(255, 230, 190, 0.12)');
	wear.addColorStop(0.06, 'rgba(255, 230, 190, 0)');
	wear.addColorStop(0.94, 'rgba(255, 230, 190, 0)');
	wear.addColorStop(1, 'rgba(255, 230, 190, 0.14)');
	ctx.fillStyle = wear;
	ctx.fillRect(0, 0, w, h);
}

function foilGradient(ctx: CanvasRenderingContext2D, w: number, foil: string) {
	const gradient = ctx.createLinearGradient(0, 0, w, 0);
	gradient.addColorStop(0, foil);
	gradient.addColorStop(0.5, '#f3dfa8');
	gradient.addColorStop(1, foil);
	return gradient;
}

/**
 * Spine artwork: raised bands, foil rules and the title running bottom to
 * top. The canvas is portrait — width maps to the spine's thickness.
 */
export function spineTexture(book: ShelfBook) {
	const w = 160;
	const h = 768;
	const { el, ctx } = canvas(w, h);
	paintCloth(ctx, w, h, book.cloth, book.slug.length * 13);

	const foil = foilGradient(ctx, w, book.foil);
	const bands = [0.08, 0.16, 0.84, 0.92];
	for (const y of bands) {
		const by = y * h;
		const band = ctx.createLinearGradient(0, by - 10, 0, by + 10);
		band.addColorStop(0, 'rgba(0,0,0,0.35)');
		band.addColorStop(0.5, 'rgba(255,235,200,0.18)');
		band.addColorStop(1, 'rgba(0,0,0,0.35)');
		ctx.fillStyle = band;
		ctx.fillRect(0, by - 10, w, 20);
		ctx.fillStyle = foil;
		ctx.fillRect(0, by - 13, w, 2);
		ctx.fillRect(0, by + 11, w, 2);
	}

	// Title, rotated to read bottom-to-top as on a European spine.
	ctx.save();
	ctx.translate(w / 2, h / 2);
	ctx.rotate(-Math.PI / 2);
	ctx.fillStyle = foil;
	ctx.textAlign = 'center';
	ctx.textBaseline = 'middle';
	let size = 64;
	ctx.font = `600 ${size}px "Cormorant Garamond"`;
	const maxLength = h * 0.6;
	while (ctx.measureText(book.spine).width > maxLength && size > 30) {
		size -= 2;
		ctx.font = `600 ${size}px "Cormorant Garamond"`;
	}
	ctx.letterSpacing = '4px';
	ctx.shadowColor = 'rgba(0,0,0,0.45)';
	ctx.shadowOffsetY = 2;
	ctx.fillText(book.spine, 0, 4);
	ctx.restore();

	// Small foil fleuron near the foot.
	ctx.fillStyle = foil;
	ctx.font = '600 40px "Cormorant Garamond"';
	ctx.textAlign = 'center';
	ctx.fillText('❦', w / 2, h * 0.88 + 14);
	return toTexture(el);
}

/** Front board: a blind-tooled frame and the title in foil. */
export function coverTexture(book: ShelfBook) {
	const w = 512;
	const h = 720;
	const { el, ctx } = canvas(w, h);
	paintCloth(ctx, w, h, book.cloth, book.slug.length * 7);
	const foil = foilGradient(ctx, w, book.foil);
	ctx.strokeStyle = foil;
	ctx.lineWidth = 3;
	ctx.strokeRect(36, 36, w - 72, h - 72);
	ctx.lineWidth = 1.5;
	ctx.strokeRect(50, 50, w - 100, h - 100);
	ctx.fillStyle = foil;
	ctx.textAlign = 'center';
	ctx.font = '600 58px "Cormorant Garamond"';
	wrapText(ctx, book.title, w / 2, h * 0.38, w - 140, 64);
	ctx.font = '500 34px "Cormorant Garamond"';
	ctx.fillText('❦', w / 2, h * 0.62);
	return toTexture(el);
}

/** The first page a visitor sees when a shelf book opens. */
export function titlePageTexture(book: ShelfBook) {
	const w = 720;
	const h = 1024;
	const { el, ctx } = canvas(w, h);
	paintPaper(ctx, w, h, book.slug.length * 17);
	ctx.fillStyle = '#2a1c13';
	ctx.textAlign = 'center';
	ctx.font = '500 26px "EB Garamond"';
	ctx.letterSpacing = '6px';
	ctx.fillText('A CASE STUDY', w / 2, h * 0.24);
	ctx.letterSpacing = '0px';
	ctx.font = '600 84px "Cormorant Garamond"';
	const end = wrapText(ctx, book.title, w / 2, h * 0.36, w - 140, 90);
	ctx.font = 'italic 400 34px "EB Garamond"';
	ctx.fillStyle = '#5c4838';
	wrapText(ctx, book.subtitle, w / 2, end + 72, w - 180, 44);
	ctx.fillStyle = '#b08d57';
	ctx.font = '500 40px "Cormorant Garamond"';
	ctx.fillText('❦', w / 2, h * 0.7);
	ctx.fillStyle = '#2a1c13';
	ctx.font = '500 24px "EB Garamond"';
	ctx.letterSpacing = '5px';
	ctx.fillText('YVONNE WU', w / 2, h * 0.86);
	return toTexture(el);
}

/** Draw centred text wrapped to `maxWidth`; returns the last baseline. */
function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, lineHeight: number) {
	const words = text.split(' ');
	let line = '';
	let cursor = y;
	for (const word of words) {
		const test = line ? `${line} ${word}` : word;
		if (ctx.measureText(test).width > maxWidth && line) {
			ctx.fillText(line, x, cursor);
			line = word;
			cursor += lineHeight;
		} else {
			line = test;
		}
	}
	ctx.fillText(line, x, cursor);
	return cursor;
}

/* ---------------------------------------------------------------- */
/* The navigation book's pages                                       */
/* ---------------------------------------------------------------- */

export const PAGE_CANVAS = { width: 900, height: 1200 };

/** Where each contents entry sits on the right page, as fractions of the page. */
export function contentsRows(count: number) {
	const top = 0.37;
	const step = 0.115;
	return Array.from({ length: count }, (_, i) => ({ y: top + i * step, height: step * 0.8 }));
}

function gutterShade(ctx: CanvasRenderingContext2D, w: number, h: number, side: 'left' | 'right') {
	// The page dips into the gutter: darken the inner edge.
	const inner = side === 'left' ? w : 0;
	const gradient = ctx.createLinearGradient(inner, 0, side === 'left' ? w * 0.8 : w * 0.2, 0);
	gradient.addColorStop(0, 'rgba(70, 45, 20, 0.35)');
	gradient.addColorStop(0.35, 'rgba(70, 45, 20, 0.08)');
	gradient.addColorStop(1, 'rgba(70, 45, 20, 0)');
	ctx.fillStyle = gradient;
	ctx.fillRect(0, 0, w, h);
}

/** Left page: a frontispiece that says whose study this is. */
export function paintFrontispiece(ctx: CanvasRenderingContext2D) {
	const { width: w, height: h } = PAGE_CANVAS;
	paintPaper(ctx, w, h, 41);
	ctx.textAlign = 'center';
	ctx.fillStyle = '#5c4838';
	ctx.font = '500 26px "EB Garamond"';
	ctx.letterSpacing = '8px';
	ctx.fillText('THE STUDY OF', w / 2, h * 0.24);
	ctx.letterSpacing = '2px';
	ctx.fillStyle = '#2a1c13';
	ctx.font = '600 104px "Cormorant Garamond"';
	ctx.fillText('Yvonne Wu', w / 2, h * 0.34);
	ctx.letterSpacing = '0px';
	ctx.fillStyle = '#b08d57';
	ctx.font = '500 44px "Cormorant Garamond"';
	ctx.fillText('— ❦ —', w / 2, h * 0.43);
	ctx.fillStyle = '#2a1c13';
	ctx.font = 'italic 400 40px "EB Garamond"';
	ctx.fillText('UX & UI Designer', w / 2, h * 0.52);
	ctx.fillStyle = '#5c4838';
	ctx.font = '400 30px "EB Garamond"';
	wrapText(
		ctx,
		'Being a collection of human-centred work, notes, and correspondence, kept in Boston.',
		w / 2,
		h * 0.64,
		w * 0.62,
		44,
	);
	ctx.font = '500 22px "EB Garamond"';
	ctx.letterSpacing = '6px';
	ctx.fillText('MMXXVI', w / 2, h * 0.88);
	ctx.letterSpacing = '0px';
	gutterShade(ctx, w, h, 'left');
}

/** Right page: the table of contents, with the hovered row inked in. */
export function paintContents(
	ctx: CanvasRenderingContext2D,
	entries: { number: string; label: string; page: number }[],
	highlighted: number,
) {
	const { width: w, height: h } = PAGE_CANVAS;
	paintPaper(ctx, w, h, 43);
	const left = w * 0.14;
	const right = w * 0.86;
	ctx.fillStyle = '#2a1c13';
	ctx.textAlign = 'center';
	ctx.font = '600 50px "Cormorant Garamond"';
	ctx.letterSpacing = '14px';
	ctx.fillText('CONTENTS', w / 2 + 7, h * 0.2);
	ctx.letterSpacing = '0px';
	ctx.strokeStyle = '#b08d57';
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.moveTo(w * 0.36, h * 0.235);
	ctx.lineTo(w * 0.64, h * 0.235);
	ctx.stroke();

	contentsRows(entries.length).forEach(({ y }, i) => {
		const entry = entries[i];
		const baseline = h * y + 22;
		const active = i === highlighted;
		if (active) {
			// A warm wash, like lamplight caught on the line.
			const wash = ctx.createLinearGradient(left - 30, 0, right + 30, 0);
			wash.addColorStop(0, 'rgba(217, 162, 76, 0)');
			wash.addColorStop(0.15, 'rgba(217, 162, 76, 0.28)');
			wash.addColorStop(0.85, 'rgba(217, 162, 76, 0.28)');
			wash.addColorStop(1, 'rgba(217, 162, 76, 0)');
			ctx.fillStyle = wash;
			ctx.fillRect(left - 30, baseline - 58, right - left + 60, 82);
		}
		ctx.textAlign = 'left';
		ctx.fillStyle = active ? '#6f2b2a' : '#8a6f55';
		ctx.font = '500 34px "EB Garamond"';
		ctx.fillText(entry.number, left, baseline);
		ctx.fillStyle = active ? '#6f2b2a' : '#2a1c13';
		ctx.font = `${active ? 'italic 600' : '600'} 58px "Cormorant Garamond"`;
		const labelX = left + 78;
		ctx.fillText(entry.label, labelX, baseline);
		const labelEnd = labelX + ctx.measureText(entry.label).width;

		ctx.textAlign = 'right';
		ctx.font = '400 34px "EB Garamond"';
		ctx.fillStyle = active ? '#6f2b2a' : '#5c4838';
		ctx.fillText(String(entry.page), right, baseline);
		const pageStart = right - ctx.measureText(String(entry.page)).width;

		// Dot leaders between the title and its page number.
		ctx.fillStyle = 'rgba(92, 72, 56, 0.6)';
		for (let x = labelEnd + 24; x < pageStart - 18; x += 16) {
			ctx.fillRect(x, baseline - 6, 3, 3);
		}
		if (active) {
			// Ink underline, slightly uneven like a pen stroke.
			ctx.strokeStyle = '#6f2b2a';
			ctx.lineWidth = 3;
			ctx.lineCap = 'round';
			ctx.beginPath();
			ctx.moveTo(labelX, baseline + 14);
			ctx.quadraticCurveTo((labelX + labelEnd) / 2, baseline + 19, labelEnd + 6, baseline + 12);
			ctx.stroke();
		}
	});

	ctx.textAlign = 'center';
	ctx.fillStyle = '#8a6f55';
	ctx.font = 'italic 400 28px "EB Garamond"';
	ctx.fillText('Select a chapter to turn to it', w / 2, h * 0.9);
	gutterShade(ctx, w, h, 'right');
}

/** A blank verso for the back of the turning leaf; it lands as a left page. */
export function paintBlankPage(ctx: CanvasRenderingContext2D, seed: number) {
	const { width: w, height: h } = PAGE_CANVAS;
	paintPaper(ctx, w, h, seed);
	gutterShade(ctx, w, h, 'left');
}

/** The page a turn lands on: the chapter's number and title. */
export function paintChapterOpening(ctx: CanvasRenderingContext2D, number: string, label: string) {
	const { width: w, height: h } = PAGE_CANVAS;
	paintPaper(ctx, w, h, 47);
	ctx.textAlign = 'center';
	ctx.fillStyle = '#8a6f55';
	ctx.font = '500 28px "EB Garamond"';
	ctx.letterSpacing = '10px';
	ctx.fillText(`CHAPTER ${number}`, w / 2 + 5, h * 0.36);
	ctx.letterSpacing = '0px';
	ctx.fillStyle = '#2a1c13';
	ctx.font = 'italic 600 120px "Cormorant Garamond"';
	ctx.fillText(label, w / 2, h * 0.48);
	ctx.fillStyle = '#b08d57';
	ctx.font = '500 44px "Cormorant Garamond"';
	ctx.fillText('❦', w / 2, h * 0.58);
	gutterShade(ctx, w, h, 'right');
}

export function pageCanvas() {
	return canvas(PAGE_CANVAS.width, PAGE_CANVAS.height);
}

export { toTexture };
