import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { useNavigate } from "react-router-dom";
import { post } from "@/services/apiService";
import { appName, allowRegistration } from "@/config";
import { LoaderCircle } from "lucide-react"; // Import the spinner icon
import { toast } from "sonner";

interface ApiError extends Error {
  message: string;
}

type LoginFormInputs = z.infer<typeof loginSchema>;

// Define Zod schema
const loginSchema = z.object({
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
});

const Login = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.unauthorized) {
      toast.error("You are not authorized.");
      // Clear the state after displaying the toast
      setTimeout(() => {
        navigate(location.pathname, { replace: true });
      }, 0); // Use a timeout to ensure the state is cleared after the toast is displayed
    }
  }, [location, navigate]);

  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormInputs>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit: SubmitHandler<LoginFormInputs> = async (data) => {
    setIsLoading(true);
    try {
      const response = await post("/auth/login", data);
      localStorage.setItem("authToken", response.token);
      localStorage.setItem("user", JSON.stringify(response.user));
      navigate("/dashboard");
      toast.success("Login successful!");
    } catch (error) {
      const apiError = error as ApiError;
      if (apiError.message) {
        toast.error(apiError.message);
      } else {
        toast.error("An unexpected error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className="p-6 md:p-8" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col items-center text-center">
          <h1 className="text-2xl font-bold">Welcome back</h1>
          <p className="text-balance text-muted-foreground">
            Login to your {appName} account
          </p>
        </div>
        <div className="grid gap-2 relative">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="m@example.com"
            {...register("email")}
            required
          />
          {errors.email && (
            <p className="text-destructive text-xs absolute -bottom-5">
              {errors.email.message}
            </p>
          )}
        </div>
        <div className="grid gap-2 relative">
          <div className="flex items-center">
            <Label htmlFor="password">Password</Label>
            <a
              href="/forgot-password"
              className="ml-auto text-sm underline-offset-2 hover:underline"
            >
              Forgot your password?
            </a>
          </div>
          <PasswordInput id="password" {...register("password")} required />
          {errors.password && (
            <p className="text-destructive text-xs absolute -bottom-5">
              {errors.password.message}
            </p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? (
            <>
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              Login...
            </>
          ) : (
            "Login"
          )}
        </Button>
        {allowRegistration && (
          <div className="text-center text-sm">
            Don&apos;t have an account?{" "}
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
