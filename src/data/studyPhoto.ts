/**
 * The photographed study: one image per lighting preset, all from the same
 * viewpoint, and where each interactive object sits in that frame.
 *
 * Every coordinate is a percentage of the image: [x, y], with 0,0 at the top
 * left. When the photos are replaced, re-measure these (open the homepage
 * with ?calibrate to click points and read their coordinates).
 */

import type { PresetName } from '../components/study/lighting';

type Point = [number, number];
/** [left, top, right, bottom] */
type Box = [number, number, number, number];
/** Page corners in order: top-left, top-right, bottom-right, bottom-left. */
type Quad = [Point, Point, Point, Point];

export const studyPhoto = {
	/** Pixel size of the images; all share it. */
	width: 1671,
	height: 941,
	/**
	 * One photo per lighting preset. A preset without its own photo is graded
	 * from the golden-hour one instead (see photo.css, [data-grade]).
	 */
	images: {
		golden: '/study/study-golden.jpg',
	} as { golden: string } & Partial<Record<PresetName, string>>,

	/** The open book's pages, onto which the contents are printed. */
	pages: {
		left: [
			[38.84, 67.48],
			[50.12, 68.65],
			[50.12, 92.72],
			[36.06, 92.03],
		] as Quad,
		right: [
			[50.27, 68.65],
			[61.4, 67.59],
			[63.97, 92.19],
			[50.27, 92.72],
		] as Quad,
	},

	/** Spines of the case study books on the shelf, by slug. */
	books: {
		pawtrainer: [83.54, 43.9, 85.14, 60.0],
		'watts-the-big-deal': [85.14, 43.9, 87.06, 60.0],
	} as Record<string, Box>,

	lamp: [19.2, 46.8, 33.5, 91.9] as Box,

	/** For the graded presets: where the lamp's light comes from and pools, and the window. */
	lampShade: [27.5, 62.2] as Point,
	lampPool: [36, 85] as Point,
	window: [40, 0, 60, 65] as Box,

	/** The bookcase as a whole, for the Work zoom. */
	shelf: [74, 10, 100, 84] as Box,

	/** What to keep in view when the screen is narrower than the photo. */
	focus: {
		desk: [50, 72] as Point,
		shelf: [86, 52] as Point,
	},
};

export type { Box, Point, Quad };
