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

const TourEnquiryDetailsForm = z.object({
  tourBookingDetailId: z.string().optional(),
  day: z.coerce
    .number()
    .int("Day must be an integer.")
    .min(1, "Day field is required.")
    .max(1000, "Day cannot be more than 1000."),
  description: z
    .string()
    .min(1, "Description is required.")
    .max(190, "Description must not exceed 190 characters."),
  date: z
    .string()
    .min(1, "Date is required.")
    .max(100, "Date must not exceed 100 characters."),
  cityId: z.string().optional(),
});

const FormSchema = z.object({
  bookingNumber: z.string().optional(),
  bookingDate: z
    .string()
    .min(1, "Booking Date is required.")
    .max(100, "Booking Date must not exceed 100 characters."),
  departureDate: z
    .string()
    .max(100, "Departure Date must not exceed 100 characters.")
    .optional(),
  journeyDate: z
    .string()
    .max(100, "journey Date must not exceed 100 characters.")
    .optional(),

  budgeField: z
    .string()
    .max(100, "Budge Field must not exceed 100 characters.")
    .optional(),
  clientId: z
    .string()
    .min(1, "Client field is required.")
    .max(100, "Client field must not exceed 100 characters."),
  numberOfAdults: z.string().optional(),
  numberOfChildren5To11: z.string().optional(),
  numberOfChildrenUnder5: z.string().optional(),
  branchId: z
    .string()
    .max(100, "number of adults must not exceed 100 characters.")
    .optional(),
  tourId: z
    .string()
    .max(100, "number of adults must not exceed 100 characters.")
    .optional(),
  isJourney: z.coerce.number().min(0, " required"),
  isHotel: z.coerce.number().min(0, " required"),
  isVehicle: z.coerce.number().min(0, " required"),
  isPackage: z.coerce.number().min(0, " required"),
  enquiryStatus: z
    .string()
    .max(100, "Enquiry status must not exceed 100 characters.")
    .optional(),
  tourBookingDetails: z.array(TourEnquiryDetailsForm).optional(),
});

type FormInputs = z.infer<typeof FormSchema>;

const TourEnquiryForm = ({ mode }: { mode: "create" | "edit" }) => {
  const { id } = useParams<{ id: string }>();
  const [openTourId, setOpenTourId] = useState<boolean>(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const storedUser = localStorage.getItem("user");
  const parsedUser = JSON.parse(storedUser);
  const role = parsedUser.role;
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
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "tourBookingDetails", // Name of the array in the form schema
  });

  const { data: editTourEnquiryData, isLoading: editTourEnquiryLoading } =
    useQuery({
      queryKey: ["editTourEnquiry", id],
      queryFn: async () => {
        const response = await get(`/tourEnquiries/${id}`);
        return response; // API returns the sector object directly
      },
      enabled: !!id && mode === "edit",
    });

  // clients
  const { data: clients, isLoading: isClientsLoading } = useQuery({
    queryKey: ["cilents"],
    queryFn: async () => {
      const response = await get(`/clients/all`);
      return response; // API returns the sector object directly
    },
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
  const { data: tours, isLoading: isToursLoading } = useQuery({
    queryKey: ["tours"],
    queryFn: async () => {
      const response = await get(`/tours/all`);
      return response; // API returns the sector object directly
    },
  });

  // cities
  const { data: cities, isLoading: isCitiesLoading } = useQuery({
    queryKey: ["cities"],
    queryFn: async () => {
      const response = await get(`/cities/all`);
      return response; // API returns the sector object directly
    },
  });

  useEffect(() => {
    if (editTourEnquiryData) {
      // ✅ Map familyFriends once
      const tourBookingDetailsData =
        editTourEnquiryData.tourBookingDetails?.map((tourBooking) => ({
          tourBookingDetailId: tourBooking.id ? String(tourBooking.id) : "",
          day: tourBooking.day || "",
          description: tourBooking.description || "",
          cityId: tourBooking.cityId ? String(tourBooking.cityId) : "",
          date: tourBooking.date
            ? new Date(tourBooking.date).toISOString().split("T")[0]
            : "",
        })) || [];

      // ✅ Reset full form including field array
      reset({
        bookingDate: editTourEnquiryData.bookingDate
          ? new Date(editTourEnquiryData.bookingDate)
              .toISOString()
              .split("T")[0]
          : "",
        departureDate: editTourEnquiryData.departureDate
          ? new Date(editTourEnquiryData.departureDate)
              .toISOString()
              .split("T")[0]
          : "",
        journeyDate: editTourEnquiryData.journeyDate
          ? new Date(editTourEnquiryData.journeyDate)
              .toISOString()
              .split("T")[0]
          : "",
        budgeField: editTourEnquiryData.budgeField || "",
        clientId: editTourEnquiryData.clientId
          ? String(editTourEnquiryData.clientId)
          : "",
        numberOfAdults: editTourEnquiryData.numberOfAdults
          ? String(editTourEnquiryData.numberOfAdults)
          : "",
        numberOfChildren5To11: editTourEnquiryData.numberOfChildren5To11
          ? String(editTourEnquiryData.numberOfChildren5To11)
          : "",
        numberOfChildrenUnder5: editTourEnquiryData.numberOfChildrenUnder5
          ? String(editTourEnquiryData.numberOfChildrenUnder5)
          : "",
        branchId: editTourEnquiryData.branchId
          ? String(editTourEnquiryData.branchId)
          : "",
        tourId: editTourEnquiryData.tourId
          ? String(editTourEnquiryData.tourId)
          : "",
        isJourney: Number(editTourEnquiryData.isJourney),
        isHotel: Number(editTourEnquiryData.isHotel),
        isVehicle: Number(editTourEnquiryData.isVehicle),
        isPackage: Number(editTourEnquiryData.isPackage),
        enquiryStatus: editTourEnquiryData.enquiryStatus || "",
        tourBookingDetails: tourBookingDetailsData, // ✅ include this
      });
    }
  }, [editTourEnquiryData, reset, setValue]);

  // Mutation for creating a user
  const createMutation = useMutation({
    mutationFn: (data: FormInputs) => post("/tour-enquiries", data),
    onSuccess: () => {
      queryClient.invalidateQueries(["tourEnquiries"]); // Refetch the users list
      toast.success("Tour Enquiry created successfully");
      navigate("/tour-enquiries"); // Navigate to the hotels page after successful creation
    },
    onError: (error: any) => {
      Validate(error, setError);
      toast.error(error.response?.data?.message || "Failed to create Enquiry");
    },
  });

  // Mutation for updating a user
  const updateMutation = useMutation({
    mutationFn: (data: FormInputs) => put(`/tour-enquiries/${id}`, data),
    onSuccess: () => {
      toast.success("Tour Enquiry updated successfully");
      queryClient.invalidateQueries(["tourEnquiry"]);
      navigate("/tour-enquiries"); // Navigate to the hotels page after successful update
    },
    onError: (error: any) => {
      Validate(error, setError);
      toast.error(
        error.response?.data?.message || "Failed to update Tour Enquiry"
      );
    },
  });

  const handleTourSelectChange = (tour) => {
    console.log("tour Data", tour);

    const journeyDate = watch("journeyDate"); // Get the selected journeyDate from the form

    if (!journeyDate) {
      toast.error("Please select a Journey Date before selecting a tour.");
      return; // Exit if no journeyDate is selected
    }

    if (tour.itineraries && Array.isArray(tour.itineraries)) {
      // Parse the journeyDate into a Date object
      const startDate = new Date(journeyDate);

      // Map the itineraries to match the structure of tourBookingDetails
      const mappedItineraries = tour.itineraries.map((itinerary, index) => ({
        day: itinerary.day || "", // Use the day from the itinerary
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
      {/* JSX Code for HotelForm.tsx */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="mx-auto mt-10 min-w-5xl">
          <CardContent className="pt-6">
            {/* Client Details */}
            <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Tour Enquiry
            </CardTitle>

            {/* start code */}
            {/* start code */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
              <div>
                <Label
                  htmlFor="bookingNumber"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Booking Number
                </Label>
                <Input
                  id="bookingNumber"
                  {...register("bookingNumber")}
                  placeholder="Booking number"
                  readOnly
                  className="bg-gray-100 text-gray-500 cursor-not-allowed"

                  // disabled
                />
                {errors.bookingNumber && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.bookingNumber.message}
                  </p>
                )}
              </div>

              {/* Booking Date */}
              <div>
                <Label
                  htmlFor="bookingDate"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Booking Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="bookingDate"
                  type="date"
                  {...register("bookingDate")}
                />
                {errors.bookingDate && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.bookingDate.message}
                  </p>
                )}
              </div>

              {/* Departure Date */}
              <div>
                <Label
                  htmlFor="departureDate"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Departure Date
                </Label>
                <Input
                  id="departureDate"
                  type="date"
                  {...register("departureDate")}
                />
                {errors.departureDate && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.departureDate.message}
                  </p>
                )}
              </div>

              {/* Journey Date */}
              <div>
                <Label
                  htmlFor="journeyDate"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Journey Date
                </Label>
                <Input
                  id="journeyDate"
                  type="date"
                  {...register("journeyDate")}
                />
                {errors.journeyDate && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.journeyDate.message}
                  </p>
                )}
              </div>

              {/* Budget Field */}
              <div>
                <Label
                  htmlFor="budgetField"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Budget Field
                </Label>
                <Select
                  onValueChange={(value) => setValue("budgeField", value)}
                  value={watch("budgeField")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select budget" />
                  </SelectTrigger>
                  <SelectContent>
                    {budgetFieldOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.budgeField && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.budgeField.message}
                  </p>
                )}
              </div>

              {/* Client ID */}
              <div>
                <Label
                  htmlFor="clientId"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Client <span className="text-red-500">*</span>
                </Label>
                <Select
                  onValueChange={(value) => setValue("clientId", value)}
                  value={watch("clientId")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients?.map((client) => (
                      <SelectItem key={client.id} value={String(client.id)}>
                        {client.clientName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.clientId && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.clientId.message}
                  </p>
                )}
              </div>

              {parsedUser.role === "admin" && (
                <div>
                  <Label
                    htmlFor="branchId"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Branch
                  </Label>
                  <Select
                    onValueChange={(value) => setValue("branchId", value)}
                    value={watch("branchId")}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select branch" />
                    </SelectTrigger>
                    <SelectContent>
                      {branches?.map((branch) => (
                        <SelectItem key={branch.id} value={String(branch.id)}>
                          {branch.branchName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.branchId && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.branchId.message}
                    </p>
                  )}
                </div>
              )}

              {/* numberOfAdults */}
              <div>
                <Label
                  htmlFor="no"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  No. Of Adults
                </Label>
                <Controller
                  name="numberOfAdults"
                  control={control}
                  render={({ field }) => (
                    <Select
                      key={field.value}
                      onValueChange={(value) =>
                        setValue("numberOfAdults", value)
                      }
                      value={watch("numberOfAdults")}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {noOfAdultsOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.numberOfAdults && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.numberOfAdults.message}
                  </p>
                )}
              </div>

              {/* numberOfChildren5To11 */}
              <div>
                <Label
                  htmlFor="no"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  No. Of Children 5-11
                </Label>
                <Controller
                  name="numberOfChildren5To11"
                  control={control}
                  render={({ field }) => (
                    <Select
                      key={field.value}
                      onValueChange={(value) =>
                        setValue("numberOfChildren5To11", value)
                      }
                      value={watch("numberOfChildren5To11")}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {noOfChildrens5To11Options.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.numberOfChildren5To11 && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.numberOfChildren5To11.message}
                  </p>
                )}
              </div>

              {/* numberOfChildrenBelow5 */}
              <div>
                <Label
                  htmlFor="no"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  No. Of Children &lt; 5
                </Label>
                <Controller
                  name="numberOfChildrenBelow5"
                  control={control}
                  render={({ field }) => (
                    <Select
                      key={field.value}
                      onValueChange={(value) =>
                        setValue("numberOfChildrenBelow5", value)
                      }
                      value={watch("numberOfChildrenBelow5")}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {noOfChildrensBelow5Options.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.numberOfChildrenBelow5 && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.numberOfChildrenBelow5.message}
                  </p>
                )}
              </div>

              {/* Tours Dropdown */}
              <div>
                <Label
                  htmlFor="tourId"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Tour
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
                          className=" w-[325px] justify-between mt-1"
                          onClick={() => setOpenTourId((prev) => !prev)} // Toggle popover on button click
                        >
                          {field.value
                            ? tours &&
                              tours.find((tour) => tour.id === field.value)
                                ?.tourTitle
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
                              {tours &&
                                tours.map((tour) => (
                                  <CommandItem
                                    key={tour.id}
                                    value={tour.id}
                                    onSelect={(currentValue) => {
                                      setValue("tourId", tour.id);

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
                  htmlFor="bookingDetails"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Booking Details
                </Label>
                <Textarea
                  id="bookingDetails"
                  {...register("bookingDetails")}
                  placeholder="Enter booking details"
                  rows={4} // Optional: control height
                />
                {errors.bookingDetails && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.bookingDetails.message}
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
                    Is Journey
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
                    Is Hotel
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
                    Is Vehicle
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isPackage"
                    {...register("isPackage")}
                    className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <Label
                    htmlFor="isPackage"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Is Package
                  </Label>
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
                    <TableHead>Day</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Night Halt</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell>
                        <Input
                          {...register(`tourBookingDetails.${index}.day`)}
                          type="number"
                          placeholder="Enter day"
                          className="w-20 m-0" // 👈 Adjust as needed
                        />
                        {errors.tourBookingDetails?.[index]?.day && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.tourBookingDetails[index]?.day?.message}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Input
                          {...register(`tourBookingDetails.${index}.date`)}
                          type="date"
                          placeholder="Enter day"
                          className="w-36" // 👈 Adjust as needed
                        />
                        {errors.tourBookingDetails?.[index]?.date && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.tourBookingDetails[index]?.date?.message}
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Textarea
                          {...register(`tourBookingDetails.${index}.date`)}
                          placeholder="description"
                          rows={4} // Optional: control height
                        />
                        {errors.tourBookingDetails?.[index]?.description && (
                          <p className="text-red-500 text-xs mt-1">
                            {
                              errors.tourBookingDetails[index]?.description
                                ?.message
                            }
                          </p>
                        )}
                      </TableCell>
                      <TableCell>
                        <Controller
                          name={`tourBookingDetails.${index}.cityId`}
                          control={control}
                          render={({ field }) => (
                            <Select
                              key={field.value}
                              onValueChange={(value) => {
                                setValue(
                                  `tourBookingDetails.${index}.cityId`,
                                  value
                                );
                              }}
                              value={watch(
                                `tourBookingDetails.${index}.cityId`
                              )}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a city" />
                              </SelectTrigger>
                              <SelectContent>
                                {cities?.map((city) => (
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
                      </TableCell>

                      {/* tourBookingDetailId id */}
                      <Input
                        type="hidden"
                        {...register(
                          `tourBookingDetails.${index}.tourBookingDetailId`
                        )}
                      />
                      {errors.tourBookingDetails?.[index]
                        ?.tourBookingDetailId && (
                        <p className="text-red-500 text-xs mt-1">
                          {
                            errors.tourBookingDetails[index]
                              ?.tourBookingDetailId?.message
                          }
                        </p>
                      )}
                      {/* tourBookingDetailId id */}

                      <TableCell>
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => remove(index)}
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
                onClick={() =>
                  append({
                    tourBookingDetailId: "",
                    day: "",
                    date: "",
                    description: "",
                    cityId: "",
                  })
                }
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                Add
              </Button>
            </div>
            {/* end */}
          </CardContent>

          {/* Submit/Cancel Buttons */}
          <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 rounded-b-lg">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/tourEnquiries")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="min-w-[90px]">
              {isLoading ? (
                <LoaderCircle className="animate-spin h-4 w-4" />
              ) : mode === "create" ? (
                "Create Tour Enquiry"
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

export default TourEnquiryForm;
