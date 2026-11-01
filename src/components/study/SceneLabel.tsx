import { createContext, useContext, type RefObject } from 'react';
import { Html } from '@react-three/drei';
import { setHovered, useStudy, type Hint, type Target } from './store';

/**
 * A DOM layer outside the canvas for the labels. drei's default puts them
 * inside the canvas wrapper React owns, which breaks when the canvas unmounts.
 */
export const LabelLayer = createContext<RefObject<HTMLDivElement | null> | null>(null);

function useLayer() {
	return useContext(LabelLayer) as RefObject<HTMLElement> | undefined;
}

interface LabelProps {
	target: Target;
	position: [number, number, number];
	label: string;
	/** Read to assistive tech in addition to the label. */
	description?: string;
	onActivate: () => void;
	/** Extra state for toggle buttons such as the lamp. */
	expanded?: boolean;
	controls?: string;
}

/**
 * A real, focusable button anchored to a scene object. Tabbing to it lights
 * the object up exactly as hovering would; the chip doubles as the visible
 * label for pointer users. Pointer events pass through to the canvas.
 */
export function SceneLabel({ target, position, label, description, onActivate, expanded, controls }: LabelProps) {
	const active = useStudy((s) => s.hovered === target);
	const busy = useStudy((s) => s.activeBook !== null);
	const layer = useLayer();
	return (
		<Html position={position} center zIndexRange={[30, 20]} style={{ pointerEvents: 'none' }} portal={layer}>
			<button
				type="button"
				className={`scene-label${active ? ' is-active' : ''}`}
				aria-label={description ? `${label}. ${description}` : label}
				aria-expanded={expanded}
				aria-controls={controls}
				disabled={busy}
				onFocus={() => setHovered(target)}
				onBlur={() => setHovered(null)}
				onClick={onActivate}
			>
				{label}
			</button>
		</Html>
	);
}

interface HintProps {
	hint: Hint;
	position: [number, number, number];
	children: string;
	align?: 'left' | 'right' | 'center';
}

/** An understated first-visit cue that fades for good once its object is used. */
export function SceneHint({ hint, position, children, align = 'center' }: HintProps) {
	// Step aside while the object's own label is showing.
	const prefix = { book: 'chapter:', shelf: 'book:', lamp: 'lamp' }[hint];
	const visible = useStudy(
		(s) =>
			s.ready && !s.hintsDismissed[hint] && s.view === 'desk' && !s.activeBook && !s.hovered?.startsWith(prefix),
	);
	const layer = useLayer();
	return (
		<Html position={position} center zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }} portal={layer}>
			<p className={`scene-hint scene-hint--${align}${visible ? ' is-visible' : ''}`} aria-hidden="true">
				<span className="scene-hint__dot" />
				{children}
			</p>
		</Html>
	);
}

