/**
 * The study's furniture, as data. Each shelf book is one case study (matched
 * to `caseStudies` by slug), so adding a project means adding a book here.
 * Kept apart from caseStudies.ts so the 3D island doesn't ship case study copy.
 */

export interface ShelfBook {
	slug: string;
	/** Printed up the spine in foil. */
	spine: string;
	/** Printed on the front board and the title page. */
	title: string;
	subtitle: string;
	/** Binding cloth and foil colours. */
	cloth: string;
	foil: string;
	/** Physical size in metres: height, thickness, depth. */
	size: [number, number, number];
}

export const shelfBooks: ShelfBook[] = [
	{
		slug: 'pawtrainer',
		spine: 'PAWTRAINER',
		title: 'PawTrainer',
		subtitle: 'An AI companion for smart dog care',
		cloth: '#56603f',
		foil: '#c9a865',
		size: [0.36, 0.075, 0.26],
	},
	{
		slug: 'watts-the-big-deal',
		spine: 'DATA VISUALIZATION',
		title: 'Watt’s the Big Deal?',
		subtitle: 'Solar energy, made legible',
		cloth: '#6a2c24',
		foil: '#c9a865',
		size: [0.34, 0.07, 0.25],
	},
];

export interface Chapter {
	number: string;
	label: string;
	href: string;
	/** Page number printed in the table of contents. */
	page: number;
}

export const chapters: Chapter[] = [
	{ number: '01', label: 'Home', href: '/', page: 1 },
	{ number: '02', label: 'Work', href: '/work', page: 7 },
	{ number: '03', label: 'About', href: '/about', page: 23 },
	{ number: '04', label: 'Contact', href: '/contact', page: 31 },
];

export const contact = {
	email: 'yvonnewu.designs@gmail.com',
	linkedin: 'https://www.linkedin.com/in/yvonne-wu-54b7a335b/',
	instagram: 'https://www.instagram.com/threepudgybeans/',
};
