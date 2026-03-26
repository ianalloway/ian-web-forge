# Loom outline — Sports ML evaluation stack (~5–7 min)

Use this if you prefer video over PDF. Record screen + face; show repo + local run.

1. **Hook (30s):** “Sports ML résumés overuse one accuracy number. I ship calibration, rolling stability, and CLV language in one view.”
2. **Repo tour (90s):** `nba-clv-dashboard` README → `app.py` / `/api/metrics` → `static/index.html` charts.
3. **Live demo (2 min):** `uvicorn nba_clv_dashboard.app:app --reload --port 8765` → open localhost; point at calibration scatter, rolling accuracy, CLV block.
4. **Primitives (90s):** Quick `nba-ratings` / `nba-edge` import snippet: Elo + logistic + Kelly—why library vs notebook.
5. **Line tool (45s):** `odds-drift-watch` / `closing-line-archive` — monitoring plus historical snapshots for reproducible research.
6. **Close (30s):** “Open to ML / data roles in sports, fintech, or forecasting. Case study: `ianalloway.xyz/papers/sports-ml-evaluation-case-study.html`.”

**After recording:** Paste Loom link in LinkedIn featured, GitHub profile README badge row, and first line of outreach emails.
