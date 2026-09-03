import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AttributeBars } from "./AttributeBars";

describe("AttributeBars", () => {
  it("renders the four Portuguese attribute labels and values", () => {
    render(<AttributeBars attributes={{ riqueza: 1, recursos: 2, soldados: 3, controle: 4 }} />);

    expect(screen.getByText("Sangue")).toBeInTheDocument();
    expect(screen.getByText("Influência")).toBeInTheDocument();
    expect(screen.getByText("Rebanho")).toBeInTheDocument();
    expect(screen.getByText("Máscara")).toBeInTheDocument();
    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("4")).toBeInTheDocument();
  });
});
