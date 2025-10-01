"use client";

import { GalleryVerticalEnd } from "lucide-react";
import { LoginForm } from "@/components/login-form";
import { toast } from "sonner";
import { login } from "@/lib/auth";

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

      console.log("Login successful, token stored");
      console.log("JWT Token:", localStorage.getItem("jwt_token")?.substring(0, 20) + "...");

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
            <div className="bg-primary text-primary-foreground flex size-6 items-center justify-center rounded-md">
              <GalleryVerticalEnd className="size-4" />
            </div>
            Tariff Calculator
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm onSubmit={handleLogin} />
          </div>
        </div>
      </div>
      <div className="bg-muted relative hidden lg:block">
        <img
          src="/placeholder.svg"
          alt="Image"
          className="absolute inset-0 h-full w-full object-cover dark:brightness-[0.2] dark:grayscale"
        />
      </div>
    </div>
  );
}
