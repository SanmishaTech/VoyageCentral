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
  airlineName: z
    .string()
    .min(1, "Airline Name cannot be left blank.") // Ensuring minimum length of 2
    .max(100, "Airline Name must not exceed 100 characters."),
});

type FormInputs = z.infer<typeof FormSchema>;

interface FormProps {
  mode: "create" | "edit";
  airlineId?: string;
  onSuccess?: () => void;
  className?: string;
}

const AirlineForm = ({ mode, airlineId, onSuccess, className }: FormProps) => {
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
    reset,
    control,
    setError,
    formState: { errors },
  } = useForm<FormInputs>({
    resolver: zodResolver(FormSchema),
  });

  const { data: editAirlineData, isLoading: editAirlineLoading } = useQuery({
    queryKey: ["editAirline", airlineId],
    queryFn: async () => {
      const response = await get(`/airlines/${airlineId}`);
      return response; // API returns the sector object directly
    },
    enabled: !!airlineId && mode === "edit",
  });

  useEffect(() => {
    if (editAirlineData) {
      reset({
        airlineName: editAirlineData.airlineName, // Access the sectorName directly from response
      });
    }
  }, [editAirlineData, reset]);

  // Mutation for creating a user
  const createMutation = useMutation({
    mutationFn: (data: FormInputs) => post("/airlines", data),
    onSuccess: () => {
      toast.success("Airline created successfully");
      queryClient.invalidateQueries(["airlines"]); // Refetch the users list
      onSuccess?.(); // Call onSuccess callback if provided
    },
    onError: (error: any) => {
      Validate(error, setError);
      toast.error(error.response?.data?.message || "Failed to create airline");
    },
  });

  // Mutation for updating a user
  const updateMutation = useMutation({
    mutationFn: (data: FormInputs) => put(`/airlines/${airlineId}`, data),
    onSuccess: () => {
      toast.success("Airline updated successfully");
      queryClient.invalidateQueries(["airlines"]);
      onSuccess?.(); // Call onSuccess instead of navigating
    },
    onError: (error: any) => {
      Validate(error, setError);
      toast.error(error.response?.data?.message || "Failed to create airline");
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
          <Label htmlFor="airlineName">Airline Name</Label>
          <Input
            id="airlineName"
            type="text"
            placeholder="Enter airline Name"
            {...register("airlineName")}
          />
          {errors.airlineName && (
            <span className="text-red-500 text-sm absolute bottom-0 translate-y-[110%]">
              {errors.airlineName.message}
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

export default AirlineForm;
