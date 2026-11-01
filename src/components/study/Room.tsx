import { useMemo } from 'react';
import { MeshStandardMaterial } from 'three';
import { GalleryWall } from './GalleryWall';
import { DESK, ROOM, SHELF } from './layout';
import { spray, type Painter } from './prints';
import { useMaterials } from './materials';
import { toTexture } from './textures';

/** Raised walnut panels along a stretch of wall, capped by a chair rail. */
function Wainscot({ from, to, z }: { from: number; to: number; z: number }) {
	const { walnut, mahogany } = useMaterials();
	const width = to - from;
	const count = Math.max(1, Math.round(width / 0.55));
	const panelWidth = width / count;
	return (
		<group position={[0, 0, z]}>
			<mesh material={mahogany} position={[from + width / 2, ROOM.wainscot / 2, -0.03]} receiveShadow castShadow>
				<boxGeometry args={[width, ROOM.wainscot, 0.06]} />
			</mesh>
			{Array.from({ length: count }, (_, i) => (
				<mesh
					key={i}
					material={walnut}
					position={[from + panelWidth * (i + 0.5), ROOM.wainscot * 0.53, 0.008]}
					receiveShadow
				>
					<boxGeometry args={[panelWidth - 0.12, ROOM.wainscot - 0.32, 0.016]} />
				</mesh>
			))}
			{/* Chair rail and skirting */}
			<mesh material={walnut} position={[from + width / 2, ROOM.wainscot, 0.015]} castShadow receiveShadow>
				<boxGeometry args={[width, 0.05, 0.05]} />
			</mesh>
			<mesh material={mahogany} position={[from + width / 2, 0.07, 0.01]} receiveShadow>
				<boxGeometry args={[width, 0.14, 0.04]} />
			</mesh>
		</group>
	);
}

/** An engraving in a gilt frame. `size` is the frame in metres. */
function FramedPrint({
	position,
	size,
	paint,
	lean = 0,
}: {
	position: [number, number, number];
	size: [number, number];
	paint: Painter;
	/** Tilt back from upright, for a print propped on a shelf. */
	lean?: number;
}) {
	const { agedBrass } = useMaterials();
	const material = useMemo(() => {
		const el = document.createElement('canvas');
		el.width = 400;
		el.height = Math.round((400 * size[1]) / size[0]);
		const ctx = el.getContext('2d')!;
		ctx.fillStyle = '#e8dcc0';
		ctx.fillRect(0, 0, el.width, el.height);
		paint(ctx, el.width, el.height);
		return new MeshStandardMaterial({ map: toTexture(el), roughness: 0.9 });
	}, [paint, size]);
	return (
		<group position={position} rotation={[lean, 0, 0]}>
			<mesh material={agedBrass} castShadow>
				<boxGeometry args={[size[0], size[1], 0.03]} />
			</mesh>
			<mesh material={material} position={[0, 0, 0.016]}>
				<planeGeometry args={[size[0] - 0.08, size[1] - 0.08]} />
			</mesh>
		</group>
	);
}

/** A small print propped on the bookcase's desk-level shelf. */
function ProppedPrint() {
	const shelfTop = DESK.top + SHELF.boards[0] + 0.013;
	return (
		<FramedPrint
			position={[SHELF.x0 + 0.66, shelfTop + 0.15, ROOM.back + 0.13]}
			size={[0.24, 0.3]}
			paint={spray('Rosa canina', 'rgba(150, 60, 50, 0.55)')}
			lean={-0.12}
		/>
	);
}

export function Room() {
	const { floor, plaster, ceiling, mahogany } = useMaterials();
	const depth = ROOM.front - ROOM.back;
	const width = ROOM.right - ROOM.left;
	const midZ = (ROOM.front + ROOM.back) / 2;
	const midX = (ROOM.left + ROOM.right) / 2;

	return (
		<group>
			<mesh material={floor} rotation={[-Math.PI / 2, 0, 0]} position={[midX, 0, midZ]} receiveShadow>
				<planeGeometry args={[width, depth]} />
			</mesh>
			<mesh material={ceiling} rotation={[Math.PI / 2, 0, 0]} position={[midX, ROOM.ceiling, midZ]}>
				<planeGeometry args={[width, depth]} />
			</mesh>
			{/* Side walls */}
			<mesh material={plaster} rotation={[0, Math.PI / 2, 0]} position={[ROOM.left, ROOM.ceiling / 2, midZ]} receiveShadow>
				<planeGeometry args={[depth, ROOM.ceiling]} />
			</mesh>
			<mesh material={plaster} rotation={[0, -Math.PI / 2, 0]} position={[ROOM.right, ROOM.ceiling / 2, midZ]} receiveShadow>
				<planeGeometry args={[depth, ROOM.ceiling]} />
			</mesh>
			{/* Crown moulding along the back wall */}
			<mesh material={mahogany} position={[midX, ROOM.ceiling - 0.06, ROOM.back + 0.04]} castShadow>
				<boxGeometry args={[width, 0.12, 0.08]} />
			</mesh>
			{/* Panelling below the window, stopping at the built-in shelf. Its
			    back face closes the wall under the window so no sun leaks. */}
			<Wainscot from={ROOM.left} to={SHELF.x0} z={ROOM.back} />
			<mesh material={mahogany} position={[midX, ROOM.wainscot / 2, ROOM.back - ROOM.wallThickness / 2]} castShadow>
				<boxGeometry args={[width, ROOM.wainscot, ROOM.wallThickness]} />
			</mesh>
			<GalleryWall />
			<ProppedPrint />
		</group>
	);
}
