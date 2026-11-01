import { useLayoutEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Color, InstancedMesh, MeshStandardMaterial, Object3D, type SpotLight } from 'three';
import { shelfBooks } from '../../data/library';
import { CaseStudyBook } from './CaseStudyBook';
import { SHELF } from './layout';
import { useLiveLighting } from './LightRig';
import { useMaterials } from './materials';
import { SceneHint } from './SceneLabel';

/*
 * Everything here is in the bookcase's own frame (see SHELF in layout.ts):
 * x along the wall from the back corner, z = 0 at the wall, shelves facing +z.
 */

const BOARD = 0.026;
const SIDE = 0.035;
const FRONT = SHELF.depth;
const FEATURED_BAY = { x0: SHELF.uprights[0] + SIDE / 2, x1: SHELF.uprights[1] - SIDE / 2 };

/** The case studies stand together, with bookends and the light centred on them. */
const FEATURED_GAP = 0.018;
const FEATURED_WIDTH = shelfBooks.reduce((sum, book) => sum + book.size[1], 0) + FEATURED_GAP * (shelfBooks.length - 1);
const FEATURED = {
	start: FEATURED_BAY.x0 + 0.17,
	get end() {
		return this.start + FEATURED_WIDTH;
	},
	get center() {
		return this.start + FEATURED_WIDTH / 2;
	},
};

/** Muted cloths and leathers for the supporting cast, so the case studies stand out. */
const FILLER_CLOTHS = ['#3a2a20', '#4b3524', '#2f2a1e', '#5a4632', '#3d2422', '#463d2b', '#2c2119', '#5b4a3a', '#4a2a1c', '#2f3324', '#6a5236'];

function seeded(seed: number) {
	let s = seed;
	return () => {
		s = (s * 16807) % 2147483647;
		return (s - 1) / 2147483646;
	};
}

interface Filler {
	x: number;
	y: number;
	height: number;
	thickness: number;
	depth: number;
	/** Rotation about z: a lean for upright books, a quarter turn for lying ones. */
	roll: number;
	yaw: number;
	color: number;
	shade: number;
}

/** Fill one bay of one board: tightly packed books, with the odd stack or lean. */
function fillBay(x0: number, x1: number, y: number, clearance: number, seed: number): Filler[] {
	const rand = seeded(seed);
	const books: Filler[] = [];
	let x = x0 + 0.01;
	// Some bays keep a short horizontal stack at one end, as in a working library.
	const stackAt = rand() < 0.35 ? (rand() < 0.5 ? 'start' : 'end') : null;
	const stackWidth = 0.22;
	const runEnd = stackAt === 'end' ? x1 - stackWidth : x1 - 0.01;
	if (stackAt === 'start') x += stackWidth;
	while (x < runEnd) {
		const thickness = 0.02 + rand() * 0.035;
		if (x + thickness > runEnd) break;
		const height = Math.min(clearance - 0.03, 0.24 + rand() * 0.11);
		books.push({
			x: x + thickness / 2,
			y,
			height,
			thickness,
			depth: 0.17 + rand() * 0.07,
			roll: 0,
			yaw: 0,
			color: Math.floor(rand() * FILLER_CLOTHS.length),
			shade: 0.75 + rand() * 0.4,
		});
		x += thickness + 0.0015;
	}
	// The last book of a short run leans against the upright.
	if (books.length && runEnd - x > 0.04) {
		const last = books[books.length - 1];
		last.roll = -0.12;
		last.x += 0.02;
	}
	if (stackAt) {
		const cx = stackAt === 'start' ? x0 + 0.01 + stackWidth / 2 : x1 - 0.01 - stackWidth / 2;
		let top = y;
		const count = 3 + Math.floor(rand() * 3);
		for (let i = 0; i < count; i++) {
			const thickness = 0.028 + rand() * 0.02;
			books.push({
				x: cx + (rand() - 0.5) * 0.02,
				y: top,
				height: 0.19 + rand() * 0.04,
				thickness,
				depth: 0.16,
				roll: Math.PI / 2,
				yaw: (rand() - 0.5) * 0.2,
				color: Math.floor(rand() * FILLER_CLOTHS.length),
				shade: 0.75 + rand() * 0.4,
			});
			top += thickness;
		}
	}
	return books;
}

/** Every board in every bay, packed — drawn as one instanced mesh. */
function FillerBooks() {
	const mesh = useRef<InstancedMesh>(null);
	const books = useMemo(() => {
		const all: Filler[] = [];
		const boards = SHELF.boards.map((y) => y + BOARD / 2);
		boards.forEach((y, row) => {
			const clearance = (SHELF.boards[row + 1] ?? SHELF.height) - SHELF.boards[row] - BOARD;
			for (let bay = 0; bay < SHELF.uprights.length - 1; bay++) {
				let x0 = SHELF.uprights[bay] + SIDE / 2;
				const x1 = SHELF.uprights[bay + 1] - SIDE / 2;
				let end = x1;
				// The featured board keeps only a few books, beyond the bookends.
				if (row === SHELF.featured) x0 = FEATURED.end + 0.12;
				// Leave room for the plant, the globe up top, and the print
				// propped on the desk-level board (see Room.tsx).
				if (row === 2) x0 += 0.22;
				if (row === boards.length - 1) end -= 0.3;
				if (row === 0) end = 0.45;
				all.push(...fillBay(x0, end, y, Math.min(clearance, 0.42), row * 31 + bay * 7 + 3));
			}
		});
		return all;
	}, []);

	const material = useMemo(() => new MeshStandardMaterial({ roughness: 0.8 }), []);

	useLayoutEffect(() => {
		if (!mesh.current) return;
		const dummy = new Object3D();
		const color = new Color();
		books.forEach((book, i) => {
			const lying = book.roll === Math.PI / 2;
			const lift = lying ? book.thickness / 2 : book.height / 2;
			dummy.position.set(book.x, book.y + lift, FRONT - 0.02 - book.depth / 2);
			dummy.rotation.set(0, book.yaw, book.roll);
			dummy.scale.set(book.thickness, book.height, book.depth);
			dummy.updateMatrix();
			mesh.current!.setMatrixAt(i, dummy.matrix);
			mesh.current!.setColorAt(i, color.set(FILLER_CLOTHS[book.color]).multiplyScalar(book.shade));
		});
		mesh.current.instanceMatrix.needsUpdate = true;
		if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
	}, [books]);

	return (
		<instancedMesh ref={mesh} args={[undefined, material, books.length]} castShadow receiveShadow>
			<boxGeometry args={[1, 1, 1]} />
		</instancedMesh>
	);
}

/** A few curiosities between the books. */
function Curios() {
	const { brass, agedBrass, olive, ceramic } = useMaterials();
	const boards = SHELF.boards.map((y) => y + BOARD / 2);
	return (
		<group>
			{/* Brass bookends either side of the case studies */}
			{[FEATURED.start - 0.04, FEATURED.end + 0.04].map((x, i) => (
				<group key={x} position={[x, boards[SHELF.featured], FRONT - 0.12]}>
					<mesh material={brass} position={[0, 0.004, 0]} castShadow>
						<boxGeometry args={[0.07, 0.008, 0.11]} />
					</mesh>
					<mesh material={brass} position={[i === 0 ? -0.03 : 0.03, 0.08, 0]} castShadow>
						<boxGeometry args={[0.008, 0.16, 0.1]} />
					</mesh>
				</group>
			))}
			{/* Small brass globe on the top board */}
			<group position={[SHELF.length - 0.16, boards[boards.length - 1], FRONT - 0.15]}>
				<mesh material={agedBrass} position={[0, 0.01, 0]} castShadow>
					<cylinderGeometry args={[0.045, 0.055, 0.02, 24]} />
				</mesh>
				<mesh material={agedBrass} position={[0, 0.05, 0]}>
					<cylinderGeometry args={[0.006, 0.006, 0.07, 8]} />
				</mesh>
				<mesh position={[0, 0.15, 0]} rotation={[0, 0, 0.4]} castShadow>
					<sphereGeometry args={[0.075, 32, 20]} />
					<meshStandardMaterial color="#8a7a55" roughness={0.6} />
				</mesh>
				<mesh material={brass} position={[0, 0.15, 0]} rotation={[0, Math.PI / 2, 0.4]}>
					<torusGeometry args={[0.085, 0.003, 8, 48]} />
				</mesh>
			</group>
			{/* A trailing plant in a glazed pot */}
			<group position={[0.13, boards[2], FRONT - 0.14]}>
				<mesh material={ceramic} position={[0, 0.05, 0]} castShadow>
					<cylinderGeometry args={[0.06, 0.045, 0.1, 24]} />
				</mesh>
				{Array.from({ length: 9 }, (_, i) => (
					<mesh
						key={i}
						material={olive}
						position={[Math.cos(i * 1.7) * 0.05, 0.12 + (i % 3) * 0.02, Math.sin(i * 1.7) * 0.04]}
						rotation={[Math.sin(i) * 0.8, i, Math.cos(i) * 0.8]}
						castShadow
					>
						<sphereGeometry args={[0.035, 10, 6]} />
					</mesh>
				))}
			</group>
		</group>
	);
}

/** Brass picture light over the featured bay, warming the two case studies. */
function PictureLight() {
	const { brass } = useMaterials();
	const live = useLiveLighting();
	const spot = useRef<SpotLight>(null);
	const aim = useMemo(() => new Object3D(), []);
	const y = SHELF.boards[SHELF.featured + 1] - 0.02;
	const x = FEATURED.center;
	useFrame(() => {
		if (spot.current) spot.current.intensity = live.shelfLight;
	});
	return (
		<group>
			<mesh material={brass} position={[x, y - 0.015, FRONT - 0.02]} rotation={[0, 0, Math.PI / 2]}>
				<cylinderGeometry args={[0.014, 0.014, 0.34, 20]} />
			</mesh>
			{/* Hood over the bulb, so only a warm sliver shows from below. */}
			<mesh material={brass} position={[x, y - 0.03, FRONT - 0.005]} rotation={[Math.PI / 2, 0, 0]}>
				<cylinderGeometry args={[0.03, 0.03, 0.34, 20, 1, true, Math.PI / 2, Math.PI]} />
			</mesh>
			<primitive object={aim} position={[x, SHELF.boards[SHELF.featured], FRONT - 0.12]} />
			<spotLight
				ref={spot}
				position={[x, y - 0.03, FRONT + 0.02]}
				angle={0.95}
				penumbra={0.9}
				distance={1.2}
				decay={2}
				color="#ffcf8a"
				target={aim}
			/>
		</group>
	);
}

/** Built-in carcass: back, bay uprights, boards from plinth to cornice. */
function Carcass() {
	const { mahogany, walnut } = useMaterials();
	const mid = SHELF.length / 2;
	return (
		<group>
			<mesh material={mahogany} position={[mid, SHELF.height / 2, 0.01]} receiveShadow>
				<boxGeometry args={[SHELF.length, SHELF.height, 0.02]} />
			</mesh>
			{SHELF.uprights.map((x) => (
				<mesh key={x} material={walnut} position={[x, SHELF.height / 2, FRONT / 2]} castShadow receiveShadow>
					<boxGeometry args={[SIDE, SHELF.height, FRONT]} />
				</mesh>
			))}
			{SHELF.boards.map((y) => (
				<mesh key={y} material={walnut} position={[mid, y, FRONT / 2]} castShadow receiveShadow>
					<boxGeometry args={[SHELF.length, BOARD, FRONT - 0.01]} />
				</mesh>
			))}
			{/* Plinth and cornice */}
			<mesh material={mahogany} position={[mid, SHELF.boards[0] / 2, FRONT - 0.01]} receiveShadow>
				<boxGeometry args={[SHELF.length, SHELF.boards[0], 0.02]} />
			</mesh>
			<mesh material={walnut} position={[mid, SHELF.height + 0.05, FRONT / 2 + 0.02]} castShadow>
				<boxGeometry args={[SHELF.length + 0.04, 0.1, FRONT + 0.04]} />
			</mesh>
		</group>
	);
}

export function Bookshelf() {
	const featuredY = SHELF.boards[SHELF.featured] + BOARD / 2;
	// Case studies stand together between the bookends, spines flush with the board edge.
	const startX = FEATURED.start;
	let x = startX;
	const placed = shelfBooks.map((book) => {
		const [, thickness] = book.size;
		const position: [number, number, number] = [x + thickness / 2, featuredY, FRONT - 0.025];
		x += thickness + FEATURED_GAP;
		return { book, position };
	});

	return (
		<group position={SHELF.placement.position} rotation={[0, SHELF.placement.rotationY, 0]}>
			<Carcass />
			<FillerBooks />
			<Curios />
			<PictureLight />
			{placed.map(({ book, position }) => (
				<CaseStudyBook key={book.slug} book={book} position={position} />
			))}
			<SceneHint hint="shelf" position={[startX + 0.08, featuredY + 0.5, FRONT]} align="right">
				Select a book to explore my work
			</SceneHint>
		</group>
	);
}
