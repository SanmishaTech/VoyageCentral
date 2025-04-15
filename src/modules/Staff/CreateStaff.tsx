import React from "react";
import StaffForm from "./StaffForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CreateStaffDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateStaff = ({ isOpen, onClose }: CreateStaffDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Staff Member</DialogTitle>
        </DialogHeader>
        <StaffForm mode="create" onSuccess={onClose} className="mt-4" />
      </DialogContent>
    </Dialog>
  );
};

export default CreateStaff;
