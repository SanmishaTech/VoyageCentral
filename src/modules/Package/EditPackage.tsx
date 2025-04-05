import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, put } from "@/services/apiService";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Loader } from "lucide-react";

// Schema for package validation
const packageSchema = z.object({
  packageName: z.string().min(1, "Package name is required"),
  numberOfBranches: z.coerce
    .number()
    .min(1, "Number of branches must be at least 1"),
  usersPerBranch: z.coerce
    .number()
    .min(1, "Users per branch must be at least 1"),
  periodInMonths: z.coerce.number().min(1, "Period must be at least 1 month"),
  cost: z.coerce.number().min(0, "Cost must be a non-negative number"),
});

type PackageFormData = z.infer<typeof packageSchema>;

interface EditPackageProps {
  packageId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

const EditPackage = ({ packageId, isOpen, onClose }: EditPackageProps) => {
  const queryClient = useQueryClient();

  const form = useForm<PackageFormData>({
    resolver: zodResolver(packageSchema),
    defaultValues: {
      packageName: "",
      numberOfBranches: 1,
      usersPerBranch: 1,
      periodInMonths: 1,
      cost: 0,
    },
  });

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
      form.reset({
        packageName: packageData.packageName,
        numberOfBranches: packageData.numberOfBranches,
        usersPerBranch: packageData.usersPerBranch,
        periodInMonths: packageData.periodInMonths,
        cost: packageData.cost,
      });
    }
  }, [packageData, form]);

  // Update package mutation
  const updatePackageMutation = useMutation({
    mutationFn: (data: PackageFormData) => put(`/packages/${packageId}`, data),
    onSuccess: () => {
      toast.success("Package updated successfully");
      queryClient.invalidateQueries(["packages"]);
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to update package");
    },
  });

  const onSubmit = (data: PackageFormData) => {
    updatePackageMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Package</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <div className="flex justify-center items-center h-[200px]">
            <Loader className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="packageName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Package Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="numberOfBranches"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Branches</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="usersPerBranch"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Users Per Branch</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="periodInMonths"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Period (Months)</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cost (₹)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder="Enter amount in ₹"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-4 mt-6">
                <Button
                  type="submit"
                  loading={updatePackageMutation.isLoading}
                  disabled={updatePackageMutation.isLoading}
                >
                  Update Package
                </Button>
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditPackage;
