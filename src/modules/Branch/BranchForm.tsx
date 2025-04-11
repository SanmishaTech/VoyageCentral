import React, { useEffect, useState } from "react";
import { useForm, SubmitHandler, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { LoaderCircle } from "lucide-react"; // Import the LoaderCircle icon
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";
import { get } from "@/services/apiService";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { post, put } from "@/services/apiService";

const FormSchema = z.object({
  branchName: z
    .string()
    .min(1, "Branch Name cannot be left blank.") // Ensuring minimum length of 2
    .max(100, "Branch Name must not exceed 100 characters.")
    .refine((val) => /^[A-Za-z\s\u0900-\u097F]+$/.test(val), {
      message: "Branch Name can only contain letters.",
    }),
  contactName: z
    .string()
    .min(1, "Contact Name cannot be left blank.") // Ensuring minimum length of 2
    .max(100, "Contact Name must not exceed 100 characters.")
    .refine((val) => /^[A-Za-z\s\u0900-\u097F]+$/.test(val), {
      message: "Contact Name can only contain letters.",
    }),
  contactMobile: z.string().refine((val) => /^[0-9]{10}$/.test(val), {
    message: "Mobile number must contain exact 10 digits.",
  }),
  contactEmail: z.string().email("email field is required"),
  address: z
    .string()
    .min(1, "Address field is required")
    .max(100, "Address field should not exceed 100 characters"),
});

type FormInputs = z.infer<typeof FormSchema>;

interface FormProps {
  mode: "create" | "edit";
  branchId?: string;
  onSuccess?: () => void;
  className?: string;
}

const BranchForm = ({ mode, branchId, onSuccess, className }: FormProps) => {
  const { id: paramId } = useParams<{ id: string }>();
  const [isLoadingRoles, setIsLoadingRoles] = useState(false);
  const [roles, setRoles] = useState<string[]>([]); // Roles fetched from API
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    control,
    formState: { errors },
  } = useForm<FormInputs>({
    resolver: zodResolver(FormSchema),
  });

  // Fetch user data for edit mode
  useEffect(() => {
    if (mode === "edit" && branchId) {
      const fetchBranch = async () => {
        try {
          const branch = await get(`/branches/${branchId}`);
          setValue("branchName", branch.branchName);
          setValue("contactName", branch.contactName);
          setValue("contactEmail", branch.contactEmail);
          setValue("contactMobile", branch.contactMobile);
          setValue("address", branch.address);
        } catch (error: any) {
          toast.error("Failed to fetch branch details");
        }
      };

      fetchBranch();
    }
  }, [branchId, mode, setValue]);

  // Mutation for creating a user
  const createMutation = useMutation({
    mutationFn: (data: FormInputs) => post("/branches", data),
    onSuccess: () => {
      toast.success("Branch created successfully");
      queryClient.invalidateQueries(["branches"]); // Refetch the users list
      onSuccess?.(); // Call onSuccess callback if provided
    },
    onError: (error: any) => {
      if (error.message) {
        toast.error(error.message);
      } else {
        toast.error("Failed to create Branch");
      }
    },
  });

  // Mutation for updating a user
  const updateMutation = useMutation({
    mutationFn: (data: FormInputs) => put(`/branches/${branchId}`, data),
    onSuccess: () => {
      toast.success("Branch updated successfully");
      queryClient.invalidateQueries(["branches"]);
      onSuccess?.(); // Call onSuccess instead of navigating
    },
    onError: (error: any) => {
      if (error.message) {
        toast.error(error.message);
      } else {
        toast.error("Failed to update branch");
      }
    },
  });

  // Handle form submission
  const onSubmit: SubmitHandler<FormInputs> = (data) => {
    if (mode === "create") {
      createMutation.mutate(data); // Trigger create mutation
    } else {
      updateMutation.mutate(data); // Trigger update mutation
    }
  };

  const handleCancel = () => {
    if (onSuccess) {
      onSuccess();
    }
  };

  // Remove the Card wrapper conditional and always use the dialog form style
  return (
    <div className={className}>
      <FormContent />
    </div>
  );

  function FormContent() {
    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
        {/* Name Field */}
        <div className="grid gap-2 relative">
          <Label htmlFor="branchName">Branch Name</Label>
          <Input
            id="branchName"
            type="text"
            placeholder="Enter branch name"
            {...register("branchName")}
          />
          {errors.branchName && (
            <span className="text-red-500 text-sm absolute bottom-0 translate-y-[110%]">
              {errors.branchName.message}
            </span>
          )}
        </div>

        {/* Name Field */}
        <div className="grid gap-2 relative">
          <Label htmlFor="contactName">Contact Name</Label>
          <Input
            id="contactName"
            type="text"
            placeholder="Enter contact name"
            {...register("contactName")}
          />
          {errors.contactName && (
            <span className="text-red-500 text-sm absolute bottom-0 translate-y-[110%]">
              {errors.contactName.message}
            </span>
          )}
        </div>

        {/* Email Field */}
        <div className="grid gap-2 relative">
          <Label htmlFor="contactEmail">Contact Email</Label>
          <Input
            id="contactEmail"
            type="email"
            placeholder="m@example.com"
            {...register("contactEmail")}
          />
          {errors.contactEmail && (
            <span className="text-red-500 text-sm absolute bottom-0 translate-y-[110%]">
              {errors.contactEmail.message}
            </span>
          )}
        </div>

        {/* Moble Field */}
        <div className="grid gap-2 relative">
          <Label htmlFor="contactMobile">Contact Number</Label>
          <Input
            id="contactMobile"
            type="text"
            maxLength={10}
            placeholder="enter mobile number"
            {...register("contactMobile")}
          />
          {errors.contactMobile && (
            <span className="text-red-500 text-sm absolute bottom-0 translate-y-[110%]">
              {errors.contactMobile.message}
            </span>
          )}
        </div>

        {/* Address Field */}
        <div className="grid gap-2 relative">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            type="text"
            placeholder="enter address"
            {...register("address")}
          />
          {errors.address && (
            <span className="text-red-500 text-sm absolute bottom-0 translate-y-[110%]">
              {errors.address.message}
            </span>
          )}
        </div>

        {/* Submit and Cancel Buttons */}
        <div className="justify-end flex gap-4">
          <Button
            type="submit"
            disabled={createMutation.isLoading || updateMutation.isLoading}
            className="flex items-center justify-center gap-2"
          >
            {createMutation.isLoading || updateMutation.isLoading ? (
              <>
                <LoaderCircle className="animate-spin h-4 w-4" />
                Saving...
              </>
            ) : mode === "create" ? (
              "Create Branch"
            ) : (
              "Save Changes"
            )}
          </Button>
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
        </div>
      </form>
    );
  }
};

export default BranchForm;
