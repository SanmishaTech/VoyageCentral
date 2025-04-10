import React from "react";
import BranchForm from "./BranchForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EditBranchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  branchId: string;
}

const EditBranch = ({ isOpen, onClose, branchId }: EditBranchDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Branch</DialogTitle>
        </DialogHeader>
        <BranchForm
          mode="edit"
          branchId={branchId}
          onSuccess={onClose}
          className="mt-4"
        />
      </DialogContent>
    </Dialog>
  );
};

export default EditBranch;
