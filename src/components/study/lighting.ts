import { Color } from 'three';

export type PresetName = 'golden' | 'evening' | 'reading';

/** Every value the scene eases between when the lighting preset changes. */
export interface LightingPreset {
	label: string;
	description: string;
	sun: { color: string; intensity: number };
	/** Hemisphere fill: warm bounce from above, darker wood below. */
	ambient: { sky: string; ground: string; intensity: number };
	lamp: { color: string; intensity: number; glow: number };
	/** Brass picture light over the featured shelf. */
	shelfLight: number;
	/** Brightness and tint of the view through the window. */
	outside: { tint: string; brightness: number };
	/** Opacity of the sunbeams and dust. */
	shafts: number;
	background: string;
}

export const presets: Record<PresetName, LightingPreset> = {
	golden: {
		label: 'Golden hour',
		description: 'Low sun through the window',
		sun: { color: '#ffb25e', intensity: 4.2 },
		ambient: { sky: '#ffd6a0', ground: '#3b2417', intensity: 1.05 },
		lamp: { color: '#ffb768', intensity: 1.2, glow: 0.6 },
		shelfLight: 4,
		outside: { tint: '#ffd49a', brightness: 1.25 },
		shafts: 1,
		background: '#2a1a10',
	},
	evening: {
		label: 'Evening',
		description: 'Dusk outside, the lamp lit',
		sun: { color: '#e0704a', intensity: 0.5 },
		ambient: { sky: '#6d5560', ground: '#1d120c', intensity: 0.45 },
		lamp: { color: '#ffa04a', intensity: 7.5, glow: 1.6 },
		shelfLight: 5.5,
		outside: { tint: '#8d6a8a', brightness: 0.4 },
		shafts: 0.12,
		background: '#140c08',
	},
	reading: {
		label: 'Reading',
		description: 'Bright, even light on the desk',
		sun: { color: '#ffd9a6', intensity: 2.2 },
		ambient: { sky: '#fff0d6', ground: '#4a3020', intensity: 1.4 },
		lamp: { color: '#ffd8a0', intensity: 6, glow: 1.2 },
		shelfLight: 4.5,
		outside: { tint: '#ffe8c4', brightness: 1.05 },
		shafts: 0.4,
		background: '#2e1e14',
	},
};

export const presetOrder: PresetName[] = ['golden', 'evening', 'reading'];

/** Mutable, eased copy of the active preset that scene objects read each frame. */
export interface LiveLighting {
	sunColor: Color;
	sunIntensity: number;
	skyColor: Color;
	groundColor: Color;
	ambientIntensity: number;
	lampColor: Color;
	lampIntensity: number;
	lampGlow: number;
	shelfLight: number;
	outsideTint: Color;
	outsideBrightness: number;
	shafts: number;
	background: Color;
}

export function liveFrom(preset: LightingPreset): LiveLighting {
	return {
		sunColor: new Color(preset.sun.color),
		sunIntensity: preset.sun.intensity,
		skyColor: new Color(preset.ambient.sky),
		groundColor: new Color(preset.ambient.ground),
		ambientIntensity: preset.ambient.intensity,
		lampColor: new Color(preset.lamp.color),
		lampIntensity: preset.lamp.intensity,
		lampGlow: preset.lamp.glow,
		shelfLight: preset.shelfLight,
		outsideTint: new Color(preset.outside.tint),
		outsideBrightness: preset.outside.brightness,
		shafts: preset.shafts,
		background: new Color(preset.background),
	};
}

const scratch = new Color();

/** Ease `live` toward `target`; `k` is the per-frame blend factor. */
export function easeLighting(live: LiveLighting, target: LightingPreset, k: number) {
	const lerp = (a: number, b: number) => a + (b - a) * k;
	live.sunColor.lerp(scratch.set(target.sun.color), k);
	live.sunIntensity = lerp(live.sunIntensity, target.sun.intensity);
	live.skyColor.lerp(scratch.set(target.ambient.sky), k);
	live.groundColor.lerp(scratch.set(target.ambient.ground), k);
	live.ambientIntensity = lerp(live.ambientIntensity, target.ambient.intensity);
	live.lampColor.lerp(scratch.set(target.lamp.color), k);
	live.lampIntensity = lerp(live.lampIntensity, target.lamp.intensity);
	live.lampGlow = lerp(live.lampGlow, target.lamp.glow);
	live.shelfLight = lerp(live.shelfLight, target.shelfLight);
	live.outsideTint.lerp(scratch.set(target.outside.tint), k);
	live.outsideBrightness = lerp(live.outsideBrightness, target.outside.brightness);
	live.shafts = lerp(live.shafts, target.shafts);
	live.background.lerp(scratch.set(target.background), k);
}
