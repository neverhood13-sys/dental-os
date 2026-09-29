export type ToothType = 'incisor' | 'canine' | 'premolar' | 'molar';

export const toothPaths: Record<ToothType, string> = {
  incisor:
    'M10,0 C15,0 20,8 20,26 C20,42 15,52 10,52 C5,52 0,42 0,26 C0,8 5,0 10,0 Z',
  canine:
    'M12,0 C18,0 24,10 24,28 C24,46 18,56 12,56 C6,56 0,46 0,28 C0,10 6,0 12,0 Z',
  premolar:
    'M14,0 C22,0 28,10 28,30 C28,48 22,58 14,58 C6,58 0,48 0,30 C0,10 6,0 14,0 Z',
  molar:
    'M18,0 C28,0 36,12 36,32 C36,52 28,62 18,62 C8,62 0,52 0,32 C0,12 8,0 18,0 Z',
};

// Постоянные зубы (FDI)
export const upperPermanent = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
export const lowerPermanent = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

// Молочные зубы (FDI)
export const upperDeciduous = [55, 54, 53, 52, 51, 61, 62, 63, 64, 65];
export const lowerDeciduous = [85, 84, 83, 82, 81, 71, 72, 73, 74, 75];

export const toothTypeOf = (num: number): ToothType => {
  const last = num % 10;
  if (last <= 2) return 'incisor';
  if (last === 3) return 'canine';
  if (last <= 5) return 'premolar';
  return 'molar';
};