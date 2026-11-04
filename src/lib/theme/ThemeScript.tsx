import { BLUEPRINT_DARK_CLASS, THEME_STORAGE_KEY } from "./theme";

/**
 * Aplica o tema antes da primeira pintura para evitar flash de tema incorreto.
 * Server Component: o `<script>` existe só no HTML inicial e não faz parte da árvore do cliente
 * (scripts renderizados pelo React no navegador não executam e geram aviso).
 */
const script = `(function(){try{var s=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});var d=s==="dark"||(s!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);var e=document.documentElement;if(d){e.classList.add(${JSON.stringify(BLUEPRINT_DARK_CLASS)});}e.style.colorScheme=d?"dark":"light";}catch(_){}})();`;

export function ThemeScript() {
  // biome-ignore lint/security/noDangerouslySetInnerHtml: script estático gerado a partir de constantes internas.
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
