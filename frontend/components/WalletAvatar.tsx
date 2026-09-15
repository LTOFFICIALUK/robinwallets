"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/format";

type WalletAvatarProps = {
  name: string;
  avatar?: string | null;
  className?: string;
};

export const WalletAvatar = ({ name, avatar, className }: WalletAvatarProps) => {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(avatar) && !failed;

  if (showImage) {
    return (
      <img
        src={avatar || ""}
        alt=""
        className={cn("h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-[#232830]", className)}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <span
      className={cn(
        "flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#1a1f27] font-mono text-[11px] text-[#9cc4ff]",
        className,
      )}
    >
      {initials(name || "??")}
    </span>
  );
};
