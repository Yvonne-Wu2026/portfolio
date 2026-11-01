import { Bloom, DepthOfField, EffectComposer, ToneMapping, Vignette } from '@react-three/postprocessing';
import { ToneMappingMode } from 'postprocessing';
import { useStudy, type View } from './store';

/** Distance from the camera to what stays sharp in each view, in metres. */
const FOCUS: Record<View, number> = {
	desk: 1.9,
	book: 0.65,
	shelf: 1.6,
	reading: 0.62,
};

/** Cinematic finish: shallow focus, a soft bloom on the window and lamp, vignette, and a filmic tone curve. */
export function Effects({ quality }: { quality: 'high' | 'low' }) {
	const view = useStudy((s) => s.view);
	return (
		<EffectComposer multisampling={quality === 'high' ? 4 : 0}>
			{quality === 'high' ? (
				<DepthOfField worldFocusDistance={FOCUS[view]} worldFocusRange={2.8} bokehScale={1.2} resolutionScale={0.5} />
			) : (
				<></>
			)}
			<Bloom mipmapBlur intensity={0.45} luminanceThreshold={0.82} luminanceSmoothing={0.25} />
			<Vignette offset={0.28} darkness={0.62} />
			<ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
		</EffectComposer>
	);
}
