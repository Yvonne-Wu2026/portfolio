import { useEffect, useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera, Vector2, Vector3 } from 'three';
import { READING } from './CaseStudyBook';
import { getState, useStudy, type View } from './store';

interface Shot {
	position: Vector3;
	target: Vector3;
	fov: number;
}

const shot = (p: [number, number, number], t: [number, number, number], fov: number): Shot => ({
	position: new Vector3(...p),
	target: new Vector3(...t),
	fov,
});

/** Framings for wide screens: the whole study, window centred. */
const WIDE: Record<View, Shot> = {
	// Turned a little into the corner, looking down onto the book.
	desk: shot([0, 1.7, 1.3], [0, 1.38, -1.0], 44),
	// Turned to face the side-wall bookcase, square on to the featured bay.
	shelf: shot([0.95, 1.45, 0.35], [1.12, 1.36, -1.25], 46),
	book: shot([0, 1.25, -0.05], [0, 0.9, -0.72], 40),
	reading: { position: READING.camera, target: READING.target, fov: 40 },
};

/**
 * Framings for tall screens. The study is simplified to what fits: the open
 * book under the window, with the shelf a look to the right.
 */
const TALL: Record<View, Shot> = {
	desk: shot([0, 1.5, 0.45], [0, 0.92, -0.75], 64),
	shelf: shot([1.05, 1.42, 0.2], [1.12, 1.35, -1.25], 60),
	book: shot([0, 1.22, -0.1], [0, 0.88, -0.72], 58),
	reading: shot([0.6, 1.45, 0.3], [0.8, 1.42, -0.27], 58),
};

/** Below this aspect ratio, use the tall framings. */
const TALL_BELOW = 0.85;
/** The wide framings are composed for 16:9; keep their horizontal coverage on squarer screens. */
const WIDE_ASPECT = 16 / 9;

export function SceneCamera() {
	const camera = useThree((s) => s.camera) as PerspectiveCamera;
	const size = useThree((s) => s.size);
	const view = useStudy((s) => s.view);
	const reducedMotion = useStudy((s) => s.reducedMotion);
	const pointer = useRef(new Vector2());
	const lookAt = useRef<Vector3 | null>(null);
	const scratch = useMemo(() => ({ position: new Vector3(), target: new Vector3() }), []);

	useEffect(() => {
		const onMove = (event: PointerEvent) => {
			pointer.current.set((event.clientX / window.innerWidth) * 2 - 1, (event.clientY / window.innerHeight) * 2 - 1);
		};
		window.addEventListener('pointermove', onMove);
		return () => window.removeEventListener('pointermove', onMove);
	}, []);

	// The canvas can measure 0×0 on its first frames; treat that as wide.
	const aspect = size.width > 0 && size.height > 0 ? size.width / size.height : WIDE_ASPECT;
	const framing = aspect < TALL_BELOW ? TALL[view] : WIDE[view];
	const fov = useMemo(() => {
		if (aspect < TALL_BELOW || aspect >= WIDE_ASPECT) return framing.fov;
		const halfWide = Math.atan(Math.tan((framing.fov * Math.PI) / 360) * WIDE_ASPECT);
		return Math.min(64, (Math.atan(Math.tan(halfWide) / aspect) * 360) / Math.PI);
	}, [aspect, framing]);

	// Jump straight to the opening shot rather than flying in from the origin.
	useEffect(() => {
		if (lookAt.current) return;
		camera.position.copy(framing.position);
		lookAt.current = framing.target.clone();
		camera.lookAt(lookAt.current);
	}, [camera, framing]);

	useFrame((state, delta) => {
		if (!lookAt.current) return;
		const settling = getState().activeBook ? 2.4 : 2.1;
		const k = reducedMotion ? 1 : 1 - Math.exp(-delta * settling);
		scratch.position.copy(framing.position);
		scratch.target.copy(framing.target);
		if (!reducedMotion && view === 'desk') {
			// A slow breath plus a little parallax under the pointer.
			const t = state.clock.elapsedTime;
			scratch.position.x += pointer.current.x * 0.07 + Math.sin(t * 0.21) * 0.012;
			scratch.position.y += -pointer.current.y * 0.035 + Math.sin(t * 0.17) * 0.008;
		}
		camera.position.lerp(scratch.position, k);
		lookAt.current.lerp(scratch.target, k);
		camera.lookAt(lookAt.current);
		const nextFov = Number.isFinite(camera.fov) ? camera.fov + (fov - camera.fov) * k : fov;
		if (Math.abs(nextFov - camera.fov) > 0.01) {
			camera.fov = nextFov;
			camera.updateProjectionMatrix();
		}
	});

	return null;
}
