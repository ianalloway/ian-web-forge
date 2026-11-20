export const FALLBACK = "I don't have verified information about that";
export function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[’‘]/g, "'")
    .replace(/[?!.]+$/g, "")
    .trim()
    .replace(/\s+/g, " ");
}
export function answerQuestion(question, library) {
  if (typeof question !== "string" || question.length > 500) return { answer: FALLBACK, sources: [] };
  const q = normalize(question);
  const found = library.answers.find((item) =>
    [item.question, ...item.aliases].some((alias) => normalize(alias) === q),
  );
  return found ? { answer: found.answer, sources: found.sources } : { answer: FALLBACK, sources: [] };
}
