export function hashSeed(seed: string, salt: string) {
  let hash = 2166136261;
  const value = `${salt}:${seed}`;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function gcd(left: number, right: number) {
  let a = left;
  let b = right;
  while (b !== 0) {
    const remainder = a % b;
    a = b;
    b = remainder;
  }
  return a;
}

export function getPermutationParameters(seed: string, total: number) {
  if (total <= 1) return { multiplier: 1, increment: 0 };
  let multiplier = (hashSeed(seed, 'multiplier') % total) || 1;
  while (gcd(multiplier, total) !== 1) {
    multiplier = (multiplier + 1) % total || 1;
  }
  return { multiplier, increment: hashSeed(seed, 'increment') % total };
}

export function getRandomOffset(
  index: number,
  total: number,
  multiplier: number,
  increment: number
) {
  return Number((BigInt(multiplier) * BigInt(index) + BigInt(increment)) % BigInt(total));
}
