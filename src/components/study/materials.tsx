import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react';
import { Color, MeshPhysicalMaterial, MeshStandardMaterial, Vector2 } from 'three';
import { pageEdgeTexture, paperTexture, plasterTexture, woodTextures } from './textures';

function createMaterials() {
	const walnut = woodTextures({ dark: '#2a160b', light: '#6b4126', seed: 4, rings: 7 });
	walnut.map.repeat.set(1.4, 1);
	walnut.bump.repeat.copy(walnut.map.repeat);

	const mahogany = woodTextures({ dark: '#1f0f08', light: '#4e2a18', seed: 9, rings: 12, width: 512, height: 512 });
	const floor = woodTextures({ dark: '#1a0e07', light: '#4a2c19', seed: 15, rings: 16, planks: 6 });
	floor.map.repeat.set(2, 4);
	floor.bump.repeat.copy(floor.map.repeat);

	const plaster = plasterTexture('#7a6150');
	// Extruded wall UVs are in metres: one tile every two metres.
	plaster.repeat.set(0.5, 0.5);

	return {
		/** Polished desk top: a lacquer clearcoat over open-pored walnut. */
		deskTop: new MeshPhysicalMaterial({
			map: walnut.map,
			bumpMap: walnut.bump,
			bumpScale: 0.6,
			roughness: 0.42,
			clearcoat: 0.55,
			clearcoatRoughness: 0.28,
		}),
		walnut: new MeshStandardMaterial({ map: walnut.map, bumpMap: walnut.bump, bumpScale: 0.4, roughness: 0.6 }),
		mahogany: new MeshStandardMaterial({
			map: mahogany.map,
			bumpMap: mahogany.bump,
			bumpScale: 0.4,
			roughness: 0.55,
		}),
		floor: new MeshStandardMaterial({ map: floor.map, bumpMap: floor.bump, bumpScale: 0.8, roughness: 0.48 }),
		plaster: new MeshStandardMaterial({ map: plaster, roughness: 0.95 }),
		ceiling: new MeshStandardMaterial({ color: '#4a3528', roughness: 1 }),
		brass: new MeshStandardMaterial({ color: '#b48a4e', metalness: 1, roughness: 0.32 }),
		agedBrass: new MeshStandardMaterial({ color: '#8a6a3c', metalness: 1, roughness: 0.48 }),
		bronze: new MeshStandardMaterial({ color: '#4a3424', metalness: 0.9, roughness: 0.45 }),
		paper: new MeshStandardMaterial({ map: paperTexture(), roughness: 0.92 }),
		pageEdge: new MeshStandardMaterial({ map: pageEdgeTexture(), roughness: 0.95 }),
		leather: new MeshStandardMaterial({ color: '#3b1d14', roughness: 0.7, normalScale: new Vector2(0.5, 0.5) }),
		ceramic: new MeshPhysicalMaterial({ color: '#e9dfcb', roughness: 0.25, clearcoat: 0.6 }),
		coffee: new MeshStandardMaterial({ color: '#1d0f07', roughness: 0.1 }),
		glass: new MeshPhysicalMaterial({
			color: new Color('#fff6e6'),
			roughness: 0.05,
			transmission: 0.95,
			thickness: 0.01,
			transparent: true,
			opacity: 0.6,
		}),
		ink: new MeshStandardMaterial({ color: '#16100c', roughness: 0.3, metalness: 0.2 }),
		olive: new MeshStandardMaterial({ color: '#4f5631', roughness: 0.8 }),
	};
}

export type StudyMaterials = ReturnType<typeof createMaterials>;

const MaterialsContext = createContext<StudyMaterials | null>(null);

export function MaterialsProvider({ children }: { children: ReactNode }) {
	const materials = useMemo(createMaterials, []);
	useEffect(
		() => () => {
			for (const material of Object.values(materials)) {
				material.map?.dispose();
				material.bumpMap?.dispose();
				material.dispose();
			}
		},
		[materials],
	);
	return <MaterialsContext.Provider value={materials}>{children}</MaterialsContext.Provider>;
}

export function useMaterials() {
	const materials = useContext(MaterialsContext);
	if (!materials) throw new Error('useMaterials must be used inside <MaterialsProvider>');
	return materials;
}
