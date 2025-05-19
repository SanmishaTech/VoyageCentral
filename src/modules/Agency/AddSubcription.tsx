import React, { useEffect, useState } from "react";
import { z } from "zod";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { get, post, put } from "@/services/apiService"; // Assuming this handles the base URL internally
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { paymentModeOptions } from "@/config/data";
import Validate from "@/lib/Handlevalidation";

const subscriptionSchema = z
  .object({
    packageId: z.string().min(1, "Package is required"),
    // amont statr
    cgstPercent: z
      .union([z.string(), z.number()])
      .optional()
      .transform((val) =>
        val === "" || val == null ? undefined : parseFloat(val)
      )
      .refine(
        (val) => val === undefined || (!isNaN(val) && val >= 0 && val <= 100),
        {
          message: "CGST percent must be between 0 and 100",
        }
      ),

    cgstAmount: z
      .union([z.string(), z.number()])
      .optional()
      .transform((val) =>
        val === "" || val == null ? undefined : parseFloat(val)
      )
      .refine((val) => val === undefined || (!isNaN(val) && val >= 0), {
        message: "CGST amount must be a positive number",
      }),

    sgstPercent: z
      .union([z.string(), z.number()])
      .optional()
      .transform((val) =>
        val === "" || val == null ? undefined : parseFloat(val)
      )
      .refine(
        (val) => val === undefined || (!isNaN(val) && val >= 0 && val <= 100),
        {
          message: "SGST percent must be between 0 and 100",
        }
      ),

    sgstAmount: z
      .union([z.string(), z.number()])
      .optional()
      .transform((val) =>
        val === "" || val == null ? undefined : parseFloat(val)
      )
      .refine((val) => val === undefined || (!isNaN(val) && val >= 0), {
        message: "SGST amount must be a positive number",
      }),

    igstPercent: z
      .union([z.string(), z.number()])
      .optional()
      .transform((val) =>
        val === "" || val == null ? undefined : parseFloat(val)
      )
      .refine(
        (val) => val === undefined || (!isNaN(val) && val >= 0 && val <= 100),
        {
          message: "IGST percent must be between 0 and 100",
        }
      ),

    igstAmount: z
      .union([z.string(), z.number()])
      .optional()
      .transform((val) => {
        if (val === "" || val == null) return undefined;
        return typeof val === "number" ? val : parseFloat(val);
      })
      .refine((val) => val === undefined || (!isNaN(val) && val >= 0), {
        message: "IGST amount must be a positive number",
      }),

    totalAmount: z
      .union([z.string(), z.number()])
      .transform((val) => parseFloat(val))
      .refine((val) => !isNaN(val) && val >= 0, {
        message: "Total amount must be a positive number",
      }),

    paymentDate: z.string().min(1, "Payment date is required"),

    paymentMode: z.string().min(1, "Payment mode is required"),

    utrNumber: z
      .string()
      .optional()
      .refine((val) => !val || /^[A-Za-z0-9]{12,22}$/.test(val), {
        message: "UTR number must be 12 to 22 alphanumeric characters",
      }),
    neftImpfNumber: z
      .string()
      .optional()
      .refine((val) => !val || /^[A-Za-z0-9]{12,22}$/.test(val), {
        message: "NEFT/IMPS number must be 12 to 22 alphanumeric characters",
      }),
    chequeNumber: z
      .string()
      .optional()
      .refine((val) => !val || /^[0-9]{6,12}$/.test(val), {
        message: "Cheque number must be 6 to 12 digits",
      }),
    chequeDate: z.string().optional(),
    bankName: z.string().optional(),
    // amount end
  })
  .superRefine((data, ctx) => {
    if (data.paymentMode === "UPI" && !data.utrNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["utrNumber"],
        message: "UTR Number is required for UPI payment",
      });
    }
    if (data.paymentMode === "Net Banking" && !data.neftImpfNumber) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["neftImpfNumber"],
        message: "NEFT/IMPS Number is required for Net Banking payment",
      });
    }
    if (data.paymentMode === "Cheque") {
      if (!data.chequeNumber) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["chequeNumber"],
          message: "Cheque Number is required for Cheque payment",
        });
      }
      if (!data.chequeDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["chequeDate"],
          message: "Cheque Date is required for Cheque payment",
        });
      }
      if (!data.bankName) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["bankName"],
          message: "Bank Name is required for Cheque payment",
        });
      }
    }
  });

type SubscriptionFormInputs = z.infer<typeof subscriptionSchema>;

interface AddSubscriptionProps {
  agencyId: string;
}

const AddSubscription: React.FC<AddSubscriptionProps> = ({ agencyId }) => {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: packages = [] } = useQuery({
    queryKey: ["packages"],
    queryFn: async () => {
      const response = await get("/packages?limit=100");
      return response.packages;
    },
  });

  const {
    data: agencyData,
    isLoading: isAgencyLoading,
    isError: isAgencyError,
    error: agencyError,
  } = useQuery({
    queryKey: ["agency", agencyId],
    queryFn: async () => {
      const response = await get(`/agencies/${agencyId}`);
      console.log("Fetched agency data:", response);

      return response;
    },
    enabled: !!agencyId,
  });
  console.log("agencyData", agencyData);
  console.log("agencyId", agencyId);
  if (isAgencyError) {
    console.error("Agency fetch error:", agencyError);
  }
  const addSubscriptionMutation = useMutation({
    mutationFn: (data: any) => post("/subscriptions", data),
    onSuccess: () => {
      queryClient.invalidateQueries(["subscriptions", agencyId]);
      queryClient.invalidateQueries(["agency", agencyId]);

      reset();
      setOpen(false);
      toast.success("Subscription added successfully!");
    },
    onError: (error) => {
      Validate(setValue, error);
      toast.error("Failed to add subscription");
      console.error("Failed to add subscription:", error);
    },
  });

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<SubscriptionFormInputs>({
    resolver: zodResolver(subscriptionSchema),
    defaultValues: {
      packageId: "",
      paymentMode: "",
      paymentDate: new Date().toISOString().split("T")[0],
      cgstPercent: undefined,
      cgstAmount: undefined,
      sgstPercent: undefined,
      sgstAmount: undefined,
      igstPercent: undefined,
      igstAmount: undefined,
      totalAmount: undefined,
      utrNumber: "",
      neftImpfNumber: "",
      chequeNumber: "",
      chequeDate: "",
      bankName: "",
    },
  });

  // payment details and gst calculation start
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [isMaharashtra, setIsMaharashtra] = useState(false);

  const cgstPercent = watch("cgstPercent");
  const sgstPercent = watch("sgstPercent");
  const igstPercent = watch("igstPercent");
  const packageId = watch("packageId");

  // Find selected package and state logic (adjust as per your state selection UI)
  useEffect(() => {
    const pkg = packages.find((p: any) => String(p.id) === packageId);
    setSelectedPackage(pkg || null);
    // Set isMaharashtra based on your state selection logic
  }, [packageId, packages]);

  useEffect(() => {
    if (agencyData?.state?.stateName) {
      setIsMaharashtra(
        agencyData.state.stateName.trim().toLowerCase() === "maharashtra"
      );
    } else {
      setIsMaharashtra(false);
    }
  }, [agencyData]);

  useEffect(() => {
    if (!selectedPackage) return;
    const cost = Number(selectedPackage.cost) || 0;
    if (isMaharashtra) {
      const cgst = ((Number(cgstPercent) || 0) / 100) * cost;
      const sgst = ((Number(sgstPercent) || 0) / 100) * cost;
      setValue("cgstAmount", cgst.toFixed(2));
      setValue("sgstAmount", sgst.toFixed(2));
      setValue("igstAmount", "0.00");
      setValue("totalAmount", (cost + cgst + sgst).toFixed(2));
    } else {
      const igst = ((Number(igstPercent) || 0) / 100) * cost;
      setValue("igstAmount", igst.toFixed(2));
      setValue("cgstAmount", "0.00");
      setValue("sgstAmount", "0.00");
      setValue("totalAmount", (cost + igst).toFixed(2));
    }
  }, [
    selectedPackage,
    cgstPercent,
    sgstPercent,
    igstPercent,
    setValue,
    isMaharashtra,
  ]);
  //  payment details and gst calculation end

  useEffect(() => {
    if (!selectedPackage) return;
    if (isMaharashtra) {
      setValue("cgstPercent", 9);
      setValue("sgstPercent", 9);
      setValue("igstPercent", 0);
    } else {
      setValue("cgstPercent", 0);
      setValue("sgstPercent", 0);
      setValue("igstPercent", 18);
    }
  }, [selectedPackage, setValue]);

  // payment mode
  useEffect(() => {
    const paymentMode = watch("paymentMode");
    if (paymentMode === "Cash") {
      setValue("utrNumber", "");
      setValue("neftImpfNumber", "");
      setValue("chequeNumber", "");
      setValue("chequeDate", "");
      setValue("bankName", "");
    } else if (paymentMode === "UPI") {
      setValue("neftImpfNumber", "");
      setValue("chequeNumber", "");
      setValue("chequeDate", "");
      setValue("bankName", "");
    } else if (paymentMode === "Net Banking") {
      setValue("utrNumber", "");
      setValue("chequeNumber", "");
      setValue("chequeDate", "");
      setValue("bankName", "");
    } else if (paymentMode === "Cheque") {
      setValue("utrNumber", "");
      setValue("neftImpfNumber", "");
    }
  }, [watch("paymentMode"), setValue]);

  const onSubmit = (data: SubscriptionFormInputs) => {
    addSubscriptionMutation.mutate({
      ...data,
      agencyId: Number(agencyId),
      packageId: Number(data.packageId),
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Add Subscription</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] md:max-w-[768px] lg:max-w-[900px]">
        <DialogHeader>
          <DialogTitle>Add Subscription</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 py-4">
          {/* Agency info */}
          <div className="grid gap-1">
            <Label>Agency</Label>
            <div className="p-2 border rounded bg-muted text-sm">
              <div className="flex items-center gap-4">
                <div>
                  <strong>Name:</strong>{" "}
                  {isAgencyLoading
                    ? "Loading..."
                    : isAgencyError
                    ? "Failed to load agency"
                    : agencyData?.businessName
                    ? agencyData.businessName.charAt(0).toUpperCase() +
                      agencyData.businessName.slice(1)
                    : "N/A"}
                </div>
              </div>
            </div>
          </div>

          {/* Package selection */}
          <div>
            <Label className="mb-2" htmlFor="packageId">
              Select Package
            </Label>
            <Controller
              name="packageId"
              control={control}
              render={({ field }) => (
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger className="w-full mt-1">
                    <SelectValue placeholder="Select package" />
                  </SelectTrigger>
                  <SelectContent>
                    {packages.map((pkg: any) => (
                      <SelectItem key={pkg.id} value={String(pkg.id)}>
                        {pkg.packageName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.packageId && (
              <span className="text-red-500 text-sm">
                {errors.packageId.message}
              </span>
            )}
          </div>

          {selectedPackage && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {isMaharashtra ? (
                <>
                  <div>
                    <Label>CGST %</Label>
                    <Input type="number" {...register("cgstPercent")} />
                  </div>
                  <div>
                    <Label>SGST %</Label>
                    <Input type="number" {...register("sgstPercent")} />
                  </div>
                </>
              ) : (
                <div className="md:col-span-2">
                  <Label>IGST %</Label>
                  <Input type="number" {...register("igstPercent")} />
                </div>
              )}
            </div>
          )}

          {selectedPackage && (
            <div className="md:col-span-2 mt-2 p-4 bg-gray-100 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <h4 className="font-medium mb-2 text-sm text-gray-800 dark:text-gray-200">
                Selected Package Details
              </h4>

              <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                <dt className="text-gray-600 dark:text-gray-400">Branches:</dt>
                <dd className="text-gray-900 dark:text-gray-100">
                  {selectedPackage.numberOfBranches}
                </dd>

                <dt className="text-gray-600 dark:text-gray-400">
                  Users/Branch:
                </dt>
                <dd className="text-gray-900 dark:text-gray-100">
                  {selectedPackage.usersPerBranch}
                </dd>

                <dt className="text-gray-600 dark:text-gray-400">Duration:</dt>
                <dd className="text-gray-900 dark:text-gray-100">
                  {selectedPackage.periodInMonths} months
                </dd>

                <dt className="text-gray-600 dark:text-gray-400">Cost:</dt>
                <dd className="text-gray-900 dark:text-gray-100">
                  ₹{Number(selectedPackage.cost).toLocaleString()}
                </dd>

                {/* 👇 GST Preview - inside the same <dl> */}
                <dt className="col-span-2 mt-2 text-gray-800 dark:text-gray-200 font-medium">
                  Subscription Tax & Total Preview
                </dt>

                {isMaharashtra ? (
                  <>
                    <dt className="text-gray-600 dark:text-gray-400">
                      CGST Amount:
                    </dt>
                    <dd className="text-gray-900 dark:text-gray-100">
                      ₹{watch("cgstAmount") || "0.00"}
                    </dd>

                    <dt className="text-gray-600 dark:text-gray-400">
                      SGST Amount:
                    </dt>
                    <dd className="text-gray-900 dark:text-gray-100">
                      ₹{watch("sgstAmount") || "0.00"}
                    </dd>
                  </>
                ) : (
                  <>
                    <dt className="text-gray-600 dark:text-gray-400">
                      IGST Amount:
                    </dt>
                    <dd className="text-gray-900 dark:text-gray-100">
                      ₹{watch("igstAmount") || "0.00"}
                    </dd>
                  </>
                )}

                <dt className="text-gray-600 dark:text-gray-400">
                  Total Amount:
                </dt>
                <dd className="text-gray-900 dark:text-gray-100 font-semibold">
                  ₹{watch("totalAmount") || "0.00"}
                </dd>
              </dl>
            </div>
          )}

          <div className="grid mt-5 grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="paymentMode">Payment Mode</Label>
              {/* <select
                      id="subscription.paymentMode"
                      {...register("subscription.paymentMode")}
                      className="w-full mt-1"
                      defaultValue="UPI"
                    >
                      <option value="">Select Payment Mode</option>
                      <option value="UPI">UPI</option>
                      <option value="Net Banking">Net Banking</option>
                      <option value="Cheque">Cheque</option>
                    </select> */}
              <Controller
                name="paymentMode"
                control={control}
                render={({ field }) => (
                  <Select
                    key={field.value}
                    onValueChange={(value) => setValue("paymentMode", value)}
                    value={watch("paymentMode")}
                  >
                    <SelectTrigger className="w-full mt-1">
                      <SelectValue placeholder="Select payment mode" />
                    </SelectTrigger>
                    <SelectContent>
                      {paymentModeOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.paymentMode && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.paymentMode.message as string}
                </p>
              )}
            </div>
            <div>
              <Label htmlFor="paymentDate">Payment Date</Label>
              <Input
                id="paymentDate"
                type="date"
                {...register("paymentDate")}
                className="w-full mt-1"
                defaultValue={new Date().toISOString().split("T")[0]}
              />
              {errors.paymentDate && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.paymentDate.message as string}
                </p>
              )}
            </div>
          </div>

          {/* Conditional fields based on payment mode */}
          {watch("paymentMode") === "UPI" && (
            <div className="mt-4">
              <Label htmlFor="utrNumber">UTR Number</Label>
              <Input
                id="utrNumber"
                {...register("utrNumber")}
                placeholder="Enter UTR Number"
                className="w-full mt-1"
              />
              {errors.utrNumber && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.utrNumber.message as string}
                </p>
              )}
            </div>
          )}

          {watch("paymentMode") === "Net Banking" && (
            <div className="mt-4">
              <Label htmlFor="neftImpfNumber">NEFT/IMPS Number</Label>
              <Input
                id="neftImpfNumber"
                {...register("neftImpfNumber")}
                placeholder="Enter NEFT/IMPS Number"
                className="w-full mt-1"
              />
              {errors.neftImpfNumber && (
                <p className="text-red-500 text-xs mt-1">
                  {errors.neftImpfNumber.message as string}
                </p>
              )}
            </div>
          )}

          {watch("paymentMode") === "Cheque" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <Label htmlFor="chequeNumber">Cheque Number</Label>
                <Input
                  id="chequeNumber"
                  {...register("chequeNumber")}
                  placeholder="Enter Cheque Number"
                  className="w-full mt-1"
                />
                {errors.chequeNumber && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.chequeNumber.message as string}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="chequeDate">Cheque Date</Label>
                <Input
                  id="chequeDate"
                  type="date"
                  {...register("chequeDate")}
                  placeholder="Enter Cheque Date"
                  className="w-full mt-1"
                />
                {errors.chequeDate && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.chequeDate.message as string}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="bankName">Bank Name</Label>
                <Input
                  id="bankName"
                  {...register("bankName")}
                  placeholder="Enter Bank Name"
                  className="w-full mt-1"
                />
                {errors.bankName && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.bankName.message as string}
                  </p>
                )}
              </div>
            </div>
          )}
          {/* payment details end */}

          {/* Footer */}
          <div className="abc">
            <DialogFooter className="flex justify-end space-x-2">
              <Button
                variant="outline"
                type="button"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={addSubscriptionMutation.isLoading}
              >
                {addSubscriptionMutation.isLoading
                  ? "Adding..."
                  : "Add Subscription"}
              </Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddSubscription;
