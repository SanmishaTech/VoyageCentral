import React, { useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Validate from "@/lib/Handlevalidation";
import { LoaderCircle } from "lucide-react";
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";
import { get } from "@/services/apiService";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { post, put } from "@/services/apiService";

const FormSchema = z.object({
  serviceName: z
    .string()
    .min(1, "Service Name cannot be left blank.")
    .max(100, "Service Name must not exceed 100 characters."),
});

type FormInputs = z.infer<typeof FormSchema>;

interface FormProps {
  mode: "create" | "edit";
  serviceId?: string;
  onSuccess?: () => void;
  className?: string;
}

const ServiceForm = ({ mode, serviceId, onSuccess, className }: FormProps) => {
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

  const { data: editServiceData, isLoading: editServiceLoading } = useQuery({
    queryKey: ["editService", serviceId],
    queryFn: async () => {
      const response = await get(`/services/${serviceId}`);
      return response;
    },
    enabled: !!serviceId && mode === "edit",
  });

  useEffect(() => {
    if (editServiceData) {
      reset({
        serviceName: editServiceData.serviceName,
      });
    }
  }, [editServiceData, reset]);

  // Mutation for creating a service
  const createMutation = useMutation({
    mutationFn: (data: FormInputs) => post("/services", data),
    onSuccess: () => {
      toast.success("Service created successfully");
      queryClient.invalidateQueries(["services"]);
      onSuccess?.();
    },
    onError: (error: any) => {
      Validate(error, setError);
      toast.error(error.response?.data?.message || "Failed to create Service");
    },
  });

  // Mutation for updating a service
  const updateMutation = useMutation({
    mutationFn: (data: FormInputs) => put(`/services/${serviceId}`, data),
    onSuccess: () => {
      toast.success("Service updated successfully");
      queryClient.invalidateQueries(["services"]);
      onSuccess?.();
    },
    onError: (error: any) => {
      Validate(error, setError);
      toast.error(error.response?.data?.message || "Failed to update Service");
    },
  });

  // Handle form submission
  const onSubmit: SubmitHandler<FormInputs> = (data) => {
    if (mode === "create") {
      createMutation.mutate(data);
    } else {
      updateMutation.mutate(data);
    }
  };

  const handleCancel = () => {
    if (onSuccess) {
      onSuccess();
    }
  };

  return (
    <div className={className}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
        {/* Name Field */}
        <div className="grid gap-2 relative">
          <Label htmlFor="serviceName">Service Name</Label>
          <Input
            id="serviceName"
            type="text"
            placeholder="Enter service name"
            {...register("serviceName")}
          />
          {errors.serviceName && (
            <span className="text-red-500 text-sm absolute bottom-0 translate-y-[110%]">
              {errors.serviceName.message}
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
    </div>
  );
};

export default ServiceForm;
