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

const GroupTourMemberSchema = z.object({
  groupTourMemberId: z.string().optional(),
  name: z
    .string()
    .min(1, "Name is required.")
    .max(100, "Name must not exceed 100 characters."),
  aadharNo: z
    .string()
    .max(12, "Aadhar number must be 12 digits.")
    .refine((val) => val === "" || /^[2-9]{1}[0-9]{11}$/.test(val), {
      message:
        "Aadhar number must be exactly 12 digits and cannot start with 0 or 1.",
    })
    .optional(),
  gender: z
    .string()
    .min(1, "Gender is required.")
    .max(20, "Gender must not exceed 20 characters."),

  relation: z
    .string()
    .min(1, "Relation is required.")
    .max(100, "Relation must not exceed 50 characters."),
  dateOfBirth: z.string().min(1, "Date of Birth is required."),

  anniversaryDate: z.string().optional(),

  foodType: z
    .string()
    .min(1, "Food Type is required.")
    .max(100, "Food Type must not exceed 100 characters."),

  mobile: z.string().regex(/^\d{10}$/, "Mobile must be a 10-digit number."),

  email: z
    .string()
    .min(1, "Email is required.")
    .email("Invalid email format.")
    .max(100, "Email must not exceed 100 characters."),
});

const BookingFormSchema = z.object({
  bookingDetailId: z.string().optional(),
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

  budgetField: z
    .string()
    .max(100, "Budge Field must not exceed 100 characters.")
    .optional(),
  clientId: z.union([
    z.string().min(1, "Client field is required."),
    z.number().min(1, "Client Field is required"),
  ]),
  numberOfAdults: z.string().optional(),
  // numberOfNights: z.string().optional(),
  numberOfChildren5To11: z.string().optional(),
  numberOfChildrenUnder5: z.string().optional(),
  branchId: z
    .string()
    // .min(1, "Branch field is required.")
    .max(100, "number of adults must not exceed 100 characters.")
    .optional(),
  tourId: z
    .union([
      z.string().max(100, "tour must not exceed 100 characters."),
      z.number(),
    ])
    .optional(),
  bookingType: z.string().min(1, "Booking type is required"),
  isJourney: z.coerce.number().min(0, " required"),
  isHotel: z.coerce.number().min(0, " required"),
  isVehicle: z.coerce.number().min(0, " required"),
  isPackage: z.coerce.number().min(0, " required"),
  bookingDetail: z
    .string()
    .max(100, "Booking details must not exceed 100 characters.")
    .optional(),
  enquiryStatus: z
    .string()
    .max(100, "Enquiry status must not exceed 100 characters.")
    .optional(),
  bookingDetails: z.array(BookingFormSchema).optional(),
  groupTourMembers: z.array(GroupTourMemberSchema).optional(),
});

type FormInputs = z.infer<typeof FormSchema>;

const BookingForm = ({ mode }: { mode: "create" | "edit" }) => {
  const { id } = useParams<{ id: string }>();
  const [openTourId, setOpenTourId] = useState<boolean>(false);
  const [openClientId, setOpenClientId] = useState<boolean>(false);
  const [isGroupTour, setIsGroupTour] = useState<boolean>(false);
  const [selectedTourData, setSelectedTourData] = useState<any>(null);
  const [selectedClientData, setSelectedClientData] = useState<any>(null);
  const RESERVED_FOR_MAIN_CLIENT = 1;

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const storedUser = localStorage.getItem("user");
  const parsedUser = JSON.parse(storedUser);
  const role = parsedUser.role;

  const defaultValues: FormInputs = {
    bookingNumber: "",
    bookingDate: new Date().toISOString().split("T")[0], // Today's date
    departureDate: "",
    journeyDate: "",
    budgetField: "",
    clientId: "",
    numberOfAdults: "",
    numberOfChildren5To11: "",
    numberOfChildrenUnder5: "",
    branchId: "",
    tourId: "",
    isJourney: 0,
    isHotel: 0,
    isVehicle: 0,
    isPackage: 0,
    bookingDetail: "",
    enquiryStatus: "",
    bookingType: "",
    bookingDetails: [], // Empty array for booking details
    groupTourMembers: [], // Empty array for booking details
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
    name: "bookingDetails", // Name of the array in the form schema
  });

  const {
    fields: groupTourMemberFields,
    append: groupTourMemberAppend,
    remove: groupTourMemberRemove,
  } = useFieldArray({
    control,
    name: "groupTourMembers", // Name of the array in the form schema
  });

  const { data: editBookingData, isLoading: editBookingLoading } = useQuery({
    queryKey: ["editBooking", id],
    queryFn: async () => {
      const response = await get(`/bookings/${id}`);
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

  const clientOptions = [
    { id: "none", clientName: "---" }, // The 'unselect' option
    ...(clients ?? []),
  ];

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

  const tourOptions = [
    { id: "none", tourTitle: "---" }, // The 'unselect' option
    ...(tours ?? []),
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
      setValue("bookingDate", today);
    }
    if (editBookingData) {
      setIsGroupTour(editBookingData?.tour?.isGroupTour);
      setSelectedTourData(editBookingData?.tour);
      // ✅ Map familyFriends once
      const tourBookingDetailsData =
        editBookingData.bookingDetails?.map((tourBooking) => ({
          bookingDetailId: tourBooking.id ? String(tourBooking.id) : "",
          day: String(tourBooking.day) || "",
          description: tourBooking.description || "",
          cityId: tourBooking.cityId ? String(tourBooking.cityId) : "",
          date: tourBooking.date
            ? new Date(tourBooking.date).toISOString().split("T")[0]
            : "",
        })) || [];

      const groupTourMembersData =
        editBookingData.groupTourMembers?.map((member) => ({
          groupTourMemberId: member.id ? String(member.id) : "",
          name: member.name || "",
          gender: member.gender || "",
          aadharNo: member.aadharNo || "",
          relation: member.relation || "",
          dateOfBirth: member.dateOfBirth
            ? new Date(member.dateOfBirth).toISOString().split("T")[0]
            : "",
          anniversaryDate: member.anniversaryDate
            ? new Date(member.anniversaryDate).toISOString().split("T")[0]
            : "",
          foodType: member.foodType || "",
          mobile: member.mobile || "",
          email: member.email || "",
        })) || [];

      // ✅ Reset full form including field array
      reset({
        bookingDate: editBookingData.bookingDate
          ? new Date(editBookingData.bookingDate).toISOString().split("T")[0]
          : "",
        departureDate: editBookingData.departureDate
          ? new Date(editBookingData.departureDate).toISOString().split("T")[0]
          : "",
        journeyDate: editBookingData.journeyDate
          ? new Date(editBookingData.journeyDate).toISOString().split("T")[0]
          : "",
        bookingNumber: editBookingData.bookingNumber || "",
        bookingDetail: editBookingData.bookingDetail || "",
        budgetField: editBookingData.budgetField
          ? editBookingData.budgetField
          : "",
        clientId: editBookingData.clientId ? editBookingData.clientId : "",
        numberOfAdults:
          editBookingData.numberOfAdults !== null &&
          editBookingData.numberOfAdults !== undefined
            ? String(editBookingData.numberOfAdults)
            : "",
        numberOfChildren5To11:
          editBookingData.numberOfChildren5To11 !== null &&
          editBookingData.numberOfChildren5To11 !== undefined
            ? String(editBookingData.numberOfChildren5To11)
            : "",
        numberOfChildrenUnder5:
          editBookingData.numberOfChildrenUnder5 !== null &&
          editBookingData.numberOfChildrenUnder5 !== undefined
            ? String(editBookingData.numberOfChildrenUnder5)
            : "",
        branchId: editBookingData.branchId
          ? String(editBookingData.branchId)
          : "",
        tourId: editBookingData.tourId ? editBookingData.tourId : "",
        isJourney: Number(editBookingData.isJourney),
        isHotel: Number(editBookingData.isHotel),
        isVehicle: Number(editBookingData.isVehicle),
        isPackage: Number(editBookingData.isPackage),
        enquiryStatus: editBookingData.enquiryStatus || "",
        numberOfNights: editBookingData.numberOfNights
          ? String(editBookingData.numberOfNights)
          : "",
        bookingType: editBookingData.bookingType || "",
        bookingDetails: tourBookingDetailsData, // ✅ include this
        groupTourMembers: groupTourMembersData, // ✅ include this
      });
    }
  }, [editBookingData, reset, setValue]);
  console.log(editBookingData);

  console.log(editBookingData?.tour?.numberOfTravelers);
  // Mutation for creating a user
  const createMutation = useMutation({
    mutationFn: (data: FormInputs) => post("/bookings", data),
    onSuccess: () => {
      queryClient.invalidateQueries(["bookings"]); // Refetch the users list
      toast.success("Booking created successfully");
      navigate("/bookings"); // Navigate to the hotels page after successful creation
    },
    onError: (error: any) => {
      Validate(error, setError);
      if (error.message) {
        toast.error(error.message);
      } else {
        toast.error(
          error.response?.data?.message || "Failed to create Booking"
        );
      }
    },
  });

  // Mutation for updating a user
  const updateMutation = useMutation({
    mutationFn: (data: FormInputs) => put(`/bookings/${id}`, data),
    onSuccess: () => {
      toast.success("Booking updated successfully");
      queryClient.invalidateQueries(["bookings"]);
      navigate("/bookings"); // Navigate to the hotels page after successful update
    },
    onError: (error: any) => {
      console.log(error);
      Validate(error, setError);
      if (error.message) {
        toast.error(error.message);
      } else {
        toast.error(
          error.response?.data?.message || "Failed to create Booking"
        );
      }
    },
  });

  // data from client master
  const prepareGroupTourMembers = (client) => {
    // if (mode === "create") {
    setIsGroupTour(selectedTourData?.isGroupTour);

    if (selectedTourData?.isGroupTour) {
      groupTourMemberRemove();
      const clientFamilyFriendsData =
        client?.familyFriends?.map((member) => ({
          groupTourMemberId: "",
          aadharNo: member.aadharNo ? String(member.aadharNo) : "",
          name: member.name || "",
          gender: member.gender || "",
          relation: member.relation || "",
          dateOfBirth: member.dateOfBirth
            ? new Date(member.dateOfBirth).toISOString().split("T")[0]
            : "",
          anniversaryDate: member.anniversaryDate
            ? new Date(member.anniversaryDate).toISOString().split("T")[0]
            : "",
          foodType: member.foodType || "",
          mobile: member.mobile || "",
          email: member.email || "",
        })) || [];

      const limitedClientData = clientFamilyFriendsData.slice(
        0,
        selectedTourData.numberOfTravelers - RESERVED_FOR_MAIN_CLIENT
      );

      groupTourMemberAppend(limitedClientData);
    }
    // }
  };

  const handleTourSelectChange = (tour) => {
    const journeyDate = watch("journeyDate"); // Get the selected journeyDate from the form

    if (!journeyDate) {
      toast.error("Please select a Journey Date before selecting a tour.");
      setValue("tourId", "");
      return; // Exit if no journeyDate is selected
    }

    if (tour.itineraries && Array.isArray(tour.itineraries)) {
      // Parse the journeyDate into a Date object
      remove();
      const startDate = new Date(journeyDate);

      // Map the itineraries to match the structure of tourBookingDetails
      const mappedItineraries = tour.itineraries.map((itinerary, index) => ({
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
    //  group tour member start
    setIsGroupTour(tour.isGroupTour); // Set isGroupTour to true for condition jsx rendering
    if (!tour.isGroupTour) {
      groupTourMemberRemove();
    }
    if (mode === "edit") {
      // const allowedCount = editBookingData?.tour?.numberOfTravelers - 1 || 0;
      const allowedCount =
        tour?.numberOfTravelers - RESERVED_FOR_MAIN_CLIENT || 0;

      if (groupTourMemberFields.length > allowedCount) {
        // Create an array of indexes to remove
        const indexesToRemove = groupTourMemberFields
          .map((_, index) => index)
          .filter((index) => index >= allowedCount);

        // Remove from the last to first to avoid index shifting
        indexesToRemove.reverse().forEach((index) => {
          groupTourMemberRemove(index);
        });
      }
    }
    if (mode === "create") {
      groupTourMemberRemove();
      if (tour.isGroupTour && selectedClientData) {
        console.log("Selected Client Data:", selectedClientData);
        const clientFamilyFriendsData =
          selectedClientData?.familyFriends?.map((member) => ({
            groupTourMemberId: "",
            aadharNo: member.aadharNo ? String(member.aadharNo) : "",
            name: member.name || "",
            gender: member.gender || "",
            relation: member.relation || "",
            dateOfBirth: member.dateOfBirth
              ? new Date(member.dateOfBirth).toISOString().split("T")[0]
              : "",
            anniversaryDate: member.anniversaryDate
              ? new Date(member.anniversaryDate).toISOString().split("T")[0]
              : "",
            foodType: member.foodType || "",
            mobile: member.mobile || "",
            email: member.email || "",
          })) || [];

        const limitedClientData = clientFamilyFriendsData.slice(
          0,
          tour.numberOfTravelers - RESERVED_FOR_MAIN_CLIENT
        );

        groupTourMemberAppend(limitedClientData);
      }
    }
    //  group tour member end
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
      setValue(`bookingDetails.${idx}.day`, String(idx + 1)); // Always update day

      // Update the date field
      if (idx === 0) {
        // For the first record, use the journeyDate or the start of the current month
        setValue(`bookingDetails.${idx}.date`, startDate);
      } else {
        // For subsequent records, increment the date by one day from the previous record
        const previousDate = watch(`bookingDetails.${idx - 1}.date`);
        const newDate = previousDate
          ? new Date(
              new Date(previousDate + "T00:00:00Z").getTime() +
                24 * 60 * 60 * 1000
            )
              .toISOString()
              .split("T")[0]
          : startDate; // Fallback to startDate if previousDate is not available
        setValue(`bookingDetails.${idx}.date`, newDate);
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
      {/* JSX Code for HotelForm.tsx */}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="mx-auto mt-10">
          <CardContent className="pt-6">
            {/* Client Details */}
            <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Tour Booking
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
                <div className="col-span-2 lg:col-span-1">
                  <Label
                    htmlFor="bookingDate"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Booking Date <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="bookingDate"
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
                    {...register("bookingDate")}
                  />
                  {errors.bookingDate && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.bookingDate.message}
                    </p>
                  )}
                </div>

                {/* Departure Date */}
                <div className="col-span-2 lg:col-span-1">
                  <Label
                    htmlFor="departureDate"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Client Departure Date
                  </Label>
                  <Input
                    id="departureDate"
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
                    {...register("departureDate")}
                  />
                  {errors.departureDate && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.departureDate.message}
                    </p>
                  )}
                </div>

                {/* Journey Date */}
                <div className="col-span-2 lg:col-span-1">
                  <Label
                    htmlFor="journeyDate"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Journey Start Date
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

                {/* Tours Dropdown */}
                <div className="col-span-2 lg:col-span-1">
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
                                        setSelectedTourData(tour);
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

                {/* Client ID */}
                <div className="col-span-2 lg:col-span-1">
                  <div className="flex w-full justify-between items-center">
                    <div className="a">
                      <Label
                        htmlFor="clientId"
                        className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Client <span className="text-red-500">*</span>
                      </Label>
                      <Controller
                        name="clientId"
                        control={control}
                        render={({ field }) => (
                          <Popover
                            open={openClientId}
                            onOpenChange={setOpenClientId}
                          >
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                role="combobox"
                                aria-expanded={openClientId ? "true" : "false"} // This should depend on the popover state
                                className=" w-[275px] overflow-hidden justify-between mt-1"
                                onClick={() => setOpenClientId((prev) => !prev)} // Toggle popover on button click
                              >
                                {field.value
                                  ? clientOptions &&
                                    clientOptions.find(
                                      (client) => client.id === field.value
                                    )?.clientName
                                  : "Select client"}
                                <ChevronsUpDown className="opacity-50" />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[325px] p-0">
                              <Command>
                                <CommandInput
                                  placeholder="Search client..."
                                  className="h-9"
                                />
                                <CommandList>
                                  <CommandEmpty>No client found.</CommandEmpty>
                                  <CommandGroup>
                                    {clientOptions &&
                                      clientOptions.map((client) => (
                                        <CommandItem
                                          key={client.id}
                                          // value={String(client.id)}
                                          value={client.clientName.toLowerCase()} // 👈 Use client name for filtering
                                          onSelect={(currentValue) => {
                                            if (client.id === "none") {
                                              setValue("clientId", ""); // Clear the value
                                            } else {
                                              setValue("clientId", client.id);
                                              setSelectedClientData(client);
                                              prepareGroupTourMembers(client); // Prepare group tour members if needed
                                            }
                                            // handleTourSelectChange(client);
                                            setOpenClientId(false);
                                            // Close popover after selection
                                          }}
                                        >
                                          {client.clientName}
                                          <Check
                                            className={cn(
                                              "ml-auto",
                                              client.id === field.value
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
                      {errors.clientId && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.clientId.message}
                        </p>
                      )}
                    </div>
                    {/* <div className="">
                    <Button type="button" onClick={handleAdd} className="mt-7">
                      {" "}
                      <PlusCircle className="h-5 w-5" />
                      <AddClient />
                    </Button>
                  </div> */}
                    <div className="col-span-2 lg:col-span-1">
                      <AddClient
                        onClientAdded={(newClient) => {
                          // Update the client dropdown with the new client
                          queryClient.invalidateQueries(["clients"]);

                          // setTimeout(() => {
                          //   if (clients) {
                          //     setValue("clientId", String(newClient.id));
                          //   }
                          // }, 1000); // delay can be adjusted as needed
                        }}
                      />
                    </div>
                  </div>
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

                {/* numberOfAdults */}
                <div className="col-span-2 lg:col-span-1">
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
                          setValue(
                            "numberOfAdults",
                            value === "none" ? "" : value
                          )
                        }
                        value={watch("numberOfAdults")}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {noOfAdultsOptions.map((option) => (
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
                  {errors.numberOfAdults && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.numberOfAdults.message}
                    </p>
                  )}
                </div>

                {/* numberOfChildren5To11 */}
                <div className="col-span-2 lg:col-span-1">
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
                          setValue(
                            "numberOfChildren5To11",
                            value === "none" ? "" : value
                          )
                        }
                        value={watch("numberOfChildren5To11")}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {noOfChildrens5To11Options.map((option) => (
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
                  {errors.numberOfChildren5To11 && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.numberOfChildren5To11.message}
                    </p>
                  )}
                </div>

                {/* Budget Field */}
                <div className="col-span-2 lg:col-span-1">
                  <Label
                    htmlFor="budgetField"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Budget Field
                  </Label>
                  <Controller
                    name="budgetField"
                    control={control}
                    render={({ field }) => (
                      <Select
                        key={field.value}
                        onValueChange={(value) =>
                          setValue("budgetField", value === "none" ? "" : value)
                        }
                        value={watch("budgetField")}
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
                    )}
                  />
                  {errors.budgetField && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.budgetField.message}
                    </p>
                  )}
                </div>

                {/* numberOfChildrenBelow5 */}
                <div className="col-span-2 lg:col-span-1">
                  <Label
                    htmlFor="no"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    No. Of Children &lt; 5
                  </Label>
                  <Controller
                    name="numberOfChildrenUnder5"
                    control={control}
                    render={({ field }) => (
                      <Select
                        key={field.value}
                        onValueChange={(value) =>
                          setValue(
                            "numberOfChildrenUnder5",
                            value === "none" ? "" : value
                          )
                        }
                        value={watch("numberOfChildrenUnder5")}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {noOfChildrensBelow5Options.map((option) => (
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
                  {errors.numberOfChildrenUnder5 && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.numberOfChildrenUnder5.message}
                    </p>
                  )}
                </div>

                {/* numbr of nights */}
                {/* <div className="col-span-2 lg:col-span-1">
                  <Label
                    htmlFor="no"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    No. Of Nights
                  </Label>
                  <Controller
                    name="numberOfNights"
                    control={control}
                    render={({ field }) => (
                      <Select
                        key={field.value}
                        onValueChange={(value) =>
                          setValue(
                            "numberOfNights",
                            value === "none" ? "" : value
                          )
                        }
                        value={watch("numberOfNights")}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {noOfNightOptions.map((option) => (
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
                  {errors.numberOfNights && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.numberOfNights.message}
                    </p>
                  )}
                </div> */}

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
                      Package
                    </Label>
                  </div>
                </div>
              </div>
            </div>

            {/* end code */}

            {/* group tour members start */}
            {isGroupTour && (
              <>
                <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-8">
                  Members Traveling{" "}
                  <span className="bg-green-100 text-green-800 text-sm font-medium ml-2 px-3 py-1 rounded-full">
                    {groupTourMemberFields.length} of{" "}
                    {selectedTourData.numberOfTravelers -
                      RESERVED_FOR_MAIN_CLIENT}
                  </span>
                </CardTitle>
                <div className="mt-5">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Gender</TableHead>
                        <TableHead>Relation</TableHead>
                        <TableHead>Aadhar No</TableHead>
                        <TableHead>Date of Birth</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {groupTourMemberFields.map((field, index) => (
                        <TableRow key={field.id}>
                          <TableCell>
                            <Input
                              {...register(`groupTourMembers.${index}.name`)}
                              placeholder="Enter name"
                            />
                            {errors.groupTourMembers?.[index]?.name && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors.groupTourMembers[index]?.name?.message}
                              </p>
                            )}
                            <div className="mt-2">
                              <Label
                                htmlFor={`groupTourMembers.${index}.anniversaryDate`}
                                className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300"
                              >
                                Anniversary Date
                              </Label>
                              <Input
                                type="date"
                                id={`groupTourMembers.${index}.anniversaryDate`}
                                {...register(
                                  `groupTourMembers.${index}.anniversaryDate`
                                )}
                              />
                              {errors.groupTourMembers?.[index]
                                ?.anniversaryDate && (
                                <p className="text-red-500 text-xs mt-1">
                                  {
                                    errors.groupTourMembers[index]
                                      ?.anniversaryDate?.message
                                  }
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Select
                              onValueChange={(value) =>
                                setValue(
                                  `groupTourMembers.${index}.gender`,
                                  value
                                )
                              }
                              value={watch(`groupTourMembers.${index}.gender`)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select gender" />
                              </SelectTrigger>
                              <SelectContent>
                                {genderOptions.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={option.value}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <div className="mt-2">
                              <Label
                                htmlFor={`groupTourMembers.${index}.foodType`}
                                className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300"
                              >
                                Food Type
                              </Label>
                              <Select
                                onValueChange={(value) =>
                                  setValue(
                                    `groupTourMembers.${index}.foodType`,
                                    value
                                  )
                                }
                                value={watch(
                                  `groupTourMembers.${index}.foodType`
                                )}
                              >
                                <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Select foodType" />
                                </SelectTrigger>
                                <SelectContent>
                                  {foodTypeOptions.map((option) => (
                                    <SelectItem
                                      key={option.value}
                                      value={option.value}
                                    >
                                      {option.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input
                              {...register(
                                `groupTourMembers.${index}.relation`
                              )}
                              placeholder="Enter relation"
                            />
                            {errors.groupTourMembers?.[index]?.relation && (
                              <p className="text-red-500 text-xs mt-1">
                                {
                                  errors.groupTourMembers[index]?.relation
                                    ?.message
                                }
                              </p>
                            )}
                            <div className="mt-2">
                              <Label
                                htmlFor={`groupTourMembers.${index}.mobile`}
                                className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300"
                              >
                                Mobile
                              </Label>
                              <Input
                                id={`groupTourMembers.${index}.mobile`}
                                maxLength={10}
                                {...register(
                                  `groupTourMembers.${index}.mobile`
                                )}
                                placeholder="Enter mobile"
                              />
                              {errors.groupTourMembers?.[index]?.mobile && (
                                <p className="text-red-500 text-xs mt-1">
                                  {
                                    errors.groupTourMembers[index]?.mobile
                                      ?.message
                                  }
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input
                              {...register(
                                `groupTourMembers.${index}.aadharNo`
                              )}
                              placeholder="Enter Aadhar No"
                            />
                            {errors.groupTourMembers?.[index]?.aadharNo && (
                              <p className="text-red-500 text-xs mt-1">
                                {
                                  errors.groupTourMembers[index]?.aadharNo
                                    ?.message
                                }
                              </p>
                            )}
                            <div className="mt-2">
                              <Label
                                htmlFor={`groupTourMembers.${index}.email`}
                                className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300"
                              >
                                Email
                              </Label>
                              <Input
                                id={`groupTourMembers.${index}.email`}
                                {...register(`groupTourMembers.${index}.email`)}
                                placeholder="Enter email"
                              />
                              {errors.groupTourMembers?.[index]?.email && (
                                <p className="text-red-500 text-xs mt-1">
                                  {
                                    errors.groupTourMembers[index]?.email
                                      ?.message
                                  }
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="align-top">
                            <Input
                              type="date"
                              {...register(
                                `groupTourMembers.${index}.dateOfBirth`
                              )}
                            />
                            {errors.groupTourMembers?.[index]?.dateOfBirth && (
                              <p className="text-red-500 text-xs mt-1">
                                {
                                  errors.groupTourMembers[index]?.dateOfBirth
                                    ?.message
                                }
                              </p>
                            )}
                          </TableCell>
                          {/* group tour member id */}
                          <Input
                            type="hidden"
                            {...register(
                              `groupTourMembers.${index}.groupTourMemberId`
                            )}
                          />
                          {errors.groupTourMembers?.[index]
                            ?.groupTourMemberId && (
                            <p className="text-red-500 text-xs mt-1">
                              {
                                errors.groupTourMembers[index]
                                  ?.groupTourMemberId?.message
                              }
                            </p>
                          )}
                          {/* group tour member id */}

                          <TableCell>
                            <Button
                              type="button"
                              variant="destructive"
                              onClick={() => groupTourMemberRemove(index)}
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
                    // onClick={() =>
                    //   groupTourMemberAppend({
                    //     groupTourMemberId: "",
                    //     name: "",
                    //     gender: "",
                    //     relation: "",
                    //     aadharNo: "",
                    //     dateOfBirth: "",
                    //     anniversaryDate: "",
                    //     foodType: "",
                    //     mobile: "",
                    //     email: "",
                    //   })
                    // }
                    onClick={() => {
                      if (
                        groupTourMemberFields.length <
                        selectedTourData?.numberOfTravelers -
                          RESERVED_FOR_MAIN_CLIENT
                      ) {
                        groupTourMemberAppend({
                          groupTourMemberId: "",
                          name: "",
                          gender: "",
                          relation: "",
                          aadharNo: "",
                          dateOfBirth: "",
                          anniversaryDate: "",
                          foodType: "",
                          mobile: "",
                          email: "",
                        });
                      }
                    }}
                    disabled={
                      groupTourMemberFields.length >=
                      selectedTourData?.numberOfTravelers -
                        RESERVED_FOR_MAIN_CLIENT
                    }
                  >
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Add Member
                  </Button>
                </div>
              </>
            )}
            {/* group tour members end */}

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
                          {...register(`bookingDetails.${index}.day`)}
                          type="text"
                          placeholder="day"
                          className="w-20 m-0"
                        />
                        {errors.bookingDetails?.[index]?.day && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.bookingDetails[index]?.day?.message}
                          </p>
                        )}
                      </TableCell>

                      <TableCell className="w-36 px-1">
                        <Input
                          {...register(`bookingDetails.${index}.date`)}
                          type="date"
                          className="w-full"
                        />
                        {errors.bookingDetails?.[index]?.date && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.bookingDetails[index]?.date?.message}
                          </p>
                        )}
                      </TableCell>

                      <TableCell className="max-w-[500px] px-1 whitespace-normal break-words">
                        <Textarea
                          {...register(`bookingDetails.${index}.description`)}
                          className="w-[400px] lg:w-full"
                          placeholder="description"
                          rows={4}
                        />
                        {errors.bookingDetails?.[index]?.description && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.bookingDetails[index]?.description?.message}
                          </p>
                        )}
                      </TableCell>

                      <TableCell className="w-36 px-1">
                        <Controller
                          name={`bookingDetails.${index}.cityId`}
                          control={control}
                          render={({ field }) => (
                            <Select
                              key={field.value}
                              // onValueChange={(value) => {
                              //   setValue(`itineraries.${index}.cityId`, value);
                              // }}
                              onValueChange={(value) =>
                                setValue(
                                  `bookingDetails.${index}.cityId`,
                                  value === "none" ? "" : value
                                )
                              }
                              value={watch(`bookingDetails.${index}.cityId`)}
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
                        {errors.bookingDetails?.[index]?.cityId && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.bookingDetails[index]?.cityId?.message}
                          </p>
                        )}
                      </TableCell>

                      <Input
                        type="hidden"
                        {...register(`bookingDetails.${index}.bookingDetailId`)}
                      />
                      {errors.bookingDetails?.[index]?.bookingDetailId && (
                        <p className="text-red-500 text-xs mt-1">
                          {
                            errors.bookingDetails[index]?.bookingDetailId
                              ?.message
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
                    bookingDetailId: "",
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
              onClick={() => navigate("/bookings")}
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

export default BookingForm;
