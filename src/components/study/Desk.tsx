import { useMemo } from 'react';
import { RoundedBox } from '@react-three/drei';
import { MeshStandardMaterial } from 'three';
import { BOOK_STAND, DESK } from './layout';
import { useMaterials } from './materials';
import { toTexture } from './textures';

/** Burgundy leather inset with a gilt tooled border. */
function useBlotterMaterial() {
	return useMemo(() => {
		const el = document.createElement('canvas');
		el.width = 1024;
		el.height = 560;
		const ctx = el.getContext('2d')!;
		ctx.fillStyle = '#4a1d1b';
		ctx.fillRect(0, 0, 1024, 560);
		// Grain: tiny lighter flecks.
		for (let i = 0; i < 9000; i++) {
			ctx.fillStyle = `rgba(255, 200, 170, ${Math.random() * 0.04})`;
			ctx.fillRect(Math.random() * 1024, Math.random() * 560, 2, 2);
		}
		const glow = ctx.createRadialGradient(512, 280, 60, 512, 280, 620);
		glow.addColorStop(0, 'rgba(120, 50, 40, 0.25)');
		glow.addColorStop(1, 'rgba(0, 0, 0, 0.3)');
		ctx.fillStyle = glow;
		ctx.fillRect(0, 0, 1024, 560);
		ctx.strokeStyle = 'rgba(205, 168, 102, 0.85)';
		ctx.lineWidth = 4;
		ctx.strokeRect(26, 26, 972, 508);
		ctx.lineWidth = 1.5;
		ctx.setLineDash([6, 7]);
		ctx.strokeRect(40, 40, 944, 480);
		return new MeshStandardMaterial({ map: toTexture(el), roughness: 0.62 });
	}, []);
}

function Drawer({ x, y, width, height }: { x: number; y: number; width: number; height: number }) {
	const { walnut, brass } = useMaterials();
	return (
		<group position={[x, y, DESK.front - 0.01]}>
			<RoundedBox args={[width, height, 0.025]} radius={0.006} smoothness={2} material={walnut} castShadow receiveShadow />
			{/* Bail pull: backplate and handle */}
			<mesh material={brass} position={[0, 0.005, 0.016]}>
				<boxGeometry args={[0.09, 0.03, 0.004]} />
			</mesh>
			<mesh material={brass} position={[0, -0.006, 0.026]} rotation={[0, 0, Math.PI / 2]}>
				<torusGeometry args={[0.024, 0.0035, 8, 20, Math.PI]} />
			</mesh>
		</group>
	);
}

/** A long writing top against the back wall, on a pedestal at each end. */
export function Desk() {
	const { deskTop, mahogany } = useMaterials();
	const blotter = useBlotterMaterial();
	const pedestalWidth = 0.5;
	const pedestalHeight = DESK.top - DESK.thickness;
	const pedestals = [DESK.x0 + pedestalWidth / 2 + 0.03, DESK.x1 - pedestalWidth / 2 - 0.03];
	const apronWidth = DESK.width - pedestalWidth * 2 - 0.08;

	return (
		<group>
			<RoundedBox
				args={[DESK.width, DESK.thickness, DESK.depth]}
				radius={0.012}
				smoothness={3}
				position={[DESK.x, DESK.top - DESK.thickness / 2, DESK.z]}
				material={deskTop}
				castShadow
				receiveShadow
			/>
			{/* Leather blotter under the open book. */}
			<mesh
				material={blotter}
				position={[BOOK_STAND.x, DESK.top + 0.002, DESK.front - 0.38]}
				rotation={[-Math.PI / 2, 0, 0]}
				receiveShadow
			>
				<planeGeometry args={[1.25, 0.66]} />
			</mesh>

			{pedestals.map((x) => (
				<group key={x}>
					<mesh material={mahogany} position={[x, pedestalHeight / 2, DESK.z]} castShadow receiveShadow>
						<boxGeometry args={[pedestalWidth, pedestalHeight, DESK.depth - 0.04]} />
					</mesh>
					{[0.58, 0.36, 0.14].map((y) => (
						<Drawer key={y} x={x} y={y} width={pedestalWidth - 0.05} height={0.19} />
					))}
				</group>
			))}

			{/* Apron between the pedestals, with a long drawer under the book */}
			<mesh material={mahogany} position={[DESK.x, pedestalHeight - 0.06, DESK.z]} castShadow receiveShadow>
				<boxGeometry args={[apronWidth, 0.12, DESK.depth - 0.06]} />
			</mesh>
			<Drawer x={BOOK_STAND.x} y={pedestalHeight - 0.06} width={1.1} height={0.1} />
		</group>
	);
}
