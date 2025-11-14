"use client";

import { IconInnerShadowTop } from "@tabler/icons-react";
import { LoginForm } from "@/components/login-form";
import { toast } from "sonner";
import { login } from "@/lib/auth";
import Image from "next/image";

export default function LoginPage() {
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const username = formData.get("email") as string; // Using email field as username
    const password = formData.get("password") as string;

    try {
      await login({
        username,
        password,
      });

      toast.success("Login successful! Redirecting...");

      // Small delay to show toast before redirecting
      setTimeout(() => {
        console.log("Attempting redirect to dashboard...");
        // Use replace instead of href to prevent back button issues
        window.location.replace("/dashboard");
      }, 1000);
    } catch (error) {
      console.error("Login error:", error);
      toast.error(error instanceof Error ? error.message : "Login failed");
    }
  };

  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-medium">
            <IconInnerShadowTop className="size-5" />
            Tariffic
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm onSubmit={handleLogin} />
          </div>
        </div>
      </div>
      <div className="relative hidden lg:block">
        <Image
          src="/auth-image.webp"
          alt="Image"
          fill
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    </div>
  );
}
