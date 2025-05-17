import React, { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { toast } from "sonner";
import { post } from "@/services/apiService";
import { LoaderCircle } from "lucide-react";
import Validate from "@/lib/Handlevalidation";

const updateProfileSchema = z.object({
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name cannot exceed 100 characters")
    .regex(/^[A-Za-z\s]+$/, "Name can only contain letters."),
  email: z
    .string()
    .email("Invalid email address")
    .min(1, "Email is required")
    .max(100, "Email cannot exceed 100 characters"),
});

type UpdateProfileInputs = z.infer<typeof updateProfileSchema>;

const UpdateProfile = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    setError,
    formState: { errors },
  } = useForm<UpdateProfileInputs>({
    resolver: zodResolver(updateProfileSchema),
  });

  // Load user data from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      setUserId(parsedUser.id);
      setValue("name", parsedUser.name);
      setValue("email", parsedUser.email);
    }
  }, [setValue]);

  const onSubmit: SubmitHandler<UpdateProfileInputs> = async (data) => {
    if (!userId) {
      toast.error("User ID not found");
      return;
    }

    setIsLoading(true);

    try {
      await post(`/profile`, {
        id: userId,
        name: data.name,
        email: data.email,
      });

      // Update localStorage with new values
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        localStorage.setItem(
          "user",
          JSON.stringify({
            ...parsedUser,
            name: data.name,
            email: data.email,
          })
        );
      }

      toast.success("Profile updated successfully");
    } catch (error: any) {
      Validate(error, setError);
      toast.error(error.message || "Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="mx-auto mt-10">
      <CardHeader>
        <CardTitle>Update Profile</CardTitle>
        <CardDescription>
          Update your personal details and contact information.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              type="text"
              placeholder="John Doe"
              {...register("name")}
            />
            {errors.name && (
              <span className="text-red-500 text-sm">
                {errors.name.message}
              </span>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="m@example.com"
              {...register("email")}
            />
            {errors.email && (
              <span className="text-red-500 text-sm">
                {errors.email.message}
              </span>
            )}
          </div>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Profile"
            )}
          </Button>
        </form>
      </CardContent>
      <CardFooter>
        <p className="text-sm text-muted-foreground">
          Make sure your information is accurate before saving.
        </p>
      </CardFooter>
    </Card>
  );
};

export default UpdateProfile;
