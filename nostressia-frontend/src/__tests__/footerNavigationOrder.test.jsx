import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";

import Footer from "../components/Footer";

describe("Footer navigation order", () => {
  it("shows Explore links in the expected business order", () => {
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );

    const exploreHeading = screen.getByRole("heading", { name: /explore/i });
    const exploreColumn = exploreHeading.parentElement;
    const links = within(exploreColumn).getAllByRole("link");

    expect(links.map((link) => link.textContent)).toEqual([
      "Dashboard",
      "Analytics",
      "Daily Tips",
      "Motivation",
      "My Diary",
    ]);
  });
});
