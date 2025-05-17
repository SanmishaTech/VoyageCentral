import React from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { post } from "@/services/apiService";
import { Button, Input } from "@/components/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Validate from "@/lib/Handlevalidation";

const accommodationSchema = z.object({
  accommodationName: z
    .string()
    .min(1, "Accommodation Name is required")
    .max(100, "Accommodation Name cannot exceed 100 characters"),
});

type AccommodationFormData = z.infer<typeof accommodationSchema>;

interface CreateAccommodationProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateAccommodation: React.FC<CreateAccommodationProps> = ({
  isOpen,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
  } = useForm<AccommodationFormData>({
    resolver: zodResolver(accommodationSchema),
    defaultValues: {
      accommodationName: "",
    },
  });
  const createMutation = useMutation({
    mutationFn: (newAccommodation: AccommodationFormData) =>
      post("/accommodations", newAccommodation),
    onSuccess: () => {
      toast.success("Accommodation created successfully");
      queryClient.invalidateQueries(["accommodations"]);
      reset();
      onClose();
    },
    onError: (error: any) => {
      Validate(error, setError);
      toast.error(
        error.response?.data?.message || "Failed to create accommodation"
      );
    },
  });

  const onSubmit = (data: AccommodationFormData) => {
    createMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid gap-2 relative">
            <Label htmlFor="accommodationName">Accommodation Name</Label>
            <Input
              id="accommodationName"
              placeholder="Enter Accommodation Name..."
              {...register("accommodationName")}
            />
            {errors.accommodationName && (
              <span className="text-red-500 text-sm absolute bottom-0 translate-y-[110%]">
                {errors.accommodationName.message}
              </span>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="ml-2"
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-primary text-white">
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateAccommodation;
