"use client";

import { type Intent, OverlayToaster, type Toaster } from "@blueprintjs/core";
import { createContext, type ReactNode, useCallback, useContext, useMemo, useRef } from "react";

interface ToasterContextValue {
  readonly notify: (message: string, intent?: Intent) => void;
}

const ToasterContext = createContext<ToasterContextValue | null>(null);

/** Toaster oficial do Blueprint, criado sob demanda no primeiro aviso. */
export function ToasterProvider({ children }: { children: ReactNode }) {
  const toaster = useRef<Promise<Toaster> | null>(null);

  const notify = useCallback((message: string, intent: Intent = "success") => {
    toaster.current ??= OverlayToaster.create({ position: "top" });
    void toaster.current.then((instance) =>
      instance.show({ message, intent, icon: intent === "danger" ? "error" : "tick-circle" }),
    );
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);
  return <ToasterContext.Provider value={value}>{children}</ToasterContext.Provider>;
}

export function useToaster(): ToasterContextValue {
  const context = useContext(ToasterContext);
  if (!context) throw new Error("useToaster deve ser usado dentro de <ToasterProvider>.");
  return context;
}
