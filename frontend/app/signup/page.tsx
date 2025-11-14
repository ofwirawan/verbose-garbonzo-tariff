"use client";

import { useRouter } from "next/navigation";
import { IconInnerShadowTop } from "@tabler/icons-react";
import { SignupForm } from "@/components/signup-form";
import { toast } from "sonner";
import { register } from "@/lib/auth";
import Image from "next/image";

export default function SignupPage() {
  const router = useRouter();

  const handleSignup = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    try {
      const message = await register({
        name: email.split("@")[0], // Use email prefix as username
        email,
        password,
        roles: "ROLE_USER",
      });

      toast.success(message || "Registration successful! Please login.");
      router.push("/login");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Registration failed"
      );
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
            <SignupForm onSubmit={handleSignup} />
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
