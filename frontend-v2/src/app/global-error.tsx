"use client";

import React from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-card border border-border p-8 rounded-2xl shadow-2xl text-center space-y-6">
          <div className="w-12 h-12 rounded-full bg-red-500/10 border border-red-500/20 text-red-500 flex items-center justify-center mx-auto text-xl font-bold">
            !
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Something went wrong</h2>
          <p className="text-sm text-muted-foreground">
            An unexpected application error occurred. Click below to reload the page.
          </p>
          <button
            onClick={() => reset()}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium transition-colors shadow-lg shadow-indigo-600/20"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
