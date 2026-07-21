"use client";

import { usePathname, useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { authAPI } from "@/config/api";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, updateUserLocal } = useAuth();
  const [isVerifying, setIsVerifying] = useState(true);

  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      if (loading) return;

      if (isLoginPage) {
        if (user && user.isAdmin) {
          router.push("/admin/dashboard");
        } else {
          setIsVerifying(false);
        }
        return;
      }

      if (!user) {
        router.push("/admin/login");
        return;
      }

      if (user.isAdmin) {
        if (isMounted) setIsVerifying(false);
        return;
      }

      // User exists but local state has isAdmin = false.
      // Re-verify with backend in case user was recently promoted.
      try {
        const res = await authAPI.getMe();
        const freshUser = res.data?.user;
        if (freshUser && freshUser.isAdmin) {
          updateUserLocal(freshUser);
          if (isMounted) setIsVerifying(false);
        } else {
          router.push("/dashboard");
        }
      } catch (err) {
        router.push("/dashboard");
      }
    }

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [user, loading, router, isLoginPage, updateUserLocal]);

  if (loading || isVerifying) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F5F7FA]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (isLoginPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      <AdminSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header can go here if needed, or inside pages */}
        <header className="bg-card/50 backdrop-blur-xl border-b border-border h-16 flex items-center px-6 sticky top-0 z-10 shrink-0 shadow-sm">
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full flex items-center justify-center font-bold text-sm">
              {user?.name?.charAt(0) || "A"}
            </div>
            <span className="text-sm font-medium hidden sm:block text-foreground">{user?.name}</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto relative">
          {children}
        </main>
      </div>
    </div>
  );
}
