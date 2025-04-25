import React from "react";
import BankForm from "./BankForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EditBankDialogProps {
  isOpen: boolean;
  onClose: () => void;
  bankId: string;
}

const EditBank = ({ isOpen, onClose, bankId }: EditBankDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Bank</DialogTitle>
        </DialogHeader>
        <BankForm
          mode="edit"
          bankId={bankId}
          onSuccess={onClose}
          className="mt-4"
        />
      </DialogContent>
    </Dialog>
  );
};

export default EditBank;
