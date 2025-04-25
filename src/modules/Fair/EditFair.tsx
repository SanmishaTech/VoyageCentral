import React from "react";
import FairForm from "./FairForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EditFairDialogProps {
  isOpen: boolean;
  onClose: () => void;
  fairId: string;
}

const EditFair = ({ isOpen, onClose, fairId }: EditFairDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Fair</DialogTitle>
        </DialogHeader>
        <FairForm
          mode="edit"
          fairId={fairId}
          onSuccess={onClose}
          className="mt-4"
        />
      </DialogContent>
    </Dialog>
  );
};

export default EditFair;
