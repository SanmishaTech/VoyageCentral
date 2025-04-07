import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui";
import { PasswordInput } from "@/components/ui/password-input";
import { useMutation } from "@tanstack/react-query"; // Import useMutation
import { patch } from "@/services/apiService"; // Import the patch method
import { toast } from "sonner"; // Import toast for notifications
import Joi from "joi"; // Import Joi for validation

interface ChangePasswordDialogProps {
  userId: number;
  isOpen: boolean;
  onClose: () => void;
}

const ChangePasswordDialog: React.FC<ChangePasswordDialogProps> = ({
  userId,
  isOpen,
  onClose,
}) => {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Joi schema for password validation
  const schema = Joi.object({
    newPassword: Joi.string().min(6).required().label("New Password"),
    confirmPassword: Joi.string()
      .valid(Joi.ref("newPassword"))
      .required()
      .label("Confirm Password")
      .messages({ "any.only": "Passwords do not match!" }),
  });

  // Mutation for changing the password
  const changePasswordMutation = useMutation({
    mutationFn: (password: string) =>
      patch(`/users/${userId}/password`, { password }),
    onSuccess: () => {
      toast.success("Password changed successfully!");
      onClose(); // Close the dialog after success
    },
    onError: () => {
      toast.error("Failed to change password. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate passwords using Joi
    const { error } = schema.validate({ newPassword, confirmPassword });
    if (error) {
      toast.error(error.details[0].message);
      return;
    }

    // Trigger the mutation
    changePasswordMutation.mutate(newPassword);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Change Password</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <PasswordInput
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="w-full"
            />
            <PasswordInput
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full"
            />
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={changePasswordMutation.isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={changePasswordMutation.isLoading}
            >
              {changePasswordMutation.isLoading ? "Changing..." : "Change Password"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ChangePasswordDialog;