import React from "react";
import StaffForm from "./StaffForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EditStaffDialogProps {
  isOpen: boolean;
  onClose: () => void;
  staffId: string;
}

const EditStaff = ({ isOpen, onClose, staffId }: EditStaffDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Staff Member</DialogTitle>
        </DialogHeader>
        <StaffForm
          mode="edit"
          staffId={staffId}
          onSuccess={onClose}
          className="mt-4"
        />
      </DialogContent>
    </Dialog>
  );
};

export default EditStaff;
