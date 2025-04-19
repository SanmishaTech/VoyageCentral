import React from "react";
import AirlineForm from "./AirlineForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface EditAirlineDialogProps {
  isOpen: boolean;
  onClose: () => void;
  airlineId: string;
}

const EditAirline = ({
  isOpen,
  onClose,
  airlineId,
}: EditAirlineDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Edit Airline</DialogTitle>
        </DialogHeader>
        <AirlineForm
          mode="edit"
          airlineId={airlineId}
          onSuccess={onClose}
          className="mt-4"
        />
      </DialogContent>
    </Dialog>
  );
};

export default EditAirline;
