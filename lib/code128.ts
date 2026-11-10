/**
 * Code-barres Code 128 (jeu B) en SVG, sans dépendance.
 * Chaque motif = largeurs alternées barre/espace (en modules).
 */
const PATTERNS = [
  "212222", "222122", "222221", "121223", "121322", "131222", "122213", "122312", "132212", "221213",
  "221312", "231212", "112232", "122132", "122231", "113222", "123122", "123221", "223211", "221132",
  "221231", "213212", "223112", "312131", "311222", "321122", "321221", "312212", "322112", "322211",
  "212123", "212321", "232121", "111323", "131123", "131321", "112313", "132113", "132311", "211313",
  "231113", "231311", "112133", "112331", "132131", "113123", "113321", "133121", "313121", "211331",
  "231131", "213113", "213311", "213131", "311123", "311321", "331121", "312113", "312311", "332111",
  "314111", "221411", "431111", "111224", "111422", "121124", "121421", "141122", "141221", "112214",
  "112412", "122114", "122411", "142112", "142211", "241211", "221114", "413111", "241112", "134111",
  "111242", "121142", "121241", "114212", "124112", "124211", "411212", "421112", "421211", "212141",
  "214121", "412121", "111143", "111341", "131141", "114113", "114311", "411113", "411311", "113141",
  "114131", "311141", "411131", "211412", "211214", "211232", "2331112"
];
const START_B = 104;
const STOP = 106;

export function code128Modules(text: string) {
  const values = [...text].map((char) => {
    const code = char.charCodeAt(0) - 32;
    if (code < 0 || code > 94) throw new Error(`Caractère non pris en charge: ${char}`);
    return code;
  });
  const checksum = (START_B + values.reduce((sum, value, index) => sum + value * (index + 1), 0)) % 103;
  return [START_B, ...values, checksum, STOP].map((value) => PATTERNS[value]).join("");
}

/** SVG prêt à imprimer (zones blanches de 10 modules de chaque côté). */
export function code128Svg(text: string, { height = 50, module = 1.6 }: { height?: number; module?: number } = {}) {
  const widths = code128Modules(text).split("").map(Number);
  const quiet = 10;
  const total = widths.reduce((sum, width) => sum + width, 0) + quiet * 2;
  let x = quiet;
  const bars: string[] = [];
  widths.forEach((width, index) => {
    if (index % 2 === 0) bars.push(`<rect x="${x}" y="0" width="${width}" height="${height}"/>`);
    x += width;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${height}" width="${total * module}" height="${height}" preserveAspectRatio="none" shape-rendering="crispEdges">${bars.join("")}</svg>`;
}
