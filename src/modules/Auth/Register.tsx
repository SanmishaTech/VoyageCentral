import { useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { useNavigate } from "react-router-dom";
import { post } from "@/services/apiService";
import { appName } from "@/config";
import { LoaderCircle } from "lucide-react"; // Spinner icon
import { toast } from "sonner";

interface ApiError extends Error {
  message: string;
}

type RegisterFormInputs = z.infer<typeof registerSchema>;

// Define Zod schema
const registerSchema = z
  .object({
    name: z.string().nonempty("Name is required"),
    email: z
      .string()
      .nonempty("Email is required")
      .email("Invalid email address"),
    password: z
      .string()
      .nonempty("Password is required")
      .min(5, "Password must be at least 5 characters long"),
    confirmPassword: z.string().nonempty("Confirm Password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });

const Register = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormInputs>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit: SubmitHandler<RegisterFormInputs> = async (data) => {
    setIsLoading(true);
    try {
      await post("/auth/register", data);
      toast.success("Registration successful! Please log in.");
      navigate("/"); // Redirect to login page
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
    <form className="p-4 md:p-6" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col space-y-6">
        <div className="flex flex-col items-center text-center space-y-2">
          <h1 className="text-2xl font-bold">Create an Account</h1>
          <p className="text-balance text-muted-foreground">
            Register for your {appName} account
          </p>
        </div>
        <div className="flex flex-col space-y-6">
          <div className="grid gap-2 relative">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              {...register("name")}
              required
            />
            {errors.name && (
              <span className="text-destructive text-xs absolute -bottom-5">
                {errors.name.message}
              </span>
            )}
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
            <Label htmlFor="password">Password</Label>
            <PasswordInput id="password" {...register("password")} required />
            {errors.password && (
              <p className="text-destructive text-xs absolute -bottom-5">
                {errors.password.message}
              </p>
            )}
          </div>
          <div className="grid gap-2 relative">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <PasswordInput
              id="confirmPassword"
              {...register("confirmPassword")}
              required
            />
            {errors.confirmPassword && (
              <p className="text-destructive text-xs absolute -bottom-5">
                {errors.confirmPassword.message}
              </p>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                Registering...
              </>
            ) : (
              "Register"
            )}
          </Button>
          <div className="text-center text-sm">
            Already have an account?{" "}
            <a href="/" className="underline underline-offset-4">
              Login
            </a>
          </div>
        </div>
      </div>
    </form>
  );
};

export default Register;
