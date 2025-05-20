import React from "react";
import ServiceForm from "./ServiceForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EditServiceDialogProps {
  isOpen: boolean;
  onClose: () => void;
  serviceId: string;
}

const EditService = ({
  isOpen,
  onClose,
  serviceId,
}: EditServiceDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Service</DialogTitle>
        </DialogHeader>
        <ServiceForm
          mode="edit"
          serviceId={serviceId}
          onSuccess={onClose}
          className="mt-4"
        />
      </DialogContent>
    </Dialog>
  );
};

export default EditService;
