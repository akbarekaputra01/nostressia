import { useEffect } from "react";

const DEFAULT_TITLE = "Nostressia";
const DEFAULT_DESCRIPTION =
  "Nostressia helps you track daily stress, discover mental wellness tips, and reflect through journaling and motivation.";
const DEFAULT_IMAGE = "/Logo-Nostressia.png";

const setMetaTag = ({ name, property, content }) => {
  if (typeof document === "undefined") return;
  const selector = name ? `meta[name="${name}"]` : `meta[property="${property}"]`;
  let element = document.head.querySelector(selector);
  if (!element) {
    element = document.createElement("meta");
    if (name) element.setAttribute("name", name);
    if (property) element.setAttribute("property", property);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
};

const setLinkTag = ({ rel, href }) => {
  if (typeof document === "undefined") return;
  let element = document.head.querySelector(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", rel);
    document.head.appendChild(element);
  }
  element.setAttribute("href", href);
};

const resolveCanonical = (canonical) => {
  if (canonical) return canonical;
  if (typeof window === "undefined") return "";
  return `${window.location.origin}${window.location.pathname}`;
};

export default function PageMeta({
  title,
  description,
  canonical,
  image,
  type = "website",
  noindex = false,
}) {
  useEffect(() => {
    const resolvedTitle = title ? `${title} | ${DEFAULT_TITLE}` : DEFAULT_TITLE;
    const resolvedDescription = description || DEFAULT_DESCRIPTION;
    const resolvedImage = image || DEFAULT_IMAGE;

    if (typeof document !== "undefined") {
      document.title = resolvedTitle;
    }

    setMetaTag({ name: "description", content: resolvedDescription });
    setMetaTag({ property: "og:title", content: resolvedTitle });
    setMetaTag({ property: "og:description", content: resolvedDescription });
    setMetaTag({ property: "og:type", content: type });
    setMetaTag({ property: "og:image", content: resolvedImage });
    setMetaTag({ name: "twitter:card", content: "summary_large_image" });
    setMetaTag({ name: "twitter:title", content: resolvedTitle });
    setMetaTag({ name: "twitter:description", content: resolvedDescription });
    setMetaTag({ name: "twitter:image", content: resolvedImage });

    const resolvedCanonical = resolveCanonical(canonical);
    if (resolvedCanonical) {
      setLinkTag({ rel: "canonical", href: resolvedCanonical });
    }

    if (noindex) {
      setMetaTag({ name: "robots", content: "noindex,nofollow" });
    } else if (typeof document !== "undefined") {
      const robotsTag = document.head.querySelector('meta[name="robots"]');
      if (robotsTag) robotsTag.remove();
    }
  }, [title, description, canonical, image, type, noindex]);

  return null;
}
