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
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { post, put } from "@/services/apiService";

const FormSchema = z.object({
  fairName: z
    .string()
    .min(1, "Fair Name cannot be left blank.") // Ensuring minimum length of 2
    .max(100, "Fair Name must not exceed 100 characters."),
});

type FormInputs = z.infer<typeof FormSchema>;

interface FormProps {
  mode: "create" | "edit";
  fairId?: string;
  onSuccess?: () => void;
  className?: string;
}

const FairForm = ({ mode, fairId, onSuccess, className }: FormProps) => {
  const { id: paramId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    setError,
    formState: { errors },
  } = useForm<FormInputs>({
    resolver: zodResolver(FormSchema),
  });

  const { data: editFairData, isLoading: editFairLoading } = useQuery({
    queryKey: ["editFair", fairId],
    queryFn: async () => {
      const response = await get(`/fairs/${fairId}`);
      return response; // API returns the sector object directly
    },
    enabled: !!fairId && mode === "edit",
  });

  useEffect(() => {
    if (editFairData) {
      reset({
        fairName: editFairData.fairName, // Access the sectorName directly from response
      });
    }
  }, [editFairData, reset]);

  // Mutation for creating a user
  const createMutation = useMutation({
    mutationFn: (data: FormInputs) => post("/fairs", data),
    onSuccess: () => {
      toast.success("Fair created successfully");
      queryClient.invalidateQueries(["fairs"]); // Refetch the users list
      onSuccess?.(); // Call onSuccess callback if provided
    },
    onError: (error: any) => {
      Validate(error, setError);
      toast.error(error.response?.data?.message || "Failed to create Fair");
    },
  });

  // Mutation for updating a user
  const updateMutation = useMutation({
    mutationFn: (data: FormInputs) => put(`/fairs/${fairId}`, data),
    onSuccess: () => {
      toast.success("Fair updated successfully");
      queryClient.invalidateQueries(["fairs"]);
      onSuccess?.(); // Call onSuccess instead of navigating
    },
    onError: (error: any) => {
      Validate(error, setError);
      toast.error(error.response?.data?.message || "Failed to create fair");
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
          <Label htmlFor="fairName">Fair Name</Label>
          <Input
            id="fairName"
            type="text"
            placeholder="Enter bank Name"
            {...register("fairName")}
          />
          {errors.fairName && (
            <span className="text-red-500 text-sm absolute bottom-0 translate-y-[110%]">
              {errors.fairName.message}
            </span>
          )}
        </div>

        {/* Submit and Cancel Buttons */}
        <div className="justify-end flex gap-4">
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

export default FairForm;
