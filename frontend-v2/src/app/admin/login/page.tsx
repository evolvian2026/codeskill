"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { Loader2, ShieldCheck, AlertCircle } from "lucide-react";

const adminLoginSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().optional(),
  otp: z.string().optional(),
});

type AdminLoginFormValues = z.infer<typeof adminLoginSchema>;

export default function AdminLoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showOTP, setShowOTP] = useState(false);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const { adminLogin, adminLoginVerify } = useAuth();
  const router = useRouter();

  const form = useForm<AdminLoginFormValues>({
    resolver: zodResolver(adminLoginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: AdminLoginFormValues) => {
    setIsLoading(true);
    form.clearErrors("root");
    setInfoMessage(null);
    try {
      if (!showOTP) {
        const res = await adminLogin({ email: data.email, password: data.password });
        if (res.requireOTP) {
          setShowOTP(true);
          if (res.message) setInfoMessage(res.message);
        } else {
          router.push("/admin/dashboard");
        }
      } else {
        if (!data.otp) {
          form.setError("otp", { type: "manual", message: "OTP is required" });
          return;
        }
        await adminLoginVerify({ email: data.email, otp: data.otp });
        router.push("/admin/dashboard");
      }
    } catch (err: any) {
      form.setError("root", { type: "manual", message: err.message || "Failed to authenticate admin" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground font-sans">
      
      {/* Left Column - Brand/Graphic (Hidden on smaller screens) */}
      <div className="hidden lg:flex flex-1 relative bg-black items-center justify-center overflow-hidden flex-col p-12 text-white text-center">
        {/* Abstract Grid / Red Admin Background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:32px_32px] opacity-20" />
        <div className="absolute left-1/2 top-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-red-500/20 blur-[120px]" />
        
        {/* Brand Content */}
        <div className="relative z-10 max-w-md flex flex-col items-center">
          <Link href="/" className="w-16 h-16 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center mb-8 shadow-2xl hover:bg-white/20 transition-colors">
            <ShieldCheck className="w-8 h-8 text-red-400" />
          </Link>
          <h1 className="text-4xl font-bold tracking-tight mb-4">
            CodeSkill<br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-rose-500">Admin Portal</span>
          </h1>
          <p className="text-lg text-gray-400">
            Secure access for platform administrators. Manage content, monitor activity, and configure system settings.
          </p>
        </div>
      </div>

      {/* Right Column - Admin Login Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative bg-white dark:bg-zinc-950">
        {/* Subtle Background Pattern for Right Side */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] -z-10" />

        <div className="w-full max-w-[420px] flex flex-col gap-6">
          
          {/* Mobile Logo Header */}
          <div className="flex lg:hidden flex-col items-center text-center mb-2">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-black/5 bg-card border border-border">
              <ShieldCheck className="w-7 h-7 text-red-500" />
            </div>
          </div>

          <div className="mb-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight mb-2">Admin Access</h2>
            <p className="text-sm text-muted-foreground mt-4">Authorized personnel only.</p>
          </div>

          {/* Form */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            
            {form.formState.errors.root && (
              <div className="p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-red-500 leading-snug">
                  {form.formState.errors.root.message}
                </p>
              </div>
            )}

            {infoMessage && (
              <div className="p-4 bg-blue-500/10 border border-blue-500/50 rounded-lg flex items-start gap-3 animate-in fade-in slide-in-from-top-2">
                <ShieldCheck className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-sm font-medium text-blue-500 leading-snug">
                  {infoMessage}
                </p>
              </div>
            )}

            <div className="space-y-1.5">
              <input
                type="email"
                placeholder="Admin Email"
                disabled={showOTP}
                {...form.register("email")}
                className="w-full h-12 bg-transparent border border-border rounded-md px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-sm disabled:opacity-50"
              />
              {form.formState.errors.email && (
                <p className="text-xs text-destructive mt-1">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <input
                type="password"
                placeholder="Password"
                disabled={showOTP}
                {...form.register("password")}
                className="w-full h-12 bg-transparent border border-border rounded-md px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-sm disabled:opacity-50"
              />
              {form.formState.errors.password && (
                <p className="text-xs text-destructive mt-1">{form.formState.errors.password.message}</p>
              )}
            </div>

            {showOTP && (
              <div className="space-y-1.5 pt-2">
                <input
                  type="text"
                  placeholder="6-Digit Verification Code"
                  {...form.register("otp")}
                  className="w-full h-12 bg-transparent border border-border rounded-md px-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-sm tracking-widest font-medium text-center"
                />
                {form.formState.errors.otp && (
                  <p className="text-xs text-destructive mt-1">{form.formState.errors.otp.message}</p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 rounded-md bg-zinc-900 dark:bg-white hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-black font-semibold text-sm transition-all flex items-center justify-center mt-2 disabled:opacity-70 shadow-md"
            >
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (showOTP ? "Verify Login" : "Authenticate as Admin")}
            </button>
          </form>
          
          <div className="mt-6 pt-6 border-t border-border text-center">
            <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Return to Homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
