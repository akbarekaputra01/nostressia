import { render } from "@testing-library/react";

import PageMeta from "../components/PageMeta";

const getMeta = (selector) => document.head.querySelector(selector);

describe("PageMeta", () => {
  it("sets document title and social metadata", () => {
    render(
      <PageMeta
        title="Dashboard"
        description="Custom description"
        canonical="https://nostressia.test/dashboard"
        image="/custom.png"
        type="article"
      />,
    );

    expect(document.title).toBe("Dashboard | Nostressia");
    expect(getMeta('meta[name="description"]')?.getAttribute("content")).toBe(
      "Custom description",
    );
    expect(getMeta('meta[property="og:title"]')?.getAttribute("content")).toBe(
      "Dashboard | Nostressia",
    );
    expect(getMeta('meta[property="og:type"]')?.getAttribute("content")).toBe(
      "article",
    );
    expect(getMeta('meta[property="og:image"]')?.getAttribute("content")).toBe(
      "/custom.png",
    );
    expect(getMeta('meta[name="twitter:card"]')?.getAttribute("content")).toBe(
      "summary_large_image",
    );
    expect(getMeta('link[rel="canonical"]')?.getAttribute("href")).toBe(
      "https://nostressia.test/dashboard",
    );
  });

  it("toggles the noindex robots tag", () => {
    const { rerender } = render(<PageMeta noindex />);

    expect(getMeta('meta[name="robots"]')?.getAttribute("content")).toBe(
      "noindex,nofollow",
    );

    rerender(<PageMeta noindex={false} />);
    expect(getMeta('meta[name="robots"]')).toBeNull();
  });
});
