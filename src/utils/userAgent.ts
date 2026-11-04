const browsers: ReadonlyArray<[RegExp, string]> = [
  [/Edg\//, "Edge"],
  [/OPR\/|Opera/, "Opera"],
  [/SamsungBrowser\//, "Samsung Internet"],
  [/Firefox\//, "Firefox"],
  [/Chrome\//, "Chrome"],
  [/Safari\//, "Safari"],
];

const systems: ReadonlyArray<[RegExp, string]> = [
  [/Windows/, "Windows"],
  [/Android/, "Android"],
  [/iPhone|iPad|iPod/, "iOS"],
  [/Mac OS X|Macintosh/, "macOS"],
  [/Linux/, "Linux"],
];

/** Descrição curta e legível do dispositivo (ex.: "Chrome · Windows"). */
export function describeUserAgent(userAgent: string | null | undefined): string {
  if (!userAgent) return "Dispositivo desconhecido";
  const browser = browsers.find(([pattern]) => pattern.test(userAgent))?.[1] ?? "Navegador";
  const system = systems.find(([pattern]) => pattern.test(userAgent))?.[1];
  return system ? `${browser} · ${system}` : browser;
}
