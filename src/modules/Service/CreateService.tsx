import React from "react";
import ServiceForm from "./ServiceForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CreateServiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateService = ({ isOpen, onClose }: CreateServiceDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create Service</DialogTitle>
        </DialogHeader>
        <ServiceForm mode="create" onSuccess={onClose} className="mt-4" />
      </DialogContent>
    </Dialog>
  );
};
export default CreateService;
