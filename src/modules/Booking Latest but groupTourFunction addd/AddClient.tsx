import React, { useState } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { PlusCircle } from "lucide-react";
import { post } from "@/services/apiService"; // Adjust import as needed

const AddClient = ({ onClientAdded }) => {
  const [open, setOpen] = useState(false);

  const {
    register,
    reset,
    handleSubmit,
    formState: { errors },
  } = useForm({
    defaultValues: {
      clientName: "",
      mobile1: "",
    },
  });

  const onSubmit = async (data) => {
    try {
      await post("/clients", data);
      toast.success("Client added successfully!");
      reset();
      setOpen(false);
      if (onClientAdded) onClientAdded();
    } catch (error) {
      toast.error(error.message || "Failed to add client.");
    }
  };

  const handleCancel = () => {
    reset();
    setOpen(false);
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
              htmlFor="clientName"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Client Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="clientName"
              {...register("clientName", {
                required: "Client name is required.",
                minLength: {
                  value: 1,
                  message: "Name cannot be left blank.",
                },
                maxLength: {
                  value: 100,
                  message: "Name must not exceed 100 characters.",
                },
                validate: (val) =>
                  /^[A-Za-z\s\u0900-\u097F]+$/.test(val) ||
                  "Name can only contain letters.",
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
              maxLength={10}
              {...register("mobile1", {
                required: "Mobile number is required.",
                validate: (val) =>
                  /^\d{10}$/.test(val) ||
                  "Mobile number must be exactly 10 digits.",
              })}
              placeholder="Enter primary mobile number"
            />
            {errors.mobile1 && (
              <p className="text-red-500 text-xs mt-1">
                {errors.mobile1.message}
              </p>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSubmit(onSubmit)}>
            Add Client
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AddClient;
