import React from "react";
import VehicleForm from "./VehicleForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EditVehicleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  vehicleId: string;
}

const EditVehicle = ({
  isOpen,
  onClose,
  vehicleId,
}: EditVehicleDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Vehicle</DialogTitle>
        </DialogHeader>
        <VehicleForm
          mode="edit"
          vehicleId={vehicleId}
          onSuccess={onClose}
          className="mt-4"
        />
      </DialogContent>
    </Dialog>
  );
};

export default EditVehicle;
