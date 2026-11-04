import type { ReactNode } from "react";
import { AuthMain, AuthPanel, Logo } from "./styles";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <AuthMain>
      <AuthPanel>
        {/* Imagem estática local; dispensa o otimizador (indisponível sem binding IMAGES). */}
        <Logo src="/agage.png" alt="AGAGE" width={140} height={32} />
        {children}
      </AuthPanel>
    </AuthMain>
  );
}
