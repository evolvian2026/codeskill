"use client";

import { AuthProvider } from "@/context/AuthContext";
import { ReactNode } from "react";
import { GoogleOAuthProvider } from "@react-oauth/google";

import { ThemeProvider } from "next-themes";

import { Toaster } from "react-hot-toast";

export function Providers({ children }: { children: ReactNode }) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "";
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <GoogleOAuthProvider clientId={clientId}>
        <AuthProvider>
          {children}
          <Toaster position="top-center" />
        </AuthProvider>
      </GoogleOAuthProvider>
    </ThemeProvider>
  );
}
