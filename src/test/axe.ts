import axe from "axe-core";

/**
 * Executa o axe-core (WCAG 2.x A/AA) e retorna as violações em formato legível.
 * `color-contrast` é desativado porque o jsdom não calcula estilos renderizados.
 */
export async function findAccessibilityViolations(container: Element): Promise<string[]> {
  const results = await axe.run(container, {
    runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "best-practice"] },
    rules: { "color-contrast": { enabled: false } },
  });
  return results.violations.map(
    (violation) =>
      `${violation.id}: ${violation.help} (${violation.nodes.map((n) => n.target.join(" ")).join(", ")})`,
  );
}
