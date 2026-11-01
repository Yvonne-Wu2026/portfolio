import { dismissHint, setState } from './store';

/** Open or close the lamp's lighting dial; using it retires the lamp hint. */
export function toggleLighting(open?: boolean) {
	dismissHint('lamp');
	setState((s) => ({ controlsOpen: open ?? !s.controlsOpen }));
}
