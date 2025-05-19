import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  LoaderCircle,
  Trash2,
  PlusCircle,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { post } from "@/services/apiService";
import { Label } from "@/components/ui/label";

const AddClient = ({ onClientAdded }) => {
  const [open, setOpen] = useState(false);

  // Initialize react-hook-form
  const {
    register,
    reset,
    formState: { errors },
    getValues,
  } = useForm({
    defaultValues: {
      clientName: "",
      mobile1: "",
    },
  });

  const handleAddClient = async () => {
    const data = getValues(); // Get form values manually

    if (!data.clientName.trim()) {
      toast.error("Client name is required.");
      return;
    }

    if (!data.mobile1.trim()) {
      toast.error("Client name is required.");
      return;
    }

    try {
      // Call API to add client
      const newClient = await post("/clients", data);

      toast.success("Client added successfully!");
      console.log("new CLient data", newClient);
      // Notify parent component about the new client
      if (onClientAdded) {
        onClientAdded(newClient);
      }

      // Reset form and close dialog
      reset();
      setOpen(false);
    } catch (error) {
      toast.error(error.message || "Failed to add client.");
    }
  };

  const handleCancel = () => {
    reset(); // Reset the form
    setOpen(false); // Close the dialog
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" className="mt-7">
          <PlusCircle className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Client</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label
              htmlFor="mobile1"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="clientName"
              {...register("clientName", {
                required: "Client name is required.",
              })}
              placeholder="Enter client name"
            />
            {errors.clientName && (
              <p className="text-red-500 text-xs mt-1">
                {errors.clientName.message}
              </p>
            )}
          </div>
          <div>
            <Label
              htmlFor="mobile1"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Mobile 1 <span className="text-red-500">*</span>
            </Label>
            <Input
              id="mobile1"
              {...register("mobile1", {
                required: "Mobile number is required.",
                validate: (val) =>
                  /^\d{10}$/.test(val) ||
                  "Mobile number must be exactly 10 digits.",
              })}
              maxLength={10}
              placeholder="Enter primary mobile number"
            />
            {errors.mobile1 && (
              <p className="text-red-500 text-xs mt-1">
                {errors.mobile1.message}
              </p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleAddClient}>Add</Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AddClient;
