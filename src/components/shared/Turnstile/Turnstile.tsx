"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "@/lib/theme/ThemeProvider";
import { TurnstileContainer } from "./styles";

const SCRIPT_URL = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

interface TurnstileApi {
  render(element: HTMLElement, options: Record<string, unknown>): string;
  reset(widgetId: string): void;
  remove(widgetId: string): void;
}

declare global {
  interface Window {
    turnstile?: TurnstileApi;
  }
}

let scriptPromise: Promise<TurnstileApi> | null = null;

function loadTurnstile(): Promise<TurnstileApi> {
  scriptPromise ??= new Promise((resolve, reject) => {
    if (window.turnstile) return resolve(window.turnstile);
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => (window.turnstile ? resolve(window.turnstile) : reject());
    script.onerror = () => {
      scriptPromise = null;
      reject(new Error("Não foi possível carregar a verificação anti-robô."));
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

interface TurnstileProps {
  readonly siteKey: string;
  /** Token válido, ou `null` quando expira/falha (o envio deve ficar bloqueado). */
  readonly onToken: (token: string | null) => void;
  /** Mude o valor para gerar um novo desafio (tokens são de uso único). */
  readonly resetKey?: number;
}

/** Widget oficial do Cloudflare Turnstile (renderização explícita), no idioma e tema do painel. */
export function Turnstile({ siteKey, onToken, resetKey = 0 }: TurnstileProps) {
  const container = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const onTokenRef = useRef(onToken);
  onTokenRef.current = onToken;
  const { theme } = useTheme();

  useEffect(() => {
    let cancelled = false;
    void loadTurnstile()
      .then((api) => {
        if (cancelled || !container.current) return;
        widgetId.current = api.render(container.current, {
          sitekey: siteKey,
          language: "pt-br",
          theme,
          callback: (token: string) => onTokenRef.current(token),
          "expired-callback": () => onTokenRef.current(null),
          "error-callback": () => onTokenRef.current(null),
        });
      })
      .catch(() => onTokenRef.current(null));
    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) window.turnstile.remove(widgetId.current);
      widgetId.current = null;
    };
  }, [siteKey, theme]);

  useEffect(() => {
    if (resetKey > 0 && widgetId.current && window.turnstile) {
      onTokenRef.current(null);
      window.turnstile.reset(widgetId.current);
    }
  }, [resetKey]);

  return <TurnstileContainer ref={container} />;
}
