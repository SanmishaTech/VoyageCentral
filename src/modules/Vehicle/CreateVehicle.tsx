import React from "react";
import VehicleForm from "./VehicleForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CreateVehicleDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateVehicle = ({ isOpen, onClose }: CreateVehicleDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Vehicle</DialogTitle>
        </DialogHeader>
        <VehicleForm mode="create" onSuccess={onClose} className="mt-4" />
      </DialogContent>
    </Dialog>
  );
};
export default CreateVehicle;
