import React, { useEffect, useState } from "react";
import {
  useForm,
  SubmitHandler,
  Controller,
  useFieldArray,
} from "react-hook-form";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
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
import TourBookingDetailsTable from "../TourBookingDetailsTable";
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
  mode: z
    .string()
    .min(1, "Mode field is required.")
    .max(100, "Mode field must not exceed 100 characters."),
  fromPlace: z
    .string()
    .min(1, "From place field is required.")
    .max(100, "From place field must not exceed 100 characters."),
  toPlace: z
    .string()
    .min(1, "From place field is required.")
    .max(100, "From place field must not exceed 100 characters."),
  journeyBookingDate: z
    .string()
    .min(1, " journey Booking Date field is required"),
  fromDepartureDate: z.string().min(1, "From departure Date field is required"),
  toArrivalDate: z.string().min(1, " To arrival Date field is required"),
  foodType: z.string().optional(),
  billDescription: z
    .string()
    .max(180, "Bill Description field must not exceed 100 characters.")
    .optional(),
  busName: z
    .string()
    .max(180, "Bus Name field must not exceed 100 characters.")
    .optional(),
  trainName: z
    .string()
    .max(180, "Train Name field must not exceed 100 characters.")
    .optional(),
  trainNumber: z
    .string()
    .max(180, "Train Number field must not exceed 100 characters.")
    .optional(),
  flightNumber: z
    .string()
    .max(180, "Train Number field must not exceed 100 characters.")
    .optional(),
  trainClass: z
    .string()
    .max(180, "Class field must not exceed 100 characters.")
    .optional(),
  airlineClass: z
    .string()
    .max(180, "Class field must not exceed 100 characters.")
    .optional(),
  flightClass: z
    .string()
    .max(180, "Class field must not exceed 100 characters.")
    .optional(),
  pnrNumber: z
    .string()
    .max(180, "PNR No. field must not exceed 100 characters.")
    .optional(),
  airlineId: z.coerce.number().nullable().optional(),
  vehicleId: z.coerce.number().nullable().optional(),
});

type FormInputs = z.infer<typeof FormSchema>;

const defaultValues: FormInputs = {
  mode: "",
  fromPlace: "",
  toPlace: "",
  journeyBookingDate: new Date().toISOString().split("T")[0], // Default to today
  fromDepartureDate: "",
  toArrivalDate: "",
  foodType: "",
  billDescription: "",
  busName: "",
  trainName: "",
  trainNumber: "",
  flightNumber: "",
  trainClass: "",
  flightClass: "",
  airlineClass: "",
  pnrNumber: "",
  airlineId: null,
  vehicleId: null,
};

const JourneyBookingForm = ({ mode }: { mode: "create" | "edit" }) => {
  const { id, journeyBookingId } = useParams<{
    id: string;
    journeyBookingId: string;
  }>();
  const [openAirlineId, setOpenAirlineId] = useState<boolean>(false);
  const [openVehicleId, setOpenVehicleId] = useState<boolean>(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  dayjs.extend(utc);
  dayjs.extend(timezone);
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

  // airlines
  const { data: airlines, isLoading: isAirlineLoading } = useQuery({
    queryKey: ["airlines"],
    queryFn: async () => {
      const response = await get(`/airlines/all`);
      return response; // API returns the sector object directly
    },
  });

  const airlineOptions = [
    { id: "none", airlineName: "---" }, // The 'unselect' option
    ...(airlines ?? []),
  ];

  // airlines
  const { data: vehicles, isLoading: isVehicleLoading } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const response = await get(`/vehicles/all`);
      return response; // API returns the sector object directly
    },
  });

  const vehicleOptions = [
    { id: "none", vehicleName: "---" }, // The 'unselect' option
    ...(vehicles ?? []),
  ];

  const { data: editJourneyBookingData, isLoading: editJourneyBookingLoading } =
    useQuery({
      queryKey: ["editJourneyBooking", journeyBookingId],
      queryFn: async () => {
        const response = await get(`/journey-bookings/${journeyBookingId}`);
        return response; // API returns the sector object directly
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
    if (editJourneyBookingData) {
      reset({
        mode: editJourneyBookingData.mode || "",
        fromPlace: editJourneyBookingData.fromPlace || "",
        toPlace: editJourneyBookingData.toPlace || "",
        journeyBookingDate: editJourneyBookingData.journeyBookingDate
          ? new Date(editJourneyBookingData.journeyBookingDate)
              .toISOString()
              .split("T")[0]
          : "",

        fromDepartureDate: editJourneyBookingData.fromDepartureDate
          ? dayjs
              .utc(editJourneyBookingData.fromDepartureDate) // Convert to UTC
              .tz("Asia/Kolkata") // Convert to IST
              .format("YYYY-MM-DDTHH:mm") // Convert to the required format for datetime-local
          : "",
        toArrivalDate: editJourneyBookingData.toArrivalDate
          ? dayjs
              .utc(editJourneyBookingData.toArrivalDate) // Convert to UTC
              .tz("Asia/Kolkata") // Convert to IST
              .format("YYYY-MM-DDTHH:mm") // Convert to the required format for datetime-local
          : "",

        // fromDepartureDate: editJourneyBookingData.fromDepartureDate
        //   ? new Date(editJourneyBookingData.fromDepartureDate)
        //       .toISOString()
        //       .split("T")[0]
        //   : "",
        // toArrivalDate: editJourneyBookingData.toArrivalDate
        //   ? new Date(editJourneyBookingData.toArrivalDate)
        //       .toISOString()
        //       .split("T")[0]
        //   : "",
        foodType: editJourneyBookingData.foodType || "",
        trainNumber: editJourneyBookingData.trainNumber || "",
        trainName: editJourneyBookingData.trainName || "",
        busName: editJourneyBookingData.busName || "",
        pnrNumber: editJourneyBookingData.pnrNumber || "",
        trainClass:
          editJourneyBookingData.mode === "Train"
            ? editJourneyBookingData.class
            : "",
        flightClass:
          editJourneyBookingData.mode === "Flight"
            ? editJourneyBookingData.class
            : "",
        flightNumber: editJourneyBookingData.flightNumber || "",

        billDescription: editJourneyBookingData.billDescription || "",
        airlineId: editJourneyBookingData.airlineId
          ? editJourneyBookingData.airlineId
          : "",
        vehicleId: editJourneyBookingData.vehicleId
          ? editJourneyBookingData.vehicleId
          : "",
      });
    }
  }, [editJourneyBookingData, reset, setValue]);

  const modeValue = watch("mode");

  // Mutation for creating a user
  const createMutation = useMutation({
    mutationFn: (data: FormInputs) => post(`/journey-bookings/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["journey-bookings"]); // Refetch the users list
      toast.success("Journey Booking added successfully");
      navigate(`/bookings/${id}/details`);
    },
    onError: (error: any) => {
      Validate(error, setError);
      toast.error(
        error.response?.data?.message || "Failed to create journey booking"
      );
    },
  });

  // Mutation for updating a user
  const updateMutation = useMutation({
    mutationFn: (data: FormInputs) =>
      put(`/journey-bookings/${journeyBookingId}`, data),
    onSuccess: () => {
      toast.success("Journey Booking updated successfully");
      queryClient.invalidateQueries(["journey-bookings"]);
      navigate(`/bookings/${id}/details`);
    },
    onError: (error: any) => {
      Validate(error, setError);
      console.log("this is error", error);
      toast.error(
        error.response?.data?.message || "Failed to update journey booking"
      );
    },
  });

  // // Handle form submission
  // const onSubmit: SubmitHandler<FormInputs> = (data) => {
  //   console.log("this is data ", data);
  //   if (data.mode === "Train") {
  //     data.busName = "";
  //     data.flightClass = "";
  //     data.airlineId = null;
  //     data.flightNumber = "";
  //   }
  //   if (data.mode === "Flight") {
  //     data.busName = "";
  //     data.trainName = "";
  //     data.trainNumber = "";
  //     data.trainClass = "";
  //   }
  //   if (data.mode === "Bus") {
  //     data.trainName = "";
  //     data.trainNumber = "";
  //     data.pnrNumber = "";
  //     data.trainClass = "";
  //     data.flightClass = "";
  //     data.airlineId = null;
  //     data.flightNumber = "";
  //   }

  //   if (mode === "create") {
  //     createMutation.mutate(data); // Trigger create mutation
  //   } else {
  //     updateMutation.mutate(data); // Trigger update mutation
  //   }
  // };

  const onSubmit: SubmitHandler<FormInputs> = (data) => {
    let cleanedData = { ...data };

    if (cleanedData.mode === "Train") {
      cleanedData = {
        ...cleanedData,
        busName: "",
        flightClass: "",
        airlineId: null,
        flightNumber: "",
        vehicleId: null,
      };
    }

    if (cleanedData.mode === "Flight") {
      cleanedData = {
        ...cleanedData,
        busName: "",
        trainName: "",
        trainNumber: "",
        vehicleId: null,
        trainClass: "",
      };
    }

    if (cleanedData.mode === "Bus") {
      cleanedData = {
        ...cleanedData,
        trainName: "",
        trainNumber: "",
        pnrNumber: "",
        trainClass: "",
        flightClass: "",
        airlineId: null,
        vehicleId: null,
        flightNumber: "",
      };
    }

    if (cleanedData.mode === "Car") {
      cleanedData = {
        ...cleanedData,
        trainName: "",
        trainNumber: "",
        pnrNumber: "",
        trainClass: "",
        flightClass: "",
        airlineId: null,
        flightNumber: "",
        busName: "",
      };
    }

    if (mode === "create") {
      createMutation.mutate(cleanedData);
    } else {
      updateMutation.mutate(cleanedData);
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
            {/* start */}
            <TourBookingDetailsTable
              editBookingLoading={editBookingLoading}
              isEditBookingError={isEditBookingError}
              editBookingData={editBookingData}
            />
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
                  From Place <span className="text-red-500">*</span>
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
                  To Place <span className="text-red-500">*</span>
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
                  Booking Date <span className="text-red-500">*</span>
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
                  From Departure Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="fromDepartureDate"
                  type="datetime-local"
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
                  To Arrival Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="toArrivalDate"
                  type="datetime-local"
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

              {modeValue === "Car" ? (
                <>
                  <div className="col-span-2 md:col-span-1">
                    <Label
                      htmlFor="vehicleId"
                      className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Car Name
                    </Label>
                    <Controller
                      name="vehicleId"
                      control={control}
                      render={({ field }) => (
                        <Popover
                          open={openVehicleId}
                          onOpenChange={setOpenVehicleId}
                        >
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              role="combobox"
                              aria-expanded={openVehicleId ? "true" : "false"} // This should depend on the popover state
                              className=" w-[300px] justify-between mt-1"
                              onClick={() => setOpenVehicleId((prev) => !prev)} // Toggle popover on button click
                            >
                              {field.value
                                ? vehicleOptions &&
                                  vehicleOptions.find(
                                    (vehicle) => vehicle.id === field.value
                                  )?.vehicleName
                                : "Select vehicle"}
                              <ChevronsUpDown className="opacity-50" />
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-[325px] p-0">
                            <Command>
                              <CommandInput
                                placeholder="Search vehicle..."
                                className="h-9"
                              />
                              <CommandList>
                                <CommandEmpty>No vehicle found.</CommandEmpty>
                                <CommandGroup>
                                  {vehicleOptions &&
                                    vehicleOptions.map((vehicle) => (
                                      <CommandItem
                                        key={vehicle.id}
                                        // value={String(vehicle.id)}
                                        value={
                                          vehicle?.vehicleName
                                            ? vehicle.vehicleName.toLowerCase()
                                            : ""
                                        } // 👈 Use airline name for filtering
                                        onSelect={(currentValue) => {
                                          if (vehicle.id === "none") {
                                            setValue("vehicleId", null); // Clear the value
                                          } else {
                                            setValue("vehicleId", vehicle.id);
                                          }
                                          // handleTourSelectChange(airline);
                                          setOpenVehicleId(false);
                                          // Close popover after selection
                                        }}
                                      >
                                        {vehicle.vehicleName}
                                        <Check
                                          className={cn(
                                            "ml-auto",
                                            vehicle.id === field.value
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
                    {errors.vehicleId && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.vehicleId.message}
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
                              className=" w-[300px] justify-between mt-1"
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
                                            setValue("airlineId", null); // Clear the value
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
              onClick={() => navigate(`/bookings/${id}/details`)}
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

export default JourneyBookingForm;
