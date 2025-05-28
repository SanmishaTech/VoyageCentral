import React, { useEffect, useState } from "react";
import {
  useForm,
  SubmitHandler,
  Controller,
  useFieldArray,
  useWatch,
} from "react-hook-form";
import dayjs from "dayjs";
import { Checkbox } from "@/components/ui/checkbox"; // make sure it's imported

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
    description: z
      .string()
      .min(1, "Description field is required.")
      .max(180, "Description must not exceed 180 characters."),

    cost: z.preprocess(
      (val) => {
        if (typeof val === "string") {
          const parsed = parseFloat(val);
          return isNaN(parsed) ? val : parsed;
        }
        return val;
      },
      z
        .number({
          invalid_type_error: "Amount must be a number",
          required_error: "Amount is required",
        })
        .min(0.01, "Amount must be greater than 0")
        .max(99999999.99, "Amount cannot exceed 99,999,999.99")
    ),

    isPaid: z.boolean(),

    agentId: z.union([z.string().optional(), z.number().optional()]),

    paymentMode: z
      .string()
      .max(50, "Payment mode can't exceed 50 characters")
      .optional(),

    bankId: z.union([z.string().optional(), z.number().optional()]),

    serviceId: z.union([z.string().optional(), z.number().optional()]),

    paymentDate: z.string().optional(),

    paidAmount: z
      .string()
      .optional()
      .refine(
        (val) => val === undefined || val.trim() === "" || !isNaN(Number(val)),
        "Paid amount must be a number"
      )
      .refine(
        (val) =>
          val === undefined || val.trim() === "" || Number(val) <= 1000000,
        "Paid amount cannot exceed 1,000,000"
      ),

    chequeDate: z.string().optional(),

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
  })
  .superRefine((data, ctx) => {
    if (data.isPaid) {
      // Required fields when isPaid is true
      if (!data.agentId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["agentId"],
          message: "Agent is required when paid",
        });
      }
      if (!data.serviceId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["serviceId"],
          message: "Service is required when paid",
        });
      }
      if (!data.paymentMode) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["paymentMode"],
          message: "Payment mode is required when paid",
        });
      }
      if (!data.paymentDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["paymentDate"],
          message: "Payment date is required when paid",
        });
      }
      if (!data.paidAmount) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["paidAmount"],
          message: "Paid amount is required when paid",
        });
      }
    }
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
  description: "",
  cost: "",
  isPaid: false,
  agentId: "",
  paymentMode: "",
  bankId: "",
  serviceId: "",
  paymentDate: "",
  paidAmount: "",
  chequeDate: "",
  chequeNumber: "",
  utrNumber: "",
  nrftImpfNumber: "",
};
const ServiceBookingForm = ({ mode }: { mode: "create" | "edit" }) => {
  const { id, serviceBookingId } = useParams<{
    id: string;
    serviceBookingId: string;
  }>();
  const [openBankId, setOpenBankId] = useState<boolean>(false);
  const [openAgentId, setOpenAgentId] = useState<boolean>(false);
  const [openServiceId, setOpenServiceId] = useState<boolean>(false);

  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  const isPaid = watch("isPaid"); // Watch for isPaid value

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

  // services
  const { data: services, isLoading: isServiceLoading } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const response = await get(`/services/all`);
      return response; // API returns the sector object directly
    },
  });

  const serviceOptions = [
    { id: "none", serviceName: "---" }, // The 'unselect' option
    ...(services ?? []),
  ];

  // agents
  const { data: agents, isLoading: isAgentsLoading } = useQuery({
    queryKey: ["agents"],
    queryFn: async () => {
      const response = await get(`/agents/all`);
      return response; // API returns the sector object directly
    },
  });

  const agentOptions = [
    { id: "none", agentName: "---" }, // The 'unselect' option
    ...(agents ?? []),
  ];

  const { data: editServiceBookingData, isLoading: editServiceBookingLoading } =
    useQuery({
      queryKey: ["editServiceBooking", serviceBookingId],
      queryFn: async () => {
        const response = await get(`/service-bookings/${serviceBookingId}`);
        return response;
      },
    });

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
    if (editServiceBookingData) {
      reset({
        description: editServiceBookingData?.description ?? "", // Use empty string if undefined
        cost: editServiceBookingData?.cost
          ? parseFloat(editServiceBookingData.cost).toFixed(2)
          : "", // Format cost with 2 decimals or default to "0.00"
        isPaid: editServiceBookingData?.isPaid, // Default to false if undefined
        agentId: editServiceBookingData?.agentId
          ? parseInt(editServiceBookingData.agentId)
          : "", // Parse if defined, otherwise null
        paymentMode: editServiceBookingData?.paymentMode || "", // Default to empty string if undefined
        bankId: editServiceBookingData?.bankId
          ? editServiceBookingData?.bankId
          : "", // Default to 0 if undefined
        serviceId: editServiceBookingData?.serviceId
          ? editServiceBookingData?.serviceId
          : "", // Default to 0 if undefined
        paymentDate: editServiceBookingData.paymentDate
          ? new Date(editServiceBookingData.paymentDate)
              .toISOString()
              .split("T")[0]
          : "",
        paidAmount: editServiceBookingData?.paidAmount
          ? parseFloat(editServiceBookingData.paidAmount).toFixed(2)
          : "", // Format paidAmount or default to "0.00"
        chequeDate: editServiceBookingData.chequeDate
          ? new Date(editServiceBookingData.chequeDate)
              .toISOString()
              .split("T")[0]
          : "",
        chequeNumber: editServiceBookingData?.chequeNumber || "", // Default to empty string if undefined
        utrNumber: editServiceBookingData?.utrNumber || "", // Default to empty string if undefined
        neftImpfNumber: editServiceBookingData?.neftImpfNumber || "", // Default to empty string if undefined
      });
    }
  }, [editServiceBookingData, reset]);

  // Mutation for creating a user
  const createMutation = useMutation({
    mutationFn: (data: FormInputs) => post(`/service-bookings/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["service-bookings"]); // Refetch the users list
      toast.success("Service Booking added successfully");
      navigate(`/bookings/${id}/details`);
    },
    onError: (error: any) => {
      Validate(error, setError);
      toast.error(
        error.response?.data?.message || "Failed to create Service booking"
      );
    },
  });

  // Mutation for updating a user
  const updateMutation = useMutation({
    mutationFn: (data: FormInputs) =>
      put(`/service-bookings/${serviceBookingId}`, data),
    onSuccess: () => {
      toast.success("Service Booking updated successfully");
      queryClient.invalidateQueries(["service-bookings"]);
      navigate(`/bookings/${id}/details`);
    },
    onError: (error: any) => {
      Validate(error, setError);
      console.log("this is error", error);
      toast.error(
        error.response?.data?.message || "Failed to update service booking"
      );
    },
  });

  useEffect(() => {
    const paymentMode = watch("paymentMode");
    const isPaid = watch("isPaid");

    if (!isPaid) {
      // Reset all payment-related fields
      setValue("agentId", "");
      setValue("serviceId", "");
      setValue("paymentMode", "");
      setValue("paymentDate", "");
      setValue("paidAmount", "");
      setValue("utrNumber", "");
      setValue("neftImpfNumber", "");
      setValue("chequeNumber", "");
      setValue("chequeDate", "");
      setValue("bankId", "");
      return;
    }

    // Reset fields based on selected paymentMode
    if (paymentMode === "Cash") {
      setValue("utrNumber", "");
      setValue("neftImpfNumber", "");
      setValue("chequeNumber", "");
      setValue("chequeDate", "");
      setValue("bankId", "");
    } else if (paymentMode === "UPI") {
      setValue("neftImpfNumber", "");
      setValue("chequeNumber", "");
      setValue("chequeDate", "");
      setValue("bankId", "");
    } else if (paymentMode === "Net Banking") {
      setValue("utrNumber", "");
      setValue("chequeNumber", "");
      setValue("chequeDate", "");
      setValue("bankId", "");
    } else if (paymentMode === "Cheque") {
      setValue("utrNumber", "");
      setValue("neftImpfNumber", "");
    }
  }, [watch("paymentMode"), watch("isPaid"), setValue]);

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
      {Object.entries(errors).map(([field, error]) => (
        <p key={field} className="text-red-500 text-sm">
          {error?.message as string}
        </p>
      ))}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="mx-auto mt-10 ">
          <CardContent className="pt-6 space-y-8">
            <TourBookingDetailsTable
              editBookingLoading={editBookingLoading}
              isEditBookingError={isEditBookingError}
              editBookingData={editBookingData}
            />

            <CardTitle className="font-semibold mt-5 text-gray-800 dark:text-gray-200 mb-4">
              Service Booking
            </CardTitle>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* Party Coming From */}
              <div className="col-span-1 md:col-span-3">
                <Label
                  htmlFor="description"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Description <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="description"
                  {...register("description")}
                  placeholder="description"
                />
                {errors.description && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.description.message}
                  </p>
                )}
              </div>
              <div className="mt-8 ml-5 flex items-center space-x-2 ">
                <Controller
                  name="isPaid"
                  control={control}
                  render={({ field }) => (
                    <Checkbox
                      id="isPaid"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      className="border border-2"
                    />
                  )}
                />
                <Label
                  htmlFor="isPaid"
                  className="text-sm text-gray-700 dark:text-gray-300"
                >
                  Is Paid
                </Label>
              </div>

              <div className="col-start-3">
                <Label
                  htmlFor="cost"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Cost <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  placeholder="Enter cost"
                  {...register("cost")}
                />
                {errors.cost && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.cost.message}
                  </p>
                )}
              </div>
              {watch("isPaid") && (
                <>
                  {/* Agent and Service ID fields */}
                  <div className="col-span-3">
                    <div className="grid grid-cols-1 md:grid-cols-2">
                      {/* Agent */}
                      <div className="">
                        <Label
                          htmlFor="agentId"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          Agent
                        </Label>
                        <Controller
                          name="agentId"
                          control={control}
                          render={({ field }) => (
                            <Popover
                              open={openAgentId}
                              onOpenChange={setOpenAgentId}
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-[300px] md:w-[485px] justify-between mt-1"
                                  onClick={() =>
                                    setOpenAgentId((prev) => !prev)
                                  }
                                >
                                  {field.value
                                    ? agentOptions.find(
                                        (agent) => agent.id === field.value
                                      )?.agentName
                                    : "Select agent"}
                                  <ChevronsUpDown className="opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[325px] p-0">
                                <Command>
                                  <CommandInput
                                    placeholder="Search agent..."
                                    className="h-9"
                                  />
                                  <CommandList>
                                    <CommandEmpty>No agent found.</CommandEmpty>
                                    <CommandGroup>
                                      {agentOptions.map((agent) => (
                                        <CommandItem
                                          key={agent.id}
                                          value={
                                            agent.agentName?.toLowerCase() || ""
                                          }
                                          onSelect={() => {
                                            setValue(
                                              "agentId",
                                              agent.id === "none"
                                                ? null
                                                : agent.id
                                            );
                                            setOpenAgentId(false);
                                          }}
                                        >
                                          {agent.agentName}
                                          <Check
                                            className={cn(
                                              "ml-auto",
                                              agent.id === field.value
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
                        {errors.agentId && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.agentId.message}
                          </p>
                        )}
                      </div>

                      {/* Service ID */}
                      <div className="">
                        <Label
                          htmlFor="serviceId"
                          className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                        >
                          Service Name
                        </Label>
                        <Controller
                          name="serviceId"
                          control={control}
                          render={({ field }) => (
                            <Popover
                              open={openServiceId}
                              onOpenChange={setOpenServiceId}
                            >
                              <PopoverTrigger asChild>
                                <Button
                                  variant="outline"
                                  className="w-[300px] md:w-[491px] justify-between mt-1"
                                  onClick={() =>
                                    setOpenServiceId((prev) => !prev)
                                  }
                                >
                                  {field.value
                                    ? serviceOptions.find(
                                        (s) => s.id === field.value
                                      )?.serviceName
                                    : "Select service"}
                                  <ChevronsUpDown className="opacity-50" />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-[325px] p-0">
                                <Command>
                                  <CommandInput
                                    placeholder="Search service..."
                                    className="h-9"
                                  />
                                  <CommandList>
                                    <CommandEmpty>
                                      No service found.
                                    </CommandEmpty>
                                    <CommandGroup>
                                      {serviceOptions.map((service) => (
                                        <CommandItem
                                          key={service.id}
                                          value={
                                            service.serviceName?.toLowerCase() ||
                                            ""
                                          }
                                          onSelect={() => {
                                            setValue(
                                              "serviceId",
                                              service.id === "none"
                                                ? null
                                                : service.id
                                            );
                                            setOpenServiceId(false);
                                          }}
                                        >
                                          {service.serviceName}
                                          <Check
                                            className={cn(
                                              "ml-auto",
                                              service.id === field.value
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
                        {errors.serviceId && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.serviceId.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Payment Mode */}
                  <div className="">
                    <Label
                      htmlFor="paymentMode"
                      className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Payment Mode
                    </Label>
                    <Controller
                      name="paymentMode"
                      control={control}
                      render={({ field }) => (
                        <Select
                          key={field.value}
                          onValueChange={(value) =>
                            setValue("paymentMode", value)
                          }
                          value={watch("paymentMode")}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select payment mode" />
                          </SelectTrigger>
                          <SelectContent>
                            {paymentModeOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={option.value}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.paymentMode && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.paymentMode.message}
                      </p>
                    )}
                  </div>

                  {/* Payment Date */}
                  <div className="">
                    <Label
                      htmlFor="paymentDate"
                      className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Payment Date
                    </Label>
                    <Input
                      id="paymentDate"
                      type="date"
                      placeholder="Enter date"
                      {...register("paymentDate")}
                    />
                    {errors.paymentDate && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.paymentDate.message}
                      </p>
                    )}
                  </div>

                  {/* Paid Amount */}
                  <div className="">
                    <Label
                      htmlFor="paidAmount"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Paid Amount
                    </Label>
                    <Input
                      id="paidAmount"
                      {...register("paidAmount")}
                      type="number"
                      step="0.01"
                      placeholder="Enter paid amount"
                      className="w-full mt-1"
                    />
                    {errors.paidAmount && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.paidAmount.message}
                      </p>
                    )}
                  </div>

                  {/* Conditional Fields by Payment Mode */}
                  {watch("paymentMode") === "UPI" && (
                    <div className="">
                      <Label
                        htmlFor="utrNumber"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        UTR Number
                      </Label>
                      <Input
                        id="utrNumber"
                        {...register("utrNumber")}
                        placeholder="Enter UTR Number"
                        className="w-full mt-1"
                      />
                      {errors.utrNumber && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.utrNumber.message}
                        </p>
                      )}
                    </div>
                  )}

                  {watch("paymentMode") === "Net Banking" && (
                    <div className="">
                      <Label
                        htmlFor="utrNumber"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        NEFT/IMPF Number
                      </Label>
                      <Input
                        id="neftImpfNumber"
                        {...register("neftImpfNumber")}
                        placeholder="Enter NEFT/IMPS Number"
                        className="w-full mt-1"
                      />
                      {errors.neftImpfNumber && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.neftImpfNumber.message}
                        </p>
                      )}
                    </div>
                  )}

                  {watch("paymentMode") === "Cheque" && (
                    <div className="col-span-3">
                      <div className="grid w-full grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Cheque Number */}
                        <div>
                          <Label
                            htmlFor="chequeNumber"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
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
                              {errors.chequeNumber.message}
                            </p>
                          )}
                        </div>

                        {/* Cheque Date */}
                        <div>
                          <Label
                            htmlFor="chequeDate"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
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
                              {errors.chequeDate.message}
                            </p>
                          )}
                        </div>

                        {/* Bank Name */}
                        <div className="">
                          <Label
                            htmlFor="bankId"
                            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
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
                                    className="w-[300px] justify-between mt-1"
                                    onClick={() =>
                                      setOpenBankId((prev) => !prev)
                                    }
                                  >
                                    {field.value
                                      ? bankOptions.find(
                                          (b) => b.id === field.value
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
                                      <CommandEmpty>
                                        No bank found.
                                      </CommandEmpty>
                                      <CommandGroup>
                                        {bankOptions.map((bank) => (
                                          <CommandItem
                                            key={bank.id}
                                            value={
                                              bank.bankName?.toLowerCase() || ""
                                            }
                                            onSelect={() => {
                                              setValue(
                                                "bankId",
                                                bank.id === "none"
                                                  ? null
                                                  : bank.id
                                              );
                                              setOpenBankId(false);
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
                </>
              )}
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
                "Create Service booking"
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

export default ServiceBookingForm;
