## UI package (Auro Dark Glass)

This folder contains the **design-system primitives** for the “dark glass + violet accent glow” look defined in `design.json`.

### What’s included
- **Theme tokens**: `src/theme/auro-tokens.ts`
- **Themes**: `src/theme/auro-themes.ts`
- **Glass primitives**: `src/components/glass/*`
- **Pill buttons**: `src/components/buttons/*`

### Intended usage
In your Tamagui config (usually `tamagui.config.ts` in the app root), import and merge:
- `auroTokens`
- `auroThemes`

Then use components from `packages/ui/src`:
- `GlassPanel`, `GlassCard`, `GlassPill`
- `PrimaryPillButton`, `SecondaryPillButton`


