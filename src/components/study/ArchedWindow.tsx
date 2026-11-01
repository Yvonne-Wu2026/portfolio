import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import {
	AdditiveBlending,
	BufferGeometry,
	DoubleSide,
	ExtrudeGeometry,
	Float32BufferAttribute,
	MeshBasicMaterial,
	Path,
	Shape,
	ShaderMaterial,
	Vector2,
	Vector3,
} from 'three';
import { useLiveLighting } from './LightRig';
import { presets } from './lighting';
import { ROOM, SUN_DIRECTION, WINDOW } from './layout';
import { useMaterials } from './materials';
import { outsideTexture } from './textures';
import { useStudy } from './store';

/** Outline of an arched opening, counter-clockwise from the bottom left. */
export function archPoints(inset = 0, segments = 32): Vector2[] {
	const r = WINDOW.radius - inset;
	const left = WINDOW.x - r;
	const right = WINDOW.x + r;
	const bottom = WINDOW.sill + inset;
	const springLine = WINDOW.sill + WINDOW.straight;
	const points = [new Vector2(left, bottom), new Vector2(right, bottom), new Vector2(right, springLine)];
	for (let i = 1; i < segments; i++) {
		const a = (i / segments) * Math.PI;
		points.push(new Vector2(WINDOW.x + Math.cos(a) * r, springLine + Math.sin(a) * r));
	}
	points.push(new Vector2(left, springLine));
	return points;
}

/** The back wall, with the arched opening cut clean through it. */
export function BackWall() {
	const { plaster } = useMaterials();
	const geometry = useMemo(() => {
		const shape = new Shape();
		shape.moveTo(ROOM.left, ROOM.wainscot);
		shape.lineTo(ROOM.right, ROOM.wainscot);
		shape.lineTo(ROOM.right, ROOM.ceiling);
		shape.lineTo(ROOM.left, ROOM.ceiling);
		shape.closePath();
		shape.holes.push(new Path(archPoints()));
		return new ExtrudeGeometry(shape, { depth: ROOM.wallThickness, bevelEnabled: false, curveSegments: 32 });
	}, []);
	return (
		<mesh
			geometry={geometry}
			material={plaster}
			position={[0, 0, ROOM.back - ROOM.wallThickness]}
			castShadow
			receiveShadow
		/>
	);
}

/** Casing, mullions and fanlight bars. Their shadows fall across the desk. */
function Joinery() {
	const { walnut } = useMaterials();
	const casing = useMemo(() => {
		const outer = new Shape(archPoints(-0.07));
		outer.holes.push(new Path(archPoints(0)));
		return new ExtrudeGeometry(outer, { depth: 0.035, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008, bevelSegments: 2 });
	}, []);

	const r = WINDOW.radius;
	const springLine = WINDOW.sill + WINDOW.straight;
	const frameZ = ROOM.back - ROOM.wallThickness * 0.6;
	const bar = 0.028;
	const transoms = [WINDOW.sill + WINDOW.straight * 0.38, springLine];
	const fan = [Math.PI / 4, Math.PI / 2, (Math.PI * 3) / 4];

	return (
		<group>
			<mesh geometry={casing} material={walnut} position={[0, 0, ROOM.back - 0.005]} castShadow receiveShadow />
			{/* Deep sill board */}
			<mesh material={walnut} position={[WINDOW.x, WINDOW.sill - 0.02, ROOM.back - ROOM.wallThickness / 2 + 0.04]} castShadow receiveShadow>
				<boxGeometry args={[WINDOW.width + 0.22, 0.04, ROOM.wallThickness + 0.12]} />
			</mesh>
			<group position={[0, 0, frameZ]}>
				<mesh material={walnut} position={[WINDOW.x, (WINDOW.sill + WINDOW.top) / 2, 0]} castShadow>
					<boxGeometry args={[bar, WINDOW.top - WINDOW.sill, bar]} />
				</mesh>
				{transoms.map((y) => (
					<mesh key={y} material={walnut} position={[WINDOW.x, y, 0]} castShadow>
						<boxGeometry args={[WINDOW.width, bar, bar]} />
					</mesh>
				))}
				{fan.map((a) => (
					<mesh
						key={a}
						material={walnut}
						position={[WINDOW.x + (Math.cos(a) * r) / 2, springLine + (Math.sin(a) * r) / 2, 0]}
						rotation={[0, 0, a]}
						castShadow
					>
						<boxGeometry args={[r, bar * 0.8, bar * 0.8]} />
					</mesh>
				))}
			</group>
		</group>
	);
}

/** The garden outside, softly blurred. Brightness follows the preset. */
function OutsideView() {
	const live = useLiveLighting();
	const material = useMemo(() => new MeshBasicMaterial({ map: outsideTexture(), toneMapped: true }), []);
	useFrame(() => {
		material.color.copy(live.outsideTint).multiplyScalar(live.outsideBrightness);
	});
	return (
		<mesh material={material} position={[WINDOW.x - 0.3, WINDOW.sill + 0.95, ROOM.back - ROOM.wallThickness - 1.4]}>
			<planeGeometry args={[4.4, 4.4]} />
		</mesh>
	);
}

const shaftVertex = /* glsl */ `
	attribute float along;
	varying float vAlong;
	varying vec3 vNormalW;
	varying vec3 vPosW;
	void main() {
		vAlong = along;
		vec4 world = modelMatrix * vec4(position, 1.0);
		vPosW = world.xyz;
		vNormalW = normalize(mat3(modelMatrix) * normal);
		gl_Position = projectionMatrix * viewMatrix * world;
	}
`;

const shaftFragment = /* glsl */ `
	uniform vec3 uColor;
	uniform float uOpacity;
	uniform float uTime;
	varying float vAlong;
	varying vec3 vNormalW;
	varying vec3 vPosW;
	void main() {
		// Guard every pow() and normalize(): one NaN pixel here is enough for
		// the bloom pass to smear black across the whole frame.
		float along = clamp(vAlong, 0.0, 1.0);
		vec3 view = normalize(cameraPosition - vPosW);
		float normalLength = length(vNormalW);
		float facing = normalLength > 1e-4 ? pow(abs(dot(vNormalW / normalLength, view)), 1.6) : 0.0;
		float fade = smoothstep(0.0, 0.06, along) * pow(1.0 - along, 1.8);
		float drift = 0.82 + 0.18 * sin(vPosW.x * 9.0 + vPosW.y * 4.0 + uTime * 0.25);
		gl_FragColor = vec4(max(uColor * uOpacity * facing * fade * drift, 0.0), 1.0);
	}
`;

/**
 * Sunbeams: the window outline swept along the sun's direction into a hollow
 * prism, shaded additively so it brightens what's behind it and fades with
 * distance from the glass.
 */
function LightShafts() {
	const live = useLiveLighting();
	const reduceMotion = useStudy((s) => s.reducedMotion);
	const { geometry, material } = useMemo(() => {
		const outline = archPoints(0.01, 24);
		const direction = new Vector3(...SUN_DIRECTION).normalize();
		const length = 3.4;
		const z = ROOM.back - ROOM.wallThickness * 0.6;
		const positions: number[] = [];
		const along: number[] = [];
		const indices: number[] = [];
		outline.forEach((point, i) => {
			const near = new Vector3(point.x, point.y, z);
			const far = near.clone().addScaledVector(direction, length);
			positions.push(near.x, near.y, near.z, far.x, far.y, far.z);
			along.push(0, 1);
			const next = (i + 1) % outline.length;
			indices.push(i * 2, next * 2, i * 2 + 1, next * 2, next * 2 + 1, i * 2 + 1);
		});
		const geometry = new BufferGeometry();
		geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
		geometry.setAttribute('along', new Float32BufferAttribute(along, 1));
		geometry.setIndex(indices);
		geometry.computeVertexNormals();
		const material = new ShaderMaterial({
			vertexShader: shaftVertex,
			fragmentShader: shaftFragment,
			uniforms: {
				uColor: { value: live.sunColor.clone() },
				uOpacity: { value: 0 },
				uTime: { value: 0 },
			},
			transparent: true,
			depthWrite: false,
			blending: AdditiveBlending,
			side: DoubleSide,
		});
		return { geometry, material };
	}, [live]);

	useFrame((state) => {
		material.uniforms.uColor.value.copy(live.sunColor);
		material.uniforms.uOpacity.value = 0.2 * live.shafts * Math.min(1, live.sunIntensity / 3);
		if (!reduceMotion) material.uniforms.uTime.value = state.clock.elapsedTime;
	});

	return <mesh geometry={geometry} material={material} renderOrder={2} />;
}

function Dust({ count }: { count: number }) {
	const preset = useStudy((s) => s.preset);
	const reduceMotion = useStudy((s) => s.reducedMotion);
	const shafts = presets[preset].shafts;
	if (shafts < 0.2) return null;
	return (
		<Sparkles
			count={count}
			position={[0.2, 1.35, -0.95]}
			scale={[1.0, 0.8, 0.6]}
			size={0.7}
			speed={reduceMotion ? 0 : 0.18}
			noise={0.6}
			opacity={0.35 * shafts}
			color="#ffdba6"
		/>
	);
}

export function ArchedWindow({ quality }: { quality: 'high' | 'low' }) {
	return (
		<group>
			<BackWall />
			<Joinery />
			<OutsideView />
			<LightShafts />
			<Dust count={quality === 'high' ? 40 : 20} />
		</group>
	);
}
