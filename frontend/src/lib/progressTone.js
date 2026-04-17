const toneScale = [
  {
    max: 25,
    text: 'text-rose-600 dark:text-rose-300',
    solid: 'bg-rose-500',
  },
  {
    max: 50,
    text: 'text-amber-600 dark:text-amber-300',
    solid: 'bg-amber-500',
  },
  {
    max: 75,
    text: 'text-emerald-600 dark:text-emerald-300',
    solid: 'bg-emerald-500',
  },
  {
    max: 100,
    text: 'text-blue-600 dark:text-blue-300',
    solid: 'bg-blue-500',
  },
];

export function getPercentTone(percent) {
  const safePercent = Number.isFinite(percent) ? percent : 0;
  return toneScale.find((tone) => safePercent <= tone.max) || toneScale[toneScale.length - 1];
}
