import { useRef, useState, type RefObject } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { AdaptiveDpr, Environment, Lightformer, PerformanceMonitor } from '@react-three/drei';
import { Color } from 'three';
import { ArchedWindow } from './ArchedWindow';
import { Bookshelf } from './Bookshelf';
import { Desk } from './Desk';
import { DeskLamp } from './DeskLamp';
import { DeskProps } from './DeskProps';
import { Effects } from './Effects';
import { LightRig } from './LightRig';
import { presets } from './lighting';
import { MaterialsProvider } from './materials';
import { OpenNavigationBook } from './OpenNavigationBook';
import { Room } from './Room';
import { SceneCamera } from './SceneCamera';
import { LabelLayer } from './SceneLabel';
import { getState, setHovered, setState } from './store';

export type Quality = 'high' | 'low';

/** Flags the study as ready once a couple of frames have actually drawn. */
function ReadySignal() {
	const frames = useRef(0);
	useFrame(() => {
		frames.current += 1;
		if (frames.current === 3) setState({ ready: true });
	});
	return null;
}

/**
 * Warm reflections for the brass and lacquer: the window as a bright arch,
 * the lamp as a small hot spot, everything else dim wood.
 */
function Reflections() {
	return (
		<Environment resolution={128} frames={1} environmentIntensity={0.45}>
			<color attach="background" args={['#1a0f09']} />
			<Lightformer form="rect" intensity={3} color="#ffcf8a" position={[0, 2, -3]} scale={[1.4, 2.2, 1]} />
			<Lightformer form="circle" intensity={2.4} color="#ffb768" position={[-1.2, 1.4, 0]} scale={0.4} />
			<Lightformer form="rect" intensity={0.6} color="#6b4126" position={[0, 0, 2]} rotation-y={Math.PI} scale={[5, 2, 1]} />
		</Environment>
	);
}

export function StudyScene({
	initialQuality,
	labels,
}: {
	initialQuality: Quality;
	labels: RefObject<HTMLDivElement | null>;
}) {
	const [quality, setQuality] = useState<Quality>(initialQuality);
	return (
		<Canvas
			shadows
			dpr={quality === 'high' ? [1, 2] : [1, 1.25]}
			gl={{ antialias: false, powerPreference: 'high-performance', stencil: false }}
			camera={{ fov: 42, near: 0.05, far: 30, position: [0, 1.7, 1.3] }}
			onCreated={({ scene, gl }) => {
				scene.background = new Color(presets[getState().preset].background);
				// The scene's buttons are DOM siblings of the canvas; the pixels
				// themselves are decoration to assistive tech.
				gl.domElement.setAttribute('aria-hidden', 'true');
			}}
			onPointerMissed={() => setHovered(null)}
		>
			<PerformanceMonitor onDecline={() => setQuality('low')} flipflops={2} />
			<AdaptiveDpr pixelated={false} />
			<LabelLayer.Provider value={labels}>
			<MaterialsProvider>
				<LightRig quality={quality}>
					<Reflections />
					<SceneCamera />
					<Room />
					<ArchedWindow quality={quality} />
					<Desk />
					<DeskProps />
					<OpenNavigationBook />
					<Bookshelf />
					<DeskLamp quality={quality} />
				</LightRig>
			</MaterialsProvider>
			</LabelLayer.Provider>
			<Effects quality={quality} />
			<ReadySignal />
		</Canvas>
	);
}
