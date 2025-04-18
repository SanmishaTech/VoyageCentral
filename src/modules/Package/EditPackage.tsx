import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, put } from "@/services/apiService";
import { z } from "zod";
import { toast } from "sonner";
import { Button, Input } from "@/components/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loader } from "lucide-react";
import { handleApiValidationErrors } from "@/lib/Handlevalidation"; // Adjust path as needed

const packageSchema = z.object({
  packageName: z.string().min(1, "Package name is required"),
  numberOfBranches: z
    .string()
    .transform(Number)
    .pipe(z.number().min(1, "Must have at least 1 branch")),
  usersPerBranch: z
    .string()
    .transform(Number)
    .pipe(z.number().min(1, "Must have at least 1 User")),
  periodInMonths: z
    .string()
    .transform(Number)
    .pipe(z.number().min(1, "Period must be at least 1 month")),
  cost: z.coerce.number().min(1, "Cost must be at least 1"),
});

type PackageFormData = z.infer<typeof packageSchema>;

interface EditPackageProps {
  packageId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

const EditPackage = ({ packageId, isOpen, onClose }: EditPackageProps) => {
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setError, // Get setError

    getValues, // Still useful for getting field names
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
  const formFieldNames = React.useMemo(
    () => Object.keys(getValues()) as ReadonlyArray<keyof LoginFormInputs>,
    [getValues] // Dependency array ensures it updates if form structure changes (unlikely here)
  );

  // Fetch package details
  const { data: packageData, isLoading } = useQuery({
    queryKey: ["package", packageId],
    queryFn: async () => {
      const response = await get(`/packages/${packageId}`);
      return response;
    },
    enabled: !!packageId && isOpen,
  });

  // Update form when data is loaded
  useEffect(() => {
    if (packageData) {
      reset({
        packageName: packageData.packageName,
        numberOfBranches: String(packageData.numberOfBranches),
        usersPerBranch: String(packageData.usersPerBranch),
        periodInMonths: String(packageData.periodInMonths),
        cost: packageData.cost,
      });
    }
  }, [packageData, reset]);

  // Update package mutation
  const updatePackageMutation = useMutation({
    mutationFn: (data: PackageFormData) => put(`/packages/${packageId}`, data),
    onSuccess: () => {
      toast.success("Package updated successfully");
      queryClient.invalidateQueries(["packages"]);
      onClose();
    },
    onError: (error: any) => {
      handleApiValidationErrors(error, setError, formFieldNames);
      toast.error(error.response?.data?.message || "Failed to update package");
    },
  });

  const onSubmit = (data: PackageFormData) => {
    updatePackageMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Package</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center items-center h-[200px]">
            <Loader className="h-8 w-8 animate-spin" />
          </div>
        ) : (
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
                  step="0.01"
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
                type="submit"
                className="bg-primary text-white"
                disabled={updatePackageMutation.isLoading}
              >
                Update Package
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
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditPackage;
