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
	/** Pixel size of the images; all three share it. */
	width: 2400,
	height: 1350,
	images: {
		golden: '/study/study-golden.jpg',
		evening: '/study/study-evening.jpg',
		reading: '/study/study-reading.jpg',
	} satisfies Record<PresetName, string>,

	/** The open book's pages, onto which the contents are printed. */
	pages: {
		left: [
			[38.51, 67.79],
			[50, 68.75],
			[49.95, 93.48],
			[35.99, 92.49],
		] as Quad,
		right: [
			[50, 68.75],
			[61.49, 67.82],
			[63.92, 92.56],
			[49.95, 93.48],
		] as Quad,
	},

	/** Spines of the case study books on the shelf, by slug. */
	books: {
		pawtrainer: [80.9, 41, 83.6, 60.1],
		'watts-the-big-deal': [83.7, 42, 86.9, 60.1],
	} as Record<string, Box>,

	lamp: [17.1, 63.5, 28.8, 92.1] as Box,

	/** The bookcase as a whole, for the Work zoom. */
	shelf: [74, 18, 100, 82] as Box,

	/** What to keep in view when the screen is narrower than the photo. */
	focus: {
		desk: [50, 70] as Point,
		shelf: [84, 52] as Point,
	},
};

export type { Box, Point, Quad };
