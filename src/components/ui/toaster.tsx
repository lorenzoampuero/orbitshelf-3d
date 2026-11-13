"use client";

import { Toaster as Sonner, toast } from "sonner";

/**
 * Toasts are for transient confirmations ("Saved", "Copied"). Errors a person must act on stay inline.
 * Mount `<Toaster />` once in a layout. Colours come from the product tokens, so it follows the theme.
 */
export function Toaster() {
  return (
    <Sonner
      theme="dark"
      position="bottom-right"
      closeButton
      toastOptions={{
        style: {
          background: "var(--surface-3)",
          color: "var(--fg)",
          border: "1px solid var(--line-strong)",
          borderRadius: "12px",
          fontFamily: "var(--font-body)",
          fontSize: "14px",
        },
      }}
    />
  );
}

export { toast };
