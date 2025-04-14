import { useEffect, useState } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { get } from "@/services/apiService";
import { useMutation } from "@tanstack/react-query";
import { post, put } from "@/services/apiService";
import { PasswordInput } from "@/components/ui/password-input";
import Validate from "@/lib/Handlevalidation";

interface Role {
  name: string;
  permissions: string[];
}

interface ApiResponse {
  roles: Record<string, Role>;
}

interface User {
  name: string;
  email: string;
  role: string;
  active: boolean;
}

const userFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long")
    .optional(),
  role: z.string().min(1, "Role is required"),
  active: z.boolean().optional(),
});

type UserFormInputs = z.infer<typeof userFormSchema>;

interface UserFormProps {
  mode: "create" | "edit";
  userId?: string;
  onSuccess?: () => void;
}

const UserForm = ({ mode, userId, onSuccess }: UserFormProps) => {
  const [roles, setRoles] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<UserFormInputs>({
    resolver: zodResolver(userFormSchema),
  });

  const active = watch("active");

  // Fetch roles from API
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = (await get("/roles")) as ApiResponse;
        const formattedRoles = Object.values(response.roles).map(
          (role) => role.name
        );
        setRoles(formattedRoles);
      } catch (_error: unknown) {
        toast.error("Failed to fetch roles");
      }
    };

    fetchRoles();
  }, []);

  // Fetch user data for edit mode
  useEffect(() => {
    if (mode === "edit" && userId) {
      const fetchUser = async () => {
        try {
          const response = (await get(`/users/${userId}`)) as User;
          setValue("name", response.name);
          setValue("email", response.email);
          setValue("role", response.role);
          setValue("active", response.active);
        } catch (_error: unknown) {
          toast.error("Failed to fetch user details");
        }
      };

      fetchUser();
    }
  }, [userId, mode, setValue]);

  // Mutation for creating a user
  const createUserMutation = useMutation<unknown, Error, UserFormInputs>({
    mutationFn: (data: UserFormInputs) => post("/users", data),
    onSuccess: () => {
      toast.success("User created successfully");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onSuccess?.();
    },
    onError: (error: Error) => {
      Validate(error, setError);
      toast.error(error.message || "Failed to create user");
    },
  });

  // Mutation for updating a user
  const updateUserMutation = useMutation<unknown, Error, UserFormInputs>({
    mutationFn: (data: UserFormInputs) => put(`/users/${userId}`, data),
    onSuccess: () => {
      toast.success("User updated successfully");
      queryClient.invalidateQueries({ queryKey: ["users"] });
      onSuccess?.();
    },
    onError: (error: Error) => {
      Validate(error, setError);
      toast.error(error.message || "Failed to update user");
    },
  });

  // Handle form submission
  const onSubmit: SubmitHandler<UserFormInputs> = (data) => {
    if (mode === "create") {
      createUserMutation.mutate(data);
    } else {
      updateUserMutation.mutate(data);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Name Field */}
      <div className="grid gap-2">
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          type="text"
          placeholder="John Doe"
          {...register("name")}
        />
        {errors.name && (
          <span className="text-red-500 text-sm">{errors.name.message}</span>
        )}
      </div>

      {/* Email Field */}
      <div className="grid gap-2">
        <Label htmlFor="email">Email Address</Label>
        <Input
          id="email"
          type="email"
          placeholder="m@example.com"
          {...register("email")}
        />
        {errors.email && (
          <span className="text-red-500 text-sm">{errors.email.message}</span>
        )}
      </div>

      {/* Password Field (Only for Create Mode) */}
      {mode === "create" && (
        <div className="grid gap-2">
          <Label htmlFor="password">Password</Label>
          <PasswordInput
            id="password"
            placeholder="Enter a secure password"
            {...register("password")}
          />
          {errors.password && (
            <span className="text-red-500 text-sm">
              {errors.password.message}
            </span>
          )}
        </div>
      )}

      {/* Role and Active Fields in the Same Row */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Role Dropdown */}
        <div className="grid gap-2">
          <Label htmlFor="role">Role</Label>
          <Select
            value={watch("role")}
            onValueChange={(value) => setValue("role", value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.role && (
            <span className="text-red-500 text-sm">{errors.role.message}</span>
          )}
        </div>

        {/* Active Toggle */}
        <div className="flex items-center gap-2">
          <Label htmlFor="active">Active</Label>
          <Switch
            id="active"
            checked={active}
            onCheckedChange={(checked) => setValue("active", checked)}
          />
        </div>
      </div>

      {/* Submit and Cancel Buttons */}
      <div className="flex gap-4">
        <Button
          type="submit"
          disabled={
            createUserMutation.isPending || updateUserMutation.isPending
          }
          className="flex items-center justify-center gap-2"
        >
          {createUserMutation.isPending || updateUserMutation.isPending ? (
            <>
              <LoaderCircle className="animate-spin h-4 w-4" />
              Saving...
            </>
          ) : mode === "create" ? (
            "Create User"
          ) : (
            "Save Changes"
          )}
        </Button>
        <Button type="button" variant="outline" onClick={() => onSuccess?.()}>
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default UserForm;
