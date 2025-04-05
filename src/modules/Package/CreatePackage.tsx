import React, { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { post } from "@/services/apiService";
import { Button, Input } from "@/components/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label"; // Import the Label component

interface CreatePackageProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreatePackage: React.FC<CreatePackageProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();

  const [packageName, setPackageName] = useState("");
  const [numberOfBranches, setNumberOfBranches] = useState(1);
  const [usersPerBranch, setUsersPerBranch] = useState(1);
  const [periodInMonths, setPeriodInMonths] = useState(1);
  const [cost, setCost] = useState(0);

  const createPackageMutation = useMutation({
    mutationFn: (newPackage: any) => post("/packages", newPackage),
    onSuccess: () => {
      toast.success("Package created successfully");
      queryClient.invalidateQueries(["packages"]);
      onClose(); // Close the dialog after success
    },
    onError: () => {
      toast.error("Failed to create package");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createPackageMutation.mutate({
      packageName,
      numberOfBranches,
      usersPerBranch,
      periodInMonths,
      cost,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Package</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <Label htmlFor="packageName" className="mb-2">
              Package Name
            </Label>
            <Input
              id="packageName"
              placeholder="Enter package name"
              value={packageName}
              onChange={(e) => setPackageName(e.target.value)}
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="numberOfBranches" className="mb-2">
                Number of Branches
              </Label>
              <Input
                id="numberOfBranches"
                type="number"
                placeholder="Enter number of branches"
                value={numberOfBranches}
                onChange={(e) => setNumberOfBranches(Number(e.target.value))}
                required
              />
            </div>
            <div>
              <Label htmlFor="usersPerBranch" className="mb-2">
                Users Per Branch
              </Label>
              <Input
                id="usersPerBranch"
                type="number"
                placeholder="Enter users per branch"
                value={usersPerBranch}
                onChange={(e) => setUsersPerBranch(Number(e.target.value))}
                required
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="periodInMonths" className="mb-2">
                Period (Months)
              </Label>
              <Input
                id="periodInMonths"
                type="number"
                placeholder="Enter period in months"
                value={periodInMonths}
                onChange={(e) => setPeriodInMonths(Number(e.target.value))}
                required
              />
            </div>
            <div>
              <Label htmlFor="cost" className="mb-2">
                Cost
              </Label>
              <Input
                id="cost"
                type="number"
                placeholder="Enter cost"
                value={cost}
                onChange={(e) => setCost(Number(e.target.value))}
                required
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" className="bg-primary text-white">
              Save Package
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="ml-2"
            >
              Cancel
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePackage;
