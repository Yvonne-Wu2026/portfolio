import { createContext, useContext, useMemo, useRef, type ReactNode } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import type { DirectionalLight, HemisphereLight, Object3D, PointLight } from 'three';
import { Vector3 } from 'three';
import { easeLighting, liveFrom, presets, type LiveLighting } from './lighting';
import { SUN_DIRECTION, SUN_TARGET } from './layout';
import { getState } from './store';

const LiveContext = createContext<LiveLighting | null>(null);

/** The eased lighting values; read inside useFrame, never during render. */
export function useLiveLighting() {
	const live = useContext(LiveContext);
	if (!live) throw new Error('useLiveLighting must be used inside <LightRig>');
	return live;
}

interface Props {
	quality: 'high' | 'low';
	children: ReactNode;
}

/**
 * Sun through the window plus warm bounce. Owns the eased lighting state the
 * rest of the scene reads, so a preset change crossfades everything together.
 */
export function LightRig({ quality, children }: Props) {
	const live = useMemo(() => liveFrom(presets[getState().preset]), []);
	const sun = useRef<DirectionalLight>(null);
	const hemi = useRef<HemisphereLight>(null);
	const target = useRef<Object3D>(null);
	const bounce = useRef<PointLight>(null);
	const scene = useThree((s) => s.scene);

	const sunPosition = useMemo(() => {
		const direction = new Vector3(...SUN_DIRECTION).normalize();
		// Aim at the desk, from well outside the window.
		return new Vector3(...SUN_TARGET).addScaledVector(direction, -7);
	}, []);

	useFrame((_, delta) => {
		const preset = presets[getState().preset];
		// About 1.2s to settle, independent of frame rate.
		easeLighting(live, preset, 1 - Math.exp(-delta * 3.2));
		if (sun.current) {
			sun.current.color.copy(live.sunColor);
			sun.current.intensity = live.sunIntensity;
		}
		if (hemi.current) {
			hemi.current.color.copy(live.skyColor);
			hemi.current.groundColor.copy(live.groundColor);
			hemi.current.intensity = live.ambientIntensity;
		}
		if (bounce.current) {
			bounce.current.color.copy(live.sunColor);
			bounce.current.intensity = 0.12 * live.sunIntensity + 0.1;
		}
		if (scene.background && 'lerp' in scene.background) scene.background.copy(live.background);
	});

	const mapSize = quality === 'high' ? 2048 : 1024;

	return (
		<LiveContext.Provider value={live}>
			<object3D ref={target} position={SUN_TARGET} />
			<directionalLight
				ref={sun}
				position={sunPosition}
				castShadow
				shadow-mapSize={[mapSize, mapSize]}
				shadow-bias={-0.0004}
				shadow-normalBias={0.02}
				shadow-radius={6}
				shadow-camera-left={-3}
				shadow-camera-right={3}
				shadow-camera-top={3}
				shadow-camera-bottom={-3}
				shadow-camera-near={2}
				shadow-camera-far={14}
				onUpdate={(light) => {
					if (target.current) light.target = target.current;
				}}
			/>
			<hemisphereLight ref={hemi} />
			{/* Bounce off the sunlit desk and floor back up onto the room. */}
			<pointLight ref={bounce} position={[0.3, 1.2, 0.9]} distance={5} decay={2} />
			{children}
		</LiveContext.Provider>
	);
}
