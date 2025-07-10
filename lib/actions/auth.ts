"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const SITE_URL =
  `https://${process.env.VERCEL_URL!}` || "http://localhost:3000";

const signUpSchema = z
  .object({
    firstName: z.string().min(1, "First name is required"),
    lastName: z.string().min(1, "Last name is required"),
    email: z.string().email("Please enter a valid email address"),
    phoneNumber: z
      .string()
      .min(1, "Phone number is required")
      .regex(
        /^(\+27|0)[0-9]{9}$/,
        "Please enter a valid South African phone number (+27xxxxxxxxx or 0xxxxxxxxx)"
      ),
    password: z.string().min(6, "Password must be at least 6 characters"),
    repeatPassword: z.string().min(6, "Password must be at least 6 characters"),
  })
  .refine((data) => data.password === data.repeatPassword, {
    message: "Passwords don't match",
    path: ["repeatPassword"],
  });

export type SignUpFormData = z.infer<typeof signUpSchema>;

export interface SignUpState {
  errors?: {
    firstName?: string[];
    lastName?: string[];
    email?: string[];
    phoneNumber?: string[];
    password?: string[];
    repeatPassword?: string[];
    _form?: string[];
  };
  success?: boolean;
}

export async function signUpAction(
  prevState: SignUpState,
  formData: FormData
): Promise<SignUpState> {
  const result = signUpSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    phoneNumber: formData.get("phoneNumber"),
    password: formData.get("password"),
    repeatPassword: formData.get("repeatPassword"),
  });

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
    };
  }

  const { firstName, lastName, email, phoneNumber, password } = result.data;
  const supabase = await createClient();

  // Convert phone number to international format if needed
  let formattedPhoneNumber = phoneNumber;
  if (phoneNumber.startsWith("0")) {
    formattedPhoneNumber = "+27" + phoneNumber.substring(1);
  }

  try {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${SITE_URL}/profile`,
        data: {
          full_name: `${firstName} ${lastName}`,
          phone_number: formattedPhoneNumber,
        },
      },
    });

    if (error) {
      return {
        errors: {
          _form: [error.message],
        },
      };
    }
  } catch (error) {
    return {
      errors: {
        _form: [
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        ],
      },
    };
  }

  redirect("/auth/sign-up-success");
}

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

export type LoginFormData = z.infer<typeof loginSchema>;

export interface LoginState {
  errors?: {
    email?: string[];
    password?: string[];
    _form?: string[];
  };
  success?: boolean;
}

export async function loginAction(
  prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const result = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!result.success) {
    return {
      errors: result.error.flatten().fieldErrors,
    };
  }

  const { email, password } = result.data;
  const supabase = await createClient();

  try {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        errors: {
          _form: [error.message],
        },
      };
    }
  } catch (error) {
    return {
      errors: {
        _form: [
          error instanceof Error
            ? error.message
            : "An unexpected error occurred",
        ],
      },
    };
  }
  redirect("/profile");
}

export async function logoutAction(): Promise<void> {
  try {
    const supabase = await createClient();

    // Sign out the user
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Supabase logout error:", error);
      // Continue with revalidation and redirect even if logout fails
    }

    // Revalidate the layout to clear any cached user data
    revalidatePath("/", "layout");

    // Revalidate specific paths that might show user-specific content
    revalidatePath("/profile");
    revalidatePath("/apply");
    revalidatePath("/profile", "layout");

    // Clear any additional cached routes
    revalidatePath("/auth/login");
    revalidatePath("/auth/sign-up");
  } catch (error) {
    console.error("Logout action error:", error);
    // Even if there's an error, we should still redirect
  }

  // Always redirect to home page
  redirect("/");
}
