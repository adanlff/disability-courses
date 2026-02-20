"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useEffect, useState, useCallback } from "react";
import { flushSync } from "react-dom";

export function ThemeDropdownItem() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleTheme = useCallback(async () => {
    const isDark = resolvedTheme === "dark";
    const newTheme = isDark ? "light" : "dark";

    const doc = document as any;
    if (doc.startViewTransition) {
      await doc.startViewTransition(() => {
        flushSync(() => {
          setTheme(newTheme);
        });
      }).ready;
    } else {
      setTheme(newTheme);
    }
  }, [resolvedTheme, setTheme]);

  if (!mounted) {
    return (
      <DropdownMenuItem className="flex items-center gap-3 cursor-pointer px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:!bg-[#005EB8] focus:!text-white">
        <Sun className="h-4 w-4" />
        <span>Tema: Terang</span>
      </DropdownMenuItem>
    );
  }

  const isDark = resolvedTheme === "dark";

  return (
    <DropdownMenuItem
      onClick={(e) => {
        e.preventDefault();
        toggleTheme();
      }}
      className="flex items-center gap-3 cursor-pointer px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:!bg-[#005EB8] focus:!text-white"
    >
      {isDark ? (
        <>
          <Sun className="h-4 w-4" />
          <span>Mode Terang</span>
        </>
      ) : (
        <>
          <Moon className="h-4 w-4" />
          <span>Mode Gelap</span>
        </>
      )}
    </DropdownMenuItem>
  );
}
