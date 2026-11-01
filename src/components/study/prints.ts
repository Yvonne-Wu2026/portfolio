/** Botanical plates painted onto canvases for the framed prints. */

export type Painter = (ctx: CanvasRenderingContext2D, w: number, h: number) => void;

const INK = 'rgba(60, 70, 35, 0.75)';

/** A fern frond: a curved rachis with paired, tapering pinnae. `sway` bends it. */
export const fern =
	(name: string, sway = 1): Painter =>
	(ctx, w, h) => {
		ctx.strokeStyle = INK;
		ctx.lineWidth = 2;
		const steps = 22;
		const cx = w / 2;
		for (let i = 0; i <= steps; i++) {
			const t = i / steps;
			const x = cx + Math.sin(t * 2.4) * 30 * sway;
			const y = h * 0.84 - t * h * 0.66;
			const length = w * 0.24 * Math.sin(Math.PI * (0.15 + t * 0.85)) * (1 - t * 0.55);
			for (const side of [-1, 1]) {
				ctx.beginPath();
				ctx.moveTo(x, y);
				ctx.quadraticCurveTo(x + side * length * 0.6, y - 8, x + side * length, y - 26);
				ctx.stroke();
			}
		}
		caption(ctx, w, h, name);
	};

/** A flowering spray: arching stems with five-petalled blooms. */
export const spray =
	(name: string, petal: string): Painter =>
	(ctx, w, h) => {
		ctx.lineWidth = 2;
		const stems = [
			[w * 0.5, h * 0.84, w * 0.3, h * 0.22],
			[w * 0.5, h * 0.84, w * 0.72, h * 0.3],
			[w * 0.5, h * 0.84, w * 0.5, h * 0.14],
		];
		for (const [x0, y0, x1, y1] of stems) {
			ctx.strokeStyle = INK;
			ctx.beginPath();
			ctx.moveTo(x0, y0);
			ctx.quadraticCurveTo((x0 + x1) / 2 + 30, (y0 + y1) / 2, x1, y1);
			ctx.stroke();
			for (const t of [0.35, 0.6, 1]) {
				const x = x0 + (x1 - x0) * t;
				const y = y0 + (y1 - y0) * t;
				ctx.fillStyle = petal;
				for (let p = 0; p < 5; p++) {
					const a = (p / 5) * Math.PI * 2;
					ctx.beginPath();
					ctx.ellipse(x + Math.cos(a) * 11, y + Math.sin(a) * 11, 10, 6, a, 0, Math.PI * 2);
					ctx.fill();
				}
				ctx.fillStyle = 'rgba(180, 140, 60, 0.8)';
				ctx.beginPath();
				ctx.arc(x, y, 4, 0, Math.PI * 2);
				ctx.fill();
				ctx.fillStyle = 'rgba(70, 80, 40, 0.55)';
				for (const side of [-1, 1]) {
					ctx.beginPath();
					ctx.ellipse(x + side * 22, y + 26, 16, 6, side * 0.6, 0, Math.PI * 2);
					ctx.fill();
				}
			}
		}
		caption(ctx, w, h, name);
	};

/** A single broad leaf: outline with midrib and paired veins. `lobes` scallops the edge. */
export const leaf =
	(name: string, lobes: number): Painter =>
	(ctx, w, h) => {
		const cx = w / 2;
		const top = h * 0.14;
		const bottom = h * 0.78;
		const half = w * 0.28;
		ctx.fillStyle = 'rgba(90, 100, 50, 0.22)';
		ctx.strokeStyle = INK;
		ctx.lineWidth = 2;
		ctx.beginPath();
		for (let i = 0; i <= 60; i++) {
			const t = i / 60;
			const y = top + (bottom - top) * t;
			const scallop = lobes ? 1 + 0.18 * Math.sin(t * Math.PI * lobes * 2) : 1;
			const x = cx - Math.sin(Math.PI * t) * half * scallop;
			if (i === 0) ctx.moveTo(x, y);
			else ctx.lineTo(x, y);
		}
		for (let i = 60; i >= 0; i--) {
			const t = i / 60;
			const y = top + (bottom - top) * t;
			const scallop = lobes ? 1 + 0.18 * Math.sin(t * Math.PI * lobes * 2) : 1;
			ctx.lineTo(cx + Math.sin(Math.PI * t) * half * scallop, y);
		}
		ctx.fill();
		ctx.stroke();
		ctx.beginPath();
		ctx.moveTo(cx, top);
		ctx.lineTo(cx, h * 0.86);
		for (let i = 1; i < 8; i++) {
			const y = top + ((bottom - top) * i) / 8;
			const reach = Math.sin((Math.PI * i) / 8) * half * 0.8;
			for (const side of [-1, 1]) {
				ctx.moveTo(cx, y + 18);
				ctx.quadraticCurveTo(cx + side * reach * 0.5, y + 6, cx + side * reach, y - 8);
			}
		}
		ctx.stroke();
		caption(ctx, w, h, name);
	};

/** Latin name set small and italic under the plate. */
function caption(ctx: CanvasRenderingContext2D, w: number, h: number, text: string) {
	ctx.fillStyle = 'rgba(60, 45, 30, 0.8)';
	ctx.font = `italic ${Math.round(w * 0.075)}px "EB Garamond"`;
	ctx.textAlign = 'center';
	ctx.fillText(text, w / 2, h - h * 0.05);
}
