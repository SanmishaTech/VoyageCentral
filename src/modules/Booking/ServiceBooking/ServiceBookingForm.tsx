import React, { useEffect, useState } from "react";
import {
  useForm,
  SubmitHandler,
  Controller,
  useFieldArray,
  useWatch,
} from "react-hook-form";
import dayjs from "dayjs";

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
} from "@/config/data";
const FormSchema = z.object({
  description: z
    .string()
    .min(1, "Description field is required.")
    .max(180, "Description must not exceed 180 characters."),

  cost: z.coerce
    .number({
      invalid_type_error: " cost must be a number.",
    })
    .nonnegative("cost cannot be negative.")
    .min(1, "Cost field is required"),
});

type FormInputs = z.infer<typeof FormSchema>;

const defaultValues: FormInputs = {
  description: "",
  cost: 0,
};

const ServiceBookingForm = ({ mode }: { mode: "create" | "edit" }) => {
  const { id, serviceBookingId } = useParams<{
    id: string;
    serviceBookingId: string;
  }>();
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

  const { data: editServiceBookingData, isLoading: editServiceBookingLoading } =
    useQuery({
      queryKey: ["editServiceBooking", serviceBookingId],
      queryFn: async () => {
        const response = await get(`/service-bookings/${serviceBookingId}`);
        return response;
      },
    });

  const { data: editBookingData, isLoading: editBookingLoading } = useQuery({
    queryKey: ["editBooking", id],
    queryFn: async () => {
      const response = await get(`/bookings/${id}`);
      return response; // API returns the sector object directly
    },
  });

  useEffect(() => {
    if (editServiceBookingData) {
      reset({
        description: editServiceBookingData.description,
        cost: parseFloat(editServiceBookingData.cost).toFixed(2), // Format with 2 decimals
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
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Client Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-sm text-gray-800 dark:text-gray-300">
                  <span className="font-medium">Client Name:</span>{" "}
                  {editBookingData?.client?.clientName || "N/A"}
                </div>
                <div className="text-sm text-gray-800 dark:text-gray-300">
                  <span className="font-medium">No. of Adults:</span>{" "}
                  {editBookingData?.numberOfAdults ?? "N/A"}
                </div>
                <div className="text-sm text-gray-800 dark:text-gray-300">
                  <span className="font-medium">Children (5–11 yrs):</span>{" "}
                  {editBookingData?.numberOfChildren5To11 ?? "N/A"}
                </div>
                <div className="text-sm text-gray-800 dark:text-gray-300">
                  <span className="font-medium">Children (under 5 yrs):</span>{" "}
                  {editBookingData?.numberOfChildrenUnder5 ?? "N/A"}
                </div>
              </div>
            </div>

            {/* Booking Details */}
            <div>
              <h2 className="text-lg  font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Client Booking Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="text-sm text-gray-800 dark:text-gray-300">
                  <span className="font-medium">Booking No:</span>{" "}
                  {editBookingData?.bookingNumber || "N/A"}
                </div>
                <div className="text-sm text-gray-800 dark:text-gray-300">
                  <span className="font-medium">Booking Date:</span>{" "}
                  {editBookingData?.bookingDate
                    ? dayjs(editBookingData.bookingDate).format(
                        "DD/MM/YYYY hh:mm A"
                      )
                    : "N/A"}
                </div>
                <div className="text-sm text-gray-800 dark:text-gray-300">
                  <span className="font-medium">Journey Date:</span>{" "}
                  {editBookingData?.journeyDate
                    ? dayjs(editBookingData.journeyDate).format("DD/MM/YYYY")
                    : "N/A"}
                </div>
                <div className="text-sm text-gray-800 dark:text-gray-300">
                  <span className="font-medium">Branch:</span>{" "}
                  {editBookingData?.branchId ?? "N/A"}
                </div>
                <div className="text-sm text-gray-800 dark:text-gray-300">
                  <span className="font-medium">Tour Name:</span>{" "}
                  {editBookingData?.tour?.tourTitle ?? "N/A"}
                </div>
                <div className="text-sm text-gray-800 dark:text-gray-300">
                  <span className="font-medium">Booking Detail:</span>{" "}
                  {editBookingData?.bookingDetail || "N/A"}
                </div>
              </div>
            </div>

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
                  placeholder="Party Coming From"
                />
                {errors.description && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.description.message}
                  </p>
                )}
              </div>

              <div>
                <Label
                  htmlFor="cost"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Cost <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="cost"
                  type="number"
                  placeholder="Enter cost"
                  {...register("cost")}
                />
                {errors.cost && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.cost.message}
                  </p>
                )}
              </div>
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
