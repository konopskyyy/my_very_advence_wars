export function pickVariantIndex(
  variantCount: number,
  random: () => number = Math.random,
): number {
  if (variantCount <= 0) {
    return 0;
  }

  return Math.min(variantCount - 1, Math.floor(random() * variantCount));
}
