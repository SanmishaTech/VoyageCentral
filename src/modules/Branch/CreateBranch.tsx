import React from "react";
import BranchForm from "./BranchForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CreateBranchDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateBranch = ({ isOpen, onClose }: CreateBranchDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Branch</DialogTitle>
        </DialogHeader>
        <BranchForm mode="create" onSuccess={onClose} className="mt-4" />
      </DialogContent>
    </Dialog>
  );
};
// test
export default CreateBranch;
