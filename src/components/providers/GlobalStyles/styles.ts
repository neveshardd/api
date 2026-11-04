import { css } from "@emotion/react";

/**
 * Reset estrutural mínimo (o Blueprint não remove a margem padrão do navegador), fundo e cor de
 * texto da aplicação com a paleta oficial: light-gray-5 / dark-gray-2 e dark-gray-1 / light-gray-5.
 * A cor do texto no <body> faz qualquer texto comum (fora dos componentes do Blueprint) seguir o
 * tema; sem ela, títulos e parágrafos próprios ficavam escuros no tema escuro.
 */
export const globalStyles = css`
  html,
  body {
    margin: 0;
    padding: 0;
    height: 100%;
  }

  body {
    background-color: var(--bp-palette-light-gray-5);
    color: var(--bp-palette-dark-gray-1);
  }

  .bp6-dark body {
    background-color: var(--bp-palette-dark-gray-2);
    color: var(--bp-palette-light-gray-5);
  }
`;
