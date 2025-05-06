import React, { useEffect, useState } from "react";
import {
  useForm,
  SubmitHandler,
  Controller,
  useFieldArray,
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
} from "@/config/data";
const FormSchema = z.object({
  partyComingFrom: z
    .string()
    .min(1, "Party coming from must be at least 1 characters.")
    .max(100, "Party coming from must not exceed 100 characters."),
  checkInDate: z.string().min(1, "Check-in date is required."),
  checkOutDate: z.string().min(1, "Check-out date is required."),

  nights: z
    .number()
    .int("Nights must be an integer.")
    .min(0, "Nights field is required."),

  cityId: z.coerce.string().min(1, "City field is required"),

  hotelId: z.coerce.string().min(1, "hotel field is required"),

  plan: z
    .string()
    .min(1, "Plan field is required.")
    .max(100, "Plan must not exceed 100 characters."),

  rooms: z.string().min(1, "Rooms field is required"),

  accommodationId: z.coerce
    .string()
    .min(1, "Accommodation Type field is required"),

  tariffPackage: z
    .string()
    .max(100, "Tariff package must not exceed 100 characters.")
    .optional(),

  accommodationNote: z
    .string()
    .max(180, "Accommodation note must not exceed 180 characters.")
    .optional(),

  extraBed: z.coerce.number().min(0),

  beds: z
    .string()
    .min(1, "Beds field is required.")
    .max(22, "Beds must not exceed 22 characters."),

  extraBedCost: z.coerce
    .number({
      invalid_type_error: "Extra bed cost must be a number.",
    })
    .nonnegative("Extra bed cost cannot be negative.")
    .optional()
    .nullable(),

  hotelBookingDate: z.string().min(1, "Hotel booking date is required."),

  bookingConfirmedBy: z
    .string()
    .min(1, "Confirmed by field is required.")
    .max(100, "Confirmed by must not exceed 100 characters.")
    .optional(),

  confirmationNumber: z
    .string()
    .min(1, "Confirmation number field is required.")
    .max(100, "Confirmation number must not exceed 100 characters.")
    .optional(),

  billingInstructions: z
    .string()
    .max(100, "Billing instructions must not exceed 100 characters.")
    .optional(),

  specialRequirement: z
    .string()
    .max(100, "Special requirement must not exceed 100 characters.")
    .optional(),

  notes: z
    .string()
    .max(100, "Notes must not exceed 100 characters.")
    .optional(),

  billDescription: z
    .string()
    .max(100, "Bill description must not exceed 100 characters.")
    .optional(),
});

type FormInputs = z.infer<typeof FormSchema>;

const defaultValues: FormInputs = {
  partyComingFrom: "",
  checkInDate: "", // Defaults to today (YYYY-MM-DD)
  checkOutDate: "", // Defaults to today

  nights: 0,

  cityId: "",
  hotelId: "",

  plan: "",
  rooms: "",

  accommodationId: "",

  tariffPackage: "",
  accommodationNote: "",

  extraBed: 0,
  beds: "",

  extraBedCost: null,

  hotelBookingDate: new Date().toISOString().split("T")[0], // Defaults to today

  bookingConfirmedBy: "",
  confirmationNumber: "",
  billingInstructions: "",
  specialRequirement: "",
  notes: "",
  billDescription: "",
};

const HotelBookingForm = ({ mode }: { mode: "create" | "edit" }) => {
  const { id, hotelBookingId } = useParams<{
    id: string;
    hotelBookingId: string;
  }>();
  const [openCityId, setOpenCityId] = useState<boolean>(false);
  const [openAccommodationId, setOpenAccommodationId] =
    useState<boolean>(false);
  const [openHotelId, setOpenHotelId] = useState<boolean>(false);
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

  // cities
  const { data: cities, isLoading: isCityLoading } = useQuery({
    queryKey: ["cities"],
    queryFn: async () => {
      const response = await get(`/cities/all`);
      return response; // API returns the sector object directly
    },
  });

  const cityOptions = [
    { id: "none", cityName: "---" }, // The 'unselect' option
    ...(cities ?? []),
  ];

  // hotels
  const { data: hotels, isLoading: isHotelLoading } = useQuery({
    queryKey: ["hotels"],
    queryFn: async () => {
      const response = await get(`/hotels/all`);
      return response; // API returns the sector object directly
    },
  });

  const hotelOptions = [
    { id: "none", hotelName: "---" }, // The 'unselect' option
    ...(hotels ?? []),
  ];

  // accommodations
  const { data: accommodations, isLoading: isAccommodationLoading } = useQuery({
    queryKey: ["accommodations"],
    queryFn: async () => {
      const response = await get(`/accommodations/all`);
      return response; // API returns the sector object directly
    },
  });

  const accommodationOptions = [
    { id: "none", accommodationName: "---" }, // The 'unselect' option
    ...(accommodations ?? []),
  ];

  const { data: editHotelBookingData, isLoading: editHotelBookingLoading } =
    useQuery({
      queryKey: ["editHotelBooking", hotelBookingId],
      queryFn: async () => {
        const response = await get(`/hotel-bookings/${hotelBookingId}`);
        return response; // API returns the sector object directly
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
    if (editHotelBookingData) {
      reset({
        partyComingFrom: editHotelBookingData.partyComingFrom
          ? editHotelBookingData.partyComingFrom
          : "",
        checkInDate: editHotelBookingData.checkInDate
          ? new Date(editHotelBookingData.checkInDate)
              .toISOString()
              .split("T")[0]
          : "",
        checkOutDate: editHotelBookingData.checkOutDate
          ? new Date(editHotelBookingData.checkOutDate)
              .toISOString()
              .split("T")[0]
          : "",

        nights: editHotelBookingData.nights ? editHotelBookingData.nights : 0,

        cityId: editHotelBookingData.cityId
          ? editHotelBookingData.cityId
          : null,
        hotelId: editHotelBookingData.hotelId
          ? editHotelBookingData.hotelId
          : null,

        plan: editHotelBookingData.plan ? editHotelBookingData.plan : "",
        rooms: editHotelBookingData.rooms ? editHotelBookingData.rooms : "",

        accommodationId: editHotelBookingData.accommodationId
          ? editHotelBookingData.accommodationId
          : null,

        tariffPackage: editHotelBookingData.tariffPackage
          ? editHotelBookingData.tariffPackage
          : "",
        accommodationNote: editHotelBookingData.accommodationNote
          ? editHotelBookingData.accommodationNote
          : "",

        extraBed:
          editHotelBookingData.extraBed !== undefined
            ? editHotelBookingData.extraBed
            : 0,
        beds: editHotelBookingData.beds ? editHotelBookingData.beds : "",

        extraBedCost:
          editHotelBookingData.extraBedCost !== undefined
            ? editHotelBookingData.extraBedCost
            : null,

        hotelBookingDate: editHotelBookingData.hotelBookingDate
          ? new Date(editHotelBookingData.hotelBookingDate)
              .toISOString()
              .split("T")[0]
          : new Date().toISOString().split("T")[0], // Default to today

        bookingConfirmedBy: editHotelBookingData.bookingConfirmedBy
          ? editHotelBookingData.bookingConfirmedBy
          : "",
        confirmationNumber: editHotelBookingData.confirmationNumber
          ? editHotelBookingData.confirmationNumber
          : "",
        billingInstructions: editHotelBookingData.billingInstructions
          ? editHotelBookingData.billingInstructions
          : "",
        specialRequirement: editHotelBookingData.specialRequirement
          ? editHotelBookingData.specialRequirement
          : "",
        notes: editHotelBookingData.notes ? editHotelBookingData.notes : "",
        billDescription: editHotelBookingData.billDescription
          ? editHotelBookingData.billDescription
          : "",
      });
    }
  }, [editHotelBookingData, reset]);

  // Mutation for creating a user
  const createMutation = useMutation({
    mutationFn: (data: FormInputs) => post(`/hotel-bookings/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["hotel-bookings"]); // Refetch the users list
      toast.success("Hotel Booking added successfully");
      navigate(`/bookings/${id}/details`);
    },
    onError: (error: any) => {
      Validate(error, setError);
      toast.error(
        error.response?.data?.message || "Failed to create Hotel booking"
      );
    },
  });

  // Mutation for updating a user
  const updateMutation = useMutation({
    mutationFn: (data: FormInputs) =>
      put(`/hotel-bookings/${hotelBookingId}`, data),
    onSuccess: () => {
      toast.success("Hotel Booking updated successfully");
      queryClient.invalidateQueries(["hotel-bookings"]);
      navigate(`/bookings/${id}/details`);
    },
    onError: (error: any) => {
      Validate(error, setError);
      console.log("this is error", error);
      toast.error(
        error.response?.data?.message || "Failed to update hotel booking"
      );
    },
  });

  const onSubmit: SubmitHandler<FormInputs> = (data) => {
    // let cleanedData = { ...data };

    // if (cleanedData.mode === "Train") {
    //   cleanedData = {
    //     ...cleanedData,
    //     busName: "",
    //     flightClass: "",
    //     airlineId: null,
    //     flightNumber: "",
    //   };
    // }

    // if (cleanedData.mode === "Flight") {
    //   cleanedData = {
    //     ...cleanedData,
    //     busName: "",
    //     trainName: "",
    //     trainNumber: "",
    //     trainClass: "",
    //   };
    // }

    // if (cleanedData.mode === "Bus") {
    //   cleanedData = {
    //     ...cleanedData,
    //     trainName: "",
    //     trainNumber: "",
    //     pnrNumber: "",
    //     trainClass: "",
    //     flightClass: "",
    //     airlineId: null,
    //     flightNumber: "",
    //   };
    // }

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
        <Card className="mx-auto mt-10 max-w-5xl">
          <CardContent className="pt-6">
            {/* start */}

            {/* Heading */}
            <CardTitle className=" font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Client Details
            </CardTitle>

            <div className="w-full mx-auto space-y-6">
              {/* Client Name */}
              <div>
                <p className="text-sm text-gray-800 font-medium">
                  Client Name:{" "}
                  <span className="font-normal">
                    {editBookingData?.client?.clientName || "-"}
                  </span>
                </p>
              </div>

              {/* Adults & Children Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <p className="text-sm text-gray-800 font-medium">
                  No. of Adults:{" "}
                  <span className="font-normal">
                    {editBookingData?.numberOfAdults ?? "-"}
                  </span>
                </p>
                <p className="text-sm text-gray-800 font-medium">
                  Children (5–11 yrs):{" "}
                  <span className="font-normal">
                    {editBookingData?.numberOfChildren5To11 ?? "-"}
                  </span>
                </p>
                <p className="text-sm text-gray-800 font-medium">
                  Children (under 5 yrs):{" "}
                  <span className="font-normal">
                    {editBookingData?.numberOfChildrenUnder5 ?? "-"}
                  </span>
                </p>
              </div>

              {/* Booking Info Heading */}
              <CardTitle className=" font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Client Booking Details
              </CardTitle>

              {/* Booking Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <p className="text-sm text-gray-800 font-medium">
                  Booking No:{" "}
                  <span className="font-normal">
                    {editBookingData?.bookingNumber || "-"}
                  </span>
                </p>
                <p className="text-sm text-gray-800 font-medium">
                  Booking Date:{" "}
                  <span className="font-normal">
                    {new Date(
                      editBookingData?.bookingDate
                    ).toLocaleDateString() || "-"}
                  </span>
                </p>
                <p className="text-sm text-gray-800 font-medium">
                  Journey Date:{" "}
                  <span className="font-normal">
                    {new Date(
                      editBookingData?.journeyDate
                    ).toLocaleDateString() || "-"}
                  </span>
                </p>
                <p className="text-sm text-gray-800 font-medium">
                  Branch:{" "}
                  <span className="font-normal">
                    {editBookingData?.branchId ?? "-"}
                  </span>
                </p>
              </div>

              {/* Tour and Booking Detail */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <p className="text-sm text-gray-800 font-medium">
                  Tour Name:{" "}
                  <span className="font-normal">
                    {editBookingData?.tour?.tourTitle ?? "-"}
                  </span>
                </p>
                <p className="text-sm text-gray-800 font-medium">
                  Booking Detail:{" "}
                  <span className="font-normal">
                    {editBookingData?.bookingDetail || "-"}
                  </span>
                </p>
              </div>
            </div>
            {/* end */}

            {/* Client Details */}
            <CardTitle className="text-lg mt-5 font-semibold text-gray-800 dark:text-gray-200">
              Journey Booking
            </CardTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
              <div className="col-span-2 md:col-span-1">
                <Label
                  htmlFor="mode"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Mode <span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="mode"
                  control={control}
                  render={({ field }) => (
                    <Select
                      key={field.value}
                      onValueChange={(value) =>
                        setValue("mode", value === "none" ? "" : value)
                      }
                      value={watch("mode")}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {modeOptions.map((option) => (
                          <SelectItem
                            key={option.value}
                            value={String(option.value)}
                          >
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.mode && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.mode.message}
                  </p>
                )}
              </div>

              <div className="col-span-2 md:col-span-1">
                <Label
                  htmlFor="fromPlace"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  From Place
                </Label>
                <Input
                  id="fromPlace"
                  {...register("fromPlace")}
                  placeholder="from place"
                />
                {errors.fromPlace && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.fromPlace.message}
                  </p>
                )}
              </div>

              <div className="col-span-2 md:col-span-1">
                <Label
                  htmlFor="toPlace"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  To Place
                </Label>
                <Input
                  id="toPlace"
                  {...register("toPlace")}
                  placeholder="from place"
                />
                {errors.toPlace && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.toPlace.message}
                  </p>
                )}
              </div>

              <div className="col-span-2 md:col-span-1">
                <Label
                  htmlFor="journeyBookingDate"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Booking Date
                </Label>
                <Input
                  id="journeyBookingDate"
                  type="date"
                  {...register("journeyBookingDate")}
                />
                {errors.journeyBookingDate && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.journeyBookingDate.message}
                  </p>
                )}
              </div>

              {/* fromDepartureDate */}
              <div className="col-span-2 md:col-span-1">
                <Label
                  htmlFor="fromDepartureDate"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  From Departure Date
                </Label>
                <Input
                  id="fromDepartureDate"
                  type="date"
                  {...register("fromDepartureDate")}
                />
                {errors.fromDepartureDate && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.fromDepartureDate.message}
                  </p>
                )}
              </div>

              {/* toArrivalDate */}
              <div className="col-span-2 md:col-span-1">
                <Label
                  htmlFor="toArrivalDate"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  To Arrival Date
                </Label>
                <Input
                  id="toArrivalDate"
                  type="date"
                  {...register("toArrivalDate")}
                />
                {errors.toArrivalDate && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.toArrivalDate.message}
                  </p>
                )}
              </div>

              <div className="col-span-2 md:col-span-1">
                <Label
                  htmlFor="foodType"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Food Type
                </Label>
                <Controller
                  name="foodType"
                  control={control}
                  render={({ field }) => (
                    <Select
                      key={field.value}
                      onValueChange={(value) =>
                        setValue("foodType", value === "none" ? "" : value)
                      }
                      value={watch("foodType")}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {foodTypeOptions.map((option) => (
                          <SelectItem
                            key={option.value}
                            value={String(option.value)}
                          >
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.foodType && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.foodType.message}
                  </p>
                )}
              </div>

              {modeValue === "Bus" ? (
                <>
                  <div className="col-span-2 md:col-span-1">
                    <Label
                      htmlFor="busName"
                      className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Bus Name
                    </Label>
                    <Input
                      id="busName"
                      {...register("busName")}
                      placeholder="from place"
                    />
                    {errors.busName && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.busName.message}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                ""
              )}

              {modeValue === "Train" ? (
                <>
                  <div className="col-span-2 md:col-span-1">
                    <Label
                      htmlFor="trainNumber"
                      className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Train Number
                    </Label>
                    <Input
                      id="trainNumber"
                      {...register("trainNumber")}
                      placeholder="train number"
                    />
                    {errors.trainNumber && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.trainNumber.message}
                      </p>
                    )}
                  </div>

                  <div className="col-span-2 md:col-span-1">
                    <Label
                      htmlFor="trainName"
                      className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Train Name
                    </Label>
                    <Input
                      id="trainName"
                      {...register("trainName")}
                      placeholder="train name"
                    />
                    {errors.trainName && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.trainName.message}
                      </p>
                    )}
                  </div>

                  <div className="col-span-2 md:col-span-1">
                    <Label
                      htmlFor="trainClass"
                      className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Class
                    </Label>
                    <Controller
                      name="trainClass"
                      control={control}
                      render={({ field }) => (
                        <Select
                          key={field.value}
                          onValueChange={(value) =>
                            setValue(
                              "trainClass",
                              value === "none" ? "" : value
                            )
                          }
                          value={watch("trainClass")}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {trainClassOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={String(option.value)}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.trainClass && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.trainClass.message}
                      </p>
                    )}
                  </div>

                  <div className="col-span-2 md:col-span-1">
                    <Label
                      htmlFor="pnrNumber"
                      className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      PNR Number
                    </Label>
                    <Input
                      id="pnrNumber"
                      {...register("pnrNumber")}
                      placeholder="pnr Number"
                    />
                    {errors.pnrNumber && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.pnrNumber.message}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                ""
              )}

              {modeValue === "Flight" ? (
                <>
                  <div className="col-span-2 md:col-span-1">
                    <Label
                      htmlFor="flightNumber"
                      className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Flight Number
                    </Label>
                    <Input
                      id="flightNumber"
                      {...register("flightNumber")}
                      placeholder="train number"
                    />
                    {errors.flightNumber && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.flightNumber.message}
                      </p>
                    )}
                  </div>

                  <div className="col-span-2 md:col-span-1">
                    <Label
                      htmlFor="airlineId"
                      className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Flight Name
                    </Label>
                    <Controller
                      name="airlineId"
                      control={control}
                      render={({ field }) => (
                        <Popover
                          open={openAirlineId}
                          onOpenChange={setOpenAirlineId}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={openAirlineId ? "true" : "false"} // This should depend on the popover state
                              className=" w-[275px] justify-between mt-1"
                              onClick={() => setOpenAirlineId((prev) => !prev)} // Toggle popover on button click
                            >
                              {field.value
                                ? airlineOptions &&
                                  airlineOptions.find(
                                    (airline) => airline.id === field.value
                                  )?.airlineName
                                : "Select airline"}
                              <ChevronsUpDown className="opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[325px] p-0">
                            <Command>
                              <CommandInput
                                placeholder="Search airline..."
                                className="h-9"
                              />
                              <CommandList>
                                <CommandEmpty>No airline found.</CommandEmpty>
                                <CommandGroup>
                                  {airlineOptions &&
                                    airlineOptions.map((airline) => (
                                      <CommandItem
                                        key={airline.id}
                                        // value={String(airline.id)}
                                        value={
                                          airline?.airlineName
                                            ? airline.airlineName.toLowerCase()
                                            : ""
                                        } // 👈 Use airline name for filtering
                                        onSelect={(currentValue) => {
                                          if (airline.id === "none") {
                                            setValue("airlineId", ""); // Clear the value
                                          } else {
                                            setValue("airlineId", airline.id);
                                          }
                                          // handleTourSelectChange(airline);
                                          setOpenAirlineId(false);
                                          // Close popover after selection
                                        }}
                                      >
                                        {airline.airlineName}
                                        <Check
                                          className={cn(
                                            "ml-auto",
                                            airline.id === field.value
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
                    {errors.airlineId && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.airlineId.message}
                      </p>
                    )}
                  </div>

                  <div className="col-span-2 md:col-span-1">
                    <Label
                      htmlFor="flightClass"
                      className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Class
                    </Label>
                    <Controller
                      name="flightClass"
                      control={control}
                      render={({ field }) => (
                        <Select
                          key={field.value}
                          onValueChange={(value) =>
                            setValue(
                              "flightClass",
                              value === "none" ? "" : value
                            )
                          }
                          value={watch("flightClass")}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {flightClassOptions.map((option) => (
                              <SelectItem
                                key={option.value}
                                value={String(option.value)}
                              >
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.flightClass && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.flightClass.message}
                      </p>
                    )}
                  </div>

                  <div className="col-span-2 md:col-span-1">
                    <Label
                      htmlFor="pnrNumber"
                      className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      PNR Number
                    </Label>
                    <Input
                      id="pnrNumber"
                      {...register("pnrNumber")}
                      placeholder="pnr Number"
                    />
                    {errors.pnrNumber && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.pnrNumber.message}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                ""
              )}

              <div className="col-span-2 lg:col-span-3">
                <Label
                  htmlFor="billDescription"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Bill Description
                </Label>
                <Textarea
                  id="billDescription"
                  {...register("billDescription")}
                  placeholder="bill description"
                  rows={4} // Optional: control height
                />
                {errors.billDescription && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.billDescription.message}
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
              onClick={() => navigate("/bookings")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="min-w-[90px]">
              {isLoading ? (
                <LoaderCircle className="animate-spin h-4 w-4" />
              ) : mode === "create" ? (
                "Create journey booking"
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

export default HotelBookingForm;
