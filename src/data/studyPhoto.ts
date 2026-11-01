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
	width: 1672,
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
			[38.73, 67.59],
			[50.24, 68.97],
			[50.24, 91.39],
			[35.89, 91.39],
		] as Quad,
		right: [
			[50.39, 68.97],
			[61.45, 67.75],
			[64.0, 91.39],
			[50.39, 91.66],
		] as Quad,
	},

	/** Spines of the case study books on the shelf, by slug. */
	books: {
		pawtrainer: [83.39, 44.1, 85.17, 60.6],
		'watts-the-big-deal': [85.23, 44.1, 87.36, 60.6],
	} as Record<string, Box>,

	lamp: [16.3, 61.6, 29.4, 91.4] as Box,

	/** For the graded presets: where the lamp's light comes from and pools, and the window. */
	lampShade: [22.5, 65] as Point,
	lampPool: [36, 84] as Point,
	window: [34, 0, 67, 66] as Box,

	/** The bookcase as a whole, for the Work zoom. */
	shelf: [74, 10, 100, 84] as Box,

	/** What to keep in view when the screen is narrower than the photo. */
	focus: {
		desk: [50, 72] as Point,
		shelf: [86, 52] as Point,
	},
};

export type { Box, Point, Quad };
