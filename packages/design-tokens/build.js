#!/usr/bin/env node
// packages/design-tokens/build.js
// Reads tokens.json and writes:
//   dist/web/tokens.css   — CSS custom properties (dark-first, with light theme overrides)
//   dist/mobile/tokens.ts — TypeScript token constants for React Native
//
// Run: node packages/design-tokens/build.js

const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const tokens = JSON.parse(fs.readFileSync(path.join(ROOT, 'tokens.json'), 'utf-8'));

const c = tokens.color;
const sp = tokens.spacing;
const ra = tokens.radius;
const mo = tokens.motion;
const ic = tokens.icon;

// ── Helpers ─────────────────────────────────────────────────

function mkdirp(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function colorBlock(theme) {
  const t = c[theme];
  return `  --surface-0: ${t.surface['0'].value};
  --surface-1: ${t.surface['1'].value};
  --surface-2: ${t.surface['2'].value};
  --surface-3: ${t.surface['3'].value};
  --surface-4: ${t.surface['4'].value};
  --surface-5: ${t.surface['5'].value};
  --text-primary:   ${t.text.primary.value};
  --text-secondary: ${t.text.secondary.value};
  --text-tertiary:  ${t.text.tertiary.value};
  --text-disabled:  ${t.text.disabled.value};
  --accent:         ${t.accent.base.value};
  --accent-hover:   ${t.accent.hover.value};
  --accent-subtle:  ${t.accent.subtle.value};
  --success:        ${t.semantic.success.value};
  --success-subtle: ${t.semantic.successSubtle.value};
  --warning:        ${t.semantic.warning.value};
  --warning-subtle: ${t.semantic.warningSubtle.value};
  --error:          ${t.semantic.error.value};
  --error-subtle:   ${t.semantic.errorSubtle.value};
  --info:           ${t.semantic.info.value};
  --info-subtle:    ${t.semantic.infoSubtle.value};
  --overlay:        ${t.overlay.value};`;
}

// ── 4-A: Generate web/tokens.css ────────────────────────────

const css = `/* Generated from tokens.json — do not edit manually.
   Run: node packages/design-tokens/build.js
   Version: ${tokens.meta.version} — ${tokens.meta.brand} */

:root {
  color-scheme: light dark;

  /* ── Dark-theme color defaults ── */
${colorBlock('dark')}

  /* ── Spacing ── */
  --space-xs:  ${sp.xs.value}px;
  --space-sm:  ${sp.sm.value}px;
  --space-md:  ${sp.md.value}px;
  --space-lg:  ${sp.lg.value}px;
  --space-xl:  ${sp.xl.value}px;
  --space-2xl: ${sp['2xl'].value}px;
  --space-3xl: ${sp['3xl'].value}px;
  --space-4xl: ${sp['4xl'].value}px;

  /* ── Radius ── */
  --radius-sm:   ${ra.sm.value}px;
  --radius-md:   ${ra.md.value}px;
  --radius-lg:   ${ra.lg.value}px;
  --radius-xl:   ${ra.xl.value}px;
  --radius-full: ${ra.full.value}px;

  /* ── Motion ── */
  --duration-fast:   ${mo.duration.fast.value}ms;
  --duration-base:   ${mo.duration.base.value}ms;
  --duration-slow:   ${mo.duration.slow.value}ms;
  --duration-slower: ${mo.duration.slower.value}ms;
  --easing-default:  ${mo.easing.default.value};

  /* ── Icon ── */
  --icon-stroke: ${ic.strokeWidth.value}px;
}

/* Light theme — auto (system preference) */
@media (prefers-color-scheme: light) {
  :root {
    color-scheme: light;
${colorBlock('light')}
  }
}

/* Explicit light — wins over @media when data-theme="light" */
[data-theme="light"] {
  color-scheme: light;
${colorBlock('light')}
}

/* Explicit dark — wins over @media when data-theme="dark" */
[data-theme="dark"] {
  color-scheme: dark;
${colorBlock('dark')}
}
`;

// ── 4-A: Generate mobile/tokens.ts ──────────────────────────

function flatColors(theme) {
  const t = c[theme];
  return `  surface0: '${t.surface['0'].value}',
  surface1: '${t.surface['1'].value}',
  surface2: '${t.surface['2'].value}',
  surface3: '${t.surface['3'].value}',
  surface4: '${t.surface['4'].value}',
  surface5: '${t.surface['5'].value}',
  textPrimary:   '${t.text.primary.value}',
  textSecondary: '${t.text.secondary.value}',
  textTertiary:  '${t.text.tertiary.value}',
  textDisabled:  '${t.text.disabled.value}',
  accentBase:    '${t.accent.base.value}',
  accentHover:   '${t.accent.hover.value}',
  accentSubtle:  '${t.accent.subtle.value}',
  overlay:        '${t.overlay.value}',
  success:        '${t.semantic.success.value}',
  successSubtle:  '${t.semantic.successSubtle.value}',
  warning:        '${t.semantic.warning.value}',
  warningSubtle:  '${t.semantic.warningSubtle.value}',
  error:          '${t.semantic.error.value}',
  errorSubtle:    '${t.semantic.errorSubtle.value}',
  info:           '${t.semantic.info.value}',
  infoSubtle:     '${t.semantic.infoSubtle.value}',`;
}

const ts = `// Generated from tokens.json — do not edit manually.
// Run: node packages/design-tokens/build.js
// Version: ${tokens.meta.version} — ${tokens.meta.brand}

export const lightTokens = {
${flatColors('light')}
} as const;

export const darkTokens = {
${flatColors('dark')}
} as const;

export const spacing = {
  xs:    ${sp.xs.value},
  sm:    ${sp.sm.value},
  md:    ${sp.md.value},
  lg:    ${sp.lg.value},
  xl:    ${sp.xl.value},
  '2xl': ${sp['2xl'].value},
  '3xl': ${sp['3xl'].value},
  '4xl': ${sp['4xl'].value},
} as const;

export const radius = {
  sm:   ${ra.sm.value},
  md:   ${ra.md.value},
  lg:   ${ra.lg.value},
  xl:   ${ra.xl.value},
  full: ${ra.full.value},
} as const;
`;

// ── Write outputs ────────────────────────────────────────────

mkdirp(path.join(ROOT, 'dist', 'web'));
mkdirp(path.join(ROOT, 'dist', 'mobile'));

fs.writeFileSync(path.join(ROOT, 'dist', 'web', 'tokens.css'), css, 'utf-8');
fs.writeFileSync(path.join(ROOT, 'dist', 'mobile', 'tokens.ts'), ts, 'utf-8');

console.log('✓ dist/web/tokens.css');
console.log('✓ dist/mobile/tokens.ts');
