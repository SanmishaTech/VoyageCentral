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

const countriesSchema = z.object({
  sectorName: z.string().min(1, "Sector name is required"),
});

type SectorFormData = z.infer<typeof countriesSchema>;

interface CreateSectorProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateSector: React.FC<CreateSectorProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<SectorFormData>({
    resolver: zodResolver(countriesSchema),
    defaultValues: {
      sectorName: "",
    },
  });

  const createSectorMutation = useMutation({
    mutationFn: (newSector: SectorFormData) => post("/sectors", newSector),
    onSuccess: () => {
      toast.success("Sector created successfully");
      queryClient.invalidateQueries(["sectors"]);
      reset();
      onClose();
    },
    onError: () => {
      toast.error("Failed to create sectors");
    },
  });

  const onSubmit = (data: SectorFormData) => {
    createSectorMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Sector</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid gap-2 relative">
            <Label htmlFor="sectorName">Sector Name</Label>
            <Input
              id="sectorName"
              placeholder="Enter Sector Name..."
              {...register("sectorName")}
            />
            {errors.sectorName && (
              <span className="text-red-500 text-sm absolute bottom-0 translate-y-[110%]">
                {errors.sectorName.message}
              </span>
            )}
          </div>

          <DialogFooter>
            <Button type="submit" className="bg-primary text-white">
              Save Sector
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
      </DialogContent>
    </Dialog>
  );
};

export default CreateSector;
