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
import { useNavigate } from "react-router-dom";
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

const FormSchema = z.object({
  tourMembers: z.array(TourMemberSchema).optional(),
});
type FormInputs = z.infer<typeof FormSchema>;

const TourMemberList = ({ bookingId }) => {
  const queryClient = useQueryClient();
  const defaultValues: z.infer<typeof FormSchema> = {
    tourMembers: [], // Optional array
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

  const fetchTourMembers = async () => {
    const response = await get(`/tour-members/booking/${bookingId}`);
    return response;
  };

  // Fetch users using react-query
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["tour-members", bookingId],
    queryFn: () => fetchTourMembers(),
  });

  const tourMembers = data?.tourMembers || [];

  useEffect(() => {
    if (tourMembers) {
      const tourMemberData =
        tourMembers?.map((member) => ({
          tourMemberId: String(member.id) || "",
          aadharNo: member.aadharNo || "",
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

      // ✅ Reset full form including field array
      reset({
        tourMembers: tourMemberData, // ✅ include this
      });
    }
  }, [tourMembers, reset, setValue]);

  // data from client master
  // useEffect(() => {
  //   if (editBookingData && tourMembers?.length === 0) {
  //     const tourMemberDataFromClientMaster =
  //       editBookingData.client.familyFriends?.map((member) => ({
  //         tourMemberId: "",
  //         aadharNo: member.aadharNo || "",
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
  //       })) || [];

  //     reset({
  //       tourMembers: tourMemberDataFromClientMaster,
  //     });
  //   }
  // }, [editBookingData, reset]);

  // data from client master

  // Mutation for updating a user
  const updateMutation = useMutation({
    mutationFn: (data: FormInputs) => put(`/tour-members/${bookingId}`, data),
    onSuccess: () => {
      toast.success("Tour Members saved successfully");
      queryClient.invalidateQueries(["tour-members", bookingId]);
    },
    onError: (error: any) => {
      console.log(error, "error");
      Validate(error, setError);
      toast.error(
        error.response?.data?.message || "Failed to save tour Members"
      );
    },
  });

  // Handle form submission
  const onSubmit: SubmitHandler<FormInputs> = (data) => {
    updateMutation.mutate(data); // Trigger update mutation
  };
  const isTourLoading = updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-1">
      {/* {Object.entries(errors).map(([field, error]) => (
        <p key={field} className="text-red-500 text-sm">
          {error?.message as string}
        </p>
      ))} */}

      {/* start */}
      <div className="flex justify-between items-center">
        <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200 ">
          Tour Members
        </CardTitle>
        {/* <Button
          type="button"
          onClick={() => navigate(`/bookings/${bookingId}/tourMembers/create`)}
          className="bg-primary text-xs hover:bg-primary/90 text-white shadow-sm transition-all duration-200 hover:shadow-md"
        >
          <PlusCircle className="mr-2 h-5 w-5" />
          Add Tour Member
        </Button> */}
      </div>

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
                      {...register(`tourMembers.${index}.anniversaryDate`)}
                    />
                    {errors.tourMembers?.[index]?.anniversaryDate && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.tourMembers[index]?.anniversaryDate?.message}
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
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="mt-2">
                    <Label
                      htmlFor={`tourMembers.${index}.foodType`}
                      className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300"
                    >
                      Food Type
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
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
        >
          <PlusCircle className="mr-2 h-5 w-5" />
          Add Tour Member
        </Button>
      </div>
      {/* end */}
      {/* </CardContent> */}
      {/* Submit/Cancel Buttons */}
      <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 rounded-b-lg">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate("/bookings")}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isTourLoading} className="min-w-[90px]">
          {isTourLoading ? (
            <LoaderCircle className="animate-spin h-4 w-4" />
          ) : (
            <>Save Changes</>
          )}
        </Button>
      </div>
      {/* </Card> */}
    </form>
  );
};

export default TourMemberList;
