import assert from 'node:assert/strict'

// These are the backgrounds authored by recipe-art, savory-art, and dessert-art.
// Strip them at build time so undiscovered cards preserve each dish's true outline.
const canvas = /<rect\b(?=[^>]*\bwidth="480")(?=[^>]*\bheight="360")[^>]*\/>/g
const tablePatterns = [
  /<path\b[^>]*\bd="M0 319H480M34 0V360"[^>]*\/>/g,
  /<path\b[^>]*\bd="M0 314Q90 285 165 318T329 315T480 311V360H0Z"[^>]*\/>/g,
]
const shadows = [
  /<ellipse\b(?=[^>]*\bcx="251")(?=[^>]*\bcy="274")(?=[^>]*\brx="161")(?=[^>]*\bry="17")[^>]*\/>/g,
  /<ellipse\b[^>]*\bfill="#(?:d5b781|d8c9a4)"[^>]*\/>/g,
]

export function recipeSilhouette(svg) {
  assert.equal(svg.match(canvas)?.length, 1, 'Recipe artwork must have one known canvas')
  let foreground = svg.replace(canvas, '')
  for (const pattern of [...tablePatterns, ...shadows]) foreground = foreground.replace(pattern, '')
  return foreground.replace(/\b(fill|stroke)="(?!none")[^"]+"/g, '$1="#000"')
}
