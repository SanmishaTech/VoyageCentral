import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, put } from "@/services/apiService";
import { z } from "zod";
import { toast } from "sonner";
import { Button, Input } from "@/components/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loader } from "lucide-react";
import Validate from "@/lib/Handlevalidation";

const accommodationSchema = z.object({
  accommodationName: z
    .string()
    .min(1, "Accommodation Name is required")
    .max(100, "Accommodation Name cannot exceed 100 characters"),
});

type AccommodationFormData = z.infer<typeof accommodationSchema>;

interface EditAccommodationProps {
  accommodationId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

const EditAccommodation = ({
  accommodationId,
  isOpen,
  onClose,
}: EditAccommodationProps) => {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    reset,
  } = useForm<AccommodationFormData>({
    resolver: zodResolver(accommodationSchema),
    defaultValues: {
      accommodationName: "",
    },
  });

  const { data: accommodationData, isLoading } = useQuery({
    queryKey: ["accommodations", accommodationId],
    queryFn: async () => {
      const response = await get(`/accommodations/${accommodationId}`);
      return response; // API returns the sector object directly
    },
    enabled: !!accommodationId && isOpen,
  });

  useEffect(() => {
    if (accommodationData) {
      reset({
        accommodationName: accommodationData.accommodationName, // Access the sectorName directly from response
      });
    }
  }, [accommodationData, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: AccommodationFormData) =>
      put(`/accommodations/${accommodationId}`, data),
    onSuccess: () => {
      toast.success("Accommodation updated successfully");
      queryClient.invalidateQueries(["accommodations"]);
      onClose();
    },
    onError: (error: any) => {
      Validate(error, setError);
      toast.error(
        error.response?.data?.message || "Failed to update accommodation"
      );
    },
  });

  const onSubmit = (data: AccommodationFormData) => {
    updateMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Accommodation</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center items-center h-[200px]">
            <Loader className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid gap-2 relative">
              <Label htmlFor="accommodationName">Accommodation Name</Label>
              <Input
                id="accommodationName"
                placeholder="Enter accommodation name"
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
              <Button
                type="submit"
                className="bg-primary text-white"
                disabled={updateMutation.isLoading}
              >
                Update
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditAccommodation;
