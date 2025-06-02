import React, { useState, useEffect } from "react";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/formatter.js";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  useForm,
  SubmitHandler,
  Controller,
  useFieldArray,
} from "react-hook-form";

import {
  tourTypeOptions,
  statusOptions,
  destinationOptions,
  genderOptions,
  foodTypeOptions,
} from "@/config/data";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // adjust path if needed
import { cn } from "@/lib/utils";

import { Card, CardContent, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

import { post, put } from "@/services/apiService";
import { set } from "date-fns";

import MultipleSelector, {
  Option,
} from "@/components/common/multiple-selector"; // Import MultipleSelector from common folder
import dayjs from "dayjs";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, del, patch } from "@/services/apiService";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import CustomPagination from "@/components/common/custom-pagination";
import {
  Loader,
  ChevronUp,
  ChevronDown,
  Edit,
  Trash2,
  Filter,
  Download,
  ShieldEllipsis,
  Search,
  PlusCircle,
  MoreHorizontal,
  LoaderCircle,
  CheckCircle,
  XCircle,
} from "lucide-react";
import ConfirmDialog from "@/components/common/confirm-dialog";
import { saveAs } from "file-saver";
import { Badge } from "@/components/ui/badge"; // Ensure Badge is imported
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";
import TourBookingDetailsTable from "../TourBookingDetailsTable";

const TourMemberSchema = z.object({
  tourMemberId: z.string().optional(),
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

const AddFormSchema = z.object({
  tourMembers: z.array(TourMemberSchema).optional(),
});
type FormInputs = z.infer<typeof FormSchema>;
const TourMemberForm = ({ mode }: { mode: "create" | "edit" }) => {
  const queryClient = useQueryClient();
  const { id: bookingId, tourMemberId } = useParams<{
    id: string;
    tourMemberId: string;
  }>();
  const [maxTourMembers, setMaxTourMembers] = useState(0);

  const addDefaultValues: z.infer<typeof AddFormSchema> = {
    tourMembers: [], // Optional array
  };

  const editDefaultValues: z.infer<typeof TourMemberSchema> = {
    name: "",
    email: "",
    mobile: "",
    gender: "",
    relation: "",
    dateOfBirth: "",
    anniversaryDate: "",
    foodType: "",
    aadharNo: "",
    tourMemberId: "",
    // Optional array
  };

  let schema = mode === "create" ? AddFormSchema : TourMemberSchema;
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
    resolver: zodResolver(schema),
    defaultValues: mode === "create" ? addDefaultValues : editDefaultValues, // Use default values in create mode
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "tourMembers", // Name of the array in the form schema
  });

  //  Track the user ID to delete
  const navigate = useNavigate();

  const {
    data: editBookingData,
    isLoading: editBookingLoading,
    isError: isEditBookingError,
  } = useQuery({
    queryKey: ["editBooking", bookingId],
    queryFn: async () => {
      const response = await get(`/bookings/${bookingId}`);
      return response; // API returns the sector object directly
    },
  });

  const { data: editTourMemberData, isLoading: isTourMemberLoading } = useQuery(
    {
      queryKey: ["editTourMember", tourMemberId],
      queryFn: async () => {
        const response = await get(`/tour-members/${tourMemberId}`);
        return response; // API returns the sector object directly
      },
      enabled: mode === "edit", // Only runs if in edit mode and bookingId exists
    }
  );

  // data from client master
  useEffect(() => {
    if (editBookingData && mode === "create") {
      const totalTravelers = editBookingData.totalTravelers || 0;
      const totalTourMembers = totalTravelers - 1;
      setMaxTourMembers(totalTourMembers); // 👈 Save it for later

      const tourMemberDataFromClientMaster =
        editBookingData.client.familyFriends?.map((member) => ({
          tourMemberId: "",
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

      reset({
        tourMembers: tourMemberDataFromClientMaster,
      });
    }
  }, [editBookingData, reset, mode]);

  // useEffect(() => {
  //   if (editBookingData && mode === "create") {
  //     const totalTravelers = editBookingData.totalTravelers || 0;
  //     const totalTourMembers = totalTravelers - 1;
  //     setMaxTourMembers(totalTourMembers); // 👈 Save it for later

  //     const rawMembers = editBookingData.client.familyFriends || [];

  //     const tourMemberDataFromClientMaster = rawMembers
  //       .slice(0, totalTourMembers) // Only take up to the needed count
  //       .map((member) => ({
  //         tourMemberId: "",
  //         aadharNo: member.aadharNo ? String(member.aadharNo) : "",
  //         name: member.name || "",
  //         gender: member.gender || "",
  //         relation: member.relation || "",
  //         dateOfBirth: member.dateOfBirth
  //           ? new Date(member.dateOfBirth).toISOString().split("T")[0]
  //           : "",
  //         anniversaryDate: member.anniversaryDate
  //           ? new Date(member.anniversaryDate).toISOString().split("T")[0]
  //           : "",
  //         foodType: member.foodType || "",
  //         mobile: member.mobile || "",
  //         email: member.email || "",
  //       }));

  //     reset({
  //       tourMembers: tourMemberDataFromClientMaster,
  //     });
  //   }
  // }, [editBookingData, reset, mode]);

  useEffect(() => {
    if (editTourMemberData) {
      reset({
        // tourMemberId: editTourMemberData.id || "",
        aadharNo: editTourMemberData.aadharNo
          ? String(editTourMemberData.aadharNo)
          : "",
        name: editTourMemberData.name || "",
        gender: editTourMemberData.gender || "",
        relation: editTourMemberData.relation || "",
        dateOfBirth: editTourMemberData.dateOfBirth
          ? new Date(editTourMemberData.dateOfBirth).toISOString().split("T")[0]
          : "",
        anniversaryDate: editTourMemberData.anniversaryDate
          ? new Date(editTourMemberData.anniversaryDate)
              .toISOString()
              .split("T")[0]
          : "",
        foodType: editTourMemberData.foodType || "",
        mobile: String(editTourMemberData.mobile) || "",
        email: editTourMemberData.email || "",
      });
    }
  }, [editTourMemberData, reset]);

  // Mutation for creating a user
  const createMutation = useMutation({
    mutationFn: (data: FormInputs) => post(`/tour-members/${bookingId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["tour-members", bookingId]); // Refetch the users list
      toast.success("Vehicle Booking added successfully");
      navigate(`/bookings/${bookingId}/details`);
    },
    onError: (error: any) => {
      Validate(error, setError);
      if (error.message) {
        toast.error(error.message);
      } else {
        toast.error(
          error.response?.data?.message || "Failed to create Tour Member"
        );
      }
    },
  });

  // Mutation for updating a user
  const updateMutation = useMutation({
    mutationFn: (data: FormInputs) =>
      put(`/tour-members/${tourMemberId}`, data),
    onSuccess: () => {
      toast.success("Tour Members saved successfully");
      queryClient.invalidateQueries(["tour-members", bookingId]);
      navigate(`/bookings/${bookingId}/details`);
    },
    onError: (error: any) => {
      console.log(error, "error");
      Validate(error, setError);
      toast.error(
        error.response?.data?.message || "Failed to save tour Member"
      );
    },
  });

  // Handle form submission
  const onSubmit: SubmitHandler<FormInputs> = (data) => {
    if (mode === "create") {
      createMutation.mutate(data);
    } else {
      updateMutation.mutate(data);
    }
  };
  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-1">
      {Object.entries(errors).map(([field, error]) => (
        <p key={field} className="text-red-500 text-sm">
          {error?.message as string}
        </p>
      ))}
      <Card className="mx-auto mt-10 ">
        <CardContent className="pt-6 space-y-8">
          <TourBookingDetailsTable
            editBookingLoading={editBookingLoading}
            isEditBookingError={isEditBookingError}
            editBookingData={editBookingData}
          />

          {/* start */}
          {mode === "create" ? (
            <>
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
                            {...register(`tourMembers.${index}.name`)}
                            placeholder="Enter name"
                          />
                          {errors.tourMembers?.[index]?.name && (
                            <p className="text-red-500 text-xs mt-1">
                              {errors.tourMembers[index]?.name?.message}
                            </p>
                          )}
                          <div className="mt-2">
                            <Label
                              htmlFor={`tourMembers.${index}.anniversaryDate`}
                              className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300"
                            >
                              Anniversary Date
                            </Label>
                            <Input
                              type="date"
                              id={`tourMembers.${index}.anniversaryDate`}
                              {...register(
                                `tourMembers.${index}.anniversaryDate`
                              )}
                            />
                            {errors.tourMembers?.[index]?.anniversaryDate && (
                              <p className="text-red-500 text-xs mt-1">
                                {
                                  errors.tourMembers[index]?.anniversaryDate
                                    ?.message
                                }
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Select
                            onValueChange={(value) =>
                              setValue(`tourMembers.${index}.gender`, value)
                            }
                            value={watch(`tourMembers.${index}.gender`)}
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
                          {errors.tourMembers?.[index]?.gender && (
                            <p className="text-red-500 text-xs mt-1">
                              {errors.tourMembers[index]?.gender?.message}
                            </p>
                          )}
                          <div className="mt-2">
                            <Label
                              htmlFor={`tourMembers.${index}.foodType`}
                              className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300"
                            >
                              Food Type <span className="text-red-500">*</span>
                            </Label>
                            <Select
                              onValueChange={(value) =>
                                setValue(`tourMembers.${index}.foodType`, value)
                              }
                              value={watch(`tourMembers.${index}.foodType`)}
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
                            {errors.tourMembers?.[index]?.foodType && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors.tourMembers[index]?.foodType?.message}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            {...register(`tourMembers.${index}.relation`)}
                            placeholder="Enter relation"
                          />
                          {errors.tourMembers?.[index]?.relation && (
                            <p className="text-red-500 text-xs mt-1">
                              {errors.tourMembers[index]?.relation?.message}
                            </p>
                          )}
                          <div className="mt-2">
                            <Label
                              htmlFor={`tourMembers.${index}.mobile`}
                              className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300"
                            >
                              Mobile
                            </Label>
                            <Input
                              id={`tourMembers.${index}.mobile`}
                              {...register(`tourMembers.${index}.mobile`)}
                              placeholder="Enter mobile"
                            />
                            {errors.tourMembers?.[index]?.mobile && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors.tourMembers[index]?.mobile?.message}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Input
                            {...register(`tourMembers.${index}.aadharNo`)}
                            placeholder="Enter Aadhar No"
                          />
                          {errors.tourMembers?.[index]?.aadharNo && (
                            <p className="text-red-500 text-xs mt-1">
                              {errors.tourMembers[index]?.aadharNo?.message}
                            </p>
                          )}
                          <div className="mt-2">
                            <Label
                              htmlFor={`tourMembers.${index}.email`}
                              className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300"
                            >
                              Email
                            </Label>
                            <Input
                              id={`tourMembers.${index}.email`}
                              {...register(`tourMembers.${index}.email`)}
                              placeholder="Enter email"
                            />
                            {errors.tourMembers?.[index]?.email && (
                              <p className="text-red-500 text-xs mt-1">
                                {errors.tourMembers[index]?.email?.message}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          <Input
                            type="date"
                            {...register(`tourMembers.${index}.dateOfBirth`)}
                          />
                          {errors.tourMembers?.[index]?.dateOfBirth && (
                            <p className="text-red-500 text-xs mt-1">
                              {errors.tourMembers[index]?.dateOfBirth?.message}
                            </p>
                          )}
                        </TableCell>

                        {/* tourMemberId id */}
                        <Input
                          type="hidden"
                          {...register(`tourMembers.${index}.tourMemberId`)}
                        />
                        {errors.tourMembers?.[index]?.tourMemberId && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.tourMembers[index]?.tourMemberId?.message}
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
                      tourMemberId: "",
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
                  // disabled={fields.length >= maxTourMembers} // 👈 Prevent adding more
                >
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Add Tour Member
                </Button>
              </div>
            </>
          ) : (
            <>
              {" "}
              <CardTitle className="text-lg mt-5 font-semibold text-gray-800 dark:text-gray-200">
                Tour Member
              </CardTitle>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
                <div className="col-span-2 md:col-span-1">
                  <Label
                    htmlFor="name"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="name"
                    {...register("name")}
                    placeholder="from place"
                  />
                  {errors.name && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.name.message}
                    </p>
                  )}
                </div>

                <div className="col-span-2 md:col-span-1">
                  <Label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    {...register("email")}
                    placeholder="from place"
                  />
                  {errors.email && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.email.message}
                    </p>
                  )}
                </div>

                <div className="col-span-2 md:col-span-1">
                  <Label
                    htmlFor="mobile"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Mobile <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="toPlace"
                    {...register("mobile")}
                    placeholder="from place"
                  />
                  {errors.mobile && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.mobile.message}
                    </p>
                  )}
                </div>

                <div className="col-span-2 md:col-span-1">
                  <Label
                    htmlFor="dateOfBirth"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Date of Birth <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="dateOfBirth"
                    type="date"
                    {...register("dateOfBirth")}
                  />
                  {errors.dateOfBirth && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.dateOfBirth.message}
                    </p>
                  )}
                </div>
                <div className="col-span-2 md:col-span-1">
                  <Label
                    htmlFor="gender"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Gender <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                    name="gender"
                    control={control}
                    render={({ field }) => (
                      <Select
                        key={field.value}
                        onValueChange={(value) => setValue("gender", value)}
                        value={watch("gender")}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          {genderOptions.map((option) => (
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
                  {errors.gender && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.gender.message}
                    </p>
                  )}
                </div>

                <div className="col-span-2 md:col-span-1">
                  <Label
                    htmlFor="anniversaryDate"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Anniversary Date
                  </Label>
                  <Input
                    id="anniversaryDate"
                    type="date"
                    {...register("anniversaryDate")}
                  />
                  {errors.anniversaryDate && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.anniversaryDate.message}
                    </p>
                  )}
                </div>

                {/* toArrivalDate */}
                <div className="col-span-2 md:col-span-1">
                  <Label
                    htmlFor="relation"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Relation <span className="text-red-500">*</span>
                  </Label>
                  <Input id="relation" type="text" {...register("relation")} />
                  {errors.relation && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.relation.message}
                    </p>
                  )}
                </div>

                <div className="col-span-2 md:col-span-1">
                  <Label
                    htmlFor="foodType"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Food Type <span className="text-red-500">*</span>
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
                <div className="col-span-2 md:col-span-1">
                  <Label
                    htmlFor="aadharNo"
                    className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Aadhar No.
                  </Label>
                  <Input
                    id="aadharNo"
                    type="number"
                    {...register("aadharNo")}
                  />
                  {errors.aadharNo && (
                    <p className="text-red-500 text-xs mt-1">
                      {errors.aadharNo.message}
                    </p>
                  )}
                </div>
              </div>
            </>
          )}

          {/* end */}
        </CardContent>
        {/* Submit/Cancel Buttons */}
        <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 rounded-b-lg">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(`/bookings/${bookingId}/details`)}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} className="min-w-[90px]">
            {isLoading ? (
              <LoaderCircle className="animate-spin h-4 w-4" />
            ) : mode === "create" ? (
              "Add Tour Member"
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </Card>
    </form>
  );
};

export default TourMemberForm;
