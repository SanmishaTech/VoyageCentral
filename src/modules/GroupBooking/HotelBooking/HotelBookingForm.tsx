import React, { useEffect, useState } from "react";
import {
  useForm,
  SubmitHandler,
  Controller,
  useFieldArray,
  useWatch,
} from "react-hook-form";
import dayjs from "dayjs";
import TourBookingDetailsTable from "../TourBookingDetailsTable";
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
  hrvNumber: z.string().optional(),
  partyComingFrom: z

    .string()
    .min(1, "Party coming from must be at least 1 characters.")
    .max(100, "Party coming from must not exceed 100 characters."),
  checkInDate: z.string().min(1, "Check-in date is required."),
  checkOutDate: z.string().min(1, "Check-out date is required."),

  nights: z.coerce
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

  beds: z.string().max(22, "Beds must not exceed 22 characters.").optional(),

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
  amount: z.preprocess(
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
      .min(1, "Amount must be greater than 0")
  ),
  totalAmount: z.preprocess(
    (val) => {
      if (typeof val === "string") {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? val : parsed;
      }
      return val;
    },
    z
      .number({
        invalid_type_error: "Total Amount must be a number",
        required_error: "Total Amount is required",
      })
      .min(1, "Total Amount must be greater than 0")
  ),
});

type FormInputs = z.infer<typeof FormSchema>;

const defaultValues: FormInputs = {
  hrvNumber: "",
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
  amount: "",
  totalAmount: "",
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

  // Watch values
  const isBed = watch("extraBed");
  const bedCost = watch("extraBedCost");
  const amount = watch("amount");

  // Real-time totalAmount calculation
  useEffect(() => {
    const parsedBedCost = isBed ? parseFloat(bedCost) || 0 : 0;
    const parsedAmount = parseFloat(amount) || 0;
    const total = parsedBedCost + parsedAmount;

    setValue("totalAmount", total.toFixed(2));
  }, [bedCost, amount, isBed, setValue]);

  // Clear bedCost if isBed is false
  useEffect(() => {
    if (!isBed) {
      setValue("extraBedCost", null);
      setValue("beds", "");
    }
  }, [isBed, setValue]);

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
    if (editHotelBookingData) {
      reset({
        hrvNumber: editHotelBookingData.hrvNumber || "",
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
        rooms: String(editHotelBookingData.rooms) || "",

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
        beds:
          editHotelBookingData.beds !== null
            ? String(editHotelBookingData.beds)
            : "",

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
        amount: editHotelBookingData.amount
          ? parseFloat(editHotelBookingData.amount).toFixed(2)
          : "",
        totalAmount: editHotelBookingData.totalAmount
          ? parseFloat(editHotelBookingData.totalAmount).toFixed(2)
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
  // const checkInDate = useWatch({ control, name: "checkInDate" });
  // const checkOutDate = useWatch({ control, name: "checkOutDate" });
  const checkInDate = watch("checkInDate");
  const checkOutDate = watch("checkOutDate");
  const extraBedChecked = watch("extraBed");

  useEffect(() => {
    if (checkInDate && checkOutDate) {
      const nights = dayjs(checkOutDate).diff(dayjs(checkInDate), "day");
      if (nights >= 0) {
        setValue("nights", nights);
      }
    }
  }, [checkInDate, checkOutDate, setValue]);

  const onSubmit: SubmitHandler<FormInputs> = (data) => {
    let cleanedData = { ...data };

    if (cleanedData.extraBed === 0) {
      cleanedData = {
        ...cleanedData,
        extraBedCost: null,
        beds: "",
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
            <TourBookingDetailsTable
              editBookingLoading={editBookingLoading}
              isEditBookingError={isEditBookingError}
              editBookingData={editBookingData}
            />

            <CardTitle className="font-semibold mt-5 text-gray-800 dark:text-gray-200 mb-4">
              Hotel Booking
            </CardTitle>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* HRV number */}
              <div>
                <Label
                  htmlFor="hrvNumber"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  HRV
                </Label>
                <Input
                  id="hrvNumber"
                  {...register("hrvNumber")}
                  readOnly
                  className="bg-gray-200"
                  placeholder="hrv"
                />
                {errors.hrvNumber && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.hrvNumber.message}
                  </p>
                )}
              </div>
              {/* Party Coming From */}
              <div>
                <Label
                  htmlFor="partyComingFrom"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Party Coming From <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="partyComingFrom"
                  {...register("partyComingFrom")}
                  placeholder="Party Coming From"
                />
                {errors.partyComingFrom && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.partyComingFrom.message}
                  </p>
                )}
              </div>

              {/* Check-in Date */}
              <div>
                <Label
                  htmlFor="checkInDate"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Check-in Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="checkInDate"
                  type="date"
                  {...register("checkInDate")}
                />
                {errors.checkInDate && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.checkInDate.message}
                  </p>
                )}
              </div>

              {/* Check-out Date */}
              <div>
                <Label
                  htmlFor="checkOutDate"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Check-out Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="checkOutDate"
                  type="date"
                  {...register("checkOutDate")}
                />
                {errors.checkOutDate && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.checkOutDate.message}
                  </p>
                )}
              </div>

              {/* Nights */}
              <div>
                <Label
                  htmlFor="nights"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Nights
                </Label>
                <Input
                  id="nights"
                  readOnly
                  className="bg-gray-200"
                  type="number"
                  {...register("nights")}
                />
                {errors.nights && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.nights.message}
                  </p>
                )}
              </div>

              {/* City ID */}
              <div>
                <Label
                  htmlFor="cityId"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  City <span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="cityId"
                  control={control}
                  render={({ field }) => (
                    <Popover open={openCityId} onOpenChange={setOpenCityId}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openCityId ? "true" : "false"} // This should depend on the popover state
                          className=" w-[300px] justify-between mt-1"
                          onClick={() => setOpenCityId((prev) => !prev)} // Toggle popover on button click
                        >
                          {field.value
                            ? cityOptions &&
                              cityOptions.find(
                                (city) => city.id === field.value
                              )?.cityName
                            : "Select city"}
                          <ChevronsUpDown className="opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[325px] p-0">
                        <Command>
                          <CommandInput
                            placeholder="Search city..."
                            className="h-9"
                          />
                          <CommandList>
                            <CommandEmpty>No city found.</CommandEmpty>
                            <CommandGroup>
                              {cityOptions &&
                                cityOptions.map((city) => (
                                  <CommandItem
                                    key={city.id}
                                    // value={String(city.id)}
                                    value={
                                      city?.cityName
                                        ? city.cityName.toLowerCase()
                                        : ""
                                    } // 👈 Use city name for filtering
                                    onSelect={(currentValue) => {
                                      if (city.id === "none") {
                                        setValue("cityId", ""); // Clear the value
                                      } else {
                                        setValue("cityId", city.id);
                                      }
                                      // handleTourSelectChange(airline);
                                      setOpenCityId(false);
                                      // Close popover after selection
                                    }}
                                  >
                                    {city.cityName}
                                    <Check
                                      className={cn(
                                        "ml-auto",
                                        city.id === field.value
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
                {errors.cityId && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.cityId.message}
                  </p>
                )}
              </div>

              {/* Hotel ID */}
              <div>
                <Label
                  htmlFor="hotelId"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Hotel <span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="hotelId"
                  control={control}
                  render={({ field }) => (
                    <Popover open={openHotelId} onOpenChange={setOpenHotelId}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openHotelId ? "true" : "false"} // This should depend on the popover state
                          className=" w-[300px] justify-between mt-1"
                          onClick={() => setOpenHotelId((prev) => !prev)} // Toggle popover on button click
                        >
                          {field.value
                            ? hotelOptions &&
                              hotelOptions.find(
                                (hotel) => hotel.id === field.value
                              )?.hotelName
                            : "Select hotel"}
                          <ChevronsUpDown className="opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[325px] p-0">
                        <Command>
                          <CommandInput
                            placeholder="Search hotel..."
                            className="h-9"
                          />
                          <CommandList>
                            <CommandEmpty>No hotel found.</CommandEmpty>
                            <CommandGroup>
                              {hotelOptions &&
                                hotelOptions.map((hotel) => (
                                  <CommandItem
                                    key={hotel.id}
                                    // value={String(hotel.id)}
                                    value={
                                      hotel?.hotelName
                                        ? hotel.hotelName.toLowerCase()
                                        : ""
                                    } // 👈 Use hotel name for filtering
                                    onSelect={(currentValue) => {
                                      if (hotel.id === "none") {
                                        setValue("hotelId", ""); // Clear the value
                                      } else {
                                        setValue("hotelId", hotel.id);
                                      }
                                      // handleTourSelectChange(airline);
                                      setOpenHotelId(false);
                                      // Close popover after selection
                                    }}
                                  >
                                    {hotel.hotelName}
                                    <Check
                                      className={cn(
                                        "ml-auto",
                                        hotel.id === field.value
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
                {errors.hotelId && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.hotelId.message}
                  </p>
                )}
              </div>

              {/* Plan */}
              <div>
                <Label
                  htmlFor="plan"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Plan <span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="plan"
                  control={control}
                  render={({ field }) => (
                    <Select
                      key={field.value}
                      onValueChange={(value) =>
                        setValue("plan", value === "none" ? "" : value)
                      }
                      value={watch("plan")}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {planOptions.map((option) => (
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
                {errors.plan && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.plan.message}
                  </p>
                )}
              </div>

              {/* Rooms */}
              <div>
                <Label
                  htmlFor="rooms"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Rooms <span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="rooms"
                  control={control}
                  render={({ field }) => (
                    <Select
                      key={field.value}
                      onValueChange={(value) =>
                        setValue("rooms", value === "none" ? "" : value)
                      }
                      value={watch("rooms")}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {roomOptions.map((option) => (
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
                {errors.rooms && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.rooms.message}
                  </p>
                )}
              </div>

              {/* Accommodation ID */}
              <div>
                <Label
                  htmlFor="accommodationId"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Type Of Accommodation <span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="accommodationId"
                  control={control}
                  render={({ field }) => (
                    <Popover
                      open={openAccommodationId}
                      onOpenChange={setOpenAccommodationId}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openAccommodationId ? "true" : "false"} // This should depend on the popover state
                          className=" w-[300px] justify-between mt-1"
                          onClick={() =>
                            setOpenAccommodationId((prev) => !prev)
                          } // Toggle popover on button click
                        >
                          {field.value
                            ? accommodationOptions &&
                              accommodationOptions.find(
                                (accommodation) =>
                                  accommodation.id === field.value
                              )?.accommodationName
                            : "Select accommodation"}
                          <ChevronsUpDown className="opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[325px] p-0">
                        <Command>
                          <CommandInput
                            placeholder="Search accommodation..."
                            className="h-9"
                          />
                          <CommandList>
                            <CommandEmpty>No accommodation found.</CommandEmpty>
                            <CommandGroup>
                              {accommodationOptions &&
                                accommodationOptions.map((accommodation) => (
                                  <CommandItem
                                    key={accommodation.id}
                                    // value={String(accommodation.id)}
                                    value={
                                      accommodation?.accommodationName
                                        ? accommodation.accommodationName.toLowerCase()
                                        : ""
                                    } // 👈 Use accommodation name for filtering
                                    onSelect={(currentValue) => {
                                      if (accommodation.id === "none") {
                                        setValue("accommodationId", ""); // Clear the value
                                      } else {
                                        setValue(
                                          "accommodationId",
                                          accommodation.id
                                        );
                                      }
                                      // handleTourSelectChange(airline);
                                      setOpenAccommodationId(false);
                                      // Close popover after selection
                                    }}
                                  >
                                    {accommodation.accommodationName}
                                    <Check
                                      className={cn(
                                        "ml-auto",
                                        accommodation.id === field.value
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
                {errors.accommodationId && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.accommodationId.message}
                  </p>
                )}
              </div>

              {/* Tariff Package */}
              <div>
                <Label
                  htmlFor="tariffPackage"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Tariff Package
                </Label>
                <Controller
                  name="tariffPackage"
                  control={control}
                  render={({ field }) => (
                    <Select
                      key={field.value}
                      onValueChange={(value) =>
                        setValue("tariffPackage", value === "none" ? "" : value)
                      }
                      value={watch("tariffPackage")}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {tariffPackageOptions.map((option) => (
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
                {errors.tariffPackage && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.tariffPackage.message}
                  </p>
                )}
              </div>

              {/* Accommodation Note */}
              <div>
                <Label
                  htmlFor="accommodationNote"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Accommodation Note
                </Label>
                <Input
                  id="accommodationNote"
                  {...register("accommodationNote")}
                  placeholder="Accommodation Note"
                />
                {errors.accommodationNote && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.accommodationNote.message}
                  </p>
                )}
              </div>

              {/* Extra Bed */}

              <div className="flex mt-6 ml-20 items-center space-x-2">
                <input
                  type="checkbox"
                  id="extraBed"
                  {...register("extraBed")}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <Label
                  htmlFor="extraBed"
                  className=" block text-xs font-medium text-gray-700 dark:text-gray-300"
                >
                  Extra Bed
                </Label>
              </div>

              {extraBedChecked ? (
                <>
                  {/* Beds */}
                  <div>
                    <Label
                      htmlFor="beds"
                      className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Beds
                    </Label>
                    <Controller
                      name="beds"
                      control={control}
                      render={({ field }) => (
                        <Select
                          key={field.value}
                          onValueChange={(value) =>
                            setValue("beds", value === "none" ? "" : value)
                          }
                          value={field.value}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select" />
                          </SelectTrigger>
                          <SelectContent>
                            {bedOptions.map((option) => (
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
                    {errors.beds && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.beds.message}
                      </p>
                    )}
                  </div>

                  {/* Extra Bed Cost */}
                  <div>
                    <Label
                      htmlFor="extraBedCost"
                      className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Extra Bed Cost
                    </Label>
                    <Input
                      id="extraBedCost"
                      type="number"
                      step="0.01"
                      placeholder="Enter cost"
                      {...register("extraBedCost")}
                    />
                    {errors.extraBedCost && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.extraBedCost.message}
                      </p>
                    )}
                  </div>
                </>
              ) : null}

              {/* Hotel Booking Date */}
              <div>
                <Label
                  htmlFor="hotelBookingDate"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Hotel Booking Date
                </Label>
                <Input
                  id="hotelBookingDate"
                  type="date"
                  {...register("hotelBookingDate")}
                />
                {errors.hotelBookingDate && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.hotelBookingDate.message}
                  </p>
                )}
              </div>

              {/* Booking Confirmed By */}
              <div>
                <Label
                  htmlFor="bookingConfirmedBy"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Booking Confirmed By <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="bookingConfirmedBy"
                  {...register("bookingConfirmedBy")}
                  placeholder="Booking Confirmed By"
                />
                {errors.bookingConfirmedBy && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.bookingConfirmedBy.message}
                  </p>
                )}
              </div>

              {/* Confirmation Number */}
              <div>
                <Label
                  htmlFor="confirmationNumber"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Confirmation Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="confirmationNumber"
                  {...register("confirmationNumber")}
                  placeholder="Confirmation Number"
                />
                {errors.confirmationNumber && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.confirmationNumber.message}
                  </p>
                )}
              </div>

              {/* Billing Instructions */}
              <div>
                <Label
                  htmlFor="billingInstructions"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Billing Instructions
                </Label>
                <Input
                  id="billingInstructions"
                  {...register("billingInstructions")}
                  placeholder="Billing Instructions"
                />
                {errors.billingInstructions && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.billingInstructions.message}
                  </p>
                )}
              </div>

              {/* Special Requirement */}
              <div className="">
                <Label
                  htmlFor="specialRequirement"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Special Requirement
                </Label>
                <Textarea
                  id="specialRequirement"
                  {...register("specialRequirement")}
                  placeholder="Special Requirement"
                  rows={4}
                />
                {errors.specialRequirement && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.specialRequirement.message}
                  </p>
                )}
              </div>

              {/* Notes */}
              <div>
                <Label
                  htmlFor="notes"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  {...register("notes")}
                  placeholder="Notes"
                  rows={4}
                />
                {errors.notes && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.notes.message}
                  </p>
                )}
              </div>

              {/* Bill Description */}
              <div className="md:col-span-2">
                <Label
                  htmlFor="billDescription"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Bill Description
                </Label>
                <Textarea
                  id="billDescription"
                  {...register("billDescription")}
                  placeholder="Bill Description"
                  rows={4}
                />
                {errors.billDescription && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.billDescription.message}
                  </p>
                )}
              </div>
              <div className=" md:col-start-2">
                <Label
                  htmlFor="amount"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Amount <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="amount"
                  {...register("amount")}
                  step="0.01"
                  type="number"
                  placeholder="Enter amount"
                />
                {errors.amount && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.amount.message}
                  </p>
                )}
              </div>
              <div className=" md:col-start-3">
                <Label
                  htmlFor="totalAmount"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Total Amount <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="totalAmount"
                  {...register("totalAmount")}
                  readOnly
                  type="number"
                  step="0.01"
                  className="bg-gray-100"
                  placeholder="Total amount"
                />
                {errors.totalAmount && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.totalAmount.message}
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
                "Create Hotel booking"
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
