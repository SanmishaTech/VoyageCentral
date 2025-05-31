import React, { useEffect, useState } from "react";
import {
  useForm,
  SubmitHandler,
  Controller,
  useFieldArray,
} from "react-hook-form";
import {
  budgetFieldOptions,
  noOfAdultsOptions,
  noOfChildrens5To11Options,
  noOfChildrensBelow5Options,
  noOfNightOptions,
  bookingTypeOptions,
  genderOptions,
  foodTypeOptions,
} from "@/config/data";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import Validate from "@/lib/Handlevalidation";
import { cn } from "@/lib/utils";
import { Textarea } from "@/components/ui/textarea"; // adjust path if needed
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  LoaderCircle,
  Trash2,
  PlusCircle,
  Check,
  ChevronsUpDown,
} from "lucide-react"; // Import the LoaderCircle icon
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";
import { get } from "@/services/apiService";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { post, put } from "@/services/apiService";
import { set } from "date-fns";
import AddClient from "./AddClient";

const GroupBookingFormSchema = z.object({
  groupBookingDetailId: z.string().optional(),
  day: z
    .string()
    .refine((val) => !isNaN(Number(val)), {
      message: "Day must be a valid number.",
    })
    .transform((val) => Number(val))
    .pipe(
      z
        .number()
        .int("Day must be an integer.")
        .min(1, "Day field is required.")
        .max(1000, "Day cannot be more than 1000.")
    ),
  description: z
    .string()
    .min(1, "Description is required.")
    .max(2000, "Description must not exceed 2000 characters."),
  date: z
    .string()
    .min(1, "Date is required.")
    .max(100, "Date must not exceed 100 characters."),
  cityId: z.string().optional(),
});

const FormSchema = z.object({
  groupBookingNumber: z.string().optional(),
  groupBookingDate: z
    .string()
    .min(1, "Booking Date is required.")
    .max(100, "Booking Date must not exceed 100 characters."),

  journeyDate: z
    .string()
    .min(1, "journey Date is required.")
    .max(100, "journey Date must not exceed 100 characters.")
    .optional(),

  branchId: z
    .string()
    // .min(1, "Branch field is required.")
    .max(100, "number of adults must not exceed 100 characters.")
    .optional(),
  tourId: z
    .union([
      z
        .string()
        .min(1, "Tour Field is required")
        .max(100, "tour must not exceed 100 characters."),
      z.number().min(1, "Tour Field is required"),
    ])
    .optional(),
  bookingType: z.string().min(1, "Booking type is required"),
  isJourney: z.coerce.number().min(0, " required"),
  isHotel: z.coerce.number().min(0, " required"),
  isVehicle: z.coerce.number().min(0, " required"),
  bookingDetail: z
    .string()
    .max(100, "Booking details must not exceed 100 characters.")
    .optional(),

  groupBookingDetails: z.array(GroupBookingFormSchema).optional(),
});

type FormInputs = z.infer<typeof FormSchema>;

const GroupBookingForm = ({ mode }: { mode: "create" | "edit" }) => {
  const { id } = useParams<{ id: string }>();
  const [openTourId, setOpenTourId] = useState<boolean>(false);
  const [selectedTourDetailsData, setSelectedTourDetailsData] =
    useState<any>(null); //used for:if same tour selected then to prevent tourBookingDetais to chnage

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const storedUser = localStorage.getItem("user");
  const parsedUser = JSON.parse(storedUser);
  const role = parsedUser.role;

  const defaultValues: FormInputs = {
    groupBookingNumber: "",
    groupBookingDate: new Date().toISOString().split("T")[0], // Today's date
    journeyDate: "",
    branchId: "",
    tourId: "",
    isJourney: 0,
    isHotel: 0,
    isVehicle: 0,
    bookingDetail: "",
    bookingType: "",
    groupBookingDetails: [], // Empty array for booking details
  };

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

  const { fields, append, remove } = useFieldArray({
    control,
    name: "groupBookingDetails", // Name of the array in the form schema
  });

  const { data: editGroupBookingData, isLoading: editGroupBookingLoading } =
    useQuery({
      queryKey: ["editGroupBooking", id],
      queryFn: async () => {
        const response = await get(`/group-bookings/${id}`);
        return response; // API returns the sector object directly
      },
      enabled: !!id && mode === "edit",
    });

  // branches
  const { data: branches, isLoading: isBranchesLoading } = useQuery({
    queryKey: ["branches"],
    queryFn: async () => {
      const response = await get(`/branches/all`);
      return response; // API returns the sector object directly
    },
  });

  // tours
  const { data: groupTours, isLoading: isGroupToursLoading } = useQuery({
    queryKey: ["groupTours"],
    queryFn: async () => {
      const response = await get(`/tours/allGroupTours`);
      return response; // API returns the sector object directly
    },
  });

  const tourOptions = [
    { id: "none", tourTitle: "---" }, // The 'unselect' option
    ...(groupTours ?? []),
  ];

  // cities
  const { data: cities, isLoading: isCitiesLoading } = useQuery({
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

  useEffect(() => {
    if (mode === "create") {
      // Set today's date as the default booking date in "add" mode
      const today = new Date().toISOString().split("T")[0]; // Format as YYYY-MM-DD
      setValue("groupBookingDate", today);
    }
    if (editGroupBookingData) {
      setSelectedTourDetailsData(editGroupBookingData.tour);

      // ✅ Map familyFriends once
      const tourBookingDetailsData =
        editGroupBookingData.groupBookingDetails?.map((tourBooking) => ({
          groupBookingDetailId: tourBooking.id ? String(tourBooking.id) : "",
          day: String(tourBooking.day) || "",
          description: tourBooking.description || "",
          cityId: tourBooking.cityId ? String(tourBooking.cityId) : "",
          date: tourBooking.date
            ? new Date(tourBooking.date).toISOString().split("T")[0]
            : "",
        })) || [];

      // ✅ Reset full form including field array
      reset({
        groupBookingDate: editGroupBookingData.groupBookingDate
          ? new Date(editGroupBookingData.groupBookingDate)
              .toISOString()
              .split("T")[0]
          : "",

        journeyDate: editGroupBookingData.journeyDate
          ? new Date(editGroupBookingData.journeyDate)
              .toISOString()
              .split("T")[0]
          : "",
        groupBookingNumber: editGroupBookingData.groupBookingNumber || "",
        bookingDetail: editGroupBookingData.bookingDetail || "",

        branchId: editGroupBookingData.branchId
          ? String(editGroupBookingData.branchId)
          : "",
        tourId: editGroupBookingData.tourId ? editGroupBookingData.tourId : "",
        isJourney: Number(editGroupBookingData.isJourney),
        isHotel: Number(editGroupBookingData.isHotel),
        isVehicle: Number(editGroupBookingData.isVehicle),
        bookingType: editGroupBookingData.bookingType || "",
        groupBookingDetails: tourBookingDetailsData, // ✅ include this
      });
    }
  }, [editGroupBookingData, reset, setValue]);
  // Mutation for creating a user
  const createMutation = useMutation({
    mutationFn: (data: FormInputs) => post("/group-bookings", data),
    onSuccess: () => {
      queryClient.invalidateQueries(["group-bookings"]); // Refetch the users list
      toast.success("Group Booking created successfully");
      navigate("/groupBookings"); // Navigate to the hotels page after successful creation
    },
    onError: (error: any) => {
      Validate(error, setError);
      if (error.message) {
        toast.error(error.message);
      } else {
        toast.error(
          error.response?.data?.message || "Failed to create Group Booking"
        );
      }
    },
  });

  // Mutation for updating a user
  const updateMutation = useMutation({
    mutationFn: (data: FormInputs) => put(`/group-bookings/${id}`, data),
    onSuccess: () => {
      toast.success("Group Booking updated successfully");
      queryClient.invalidateQueries(["group-bookings"]);
      navigate("/groupBookings"); // Navigate to the hotels page after successful update
    },
    onError: (error: any) => {
      console.log(error);
      Validate(error, setError);
      if (error.message) {
        toast.error(error.message);
      } else {
        toast.error(
          error.response?.data?.message || "Failed to create Group Booking"
        );
      }
    },
  });

  const handleTourSelectChange = (tour) => {
    const journeyDate = watch("journeyDate"); // Get the selected journeyDate from the form

    if (!journeyDate) {
      toast.error("Please select a Journey Date before selecting a tour.");
      setValue("tourId", "");
      return; // Exit if no journeyDate is selected
    }

    if (tour?.id === selectedTourDetailsData?.id) {
      return;
    }
    setSelectedTourDetailsData(tour);

    if (tour.itineraries && Array.isArray(tour.itineraries)) {
      // Parse the journeyDate into a Date object
      remove();
      const startDate = new Date(journeyDate);

      // Map the itineraries to match the structure of tourBookingDetails
      const mappedItineraries = tour.itineraries.map((itinerary, index) => ({
        groupBookingDetailId: String(itinerary.id) || "",
        day: String(itinerary.day) || "", // Use the day from the itinerary
        date: startDate
          ? new Date(startDate.getTime() + index * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0]
          : "", // Increment the date for each itinerary
        description: itinerary.description || "", // Use the description from the itinerary
        cityId: itinerary.cityId ? String(itinerary.cityId) : "", // Convert cityId to string
      }));

      // Append the mapped itineraries to the tourBookingDetails field
      append(mappedItineraries);
    }
  };

  const handleRemoveAndRecalculateDays = (index: number) => {
    console.log("Before remove:", fields); // Log the current state of fields

    // Remove the selected record
    remove(index);

    // Get the journeyDate or fallback to the start of the current month
    // const journeyDate = watch("journeyDate");
    // const startDate = journeyDate
    //   ? new Date(journeyDate + "T00:00:00Z") // Use journeyDate if available
    //       .toISOString()
    //       .split("T")[0]
    //   : new Date(new Date().getFullYear(), new Date().getMonth(), 2) // Start of the current month
    //       .toISOString()
    //       .split("T")[0];
    const journeyDate = watch("journeyDate");
    const startDate = journeyDate
      ? new Date(journeyDate + "T00:00:00Z") // Use journeyDate if available
          .toISOString()
          .split("T")[0]
      : new Date(Date.UTC(new Date().getFullYear(), new Date().getMonth(), 1)) // Start of the current month (2nd day) in UTC
          .toISOString()
          .split("T")[0];

    // Recalculate days and dates for the remaining records
    const updatedFields = [...fields].filter((_, idx) => idx !== index); // Create a new array without the removed record
    updatedFields.forEach((field, idx) => {
      setValue(`groupBookingDetails.${idx}.day`, String(idx + 1)); // Always update day

      // Update the date field
      if (idx === 0) {
        // For the first record, use the journeyDate or the start of the current month
        setValue(`groupBookingDetails.${idx}.date`, startDate);
      } else {
        // For subsequent records, increment the date by one day from the previous record
        const previousDate = watch(`groupBookingDetails.${idx - 1}.date`);
        const newDate = previousDate
          ? new Date(
              new Date(previousDate + "T00:00:00Z").getTime() +
                24 * 60 * 60 * 1000
            )
              .toISOString()
              .split("T")[0]
          : startDate; // Fallback to startDate if previousDate is not available
        setValue(`groupBookingDetails.${idx}.date`, newDate);
      }
    });

    console.log("After remove and recalculate:", updatedFields);
  };
  // Handle form submission
  const onSubmit: SubmitHandler<FormInputs> = (data) => {
    if (mode === "create") {
      createMutation.mutate(data); // Trigger create mutation
    } else {
      updateMutation.mutate(data); // Trigger update mutation
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="mx-auto mt-10">
          <CardContent className="pt-6">
            {/* Client Details */}
            <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Group Tour Booking
            </CardTitle>

            {/* start code */}
            {/* start code */}
            <div className="w-full  mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
                <div className="col-span-2 lg:col-span-1">
                  <Label
                    htmlFor="bookingNumber"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Booking Number
                  </Label>
                  <Input
                    id="groupBookingNumber"
                    {...register("groupBookingNumber")}
                    placeholder="Booking number"
                    readOnly
                    className="bg-gray-100 text-gray-500 cursor-not-allowed"

                    // disabled
                  />
                  {errors.groupBookingNumber && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.groupBookingNumber.message}
                    </p>
                  )}
                </div>

                {/* Booking Date */}
                <div className="col-span-2 lg:col-span-1">
                  <Label
                    htmlFor="groupBookingDate"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Booking Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="groupBookingDate"
                    type="date"
                    {...(mode !== "edit" && {
                      min: new Date().toISOString().split("T")[0], // Set min only if not edit mode
                    })}
                    max={
                      new Date(
                        new Date().setFullYear(new Date().getFullYear() + 2)
                      )
                        .toISOString()
                        .split("T")[0]
                    } // Today + 2 years
                    {...register("groupBookingDate")}
                  />
                  {errors.groupBookingDate && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.groupBookingDate.message}
                    </p>
                  )}
                </div>

                {/* Journey Date */}
                <div className="col-span-2 lg:col-span-1">
                  <Label
                    htmlFor="journeyDate"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Journey Start Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="journeyDate"
                    type="date"
                    {...(mode !== "edit" && {
                      min: new Date().toISOString().split("T")[0], // Set min only if not edit mode
                    })}
                    max={
                      new Date(
                        new Date().setFullYear(new Date().getFullYear() + 2)
                      )
                        .toISOString()
                        .split("T")[0]
                    } // Today + 2 years
                    {...register("journeyDate")}
                  />
                  {errors.journeyDate && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.journeyDate.message}
                    </p>
                  )}
                </div>

                {parsedUser.role === "admin" && (
                  <div className="col-span-2 lg:col-span-1">
                    <Label
                      htmlFor="branchId"
                      className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Branch <span className="text-red-500">*</span>
                    </Label>
                    <Controller
                      name="branchId"
                      control={control}
                      render={({ field }) => (
                        <Select
                          key={field.value}
                          onValueChange={(value) => setValue("branchId", value)}
                          value={watch("branchId")}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select branch" />
                          </SelectTrigger>
                          <SelectContent>
                            {branches?.map((branch) => (
                              <SelectItem
                                key={branch.id}
                                value={String(branch.id)}
                              >
                                {branch.branchName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {errors.branchId && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.branchId.message}
                      </p>
                    )}
                  </div>
                )}

                {/* Tours Dropdown */}
                <div className="col-span-2 lg:col-span-1">
                  <Label
                    htmlFor="tourId"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Tour <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    name="tourId"
                    control={control}
                    render={({ field }) => (
                      <Popover open={openTourId} onOpenChange={setOpenTourId}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={openTourId ? "true" : "false"} // This should depend on the popover state
                            className="w-[325px] justify-between overflow-hidden mt-1"
                            onClick={() => setOpenTourId((prev) => !prev)} // Toggle popover on button click
                          >
                            {field.value
                              ? tourOptions &&
                                tourOptions.find(
                                  (tour) => tour.id === field.value
                                )?.tourTitle
                              : "Select tour"}
                            <ChevronsUpDown className="opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[325px] p-0">
                          <Command>
                            <CommandInput
                              placeholder="Search tour..."
                              className="h-9"
                            />
                            <CommandList>
                              <CommandEmpty>No tour found.</CommandEmpty>
                              <CommandGroup>
                                {tourOptions &&
                                  tourOptions.map((tour) => (
                                    <CommandItem
                                      key={tour.id}
                                      value={tour.tourTitle.toLowerCase()} // 👈 Use client name for filtering
                                      onSelect={(currentValue) => {
                                        if (tour.id === "none") {
                                          setValue("tourId", "");
                                          remove();
                                        } else {
                                          setValue("tourId", tour.id);
                                        }

                                        handleTourSelectChange(tour);
                                        setOpenTourId(false);
                                        // Close popover after selection
                                      }}
                                    >
                                      {tour.tourTitle}
                                      <Check
                                        className={cn(
                                          "ml-auto",
                                          tour.id === field.value
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
                  {errors.tourId && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.tourId.message}
                    </p>
                  )}
                </div>

                {/* Booking Details */}
                <div className="col-span-2">
                  <Label
                    htmlFor="bookingDetail"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Booking Details
                  </Label>
                  <Textarea
                    id="bookingDetail"
                    {...register("bookingDetail")}
                    placeholder="Enter booking details"
                    rows={4} // Optional: control height
                  />
                  {errors.bookingDetail && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.bookingDetail.message}
                    </p>
                  )}
                </div>

                {/* Checkboxes for isJourney, isHotel, isVehicle, isPackage */}
                <div className="grid grid-cols-1 gap-2 mt-2 ml-4">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isJourney"
                      {...register("isJourney")}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <Label
                      htmlFor="isJourney"
                      className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Journey
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isHotel"
                      {...register("isHotel")}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <Label
                      htmlFor="isHotel"
                      className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Hotel
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isVehicle"
                      {...register("isVehicle")}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <Label
                      htmlFor="isVehicle"
                      className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Vehicle
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            {/* end code */}

            {/* start */}
            <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-8">
              Tour Booking Details
            </CardTitle>
            <div className="mt-5">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-22 px-1">Day</TableHead>
                    <TableHead className="w-36 px-1">Date</TableHead>
                    <TableHead className="w-[400px] px-1">
                      Description
                    </TableHead>
                    <TableHead className="w-40 px-1">Night Halt</TableHead>
                    <TableHead className="w-1 px-1 text-end">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell className="w-20 px-1">
                        <Input
                          {...register(`groupBookingDetails.${index}.day`)}
                          type="text"
                          placeholder="day"
                          className="w-20 m-0"
                        />
                        {errors.groupBookingDetails?.[index]?.day && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.groupBookingDetails[index]?.day?.message}
                          </p>
                        )}
                      </TableCell>

                      <TableCell className="w-36 px-1">
                        <Input
                          {...register(`groupBookingDetails.${index}.date`)}
                          type="date"
                          className="w-full"
                        />
                        {errors.groupBookingDetails?.[index]?.date && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.groupBookingDetails[index]?.date?.message}
                          </p>
                        )}
                      </TableCell>

                      <TableCell className="max-w-[500px] px-1 whitespace-normal break-words">
                        <Textarea
                          {...register(
                            `groupBookingDetails.${index}.description`
                          )}
                          className="w-[400px] lg:w-full"
                          placeholder="description"
                          rows={4}
                        />
                        {errors.groupBookingDetails?.[index]?.description && (
                          <p className="text-red-500 text-xs mt-1">
                            {
                              errors.groupBookingDetails[index]?.description
                                ?.message
                            }
                          </p>
                        )}
                      </TableCell>

                      <TableCell className="w-36 px-1">
                        <Controller
                          name={`groupBookingDetails.${index}.cityId`}
                          control={control}
                          render={({ field }) => (
                            <Select
                              key={field.value}
                              // onValueChange={(value) => {
                              //   setValue(`itineraries.${index}.cityId`, value);
                              // }}
                              onValueChange={(value) =>
                                setValue(
                                  `groupBookingDetails.${index}.cityId`,
                                  value === "none" ? "" : value
                                )
                              }
                              value={watch(
                                `groupBookingDetails.${index}.cityId`
                              )}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a city" />
                              </SelectTrigger>
                              <SelectContent>
                                {cityOptions?.map((city) => (
                                  <SelectItem
                                    key={city.id}
                                    value={String(city.id)}
                                  >
                                    {city.cityName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {errors.groupBookingDetails?.[index]?.cityId && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.groupBookingDetails[index]?.cityId?.message}
                          </p>
                        )}
                      </TableCell>

                      <Input
                        type="hidden"
                        {...register(
                          `groupBookingDetails.${index}.groupBookingDetailId`
                        )}
                      />
                      {errors.groupBookingDetails?.[index]
                        ?.groupBookingDetailId && (
                        <p className="text-red-500 text-xs mt-1">
                          {
                            errors.groupBookingDetails[index]
                              ?.groupBookingDetailId?.message
                          }
                        </p>
                      )}

                      <TableCell className="w-[32px] text-right m-0  p-0">
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="text-right "
                          // onClick={() => remove(index)}
                          onClick={() => handleRemoveAndRecalculateDays(index)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Button
                type="button"
                variant="outline"
                className="mt-4"
                // onClick={() => {
                //   const lastDay =
                //     fields.length > 0
                //       ? Number(fields[fields.length - 1].day)
                //       : 0;
                //   append({
                //     tourBookingDetailId: "",
                //     // day: "",
                //     day: String(lastDay + 1), // Increment day based on the last entry
                //     date: "",
                //     description: "",
                //     cityId: "",
                //   });
                // }}
                onClick={() => {
                  const lastDay =
                    fields.length > 0
                      ? Number(fields[fields.length - 1].day)
                      : 0;

                  // Determine the date for the new record
                  const lastDate =
                    fields.length > 0 ? fields[fields.length - 1].date : null;

                  const newDate = lastDate
                    ? new Date(
                        new Date(lastDate + "T00:00:00Z").getTime() +
                          24 * 60 * 60 * 1000 // Add 1 day in milliseconds
                      )
                        .toISOString()
                        .split("T")[0]
                    : new Date(
                        Date.UTC(
                          new Date().getFullYear(),
                          new Date().getMonth(),
                          1
                        )
                      ) // Start of current month (2nd day) in UTC
                        .toISOString()
                        .split("T")[0];

                  append({
                    groupBookingDetailId: "",
                    day: String(lastDay + 1), // Increment day based on the last entry
                    date: newDate, // Add the calculated date
                    description: "",
                    cityId: "",
                  });
                }}
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                Add
              </Button>
            </div>

            <div className="w-full  mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
                {/* booking Type */}
                <div className="col-span-2 lg:col-span-1">
                  <Label
                    htmlFor="no"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Booking Type <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    name="bookingType"
                    control={control}
                    render={({ field }) => (
                      <Select
                        key={field.value}
                        onValueChange={(value) =>
                          setValue("bookingType", value === "none" ? "" : value)
                        }
                        value={watch("bookingType")}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {bookingTypeOptions.map((option) => (
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
                  {errors.bookingType && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.bookingType.message}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* end */}
          </CardContent>

          {/* Submit/Cancel Buttons */}
          <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 rounded-b-lg">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/groupBookings")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="min-w-[90px]">
              {isLoading ? (
                <LoaderCircle className="animate-spin h-4 w-4" />
              ) : mode === "create" ? (
                "Create Booking"
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

export default GroupBookingForm;
