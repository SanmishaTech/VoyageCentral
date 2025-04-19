import React from "react";
import AirlineForm from "./AirlineForm";
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

const CreateAirline = ({ isOpen, onClose }: CreateAirlineDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Create New Airline</DialogTitle>
        </DialogHeader>
        <AirlineForm mode="create" onSuccess={onClose} className="mt-4" />
      </DialogContent>
    </Dialog>
  );
};
export default CreateAirline;
