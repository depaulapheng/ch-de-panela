import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const theme = readFileSync("app/editorial.css", "utf8");
const layout = readFileSync("app/layout.tsx", "utf8");

describe("identidade visual oficial Larissa e Pedro", () => {
  const official = {
    pink: "#d86190",
    fuchsia: "#e0258a",
    magenta: "#d00bb7",
    orange: "#f78806",
    apricot: "#dc8b51",
    burnt: "#d45025"
  };

  it("declara exatamente as seis cores do anexo como tokens", () => {
    for (const [name, hex] of Object.entries(official)) {
      expect(theme).toContain(`--palette-${name}:${hex};`);
    }
    expect(theme).toContain("--palette-gradient:linear-gradient(105deg,var(--palette-magenta),var(--palette-orange));");
  });

  it("carrega o tema final depois dos estilos legados", () => {
    expect(layout.indexOf('"./globals.css"')).toBeGreaterThan(-1);
    expect(layout.indexOf('"./editorial.css"')).toBeGreaterThan(layout.indexOf('"./globals.css"'));
    expect(theme).not.toContain("--primary:#a45e4c;");
  });

  it("mantém fontes consistentes e imagens de presentes sem distorção", () => {
    expect(theme).toContain('--display:"Cormorant Garamond",Georgia,serif;');
    expect(theme).toContain('--body:"DM Sans",Arial,sans-serif;');
    expect(theme).toContain("object-fit:contain");
    expect(theme).toContain(".gift-photo-placeholder");
  });

  it("usa uma cor de ação legível e mostra a navegação mobile sem recorte", () => {
    expect(theme).toContain("background:#b5401c");
    expect(theme).toContain("flex-wrap:wrap;justify-content:center");
    expect(theme).toContain("overflow-x:visible");
  });
});
