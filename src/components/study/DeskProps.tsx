import { useMemo } from 'react';
import { MeshStandardMaterial, Vector2 } from 'three';
import { DESK } from './layout';
import { useMaterials } from './materials';
import { toTexture } from './textures';

const Y = DESK.top;

/** A cup and saucer, turned on a lathe. */
function CoffeeCup() {
	const { ceramic, coffee } = useMaterials();
	const cup = useMemo(
		() => [
			new Vector2(0.0, 0),
			new Vector2(0.026, 0),
			new Vector2(0.03, 0.006),
			new Vector2(0.04, 0.03),
			new Vector2(0.044, 0.062),
			new Vector2(0.046, 0.072),
			new Vector2(0.042, 0.072),
			new Vector2(0.04, 0.064),
			new Vector2(0.036, 0.03),
			new Vector2(0.0, 0.012),
		],
		[],
	);
	const saucer = useMemo(
		() => [
			new Vector2(0, 0),
			new Vector2(0.05, 0),
			new Vector2(0.075, 0.008),
			new Vector2(0.078, 0.014),
			new Vector2(0.072, 0.012),
			new Vector2(0.03, 0.006),
			new Vector2(0, 0.006),
		],
		[],
	);
	return (
		<group position={[0.62, Y, -0.42]}>
			<mesh material={ceramic} castShadow receiveShadow>
				<latheGeometry args={[saucer, 40]} />
			</mesh>
			<group position={[0, 0.008, 0]}>
				<mesh material={ceramic} castShadow receiveShadow>
					<latheGeometry args={[cup, 40]} />
				</mesh>
				<mesh material={coffee} position={[0, 0.058, 0]} rotation={[-Math.PI / 2, 0, 0]}>
					<circleGeometry args={[0.041, 32]} />
				</mesh>
				<mesh material={ceramic} position={[0.05, 0.04, 0]} castShadow>
					<torusGeometry args={[0.016, 0.0045, 10, 24]} />
				</mesh>
			</group>
		</group>
	);
}

function FountainPen() {
	const { ink, brass } = useMaterials();
	return (
		<group position={[0.48, Y + 0.0065, -0.62]} rotation={[0, -0.5, Math.PI / 2]}>
			<mesh material={ink} castShadow>
				<cylinderGeometry args={[0.0065, 0.0055, 0.13, 20]} />
			</mesh>
			<mesh material={brass} position={[0, 0.03, 0]}>
				<cylinderGeometry args={[0.0068, 0.0068, 0.006, 20]} />
			</mesh>
			<mesh material={brass} position={[0, -0.075, 0]} rotation={[Math.PI, 0, 0]}>
				<coneGeometry args={[0.0045, 0.02, 16]} />
			</mesh>
			{/* Clip */}
			<mesh material={brass} position={[0.007, 0.045, 0]}>
				<boxGeometry args={[0.0015, 0.04, 0.003]} />
			</mesh>
		</group>
	);
}

/** A loose stack of papers, the top sheet a handwritten draft. */
function Papers() {
	const { paper } = useMaterials();
	const draft = useMemo(() => {
		const el = document.createElement('canvas');
		el.width = 420;
		el.height = 560;
		const ctx = el.getContext('2d')!;
		ctx.fillStyle = '#f0e6cf';
		ctx.fillRect(0, 0, 420, 560);
		ctx.strokeStyle = 'rgba(40, 30, 60, 0.6)';
		ctx.lineWidth = 2;
		ctx.lineCap = 'round';
		// Handwriting rendered as wavering scribble lines.
		for (let row = 0; row < 16; row++) {
			const y = 70 + row * 28;
			let x = 40;
			const end = row % 5 === 4 ? 220 : 370 - Math.random() * 40;
			ctx.beginPath();
			ctx.moveTo(x, y);
			while (x < end) {
				x += 4;
				ctx.lineTo(x, y + Math.sin(x * 0.45) * 3 + Math.sin(x * 0.11) * 1.5);
				if (Math.random() < 0.05) {
					x += 10;
					ctx.moveTo(x, y);
				}
			}
			ctx.stroke();
		}
		// A boxed wireframe sketch in the corner.
		ctx.strokeStyle = 'rgba(40, 30, 60, 0.5)';
		ctx.strokeRect(250, 420, 120, 100);
		ctx.strokeRect(262, 432, 96, 22);
		ctx.strokeRect(262, 464, 44, 44);
		return new MeshStandardMaterial({ map: toTexture(el), roughness: 0.9 });
	}, []);
	const sheets = [
		{ r: 0.14, x: 0, z: 0 },
		{ r: -0.05, x: 0.015, z: -0.01 },
		{ r: 0.32, x: -0.01, z: 0.012 },
	];
	return (
		<group position={[0.98, Y, -0.6]}>
			{sheets.map((sheet, i) => (
				<mesh
					key={i}
					material={i === sheets.length - 1 ? draft : paper}
					position={[sheet.x, 0.0015 + i * 0.0018, sheet.z]}
					rotation={[-Math.PI / 2, 0, sheet.r]}
					receiveShadow
					castShadow
				>
					<planeGeometry args={[0.21, 0.28]} />
				</mesh>
			))}
		</group>
	);
}

/** A short stack of bound volumes at the corner end of the desk. */
function BookStack() {
	const { pageEdge } = useMaterials();
	const volumes = [
		{ color: '#e4d8bc', w: 0.3, d: 0.22, h: 0.045, r: 0.05 },
		{ color: '#3f4a2c', w: 0.27, d: 0.2, h: 0.04, r: -0.08 },
		{ color: '#e9dfc8', w: 0.26, d: 0.19, h: 0.035, r: 0.12 },
		{ color: '#5e2427', w: 0.22, d: 0.16, h: 0.03, r: -0.02 },
	];
	const cloths = useMemo(() => volumes.map((v) => new MeshStandardMaterial({ color: v.color, roughness: 0.75 })), []);
	let y = Y;
	return (
		<group position={[1.3, 0, -0.62]}>
			{volumes.map((v, i) => {
				const top = y;
				y += v.h;
				const cloth = cloths[i];
				return (
					<mesh
						key={i}
						position={[0, top + v.h / 2, 0]}
						rotation={[0, v.r, 0]}
						material={[pageEdge, cloth, cloth, cloth, pageEdge, pageEdge]}
						castShadow
						receiveShadow
					>
						<boxGeometry args={[v.w, v.h, v.d]} />
					</mesh>
				);
			})}
		</group>
	);
}

export function DeskProps() {
	return (
		<group>
			<CoffeeCup />
			<FountainPen />
			<Papers />
			<BookStack />
		</group>
	);
}
