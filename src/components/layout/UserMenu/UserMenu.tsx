"use client";

import { Button, Menu, MenuDivider, MenuItem, PopoverNext } from "@blueprintjs/core";
import { IconLogout, IconUserCircle } from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ICON_SIZE, icon } from "@/components/shared/icons/AppIcon";
import { type UserRole, userRoleLabels } from "@/features/auth/domain/role";
import { authClient } from "@/lib/auth/authClient";

export interface UserMenuUser {
  readonly email: string;
  readonly role: UserRole;
}

export function UserMenu({ user }: { user: UserMenuUser }) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  const signOut = async () => {
    setSigningOut(true);
    await authClient.signOut();
    router.replace("/login");
    router.refresh();
  };

  return (
    <PopoverNext
      placement="bottom-end"
      arrow={false}
      content={
        <Menu aria-label="Conta">
          {/* Cabeçalho oficial do Menu: o papel fica acima do e-mail. */}
          <MenuDivider title={userRoleLabels[user.role]} />
          <MenuItem icon={icon(IconUserCircle)} text={user.email} disabled />
          <MenuItem
            icon={icon(IconLogout)}
            text="Sair"
            onClick={signOut}
            disabled={signingOut}
            shouldDismissPopover={false}
          />
        </Menu>
      }
    >
      <Button
        variant="minimal"
        icon={icon(IconUserCircle, ICON_SIZE.large)}
        aria-label={`Conta de ${user.email}`}
        aria-haspopup="menu"
      />
    </PopoverNext>
  );
}
