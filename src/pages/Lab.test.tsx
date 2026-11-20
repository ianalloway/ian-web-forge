// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation, useNavigate } from "react-router-dom";
import { afterEach, expect, it } from "vitest";
import Lab from "./Lab";

function HistoryProbe() {
  const navigate = useNavigate();
  return <><output>{useLocation().search}</output><button onClick={() => navigate(-1)}>Back</button></>;
}

afterEach(cleanup);

it("restores shared filters and preserves unrelated parameters when editing", () => {
  render(<MemoryRouter initialEntries={["/lab?ref=home&q=kelly&category=decisions"]}><Lab /><HistoryProbe /></MemoryRouter>);
  const search = screen.getByRole("searchbox") as HTMLInputElement;
  expect(search.value).toBe("kelly");
  expect(screen.getByRole("button", { name: /Evaluation & decisions/ }).getAttribute("aria-pressed")).toBe("true");
  fireEvent.click(screen.getByRole("button", { name: /^Algorithms/ }));
  expect(screen.getByText(/Nothing matches/)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Back" }));
  expect(screen.getByRole("button", { name: /Evaluation & decisions/ }).getAttribute("aria-pressed")).toBe("true");
  fireEvent.change(search, { target: { value: "" } });
  fireEvent.click(screen.getByRole("button", { name: /^All / }));
  expect(screen.getByRole("status").textContent).toBe("?ref=home");
});
