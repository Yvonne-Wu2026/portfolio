import { useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { presetOrder, presets, type PresetName } from './lighting';
import { toggleLighting } from './actions';
import { setState, useStudy } from './store';

const icons: Record<PresetName, React.ReactNode> = {
	golden: (
		<svg viewBox="0 0 24 24" aria-hidden="true">
			<circle cx="12" cy="13" r="4" />
			<path d="M12 4v2M4.9 7.9l1.4 1.4M19.1 7.9l-1.4 1.4M3 17h18M6 20h12" />
		</svg>
	),
	evening: (
		<svg viewBox="0 0 24 24" aria-hidden="true">
			<path d="M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5Z" />
		</svg>
	),
	reading: (
		<svg viewBox="0 0 24 24" aria-hidden="true">
			<path d="M12 7c-2-1.6-5-2-8-1.5v12c3-.5 6-.1 8 1.5 2-1.6 5-2 8-1.5v-12c-3-.5-6-.1-8 1.5Zm0 0v12" />
		</svg>
	),
};

/**
 * The lamp's lighting dial: a brass-edged plate with three settings. A radio
 * group, so arrow keys move between settings and the choice is announced.
 */
export function LightingControls() {
	const open = useStudy((s) => s.controlsOpen);
	const preset = useStudy((s) => s.preset);
	const reducedMotion = useStudy((s) => s.reducedMotion);
	const panel = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!open) return;
		panel.current?.querySelector<HTMLInputElement>('input:checked')?.focus();
		const onKey = (event: KeyboardEvent) => {
			if (event.key === 'Escape') toggleLighting(false);
		};
		window.addEventListener('keydown', onKey);
		return () => window.removeEventListener('keydown', onKey);
	}, [open]);

	return (
		<AnimatePresence>
			{open && (
				<motion.div
					ref={panel}
					id="lighting-controls"
					role="dialog"
					aria-label="Lighting"
					className="lighting-plate"
					initial={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 12, rotateX: -12 }}
					animate={{ opacity: 1, y: 0, rotateX: 0 }}
					exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 8 }}
					transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
				>
					<div className="lighting-plate__head">
						<p className="lighting-plate__title">Lighting</p>
						<button type="button" className="lighting-plate__close" onClick={() => toggleLighting(false)} aria-label="Close lighting">
							×
						</button>
					</div>
					<fieldset className="lighting-plate__options">
						<legend className="sr-only">Choose the study's lighting</legend>
						{presetOrder.map((name) => (
							<label key={name} className={`lighting-option${preset === name ? ' is-on' : ''}`}>
								<input
									type="radio"
									name="lighting"
									value={name}
									checked={preset === name}
									onChange={() => setState({ preset: name })}
								/>
								<span className="lighting-option__icon">{icons[name]}</span>
								<span className="lighting-option__text">
									<span className="lighting-option__label">{presets[name].label}</span>
									<span className="lighting-option__desc">{presets[name].description}</span>
								</span>
							</label>
						))}
					</fieldset>
				</motion.div>
			)}
		</AnimatePresence>
	);
}
