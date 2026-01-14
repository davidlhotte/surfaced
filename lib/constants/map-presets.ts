import { MapSizePreset } from '@prisma/client';

export type SizeConfig = {
  width: string;
  height: string;
};

export type MapPresetConfig = {
  desktop: SizeConfig;
  mobile: SizeConfig;
  label: string;
  description: string;
};

export const MAP_SIZE_PRESETS: Record<MapSizePreset, MapPresetConfig> = {
  [MapSizePreset.BANNER]: {
    desktop: { width: '100%', height: '250px' },
    mobile: { width: '100%', height: '200px' },
    label: 'Banner',
    description: 'Wide horizontal strip, great for page headers',
  },
  [MapSizePreset.SQUARE]: {
    desktop: { width: '500px', height: '500px' },
    mobile: { width: '100%', height: '300px' },
    label: 'Square',
    description: 'Equal width and height, perfect for sidebars',
  },
  [MapSizePreset.RECTANGLE]: {
    desktop: { width: '100%', height: '450px' },
    mobile: { width: '100%', height: '300px' },
    label: 'Rectangle',
    description: 'Standard map size, works for most layouts',
  },
  [MapSizePreset.FULL_PAGE]: {
    desktop: { width: '100%', height: '100vh' },
    mobile: { width: '100%', height: '100vh' },
    label: 'Full Page',
    description: 'Takes up the entire viewport height',
  },
};

export function getMapPreset(preset: MapSizePreset): MapPresetConfig {
  return MAP_SIZE_PRESETS[preset];
}

export function getMapStyles(preset: MapSizePreset, isMobile: boolean): SizeConfig {
  const config = MAP_SIZE_PRESETS[preset];
  return isMobile ? config.mobile : config.desktop;
}
