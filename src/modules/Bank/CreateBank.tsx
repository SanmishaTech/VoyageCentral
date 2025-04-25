import React from "react";
import BankForm from "./BankForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CreateAirlineDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreateBank = ({ isOpen, onClose }: CreateBankDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create Bank</DialogTitle>
        </DialogHeader>
        <BankForm mode="create" onSuccess={onClose} className="mt-4" />
      </DialogContent>
    </Dialog>
  );
};
export default CreateBank;
