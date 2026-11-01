/** Room dimensions in metres. The visitor sits at +z looking toward the window at -z. */

export const ROOM = {
	left: -2.6,
	/** The corner the desk and bookcase run into. */
	right: 1.75,
	back: -1.25,
	front: 2.6,
	ceiling: 3.15,
	/** Depth of the window reveal cut through the back wall. */
	wallThickness: 0.26,
	/** Height of the walnut panelling below the plaster. */
	wainscot: 0.95,
};

export const WINDOW = {
	/** Centred: the gallery wall to its left, the bookcase to its right. */
	x: 0,
	sill: 1.02,
	width: 1.24,
	/** Height of the straight sides before the arch begins. */
	straight: 1.12,
	get radius() {
		return this.width / 2;
	},
	get top() {
		return this.sill + this.straight + this.radius;
	},
};

/** A long top pushed against the back wall, running from under the window into the corner. */
export const DESK = {
	top: 0.76,
	thickness: 0.05,
	x0: -1.75,
	x1: ROOM.right,
	depth: 0.94,
	get width() {
		return this.x1 - this.x0;
	},
	get x() {
		return (this.x0 + this.x1) / 2;
	},
	/** z of the desk's centre: its back edge meets the wall. */
	get z() {
		return ROOM.back + this.depth / 2;
	},
	get front() {
		return ROOM.back + this.depth;
	},
};

/**
 * Built-in bookcase standing on the back of the desk, from the desktop to the
 * ceiling, across the right of the back wall and into the corner. Defined in
 * its own frame: x along the wall, y from the desktop, z = 0 at the wall,
 * shelves facing +z. `placement` puts that frame in the room.
 */
export const SHELF = {
	length: ROOM.right - 0.85,
	depth: 0.3,
	height: ROOM.ceiling - 0.76 - 0.06,
	/** x of the uprights: a single narrow bay, enough for a few books. */
	uprights: [0, 0.9],
	/** y of each shelf board's top surface, from the desktop. */
	boards: [0.02, 0.42, 0.82, 1.22, 1.62, 2.02],
	/** Board holding the case study books: the first above the desk. */
	featured: 1,
	placement: { position: [0.85, 0.76, ROOM.back] as [number, number, number], rotationY: 0 },
	/** World x where the bookcase begins. */
	get x0() {
		return this.placement.position[0];
	},
};

export const LAMP = { x: -0.78, z: -0.66 };

/** `scale` enlarges the stand and book together so the contents read comfortably. */
export const BOOK_STAND = { x: 0, z: -0.68, tilt: 0.52, scale: 1.4 };

/** The sun's direction of travel (into the room), unnormalised. */
export const SUN_DIRECTION: [number, number, number] = [0.4, -0.85, 1];

/** Where the sun is aimed: the open book on the desk. */
export const SUN_TARGET: [number, number, number] = [0, 0.8, -0.7];
