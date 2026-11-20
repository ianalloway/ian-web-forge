import { answerQuestion, FALLBACK } from "./ambassador.mjs";
let data;
const node = (tag, text, className) => {
  const n = document.createElement(tag);
  if (text) n.textContent = text;
  if (className) n.className = className;
  return n;
};
function link(text, url) {
  const a = node("a", text);
  a.href = url;
  if (url.startsWith("https:")) {
    a.target = "_blank";
    a.rel = "noopener noreferrer";
  }
  return a;
}
function render(library) {
  for (const p of library.projects) {
    const article = node("article", null, "project");
    article.id = p.id;
    const left = node("div");
    left.append(
      node("p", p.category, "eyebrow"),
      node("h3", p.name),
      node("p", p.headline, "project-headline"),
    );
    const tags = node("div", null, "tags");
    p.stack.forEach((x) => tags.append(node("span", x)));
    left.append(tags);
    const right = node("div", null, "project-detail"),
      dl = node("dl");
    for (const [label, value] of [
      ["PROBLEM", p.problem],
      ["MY WORK", p.action],
      ["OUTCOME", p.result],
    ])
      dl.append(node("dt", label), node("dd", value));
    const links = node("div", null, "project-links");
    links.append(link(p.linkLabel + " ↗", p.url));
    if (p.live) links.append(link("Open product ↗", p.live));
    right.append(dl, node("p", p.limit, "limit"), links);
    article.append(left, right);
    document.querySelector("#projects").append(article);
  }
  for (const s of library.sources)
    document.querySelector("#source-links").append(link(s.label + " ↗", s.url));
}
function message(text, role, ids = []) {
  const root = node("div", null, "message " + role);
  root.append(node("span", role === "user" ? "YOU" : "AMBASSADOR", "speaker"), node("p", text));
  if (ids.length) {
    const citations = node("div", null, "citations");
    ids.forEach((id) => {
      const source = data.sources.find((x) => x.id === id);
      if (source) citations.append(link(source.label + " ↗", source.url));
    });
    root.append(citations);
  }
  document.querySelector("#conversation").append(root);
  root.scrollIntoView({ block: "nearest", behavior: "auto" });
}
function ask(q) {
  q = q.trim();
  if (!q) return;
  message(q, "user");
  const result = data ? answerQuestion(q, data) : { answer: FALLBACK, sources: [] };
  message(result.answer, "assistant", result.sources);
  document.querySelector("#question").value = "";
}
document.querySelector("#ask-form").addEventListener("submit", (e) => {
  e.preventDefault();
  ask(document.querySelector("#question").value);
});
document
  .querySelectorAll("[data-question]")
  .forEach((button) => button.addEventListener("click", () => ask(button.dataset.question)));
try {
  const response = await fetch("./sources.json");
  if (!response.ok) throw Error("Source library unavailable");
  data = await response.json();
  render(data);
} catch {
  message(
    "The source library could not be loaded. Please use the downloadable resume or contact Ian directly.",
    "assistant",
  );
  document
    .querySelector("#projects")
    .append(node("p", "Project details are available in the downloadable resume."));
}
