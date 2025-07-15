"use client";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useActionState, useTransition, useState } from "react";
import { z } from "zod";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { loginAction, type LoginState } from "@/lib/actions/auth";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [state, formAction] = useActionState<LoginState, FormData>(
    loginAction,
    {}
  );
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Toggle password visibility with Ctrl+Shift+V
    if (e.ctrlKey && e.shiftKey && e.key === "V") {
      e.preventDefault();
      togglePasswordVisibility();
    }
  };

  const onSubmit = (data: LoginFormData) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, value);
    });
    startTransition(() => {
      formAction(formData);
    });
  };

  const handlePasswordReset = async () => {
    const email = form.getValues("email");
    if (!email) {
      form.setError("email", {
        message: "Please enter your email address first",
      });
      return;
    }

    setIsResettingPassword(true);
    try {
      // Navigate to forgot password page with email pre-filled
      const url = new URL("/auth/forgot-password", window.location.origin);
      url.searchParams.set("email", email);
      window.location.href = url.toString();
    } catch (error) {
      console.error("Password reset error:", error);
    } finally {
      setIsResettingPassword(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Mail className="h-4 w-4" />
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="john@example.com"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center justify-between">
                      <FormLabel className="flex items-center gap-2">
                        <Lock className="h-4 w-4" />
                        Password
                      </FormLabel>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handlePasswordReset}
                          disabled={isResettingPassword}
                          className="text-sm text-primary hover:underline underline-offset-4 disabled:opacity-50"
                        >
                          {isResettingPassword
                            ? "Sending..."
                            : "Reset Password"}
                        </button>
                        <span className="text-muted-foreground text-sm">|</span>
                        <Link
                          href="/auth/forgot-password"
                          className="text-sm text-primary hover:underline underline-offset-4"
                        >
                          Forgot Password?
                        </Link>
                      </div>
                    </div>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type={showPassword ? "text" : "password"}
                          placeholder="Enter your password"
                          onKeyDown={handleKeyDown}
                          {...field}
                        />
                        <button
                          type="button"
                          onClick={togglePasswordVisibility}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                          aria-label={
                            showPassword ? "Hide password" : "Show password"
                          }
                          title={`${showPassword ? "Hide" : "Show"} password (Ctrl+Shift+V)`}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </FormControl>
                    <FormMessage />
                    {showPassword && field.value && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Eye className="h-3 w-3" />
                        Password is visible. Click the eye icon to hide it.
                      </p>
                    )}
                    {!showPassword && field.value && (
                      <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <EyeOff className="h-3 w-3" />
                        Password is hidden. Click the eye icon to show it.
                        <span className="ml-2 text-xs bg-gray-100 px-1 py-0.5 rounded">
                          Ctrl+Shift+V
                        </span>
                      </p>
                    )}
                  </FormItem>
                )}
              />

              {state.errors?._form && (
                <div className="text-sm text-red-500">
                  {state.errors._form.map((error, index) => (
                    <p key={index}>{error}</p>
                  ))}
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                    Logging in...
                  </div>
                ) : (
                  "Login"
                )}
              </Button>
            </form>
          </Form>

          <div className="mt-4 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link href="/auth/sign-up" className="underline underline-offset-4">
              Sign up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
