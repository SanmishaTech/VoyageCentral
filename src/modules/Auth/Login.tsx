import React, { useEffect } from "react"; // Import React if needed
import { useLocation, useNavigate } from "react-router-dom";
import { useForm, SubmitHandler, FieldValues } from "react-hook-form"; // Import FieldValues
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { post } from "@/services/apiService";
import { appName, allowRegistration } from "@/config";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
// Import the new handler
import { handleApiValidationErrors } from "./Handlevalidation"; // Adjust path as needed

// --- Interfaces --- (Keep or import if defined elsewhere)
interface LoginResponse {
  token: string;
  accesstoken: string; // Assuming this is correct, often called refreshToken
  user: { id: string; email: string /* other fields */ };
}

// --- Zod Schema ---
const loginSchema = z.object({
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
  // .min(6, "Password must be at least 6 characters") // Keep client-side basic checks if desired
});

type LoginFormInputs = z.infer<typeof loginSchema>;

// --- Component ---
const Login = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setError, // Get setError
    formState: { errors },
    getValues, // Still useful for getting field names
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      // Good practice to set default values
      email: "",
      password: "",
    },
  });

  // Memoize field names to avoid re-calculating on every render
  const formFieldNames = React.useMemo(
    () => Object.keys(getValues()) as ReadonlyArray<keyof LoginFormInputs>,
    [getValues] // Dependency array ensures it updates if form structure changes (unlikely here)
  );

  // Unauthorized toast logic (remains the same)
  useEffect(() => {
    if (location.state?.unauthorized) {
      toast.error("You are not authorized.");
      // Use requestAnimationFrame or setTimeout with 0 to ensure state update happens after render
      requestAnimationFrame(() => {
        navigate(location.pathname, { replace: true, state: {} });
      });
    }
  }, [location, navigate]);

  const loginMutation = useMutation<
    LoginResponse,
    unknown, // Error type is unknown
    LoginFormInputs
  >({
    mutationFn: (loginData: LoginFormInputs) =>
      post<LoginResponse>("/auth/login", loginData),
    onSuccess: (data) => {
      // ... onSuccess logic ...
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("refreshToken", data.accesstoken);
      localStorage.setItem("user", JSON.stringify(data.user));
      // Redirect to the dashboard or the page they were trying to access
      navigate("/dashboard");
      toast.success("Login successful!");
    },
    onError: (error: unknown) => {
      // Log the original error structure here for confirmation
      console.log("Login error object passed to handler:", error);

      handleApiValidationErrors<LoginFormInputs>(
        error,
        setError,
        formFieldNames
      );
      // Remove any line like 'const Error = error?.error;' before this call
    },
  });

  const onSubmit: SubmitHandler<LoginFormInputs> = (data) => {
    loginMutation.mutate(data);
  };

  const isLoading = loginMutation.isPending;

  // --- JSX (Form remains the same) ---
  return (
    <form className="p-6 md:p-8" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col items-center text-center">
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-balance text-muted-foreground">
            Login to your {appName} account
          </p>
        </div>

        {/* Email Field */}
        <div className="grid gap-2 relative pb-3">
          {" "}
          {/* Increased pb if needed */}
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            {...register("email")}
            required
            disabled={isLoading}
            aria-invalid={errors.email ? "true" : "false"}
            aria-describedby={errors.email ? "email-error" : undefined}
          />
          {errors.email && (
            <p
              id="email-error"
              className="text-destructive text-xs absolute -bottom-1.5 left-0"
            >
              {" "}
              {/* Adjusted position */}
              {errors.email.message}
            </p>
          )}
        </div>

        {/* Password Field */}
        <div className="grid gap-2 relative pb-3">
          {" "}
          {/* Increased pb if needed */}
          <div className="flex items-center">
            <Label htmlFor="password">Password</Label>
            <a
              href="/forgot-password"
              tabIndex={isLoading ? -1 : 0}
              className="ml-auto text-sm underline-offset-2 hover:underline"
            >
              Forgot your password?
            </a>
          </div>
          <PasswordInput
            id="password"
            {...register("password")}
            required
            disabled={isLoading}
            aria-invalid={errors.password ? "true" : "false"}
            aria-describedby={errors.password ? "password-error" : undefined}
          />
          {errors.password && (
            <p
              id="password-error"
              className="text-destructive text-xs absolute -bottom-1.5 left-0"
            >
              {" "}
              {/* Adjusted position */}
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Submit Button */}
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              Logging in...
            </>
          ) : (
            "Login"
          )}
        </Button>

        {/* Registration Link */}
        {allowRegistration && (
          <div className="text-center text-sm">
            Don't have an account?{" "}
            <a href="/register" className="underline underline-offset-4">
              Register
            </a>
          </div>
        )}
      </div>
    </form>
  );
};

export default Login;
