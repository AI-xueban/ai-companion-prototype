export const APP_CONFIG = {
  name: 'AI伴学V2.0',
  shortName: 'AI伴学',
  version: '2.0.0',
  tablet: {
    stageWidth: 2400,
    stageHeight: 1600,
    designWidth: 768,
  },
  features: {
    demoControls: import.meta.env.DEV || import.meta.env.VITE_ENABLE_DEMO_CONTROLS === 'true',
  },
} as const;

export const TABLET_DESIGN_HEIGHT = Math.round(
  (APP_CONFIG.tablet.stageHeight / APP_CONFIG.tablet.stageWidth) * APP_CONFIG.tablet.designWidth,
);

export const TABLET_DESIGN_SCALE = APP_CONFIG.tablet.stageWidth / APP_CONFIG.tablet.designWidth;
