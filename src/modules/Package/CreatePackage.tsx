import React from "react";
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
import { Label } from "@/components/ui/label";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ZodError, ZodIssue } from "zod";
import Validate from "@/lib/Handlevalidation";

//
// 1. Define the shape of what your backend is returning
//
interface BackendErrorResponse {
  errors: Array<{
    path: Array<string | number>;
    message: string;
  }>;
}

const packageSchema = z.object({
  packageName: z.string().min(1, "Package name is required"),
  numberOfBranches: z
    .string()
    .transform(Number)
    .pipe(
      z
        .number()
        .min(1, "Must have at least 1 branch")
        .max(100, "Cannot exceed 100 branches")
    ),
  usersPerBranch: z
    .string()
    .transform(Number)
    .pipe(
      z
        .number()
        .min(1, "Must have at least 1 user")
        .max(1000, "Cannot exceed 1000 users per branch")
    ),
  periodInMonths: z
    .string()
    .transform(Number)
    .pipe(
      z
        .number()
        .min(1, "Period must be at least 1 month")
        .max(60, "Period cannot exceed 60 months")
    ),
  cost: z.coerce
    .number()
    .min(1, "Cost must be at least 1")
    .max(1000000, "Cost cannot exceed 1,000,000"),
});

type PackageFormData = z.infer<typeof packageSchema>;

interface CreatePackageProps {
  isOpen: boolean;
  onClose: () => void;
}

const CreatePackage: React.FC<CreatePackageProps> = ({ isOpen, onClose }) => {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setError,
  } = useForm<PackageFormData>({
    resolver: zodResolver(packageSchema),
    defaultValues: {
      packageName: "",
      numberOfBranches: "",
      usersPerBranch: "",
      periodInMonths: "",
      cost: "",
    },
  });
  function mapBackendErrorToIssue(err: BackendErrorResponse): ZodIssue[] {
    return err.errors.map(({ path, message }) => ({
      // you can choose a more specific code if you like,
      // but "custom" is fine for server‐side messages
      code: "custom" as const,
      path,
      message,
    }));
  }

  //
  // 3a. If you just want the array of issues:
  //
  function getZodIssuesFromBackend(err: BackendErrorResponse): ZodIssue[] {
    return mapBackendErrorToIssue(err);
  }

  const createPackageMutation = useMutation({
    mutationFn: (newPackage: PackageFormData) => post("/packages", newPackage),
    onSuccess: () => {
      toast.success("Package created successfully");
      queryClient.invalidateQueries(["packages"]);
      reset();
      onClose();
    },
    onError: (error) => {
      Validate(error, setError);
      throwAsZodError(backendErr);
      toast.error("Failed to create package");
    },
  });

  const onSubmit = (data: PackageFormData) => {
    createPackageMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid gap-2 relative">
            <Label htmlFor="packageName">Package Name</Label>
            <Input
              id="packageName"
              placeholder="Enter package name"
              {...register("packageName")}
            />
            {errors.packageName && (
              <span className="text-red-500 text-sm absolute bottom-0 translate-y-[110%]">
                {errors.packageName.message}
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2 relative">
              <Label htmlFor="numberOfBranches">Number of Branches</Label>
              <Input
                id="numberOfBranches"
                placeholder="Enter number of branches"
                type="number"
                {...register("numberOfBranches")}
              />
              {errors.numberOfBranches && (
                <span className="text-red-500 text-sm absolute bottom-0 translate-y-[110%]">
                  {errors.numberOfBranches.message}
                </span>
              )}
            </div>
            <div className="grid gap-2 relative">
              <Label htmlFor="usersPerBranch">Users Per Branch</Label>
              <Input
                id="usersPerBranch"
                placeholder="Enter users per branch"
                type="number"
                {...register("usersPerBranch")}
              />
              {errors.usersPerBranch && (
                <span className="text-red-500 text-sm absolute bottom-0 translate-y-[110%]">
                  {errors.usersPerBranch.message}
                </span>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2 relative">
              <Label htmlFor="periodInMonths">Period (Months)</Label>
              <Input
                id="periodInMonths"
                placeholder="Enter period in months"
                type="number"
                {...register("periodInMonths")}
              />
              {errors.periodInMonths && (
                <span className="text-red-500 text-sm absolute bottom-0 translate-y-[110%]">
                  {errors.periodInMonths.message}
                </span>
              )}
            </div>
            <div className="grid gap-2 relative">
              <Label htmlFor="cost">Cost (₹)</Label>
              <Input
                id="cost"
                placeholder="Enter cost"
                type="number"
                {...register("cost")}
              />
              {errors.cost && (
                <span className="text-red-500 text-sm absolute bottom-0 translate-y-[110%]">
                  {errors.cost.message}
                </span>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="ml-2"
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-primary text-white">
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreatePackage;
