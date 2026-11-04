import { afterEach } from "vitest";

// Testes de integração (D1/R2) rodam em `node`; o restante, em `jsdom`.
if (typeof window !== "undefined") {
  await import("@testing-library/jest-dom/vitest");
  const { cleanup } = await import("@testing-library/react");

  afterEach(() => {
    cleanup();
    localStorage.clear();
    document.documentElement.className = "";
  });

  // jsdom não implementa matchMedia; usado pelo tema e pelo Blueprint.
  if (!window.matchMedia) {
    window.matchMedia = (query: string): MediaQueryList => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    });
  }
}
