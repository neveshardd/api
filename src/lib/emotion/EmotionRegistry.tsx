"use client";

import createCache, { type EmotionCache } from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import { useServerInsertedHTML } from "next/navigation";
import { type ReactNode, useState } from "react";

interface Registry {
  readonly cache: EmotionCache;
  readonly flush: () => string[];
}

function createRegistry(): Registry {
  const cache = createCache({ key: "agage" });
  cache.compat = true;

  const originalInsert = cache.insert;
  let inserted: string[] = [];

  cache.insert = (...args) => {
    const [, serialized] = args;
    if (cache.inserted[serialized.name] === undefined) inserted.push(serialized.name);
    return originalInsert(...args);
  };

  const flush = () => {
    const names = inserted;
    inserted = [];
    return names;
  };

  return { cache, flush };
}

/**
 * Coleta os estilos Emotion gerados durante o SSR do App Router e os injeta no HTML,
 * evitando conteúdo sem estilo na primeira pintura.
 */
export function EmotionRegistry({ children }: { children: ReactNode }) {
  const [registry] = useState(createRegistry);

  useServerInsertedHTML(() => {
    const names = registry.flush();
    if (names.length === 0) return null;

    let styles = "";
    for (const name of names) {
      const css = registry.cache.inserted[name];
      if (typeof css === "string") styles += css;
    }

    return (
      <style
        key={registry.cache.key}
        data-emotion={`${registry.cache.key} ${names.join(" ")}`}
        // biome-ignore lint/security/noDangerouslySetInnerHtml: CSS serializado pelo próprio Emotion.
        dangerouslySetInnerHTML={{ __html: styles }}
      />
    );
  });

  return <CacheProvider value={registry.cache}>{children}</CacheProvider>;
}
