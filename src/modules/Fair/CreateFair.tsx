import React from "react";
import FairForm from "./FairForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CreateFairDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateFair = ({ isOpen, onClose }: CreateFairDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create Fair</DialogTitle>
        </DialogHeader>
        <FairForm mode="create" onSuccess={onClose} className="mt-4" />
      </DialogContent>
    </Dialog>
  );
};
export default CreateFair;
