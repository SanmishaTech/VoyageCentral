import React, { useEffect, useState } from "react";
import {
  useForm,
  SubmitHandler,
  Controller,
  useFieldArray,
  useWatch,
} from "react-hook-form";
import dayjs from "dayjs";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea"; // adjust path if needed
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import TourBookingDetailsTable from "../TourBookingDetailsTable";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import Validate from "@/lib/Handlevalidation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoaderCircle, Trash2, PlusCircle } from "lucide-react"; // Import the LoaderCircle icon
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";
import { get } from "@/services/apiService";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { post, put } from "@/services/apiService";
import { set } from "date-fns";
import {
  modeOptions,
  foodTypeOptions,
  flightClassOptions,
  trainClassOptions,
  planOptions,
  roomOptions,
  tariffPackageOptions,
  bedOptions,
  paymentModeOptions,
} from "@/config/data";
const FormSchema = z
  .object({
    // cost: z.coerce
    //   .number({
    //     invalid_type_error: " cost must be a number.",
    //   })
    //   .nonnegative("cost cannot be negative.")
    //   .min(1, "Cost field is required"),

    receiptNumber: z.string().optional(),
    receiptDate: z.string().min(1, "Receipt date is required"),
    paymentMode: z.string().min(1, "Payment Mode field is required"),
    amount: z
      .union([z.string(), z.number()])
      .transform((val) => parseFloat(val))
      .refine((val) => !isNaN(val) && val >= 0, {
        message: " amount must be a positive number",
      }),
    // Optional bank-related fields
    bankId: z.union([z.string(), z.number()]).optional().nullable(),
    chequeDate: z.string().optional().nullable(),
    // chequeNumber: z.string().optional().nullable(),
    // utrNumber: z.string().optional().nullable(),
    // neftImpfNumber: z.string().optional().nullable(),
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
      if (!data.bankId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["bankId"],
          message: "Bank Name is required for Cheque payment",
        });
      }
    }
  });

type FormInputs = z.infer<typeof FormSchema>;

const defaultValues: FormInputs = {
  receiptNumber: "",
  receiptDate: new Date().toISOString().split("T")[0], // or leave blank if you want user to pick
  paymentMode: "", // default payment mode
  amount: 0,
  bankId: null,
  chequeDate: null,
  chequeNumber: "",
  utrNumber: "",
  neftImpfNumber: "",
  cgstPercent: undefined,
  cgstAmount: undefined,
  sgstPercent: undefined,
  sgstAmount: undefined,
  igstPercent: undefined,
  igstAmount: undefined,
  totalAmount: 0,
};

const BookingReceiptForm = ({ mode }: { mode: "create" | "edit" }) => {
  const { id, bookingReceiptId } = useParams<{
    id: string;
    bookingReceiptId: string;
  }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [openBankId, setOpenBankId] = useState<boolean>(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    setError,
    formState: { errors },
  } = useForm<FormInputs>({
    resolver: zodResolver(FormSchema),
    defaultValues: mode === "create" ? defaultValues : undefined, // Use default values in create mode
  });

  const { data: editBookingReceiptData, isLoading: editBookingReceiptLoading } =
    useQuery({
      queryKey: ["editBookingReceipt", bookingReceiptId],
      queryFn: async () => {
        const response = await get(`/booking-receipts/${bookingReceiptId}`);
        return response;
      },
    });

  // banks
  const { data: banks, isLoading: isBankLoading } = useQuery({
    queryKey: ["banks"],
    queryFn: async () => {
      const response = await get(`/banks/all`);
      return response; // API returns the sector object directly
    },
  });

  const bankOptions = [
    { id: "none", bankName: "---" }, // The 'unselect' option
    ...(banks ?? []),
  ];

  const {
    data: editBookingData,
    isLoading: editBookingLoading,
    isError: isEditBookingError,
  } = useQuery({
    queryKey: ["editBooking", id],
    queryFn: async () => {
      const response = await get(`/bookings/${id}`);
      return response; // API returns the sector object directly
    },
  });

  useEffect(() => {
    if (editBookingReceiptData) {
      reset({
        receiptNumber: editBookingReceiptData?.receiptNumber ?? "",
        receiptDate: editBookingReceiptData?.receiptDate
          ? new Date(editBookingReceiptData.receiptDate)
              .toISOString()
              .split("T")[0]
          : "",
        paymentMode: editBookingReceiptData?.paymentMode ?? "",
        amount: editBookingReceiptData?.amount
          ? parseFloat(editBookingReceiptData?.amount).toFixed(2)
          : null,
        bankId: editBookingReceiptData?.bankId
          ? parseInt(editBookingReceiptData?.bankId)
          : null,
        chequeDate: editBookingReceiptData?.chequeDate
          ? new Date(editBookingReceiptData.chequeDate)
              .toISOString()
              .split("T")[0]
          : null,
        chequeNumber: editBookingReceiptData?.chequeNumber ?? "",
        utrNumber: editBookingReceiptData?.utrNumber ?? "",
        neftImpfNumber: editBookingReceiptData?.neftImpfNumber ?? "",
      });
    }
  }, [editBookingReceiptData, reset]);

  // Mutation for creating a user
  const createMutation = useMutation({
    mutationFn: (data: FormInputs) => post(`/booking-receipts/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["booking-receipts"]); // Refetch the users list
      toast.success("Booking Receipt added successfully");
      navigate(`/bookings/${id}/details`);
    },
    onError: (error: any) => {
      Validate(error, setError);
      toast.error(
        error.response?.data?.message || "Failed to create booking Receipt"
      );
    },
  });

  // Mutation for updating a user
  const updateMutation = useMutation({
    mutationFn: (data: FormInputs) =>
      put(`/booking-receipts/${bookingReceiptId}`, data),
    onSuccess: () => {
      toast.success("Booking Receipt updated successfully");
      queryClient.invalidateQueries(["booking-receipts"]);
      navigate(`/bookings/${id}/details`);
    },
    onError: (error: any) => {
      Validate(error, setError);
      console.log("this is error", error);
      toast.error(
        error.response?.data?.message || "Failed to update booking receipt"
      );
    },
  });

  // payment mode
  useEffect(() => {
    const paymentMode = watch("paymentMode");
    if (paymentMode === "Cash") {
      setValue("utrNumber", "");
      setValue("neftImpfNumber", "");
      setValue("chequeNumber", "");
      setValue("chequeDate", "");
      setValue("bankId", null);
    } else if (paymentMode === "UPI") {
      setValue("neftImpfNumber", "");
      setValue("chequeNumber", "");
      setValue("chequeDate", "");
      setValue("bankId", null);
    } else if (paymentMode === "Net Banking") {
      setValue("utrNumber", "");
      setValue("chequeNumber", "");
      setValue("chequeDate", "");
      setValue("bankId", null);
    } else if (paymentMode === "Cheque") {
      setValue("utrNumber", "");
      setValue("neftImpfNumber", "");
    }
  }, [watch("paymentMode"), setValue]);
  // payment mode

  const onSubmit: SubmitHandler<FormInputs> = (data) => {
    if (mode === "create") {
      createMutation.mutate(data);
    } else {
      updateMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      {/* JSX Code for HotelForm.tsx */}
      {/* {Object.entries(errors).map(([field, error]) => (
        <p key={field} className="text-red-500 text-sm">
          {error?.message as string}
        </p>
      ))} */}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="mx-auto mt-10 ">
          <CardContent className="pt-6 space-y-8">
            <TourBookingDetailsTable
              editBookingLoading={editBookingLoading}
              isEditBookingError={isEditBookingError}
              editBookingData={editBookingData}
            />

            <CardTitle className="font-semibold mt-5 text-gray-800 dark:text-gray-200 mb-4">
              Booking Receipt
            </CardTitle>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* HRV number */}
              <div>
                <Label
                  htmlFor="receiptNumber"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Receipt Number
                </Label>
                <Input
                  id="receiptNumber"
                  {...register("receiptNumber")}
                  readOnly
                  className="bg-gray-200"
                  placeholder="receipt number"
                />
                {errors.receiptNumber && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.receiptNumber.message}
                  </p>
                )}
              </div>
              {/*  Date */}
              <div>
                <Label
                  htmlFor="receiptDate"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Receipt Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="receiptDate"
                  type="date"
                  {...register("receiptDate")}
                />
                {errors.receiptDate && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.receiptDate.message}
                  </p>
                )}
              </div>
              <div>
                <Label
                  htmlFor="paymentMode"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Payment mode <span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="paymentMode"
                  control={control}
                  render={({ field }) => (
                    <Select
                      key={field.value}
                      onValueChange={(value) => setValue("paymentMode", value)}
                      value={watch("paymentMode")}
                    >
                      <SelectTrigger className="w-full">
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
                <Label
                  htmlFor="amount"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Amount <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="Enter amount"
                  {...register("amount")}
                />
                {errors.amount && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.amount.message}
                  </p>
                )}
              </div>

              {/* Conditional fields based on payment mode */}
              {watch("paymentMode") === "UPI" && (
                <div className="">
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
                <div className="">
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
                <div className="col-span-2">
                  <div className="grid w-full grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label
                        htmlFor="chequeNumber"
                        className=" block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Cheque Number
                      </Label>
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
                      <Label
                        htmlFor="chequeDate"
                        className=" block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Cheque Date
                      </Label>
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
                    <div className="">
                      <Label
                        htmlFor="bankId"
                        className=" block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Bank Name
                      </Label>
                      <Controller
                        name="bankId"
                        control={control}
                        render={({ field }) => (
                          <Popover
                            open={openBankId}
                            onOpenChange={setOpenBankId}
                          >
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openBankId ? "true" : "false"} // This should depend on the popover state
                                className=" w-[300px] justify-between mt-1"
                                onClick={() => setOpenBankId((prev) => !prev)} // Toggle popover on button click
                              >
                                {field.value
                                  ? bankOptions &&
                                    bankOptions.find(
                                      (bank) => bank.id === field.value
                                    )?.bankName
                                  : "Select bank"}
                                <ChevronsUpDown className="opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[325px] p-0">
                              <Command>
                                <CommandInput
                                  placeholder="Search bank..."
                                  className="h-9"
                                />
                                <CommandList>
                                  <CommandEmpty>No bank found.</CommandEmpty>
                                  <CommandGroup>
                                    {bankOptions &&
                                      bankOptions.map((bank) => (
                                        <CommandItem
                                          key={bank.id}
                                          // value={String(bank.id)}
                                          value={
                                            bank?.bankName
                                              ? bank.bankName.toLowerCase()
                                              : ""
                                          } // 👈 Use airline name for filtering
                                          onSelect={(currentValue) => {
                                            if (bank.id === "none") {
                                              setValue("bankId", null); // Clear the value
                                            } else {
                                              setValue("bankId", bank.id);
                                            }
                                            // handleTourSelectChange(airline);
                                            setOpenBankId(false);
                                            // Close popover after selection
                                          }}
                                        >
                                          {bank.bankName}
                                          <Check
                                            className={cn(
                                              "ml-auto",
                                              bank.id === field.value
                                                ? "opacity-100"
                                                : "opacity-0"
                                            )}
                                          />
                                        </CommandItem>
                                      ))}
                                  </CommandGroup>
                                </CommandList>
                              </Command>
                            </PopoverContent>
                          </Popover>
                        )}
                      />
                      {errors.bankId && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.bankId.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
              {/* payment details end */}
            </div>
          </CardContent>

          {/* Submit/Cancel Buttons */}
          <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 rounded-b-lg">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate(`/bookings/${id}/details`)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="min-w-[90px]">
              {isLoading ? (
                <LoaderCircle className="animate-spin h-4 w-4" />
              ) : mode === "create" ? (
                "Create booking Receipt"
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </Card>
      </form>
    </>
  );
};

export default BookingReceiptForm;
