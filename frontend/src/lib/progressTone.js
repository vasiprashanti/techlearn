export function getPercentTone(percent) {
  const normalized = Math.max(0, Math.min(100, Number(percent) || 0));

  if (normalized < 35) {
    return {
      key: "yellow",
      text: "text-yellow-600 dark:text-yellow-400",
      solid: "bg-yellow-500",
      gradient: "from-yellow-500 to-yellow-400",
      stroke: "stroke-yellow-500",
    };
  }

  if (normalized <= 50) {
    return {
      key: "green",
      text: "text-green-600 dark:text-green-400",
      solid: "bg-green-500",
      gradient: "from-green-500 to-green-400",
      stroke: "stroke-green-500",
    };
  }

  if (normalized <= 75) {
    return {
      key: "teal",
      text: "text-teal-600 dark:text-teal-400",
      solid: "bg-teal-500",
      gradient: "from-teal-500 to-teal-400",
      stroke: "stroke-teal-500",
    };
  }

  return {
    key: "blue",
    text: "text-blue-600 dark:text-blue-400",
    solid: "bg-blue-500",
    gradient: "from-blue-500 to-blue-400",
    stroke: "stroke-blue-500",
  };
}
