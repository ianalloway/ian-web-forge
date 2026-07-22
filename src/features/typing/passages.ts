export interface Passage {
  id: number;
  text: string;
  source: string;
}

export const PASSAGES: Passage[] = [
  {
    id: 1,
    text: "The best code is no code at all. Every new line you bring into the world has to be debugged, read, understood, and supported.",
    source: "Jeff Atwood",
  },
  {
    id: 2,
    text: "Talk is cheap. Show me the code.",
    source: "Linus Torvalds",
  },
  {
    id: 3,
    text: "Any fool can write code that a computer can understand. Good programmers write code that humans can understand.",
    source: "Martin Fowler",
  },
  {
    id: 4,
    text: "The goal is to turn data into information, and information into insight.",
    source: "Carly Fiorina",
  },
  {
    id: 5,
    text: "Data is a precious thing and will last longer than the systems themselves.",
    source: "Tim Berners-Lee",
  },
  {
    id: 6,
    text: "In God we trust. All others must bring data.",
    source: "W. Edwards Deming",
  },
  {
    id: 7,
    text: "Simplicity is the soul of efficiency. If you can not explain it simply, you do not understand it well enough.",
    source: "Albert Einstein",
  },
  {
    id: 8,
    text: "First, solve the problem. Then, write the code.",
    source: "John Johnson",
  },
  {
    id: 9,
    text: "Programs must be written for people to read, and only incidentally for machines to execute.",
    source: "Harold Abelson",
  },
  {
    id: 10,
    text: "The most dangerous phrase in the language is we have always done it this way.",
    source: "Grace Hopper",
  },
  {
    id: 11,
    text: "Without data, you are just another person with an opinion.",
    source: "W. Edwards Deming",
  },
  {
    id: 12,
    text: "It is not the strongest of the species that survives, nor the most intelligent, but the one most responsive to change.",
    source: "Charles Darwin",
  },
];

export function getRandomPassage(excludeId?: number): Passage {
  const pool = excludeId !== undefined
    ? PASSAGES.filter((p) => p.id !== excludeId)
    : PASSAGES;
  return pool[Math.floor(Math.random() * pool.length)];
}

export function calcWpm(correctChars: number, elapsedMs: number): number {
  if (elapsedMs < 100) return 0;
  const minutes = elapsedMs / 60000;
  return Math.round(correctChars / 5 / minutes);
}

export function calcAccuracy(correct: number, total: number): number {
  if (total === 0) return 100;
  return Math.round((correct / total) * 100);
}
