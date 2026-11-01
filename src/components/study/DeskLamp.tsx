import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useCursor } from '@react-three/drei';
import {
	BackSide,
	CatmullRomCurve3,
	Color,
	MeshPhysicalMaterial,
	MeshStandardMaterial,
	Vector2,
	Vector3,
	type Object3D,
	type PointLight,
	type SpotLight,
} from 'three';
import { toggleLighting } from './actions';
import { DESK, LAMP } from './layout';
import { useLiveLighting } from './LightRig';
import { useMaterials } from './materials';
import { SceneHint, SceneLabel } from './SceneLabel';
import { setHovered, useStudy } from './store';

const SHADE_Y = 0.36;
const SHADE_LENGTH = 0.3;
const SHADE_RADIUS = 0.072;

/**
 * A banker's lamp: turned brass foot, a harp holding an olive cased-glass
 * shade, and a pull chain. Selecting it opens the lighting controls.
 */
export function DeskLamp({ quality }: { quality: 'high' | 'low' }) {
	const { brass } = useMaterials();
	const live = useLiveLighting();
	const hovered = useStudy((s) => s.hovered === 'lamp');
	const open = useStudy((s) => s.controlsOpen);
	useCursor(hovered);

	const spot = useRef<SpotLight>(null);
	const glow = useRef<PointLight>(null);
	const aim = useRef<Object3D>(null);

	const shade = useMemo(
		() => ({
			outer: new MeshPhysicalMaterial({
				color: '#2f4a22',
				roughness: 0.18,
				clearcoat: 1,
				clearcoatRoughness: 0.08,
				emissive: new Color('#3c5a26'),
				emissiveIntensity: 0.2,
			}),
			inner: new MeshStandardMaterial({
				color: '#f5e6c4',
				emissive: new Color('#ffd79a'),
				emissiveIntensity: 1,
				side: BackSide,
				toneMapped: false,
			}),
			bulb: new MeshStandardMaterial({ color: '#fff4dc', emissive: new Color('#ffe2a8'), emissiveIntensity: 3, toneMapped: false }),
		}),
		[],
	);

	const foot = useMemo(
		() => [
			new Vector2(0, 0),
			new Vector2(0.085, 0),
			new Vector2(0.088, 0.008),
			new Vector2(0.08, 0.018),
			new Vector2(0.05, 0.03),
			new Vector2(0.03, 0.05),
			new Vector2(0.014, 0.065),
			new Vector2(0, 0.065),
		],
		[],
	);

	// Stem rising from the foot into the harp that carries the shade.
	const stem = useMemo(
		() =>
			new CatmullRomCurve3([
				new Vector3(0, 0.06, 0),
				new Vector3(0, 0.2, 0),
				new Vector3(0, 0.3, -0.01),
				new Vector3(0, SHADE_Y - 0.02, -0.04),
			]),
		[],
	);
	const harp = useMemo(
		() =>
			new CatmullRomCurve3([
				new Vector3(-SHADE_LENGTH * 0.42, SHADE_Y, -0.04),
				new Vector3(-SHADE_LENGTH * 0.3, SHADE_Y - 0.03, -0.045),
				new Vector3(0, SHADE_Y - 0.025, -0.045),
				new Vector3(SHADE_LENGTH * 0.3, SHADE_Y - 0.03, -0.045),
				new Vector3(SHADE_LENGTH * 0.42, SHADE_Y, -0.04),
			]),
		[],
	);

	const hover = useRef(0);
	useFrame((_, delta) => {
		hover.current += ((hovered || open ? 1 : 0) - hover.current) * (1 - Math.exp(-delta * 8));
		const boost = 1 + hover.current * 0.25;
		if (spot.current) {
			spot.current.color.copy(live.lampColor);
			spot.current.intensity = live.lampIntensity * boost;
		}
		if (glow.current) {
			glow.current.color.copy(live.lampColor);
			glow.current.intensity = live.lampGlow * 0.6 * boost;
		}
		shade.inner.emissiveIntensity = 0.4 + live.lampGlow * 0.9 * boost;
		shade.bulb.emissiveIntensity = 1 + live.lampGlow * 2.5;
		shade.outer.emissiveIntensity = 0.08 + live.lampGlow * 0.12 + hover.current * 0.15;
	});

	const beads = 9;
	return (
		<group position={[LAMP.x, DESK.top, LAMP.z]} rotation={[0, 0.42, 0]}>
			<group
				onPointerOver={(event) => {
					event.stopPropagation();
					setHovered('lamp');
				}}
				onPointerOut={() => setHovered(null)}
				onClick={(event) => {
					event.stopPropagation();
					toggleLighting();
				}}
			>
				<mesh material={brass} castShadow receiveShadow>
					<latheGeometry args={[foot, 48]} />
				</mesh>
				<mesh material={brass} castShadow>
					<tubeGeometry args={[stem, 24, 0.009, 12]} />
				</mesh>
				<mesh material={brass} castShadow>
					<tubeGeometry args={[harp, 24, 0.005, 8]} />
				</mesh>
				{/* The shade: a half cylinder, olive glass outside, opal white within. */}
				<group position={[0, SHADE_Y, 0.02]} rotation={[0, 0, Math.PI / 2]}>
					<mesh material={shade.outer} castShadow>
						<cylinderGeometry args={[SHADE_RADIUS, SHADE_RADIUS, SHADE_LENGTH, 40, 1, true, 0, Math.PI]} />
					</mesh>
					<mesh material={shade.inner}>
						<cylinderGeometry args={[SHADE_RADIUS - 0.002, SHADE_RADIUS - 0.002, SHADE_LENGTH - 0.004, 40, 1, true, 0, Math.PI]} />
					</mesh>
				</group>
				{/* Brass end caps and rim */}
				{[-1, 1].map((side) => (
					<mesh key={side} material={brass} position={[(side * SHADE_LENGTH) / 2, SHADE_Y, 0.02]} rotation={[0, side * Math.PI / 2, 0]}>
						<circleGeometry args={[SHADE_RADIUS + 0.003, 32, 0, Math.PI]} />
					</mesh>
				))}
				<mesh material={shade.bulb} position={[0, SHADE_Y + 0.02, 0.02]} rotation={[0, 0, Math.PI / 2]}>
					<capsuleGeometry args={[0.014, 0.12, 6, 12]} />
				</mesh>
				{/* Pull chain — the switch */}
				{Array.from({ length: beads }, (_, i) => (
					<mesh key={i} material={brass} position={[0.07, SHADE_Y - 0.01 - i * 0.012, 0.075]}>
						<sphereGeometry args={[0.0032, 8, 6]} />
					</mesh>
				))}
				<mesh material={brass} position={[0.07, SHADE_Y - 0.02 - beads * 0.012, 0.075]} castShadow>
					<cylinderGeometry args={[0.006, 0.009, 0.022, 12]} />
				</mesh>
			</group>

			<object3D ref={aim} position={[0.35, -0.02, 0.32]} />
			<spotLight
				ref={spot}
				position={[0, SHADE_Y - 0.01, 0.03]}
				angle={1.05}
				penumbra={0.75}
				distance={2.4}
				decay={2}
				castShadow={quality === 'high'}
				shadow-mapSize={[1024, 1024]}
				shadow-bias={-0.0005}
				shadow-radius={8}
				onUpdate={(light) => {
					if (aim.current) light.target = aim.current;
				}}
			/>
			<pointLight ref={glow} position={[0, SHADE_Y + 0.04, 0.02]} distance={1.4} decay={2} />

			<SceneLabel
				target="lamp"
				position={[0, SHADE_Y + 0.14, 0]}
				label="Lighting"
				description="Change the study's lighting"
				expanded={open}
				controls="lighting-controls"
				onActivate={() => toggleLighting()}
			/>
			<SceneHint hint="lamp" position={[0, SHADE_Y + 0.24, 0]} align="left">
				Adjust the lighting
			</SceneHint>
		</group>
	);
}
