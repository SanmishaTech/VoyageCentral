import React, { useEffect, useState } from "react";
import {
  useForm,
  SubmitHandler,
  Controller,
  useFieldArray,
  useWatch,
} from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox"; // make sure it's imported

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
  budgetFieldOptions,
  noOfAdultsOptions,
  noOfChildrens5To11Options,
  noOfChildrensBelow5Options,
  noOfNightOptions,
  bookingTypeOptions,
  genderOptions,
} from "@/config/data";
import AddClient from "../AddClient";

const TourMemberSchema = z.object({
  groupClientMemberId: z.string().optional(),
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
  passportNumber: z
    .string()
    .refine((val) => val === "" || /^[A-PR-WYa-pr-wy][0-9]{7}$/.test(val), {
      message: "Invalid Indian passport number format. Example: A1234567.",
    }),
  panNumber: z
    .string()
    .refine((val) => val === "" || /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(val), {
      message: "Invalid PAN number format. Example: ABCDE1234F",
    })
    .optional(),
});

const FormSchema = z.object({
  clientId: z.union([
    z.string().min(1, "Client field is required."),
    z.number().min(1, "Client Field is required"),
  ]),
  bookingDate: z.string().min(1, "Booing Date Field is required."), // should be parsed to Date if needed

  numberOfAdults: z.string().optional(),

  numberOfChildren5To11: z.string().optional(),

  numberOfChildrenUnder5: z.string().optional(),

  tourCost: z.preprocess(
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

  notes: z.string().max(1000, "Max 1000 characters").optional(),

  isJourney: z.boolean(),
  isHotel: z.boolean(),
  isVehicle: z.boolean(),
  groupClientMembers: z.array(TourMemberSchema).optional(),
});

type FormInputs = z.infer<typeof FormSchema>;

const defaultValues: FormInputs = {
  clientId: "",
  bookingDate: new Date().toISOString().split("T")[0], // defaults to today (YYYY-MM-DD)

  numberOfAdults: "",
  numberOfChildren5To11: "",
  numberOfChildrenUnder5: "",
  tourCost: "",
  notes: "",
  isJourney: false,
  isHotel: false,
  isVehicle: false,
  groupClientMembers: [],
};

const GroupClientBookingForm = ({ mode }: { mode: "create" | "edit" }) => {
  const { groupBookingId, groupClientBookingId } = useParams<{
    groupBookingId: string;
    groupClientBookingId: string;
  }>();
  const [openClientId, setOpenClientId] = useState<boolean>(false);
  const [selectedClientData, setSelectedClientData] = useState<any>(null);
  const RESERVED_FOR_MAIN_CLIENT = 1;
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

  const { fields, append, remove } = useFieldArray({
    control,
    name: "groupClientMembers", // Name of the array in the form schema
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

  const {
    data: editGroupClientBookingData,
    isLoading: editGroupClientBookingLoading,
  } = useQuery({
    queryKey: ["editGroupClientBooking", groupClientBookingId],
    queryFn: async () => {
      const response = await get(
        `/group-client-bookings/${groupClientBookingId}`
      );
      return response; // API returns the sector object directly
    },
  });

  // const {
  //   data: editBookingData,
  //   isLoading: editBookingLoading,
  //   isError: isEditBookingError,
  // } = useQuery({
  //   queryKey: ["editBooking", id],
  //   queryFn: async () => {
  //     const response = await get(`/bookings/${id}`);
  //     return response; // API returns the sector object directly
  //   },
  // });

  useEffect(() => {
    if (editGroupClientBookingData) {
      const groupClientMembersData =
        editGroupClientBookingData.groupClientMembers.map((member) => ({
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
          passportNumber: member.passportNumber || "",
          panNumber: member.panNumber || "",
        })) || [];

      reset({
        clientId: String(editGroupClientBookingData?.clientId) || "",
        bookingDate: editGroupClientBookingData.bookingDate
          ? new Date(editGroupClientBookingData.bookingDate)
              .toISOString()
              .split("T")[0]
          : "",

        numberOfAdults:
          editGroupClientBookingData.numberOfAdults !== null &&
          editGroupClientBookingData.numberOfAdults !== undefined
            ? String(editGroupClientBookingData.numberOfAdults)
            : "",
        numberOfChildren5To11:
          editGroupClientBookingData.numberOfChildren5To11 !== null &&
          editGroupClientBookingData.numberOfChildren5To11 !== undefined
            ? String(editGroupClientBookingData.numberOfChildren5To11)
            : "",
        numberOfChildrenUnder5:
          editGroupClientBookingData.numberOfChildrenUnder5 !== null &&
          editGroupClientBookingData.numberOfChildrenUnder5 !== undefined
            ? String(editGroupClientBookingData.numberOfChildrenUnder5)
            : "",

        tourCost: editGroupClientBookingData.tourCost
          ? parseFloat(editGroupClientBookingData.tourCost).toFixed(2)
          : "",

        notes: editGroupClientBookingData.notes || "",

        isJourney: editGroupClientBookingData.isJourney,
        isHotel: editGroupClientBookingData.isHotel,
        isVehicle: editGroupClientBookingData.isVehicle,

        groupClientMembers: groupClientMembersData,
      });
    }
  }, [editGroupClientBookingData, reset]);

  function handleClientSelectChange(client) {
    let clientId = parseInt(watch("clientId"));
    if (clientId === client.id) {
      return;
      // was here last time
    }
    if (selectedClientData) {
      const MemberData =
        selectedClientData?.familyFriends?.map((member: any) => ({
          groupClientBookingId: "",
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
          panNumber: member.panNumber || "",
          passportNumber: member.passportNumber || "",
        })) || [];

      append(MemberData);
    }
  }

  // Mutation for creating a user
  const createMutation = useMutation({
    mutationFn: (data: FormInputs) =>
      post(`/group-client-bookings/${groupBookingId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["group-booking-bookings"]); // Refetch the users list
      toast.success("Tour Member added successfully");
      navigate(`/groupBookings/${groupBookingId}/details`);
    },
    onError: (error: any) => {
      Validate(error, setError);
      toast.error(
        error.response?.data?.message || "Failed to create Tour Members"
      );
    },
  });

  // Mutation for updating a user
  const updateMutation = useMutation({
    mutationFn: (data: FormInputs) =>
      put(`/group-client-bookings/${groupClientBookingId}`, data),
    onSuccess: () => {
      toast.success("Tour Members updated successfully");
      queryClient.invalidateQueries(["group-client-bookings"]);
      navigate(`/bookings/${groupBookingId}/details`);
    },
    onError: (error: any) => {
      Validate(error, setError);
      console.log("this is error", error);
      toast.error(
        error.response?.data?.message || "Failed to update Tour Members"
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
            {/* <TourBookingDetailsTable
              editBookingLoading={editBookingLoading}
              isEditBookingError={isEditBookingError}
              editBookingData={editBookingData}
            /> */}

            <CardTitle className="font-semibold mt-5 text-gray-800 dark:text-gray-200 mb-4">
              Group Member
            </CardTitle>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/*  Booking Date */}
              <div>
                <Label
                  htmlFor="bookingDate"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Booking Date
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
                                          }
                                          handleClientSelectChange(client);
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

              <div className="">
                <Label
                  htmlFor="tourCost"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Tour Cost <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="tourCost"
                  {...register("tourCost")}
                  step="0.01"
                  type="number"
                  placeholder="Enter tourCost"
                />
                {errors.tourCost && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.tourCost.message}
                  </p>
                )}
              </div>
              {/* Notes */}
              <div className="col-span-2">
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
              {/* Checkboxes for isJourney, isHotel, isVehicle, isPackage */}
              <div className="grid grid-cols-1 gap-2 mt-2 ml-4">
                <div className="flex items-center space-x-2">
                  <Controller
                    name="isJourney"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        id="isJourney"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="border border-2"
                      />
                    )}
                  />
                  <Label
                    htmlFor="isJourney"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Journey
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Controller
                    name="isHotel"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        id="isHotel"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="border border-2"
                      />
                    )}
                  />
                  <Label
                    htmlFor="isHotel"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Hotel
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Controller
                    name="isVehicle"
                    control={control}
                    render={({ field }) => (
                      <Checkbox
                        id="isVehicle"
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        className="border border-2"
                      />
                    )}
                  />
                  <Label
                    htmlFor="isVehicle"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Vehicle
                  </Label>
                </div>
              </div>
              <div className="col-span-3">
                {/* groupClientMembers start */}
                {/* <> */}
                <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200 ">
                  Tour Members
                </CardTitle>
                <div className="mt-2">
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
                      {fields.map((field, index) => (
                        <TableRow key={field.id}>
                          <TableCell>
                            <Input
                              {...register(`groupClientMembers.${index}.name`)}
                              placeholder="Enter name"
                            />
                            {errors.groupClientMembers?.[index]?.name && (
                              <p className="text-red-500 text-xs mt-1">
                                {
                                  errors.groupClientMembers[index]?.name
                                    ?.message
                                }
                              </p>
                            )}
                            <div className="mt-2">
                              <Label
                                htmlFor={`groupClientMembers.${index}.anniversaryDate`}
                                className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300"
                              >
                                Anniversary Date
                              </Label>
                              <Input
                                type="date"
                                id={`groupClientMembers.${index}.anniversaryDate`}
                                {...register(
                                  `groupClientMembers.${index}.anniversaryDate`
                                )}
                              />
                              {errors.groupClientMembers?.[index]
                                ?.anniversaryDate && (
                                <p className="text-red-500 text-xs mt-1">
                                  {
                                    errors.groupClientMembers[index]
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
                                  `groupClientMembers.${index}.gender`,
                                  value
                                )
                              }
                              value={watch(
                                `groupClientMembers.${index}.gender`
                              )}
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
                            {errors.groupClientMembers?.[index]?.gender && (
                              <p className="text-red-500 text-xs mt-1">
                                {
                                  errors.groupClientMembers[index]?.gender
                                    ?.message
                                }
                              </p>
                            )}
                            <div className="mt-2">
                              <Label
                                htmlFor={`groupClientMembers.${index}.foodType`}
                                className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300"
                              >
                                Food Type{" "}
                                <span className="text-red-500">*</span>
                              </Label>
                              <Select
                                onValueChange={(value) =>
                                  setValue(
                                    `groupClientMembers.${index}.foodType`,
                                    value
                                  )
                                }
                                value={watch(
                                  `groupClientMembers.${index}.foodType`
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
                              {errors.groupClientMembers?.[index]?.foodType && (
                                <p className="text-red-500 text-xs mt-1">
                                  {
                                    errors.groupClientMembers[index]?.foodType
                                      ?.message
                                  }
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input
                              {...register(
                                `groupClientMembers.${index}.relation`
                              )}
                              placeholder="Enter relation"
                            />
                            {errors.groupClientMembers?.[index]?.relation && (
                              <p className="text-red-500 text-xs mt-1">
                                {
                                  errors.groupClientMembers[index]?.relation
                                    ?.message
                                }
                              </p>
                            )}
                            <div className="mt-2">
                              <Label
                                htmlFor={`groupClientMembers.${index}.mobile`}
                                className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300"
                              >
                                Mobile
                              </Label>
                              <Input
                                id={`groupClientMembers.${index}.mobile`}
                                {...register(
                                  `groupClientMembers.${index}.mobile`
                                )}
                                placeholder="Enter mobile"
                              />
                              {errors.groupClientMembers?.[index]?.mobile && (
                                <p className="text-red-500 text-xs mt-1">
                                  {
                                    errors.groupClientMembers[index]?.mobile
                                      ?.message
                                  }
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Input
                              {...register(
                                `groupClientMembers.${index}.aadharNo`
                              )}
                              placeholder="Enter Aadhar No"
                            />
                            {errors.groupClientMembers?.[index]?.aadharNo && (
                              <p className="text-red-500 text-xs mt-1">
                                {
                                  errors.groupClientMembers[index]?.aadharNo
                                    ?.message
                                }
                              </p>
                            )}
                            <div className="mt-2">
                              <Label
                                htmlFor={`groupClientMembers.${index}.email`}
                                className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300"
                              >
                                Email
                              </Label>
                              <Input
                                id={`groupClientMembers.${index}.email`}
                                {...register(
                                  `groupClientMembers.${index}.email`
                                )}
                                placeholder="Enter email"
                              />
                              {errors.groupClientMembers?.[index]?.email && (
                                <p className="text-red-500 text-xs mt-1">
                                  {
                                    errors.groupClientMembers[index]?.email
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
                                `groupClientMembers.${index}.dateOfBirth`
                              )}
                            />
                            {errors.groupClientMembers?.[index]
                              ?.dateOfBirth && (
                              <p className="text-red-500 text-xs mt-1">
                                {
                                  errors.groupClientMembers[index]?.dateOfBirth
                                    ?.message
                                }
                              </p>
                            )}
                          </TableCell>

                          {/* tourMemberId id */}
                          <Input
                            type="hidden"
                            {...register(
                              `groupClientMembers.${index}.groupClientMemberId`
                            )}
                          />
                          {errors.groupClientMembers?.[index]
                            ?.groupClientMemberId && (
                            <p className="text-red-500 text-xs mt-1">
                              {
                                errors.groupClientMembers[index]
                                  ?.groupClientMemberId?.message
                              }
                            </p>
                          )}
                          {/* tourMemberId id */}

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
                        groupClientMemberId: "",
                        name: "",
                        gender: "",
                        relation: "",
                        aadharNo: "",
                        dateOfBirth: "",
                        anniversaryDate: "",
                        foodType: "",
                        mobile: "",
                        email: "",
                      })
                    }
                  >
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Add Tour Member
                  </Button>
                </div>
                {/* </> */}
                {/* groupClientMembers end */}
              </div>
            </div>
          </CardContent>

          {/* Submit/Cancel Buttons */}
          <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 rounded-b-lg">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                navigate(`/groupBookings/${groupBookingId}/details`)
              }
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="min-w-[90px]">
              {isLoading ? (
                <LoaderCircle className="animate-spin h-4 w-4" />
              ) : mode === "create" ? (
                "Create Tour Members"
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

export default GroupClientBookingForm;
