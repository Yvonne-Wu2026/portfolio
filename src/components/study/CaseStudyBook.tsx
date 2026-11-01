import { useMemo, useRef } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useCursor } from '@react-three/drei';
import { Euler, MeshStandardMaterial, Quaternion, Vector3, type Group, type PointLight } from 'three';
import type { ShelfBook } from '../../data/library';
import { openBook } from './actions';
import { useMaterials } from './materials';
import { SceneLabel } from './SceneLabel';
import { setHovered, useStudy } from './store';
import { coverTexture, spineTexture, titlePageTexture } from './textures';

/** Where an opened book is held up for reading, and how it faces the camera. */
export const READING = {
	camera: new Vector3(0.55, 1.45, 0.3),
	target: new Vector3(0.95, 1.4, -0.6),
	/** World-space centre of the open spread, held up in front of the bookcase. */
	center: new Vector3(0.8, 1.42, -0.27),
	/** Turn the front board toward the camera, which sits a little to the left. */
	yaw: -Math.PI / 2 - 0.42,
};

const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

interface Props {
	book: ShelfBook;
	/** Bottom of the spine, at the shelf's front edge. */
	position: [number, number, number];
}

/**
 * One case study, as a cloth-bound book standing spine-out. Hovering tips it
 * toward the visitor; selecting it slides it out, brings it up to the camera
 * and opens the front board on its title page.
 */
export function CaseStudyBook({ book, position }: Props) {
	const [height, thickness, depth] = book.size;
	const { paper, pageEdge } = useMaterials();
	const target = `book:${book.slug}` as const;
	const hovered = useStudy((s) => s.hovered === target);
	const active = useStudy((s) => s.activeBook === book.slug);
	const reducedMotion = useStudy((s) => s.reducedMotion);
	useCursor(hovered);

	const rig = useRef<Group>(null);
	const cover = useRef<Group>(null);
	const light = useRef<PointLight>(null);
	const started = useRef<number | null>(null);

	const materials = useMemo(() => {
		const cloth = new MeshStandardMaterial({ color: book.cloth, roughness: 0.78 });
		return {
			cloth,
			spine: [cloth, cloth, cloth, cloth, new MeshStandardMaterial({ map: spineTexture(book), roughness: 0.7 }), cloth],
			cover: [
				new MeshStandardMaterial({ map: coverTexture(book), roughness: 0.72 }),
				paper,
				cloth,
				cloth,
				cloth,
				cloth,
			],
			block: [
				new MeshStandardMaterial({ map: titlePageTexture(book), roughness: 0.9 }),
				paper,
				pageEdge,
				pageEdge,
				paper,
				pageEdge,
			],
		};
	}, [book, paper, pageEdge]);

	// Poses: resting on the shelf, and held up open in front of the camera.
	const poses = useMemo(() => {
		const rest = new Vector3(...position);
		const restQuat = new Quaternion();
		const presented = new Quaternion().setFromEuler(new Euler(0.06, READING.yaw, 0));
		// The rig's origin is the foot of the spine; offset it so the spread lands centred.
		const centreOffset = new Vector3(thickness / 2, height / 2, -depth * 0.05).applyQuaternion(presented);
		const presentedPos = READING.center.clone().sub(centreOffset);
		return { rest, restQuat, presented, presentedPos };
	}, [position, height, thickness, depth]);

	const scratch = useMemo(() => ({ pos: new Vector3(), quat: new Quaternion(), tilt: new Quaternion(), axis: new Vector3(1, 0, 0) }), []);
	// The presented pose is in world space; the book lives in the shelf's frame.
	const local = useRef<{ pos: Vector3; quat: Quaternion } | null>(null);
	const hover = useRef(0);

	useFrame((state, delta) => {
		if (!rig.current || !cover.current) return;
		if (!active) {
			started.current = null;
			// Ease toward resting, or tipped out under the hand.
			hover.current += ((hovered ? 1 : 0) - hover.current) * (1 - Math.exp(-delta * 10));
			const h = hover.current;
			rig.current.position.set(poses.rest.x, poses.rest.y + 0.006 * h, poses.rest.z + 0.04 * h);
			rig.current.quaternion.setFromAxisAngle(scratch.axis, 0.13 * h);
			cover.current.rotation.y = 0;
			if (light.current) light.current.intensity = 0;
			return;
		}

		if (started.current === null) started.current = state.clock.elapsedTime;
		const parent = rig.current.parent;
		if (!local.current && parent) {
			parent.updateWorldMatrix(true, false);
			const parentQuat = parent.getWorldQuaternion(new Quaternion());
			local.current = {
				pos: parent.worldToLocal(poses.presentedPos.clone()),
				quat: parentQuat.invert().multiply(poses.presented),
			};
		}
		const presentedPos = local.current?.pos ?? poses.presentedPos;
		const presentedQuat = local.current?.quat ?? poses.presented;
		const t = reducedMotion ? 10 : state.clock.elapsedTime - started.current;

		// 1. Slide out of the shelf.
		const slide = easeOut(clamp01(t / 0.6));
		const out = scratch.pos.set(poses.rest.x, poses.rest.y + 0.012 * slide, poses.rest.z + 0.26 * slide);
		// 2. Lift across to the reader, turning the cover to face them.
		const travel = easeInOut(clamp01((t - 0.45) / 1.1));
		rig.current.position.lerpVectors(out, presentedPos, travel);
		rig.current.position.y += Math.sin(travel * Math.PI) * 0.06;
		scratch.tilt.setFromAxisAngle(scratch.axis, 0.13 * (1 - slide));
		rig.current.quaternion.copy(scratch.tilt).slerp(presentedQuat, travel);
		// 3. Open the front board.
		const open = easeInOut(clamp01((t - 1.45) / 0.95));
		cover.current.rotation.y = -2.75 * open;
		// A soft reading light that follows the book, so the title page is legible in any preset.
		if (light.current) light.current.intensity = 0.9 * travel;
	});

	const onOver = (event: ThreeEvent<PointerEvent>) => {
		event.stopPropagation();
		setHovered(target);
	};

	return (
		<group>
			<group
				ref={rig}
				position={position}
				onPointerOver={onOver}
				onPointerOut={() => setHovered(null)}
				onClick={(event) => {
					event.stopPropagation();
					openBook(book.slug);
				}}
			>
				{/* Contents sit above and behind the rig origin (foot of the spine). */}
				<group position={[0, height / 2, -depth / 2]}>
					<mesh material={materials.block} castShadow receiveShadow>
						<boxGeometry args={[thickness - 0.01, height - 0.012, depth - 0.008]} />
					</mesh>
					<mesh material={materials.spine} position={[0, 0, depth / 2 - 0.002]} castShadow>
						<boxGeometry args={[thickness, height, 0.005]} />
					</mesh>
					{/* Back board */}
					<mesh material={materials.cloth} position={[-thickness / 2 + 0.0025, 0, 0]} castShadow receiveShadow>
						<boxGeometry args={[0.005, height, depth]} />
					</mesh>
					{/* Front board, hinged at the spine */}
					<group ref={cover} position={[thickness / 2 - 0.0025, 0, depth / 2]}>
						<mesh material={materials.cover} position={[0, 0, -depth / 2]} castShadow receiveShadow>
							<boxGeometry args={[0.005, height, depth]} />
						</mesh>
					</group>
				</group>
				<pointLight ref={light} position={[0.5, 0.35, 0.3]} intensity={0} distance={1.6} decay={2} color="#ffd9a8" />
			</group>
			<SceneLabel
				target={target}
				position={[position[0], position[1] + height + 0.05, position[2]]}
				label={book.title}
				description={`Case study: ${book.subtitle}. Opens the book`}
				onActivate={() => openBook(book.slug)}
			/>
		</group>
	);
}
