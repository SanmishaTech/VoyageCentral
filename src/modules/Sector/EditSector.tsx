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

const sectorSchema = z.object({
  sectorName: z.string().min(1, "Sector name is required"),
});

type SectorFormData = z.infer<typeof sectorSchema>;

interface EditSectorProps {
  sectorId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

const EditSector = ({ sectorId, isOpen, onClose }: EditSectorProps) => {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    reset,
  } = useForm<SectorFormData>({
    resolver: zodResolver(sectorSchema),
    defaultValues: {
      sectorName: "",
    },
  });

  const { data: sectorData, isLoading } = useQuery({
    queryKey: ["sectors", sectorId],
    queryFn: async () => {
      const response = await get(`/sectors/${sectorId}`);
      return response; // API returns the sector object directly
    },
    enabled: !!sectorId && isOpen,
  });

  useEffect(() => {
    if (sectorData) {
      reset({
        sectorName: sectorData.sectorName, // Access the sectorName directly from response
      });
    }
  }, [sectorData, reset]);

  const updateSectorMutation = useMutation({
    mutationFn: (data: SectorFormData) => put(`/sectors/${sectorId}`, data),
    onSuccess: () => {
      toast.success("Sector updated successfully");
      queryClient.invalidateQueries(["sectors"]);
      onClose();
    },
    onError: (error: any) => {
      Validate(error, setError);
      toast.error(error.response?.data?.message || "Failed to update sector");
    },
  });

  const onSubmit = (data: SectorFormData) => {
    updateSectorMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Sector</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center items-center h-[200px]">
            <Loader className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid gap-2 relative">
              <Label htmlFor="sectorName">Sector Name</Label>
              <Input
                id="sectorName"
                placeholder="Enter sector name"
                {...register("sectorName")}
              />
              {errors.sectorName && (
                <span className="text-red-500 text-sm absolute bottom-0 translate-y-[110%]">
                  {errors.sectorName.message}
                </span>
              )}
            </div>

            <DialogFooter>
              <Button
                type="submit"
                className="bg-primary text-white"
                disabled={updateSectorMutation.isLoading}
              >
                Update Sector
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="ml-2"
              >
                Cancel
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditSector;
