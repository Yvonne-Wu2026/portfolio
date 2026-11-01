export type PresetName = 'golden' | 'evening' | 'reading';

/** A lighting preset as offered on the lamp's dial. */
export interface LightingPreset {
	label: string;
	description: string;
}

export const presets: Record<PresetName, LightingPreset> = {
	golden: { label: 'Golden hour', description: 'Low sun through the window' },
	evening: { label: 'Evening', description: 'Dusk outside, the lamp lit' },
	reading: { label: 'Reading', description: 'Bright, even light on the desk' },
};

export const presetOrder: PresetName[] = ['golden', 'evening', 'reading'];
