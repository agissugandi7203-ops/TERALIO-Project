import '@testing-library/jest-dom/vitest';

// Di lingkungan jsdom tanpa kartu grafis / GPU fisik:
// Return null untuk webgl / webgl2 agar komponen WebGL (seperti HeroFogScene)
// secara otomatis menggunakan CSS/SVG fallback-nya tanpa crash.
if (typeof HTMLCanvasElement !== 'undefined') {
  const originalGetContext = HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext = function (type, ...args) {
    if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') {
      return null;
    }
    return originalGetContext ? originalGetContext.apply(this, [type, ...args]) : null;
  };
}
