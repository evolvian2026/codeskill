import type { NextConfig } from "next";

export default async () => {
  // Only enforce this check in development mode
  if (process.env.NODE_ENV === "development") {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5001/api";
    const healthUrl = apiUrl.replace(/\/api$/, ""); // ping root or a health endpoint

    try {
      // Try to fetch the backend. If it's down, this fetch will throw an error (ECONNREFUSED)
      await fetch(healthUrl, { method: "HEAD", cache: "no-store" });
    } catch (e) {
      console.error("\n❌ ======================================================== ❌");
      console.error("  ERROR: Backend server is not running!");
      console.error(`  The frontend could not connect to: ${healthUrl}`);
      console.error("  Please start your NestJS/Express backend before running the frontend.");
      console.error("❌ ======================================================== ❌\n");
      
      // Stop the frontend from starting
      process.exit(1);
    }
  }

  const nextConfig: NextConfig = {
    turbopack: {
      root: __dirname,
    },
  };

  return nextConfig;
};
