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
import Validate from "@/lib/Handlevalidation";

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
    .max(100, "Contact Name must not exceed 100 characters.")
    .regex(
      /^[A-Za-z\s\u0900-\u097F]*$/,
      "Contact Name can only contain letters."
    )
    .optional(),
  pincode: z.string().refine((val) => /^\d{6}$/.test(val), {
    message: "Pincode must be of 6 digits.",
  }),

  contactMobile: z
    .string()
    .max(20, "Mobile number must not exceed 20 characters.") // Allow space for country code and mobile number
    .refine(
      (val) =>
        val === "" ||
        /^[+]?[0-9]{1,4}[-\s]?[0-9]{6,15}$/.test(val) ||
        /^[6-9]\d{9}$/.test(val),
      {
        message:
          "Mobile number must be a valid number (with or without country code).",
      }
    )
    .optional(),
  contactEmail: z
    .string()
    .refine(
      (val) =>
        val === "" || val === null || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      {
        message: "Email must be a valid email address.",
      }
    )
    .optional(),
  address: z
    .string()
    .min(1, "Address field is required")
    .max(100, "Address field should not exceed 100 characters"),
});

type FormInputs = z.infer<typeof FormSchema>;
const defaultValues: FormInputs = {
  branchName: "",
  contactName: "",
  pincode: "",
  contactMobile: "",
  contactEmail: "",
  address: "",
};

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
    setError,
    formState: { errors },
  } = useForm<FormInputs>({
    resolver: zodResolver(FormSchema),
    defaultValues: mode === "create" ? defaultValues : undefined, // Use default values in create mode
  });

  // Fetch user data for edit mode
  useEffect(() => {
    if (mode === "edit" && branchId) {
      const fetchBranch = async () => {
        try {
          const branch = await get(`/branches/${branchId}`);
          setValue("branchName", branch.branchName || "");
          setValue("contactName", branch.contactName || "");
          setValue("contactEmail", branch.contactEmail || "");
          setValue("contactMobile", branch.contactMobile || "");
          setValue("address", branch.address || "");
          setValue("pincode", branch.pincode || "");
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
      Validate(error, setError);
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
      Validate(error, setError);
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
          <Label htmlFor="branchName">
            Branch Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="branchName"
            type="text"
            placeholder="Enter Branch Name"
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
            placeholder="Enter Contact Name"
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
            placeholder="Username@example.com"
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
            placeholder="Enter Mobile Number"
            {...register("contactMobile")}
          />
          {errors.contactMobile && (
            <span className="text-red-500 text-sm absolute bottom-0 translate-y-[110%]">
              {errors.contactMobile.message}
            </span>
          )}
        </div>

        {/* Address Field */}
        {/* <div className="grid gap-2 relative">
          <Label htmlFor="address">Address</Label>
          <Input
            id="address"
            type="text"
            placeholder="Enter Address"
            {...register("address")}
          />
          {errors.address && (
            <span className="text-red-500 text-sm absolute bottom-0 translate-y-[110%]">
              {errors.address.message}
            </span>
          )}
        </div> */}
        <div className="grid grid-cols-3 gap-4">
          {/* Address Field - spans 2 columns */}
          <div className="col-span-2 relative">
            <Label className="mb-1" htmlFor="address">
              Address <span className="text-red-500">*</span>
            </Label>
            <Input
              id="address"
              type="text"
              placeholder="Enter Address"
              {...register("address")}
            />
            {errors.address && (
              <span className="text-red-500 text-sm absolute bottom-0 translate-y-[110%]">
                {errors.address.message}
              </span>
            )}
          </div>

          {/* Pincode Field - spans 1 column */}
          <div className="relative">
            <Label className="mb-1" htmlFor="pincode">
              Pincode <span className="text-red-500">*</span>
            </Label>
            <Input
              id="pincode"
              type="text"
              placeholder="Enter Pincode"
              maxLength={6}
              {...register("pincode")}
            />
            {errors.pincode && (
              <span className="text-red-500 text-xs absolute bottom-0 translate-y-[110%]">
                {errors.pincode.message}
              </span>
            )}
          </div>
        </div>

        {/* Submit and Cancel Buttons */}
        <div className="justify-end flex gap-4 mt-3">
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
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
              "Create"
            ) : (
              "Update"
            )}
          </Button>
        </div>
      </form>
    );
  }
};

export default BranchForm;
