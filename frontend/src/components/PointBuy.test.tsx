import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PointBuy } from "./PointBuy";
import type { Attributes } from "@vampiro/content";

const baseAttributes: Attributes = { riqueza: 1, recursos: 2, soldados: 3, controle: 4 };

describe("PointBuy", () => {
  it("renders four attributes and the remaining point total", () => {
    render(<PointBuy value={baseAttributes} onChange={vi.fn()} />);

    expect(screen.getByText("Sangue")).toBeInTheDocument();
    expect(screen.getByText("Influência")).toBeInTheDocument();
    expect(screen.getByText("Rebanho")).toBeInTheDocument();
    expect(screen.getByText("Máscara")).toBeInTheDocument();
    expect(screen.getByText("Pontos restantes: 0")).toBeInTheDocument();
  });

  it("clicking plus increments the attribute and calls onChange", async () => {
    const onChange = vi.fn();
    render(<PointBuy value={{ riqueza: 1, recursos: 1, soldados: 1, controle: 1 }} onChange={onChange} />);

    await userEvent.click(screen.getByRole("button", { name: "Aumentar Sangue" }));

    expect(onChange).toHaveBeenCalledWith({ riqueza: 2, recursos: 1, soldados: 1, controle: 1 });
  });

  it("disables every plus button when no points remain", () => {
    render(<PointBuy value={baseAttributes} onChange={vi.fn()} />);

    for (const button of screen.getAllByRole("button", { name: /^Aumentar/ })) {
      expect(button).toBeDisabled();
    }
  });

  it("disables plus for an attribute already at five", () => {
    render(<PointBuy value={{ riqueza: 5, recursos: 1, soldados: 1, controle: 1 }} onChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "Aumentar Sangue" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Aumentar Influência" })).toBeEnabled();
  });
});
