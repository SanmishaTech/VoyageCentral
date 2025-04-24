import React, { useEffect, useState } from "react";
import {
  useForm,
  SubmitHandler,
  Controller,
  useFieldArray,
} from "react-hook-form";
import { genderOptions, foodTypeOptions } from "@/config/data";
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

const FamilyFriendSchema = z.object({
  friendId: z.string().optional(),
  name: z
    .string()
    .min(1, "Name is required.")
    .max(100, "Name must not exceed 100 characters."),
  gender: z
    .string()
    .max(20, "Gender must not exceed 20 characters.")
    .optional(),
  relation: z
    .string()
    .max(50, "Relation must not exceed 50 characters.")
    .optional(),
  aadharNo: z
    .string()
    .max(12, "Aadhar number must be 12 digits.")
    .refine((val) => val === "" || /^[1-9]{1}[0-9]{11}$/.test(val), {
      message:
        "Aadhar number must be exactly 12 digits and cannot start with 0.",
    })
    .optional(),
  dateOfBirth: z.string().optional(),
  anniversaryDate: z.string().optional(),
  foodType: z
    .string()
    .max(30, "Food type must not exceed 30 characters.")
    .optional(),
  mobile: z
    .string()
    .max(20, "Mobile number must not exceed 20 characters.") // Allow space for country code and mobile number
    .refine(
      (val) =>
        val === "" ||
        /^[+]?[0-9]{1,4}[-\s]?[0-9]{6,15}$/.test(val) ||
        /^[6-9]\d{9}$/.test(val),
      {
        message:
          "Mobile number must be a valid number (with or without country code).",
      }
    )
    .optional(),
  email: z
    .string()
    .refine(
      (val) =>
        val === "" || val === null || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      {
        message: "Email must be a valid email address.",
      }
    )
    .optional(),
});

const FormSchema = z.object({
  clientName: z
    .string()
    .min(1, "Client name is required.")
    .max(100, "Client name must not exceed 100 characters."),
  gender: z
    .string()
    .max(20, "Gender must not exceed 20 characters.")
    .optional(),
  email: z
    .string()
    .refine((val) => val === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
      message: "Email must be a valid email address.",
    })
    .optional(),
  dateOfBirth: z.string().optional(),
  marriageDate: z.string().optional(),
  referBy: z
    .string()
    .max(30, "refer by must not exceed 30 characters.")
    .optional(),
  address1: z.string().max(255, "Address line 1 too long").optional(),
  address2: z.string().max(255, "Address line 2 too long").optional(),
  stateId: z.string().optional(),
  cityId: z.string().optional(),
  pincode: z
    .string()
    .refine((val) => val === "" || /^[1-9][0-9]{5}$/.test(val), {
      message: "Pincode must be a valid 6-digit number.",
    })
    .optional(),
  mobile1: z
    .string()
    .max(20, "Mobile number must not exceed 20 characters.") // Allow space for country code and mobile number
    .refine(
      (val) =>
        val === "" ||
        /^[+]?[0-9]{1,4}[-\s]?[0-9]{6,15}$/.test(val) ||
        /^[6-9]\d{9}$/.test(val),
      {
        message:
          "Mobile number must be a valid number (with or without country code).",
      }
    )
    .optional(),
  mobile2: z
    .string()
    .max(20, "Mobile number must not exceed 20 characters.") // Allow space for country code and mobile number
    .refine(
      (val) =>
        val === "" ||
        /^[+]?[0-9]{1,4}[-\s]?[0-9]{6,15}$/.test(val) ||
        /^[6-9]\d{9}$/.test(val),
      {
        message:
          "Mobile number must be a valid number (with or without country code).",
      }
    )
    .optional(),
  gstin: z
    .string()
    .refine(
      (val) =>
        val === "" ||
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[0-9A-Z]{1}$/.test(
          val
        ),
      { message: "Invalid GSTIN format." }
    )
    .optional(),
  passportNo: z
    .string()
    .refine(
      (val) => val === "" || /^[A-PR-WY][1-9]\d\s?\d{4}[1-9]$/.test(val),
      {
        message: "Invalid passport number.",
      }
    )
    .optional(),
  panNo: z
    .string()
    .refine((val) => val === "" || /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(val), {
      message: "Invalid PAN number format. Example: ABCDE1234F",
    })
    .optional(),
  aadharNo: z
    .string()
    .max(12, "Aadhar number must be 12 digits.")
    .refine((val) => val === "" || /^[1-9]{1}[0-9]{11}$/.test(val), {
      message:
        "Aadhar number must be exactly 12 digits and cannot start with 0.",
    })
    .optional(),
  familyFriends: z.array(FamilyFriendSchema).optional(),
});

type FormInputs = z.infer<typeof FormSchema>;

const ClientForm = ({ mode }: { mode: "create" | "edit" }) => {
  const { id } = useParams<{ id: string }>();
  const [stateId, setStateId] = useState<string | null>(null);

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
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "familyFriends", // Name of the array in the form schema
  });

  const { data: editClientData, isLoading: editClientLoading } = useQuery({
    queryKey: ["editClient", id],
    queryFn: async () => {
      const response = await get(`/clients/${id}`);
      return response; // API returns the sector object directly
    },
    enabled: !!id && mode === "edit",
  });

  // countries
  const { data: indianStates, isLoading: isIndianStatesLoading } = useQuery({
    queryKey: ["states", 1],
    queryFn: async () => {
      const response = await get(`/states/india`);
      return response; // API returns the sector object directly
    },
  });

  // hotel states
  const { data: cities, isLoading: isCitiesLoading } = useQuery({
    queryKey: ["cities", stateId],
    queryFn: async () => {
      const response = await get(`/cities/by-state/${stateId}`);
      return response; // API returns the sector object directly
    },
    enabled: !!stateId,
  });

  useEffect(() => {
    if (editClientData) {
      setStateId(String(editClientData.stateId) || "");

      // ✅ Map familyFriends once
      const familyFriendsData =
        editClientData.familyFriends?.map((friend) => ({
          friendId: String(friend.id) || "",
          name: friend.name || "",
          gender: friend.gender || "",
          relation: friend.relation || "",
          aadharNo: friend.aadharNo || "",
          dateOfBirth: friend.dateOfBirth
            ? new Date(friend.dateOfBirth).toISOString().split("T")[0]
            : "",
          anniversaryDate: friend.anniversaryDate
            ? new Date(friend.anniversaryDate).toISOString().split("T")[0]
            : "",
          foodType: friend.foodType || "",
          mobile: friend.mobile || "",
          email: friend.email || "",
        })) || [];

      // ✅ Reset full form including field array
      reset({
        clientName: editClientData.clientName || "",
        // gender: editClientData.gender,
        email: editClientData.email || "",
        dateOfBirth: editClientData.dateOfBirth
          ? new Date(editClientData.dateOfBirth).toISOString().split("T")[0]
          : "",
        marriageDate: editClientData.marriageDate
          ? new Date(editClientData.marriageDate).toISOString().split("T")[0]
          : "",
        referBy: editClientData.referBy || "",
        address1: editClientData.address1 || "",
        address2: editClientData.address2 || "",
        pincode: editClientData.pincode || "",
        mobile1: editClientData.mobile1 || "",
        mobile2: editClientData.mobile2 || "",
        gstin: editClientData.gstin || "",
        passportNo: editClientData.passportNo || "",
        panNo: editClientData.panNo || "",
        aadharNo: editClientData.aadharNo || "",
        familyFriends: familyFriendsData, // ✅ include this
      });

      // Set dependent dropdowns after reset (optional delay)
      setTimeout(() => {
        setValue("stateId", String(editClientData.stateId) || "");
        setValue("cityId", String(editClientData.cityId) || "");
        setValue("gender", editClientData.gender);
      }, 300); // shorter delay works fine too
    }
  }, [editClientData, reset, setValue]);

  // Mutation for creating a user
  const createMutation = useMutation({
    mutationFn: (data: FormInputs) => post("/clients", data),
    onSuccess: () => {
      queryClient.invalidateQueries(["clients"]); // Refetch the users list
      toast.success("Client created successfully");
      navigate("/clients"); // Navigate to the hotels page after successful creation
    },
    onError: (error: any) => {
      Validate(error, setError);
      toast.error(error.response?.data?.message || "Failed to create Client");
    },
  });

  // Mutation for updating a user
  const updateMutation = useMutation({
    mutationFn: (data: FormInputs) => put(`/clients/${id}`, data),
    onSuccess: () => {
      toast.success("Client updated successfully");
      queryClient.invalidateQueries(["clients"]);
      navigate("/clients"); // Navigate to the hotels page after successful update
    },
    onError: (error: any) => {
      Validate(error, setError);
      toast.error(error.response?.data?.message || "Failed to update clients");
    },
  });

  // Handle form submission
  const onSubmit: SubmitHandler<FormInputs> = (data) => {
    if (mode === "create") {
      createMutation.mutate(data); // Trigger create mutation
    } else {
      updateMutation.mutate(data); // Trigger update mutation
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  if (mode === "edit" && !indianStates?.length) {
    return <></>;
  }
  return (
    <>
      {/* JSX Code for HotelForm.tsx */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="mx-auto mt-10 min-w-5xl">
          <CardContent className="pt-6">
            {/* Client Details */}
            <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Client Details
            </CardTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
              {/* Client Name (2 columns) */}
              <div className="col-span-2">
                <Label
                  htmlFor="clientName"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Client Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="clientName"
                  {...register("clientName")}
                  placeholder="Enter client name"
                />
                {errors.clientName && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.clientName.message}
                  </p>
                )}
              </div>

              {/* Gender */}
              <div>
                <Label
                  htmlFor="gender"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Gender
                </Label>
                <Select
                  onValueChange={(value) => setValue("gender", value)}
                  value={watch("gender")}
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
              </div>

              {/* Date of Birth */}
              <div>
                <Label
                  htmlFor="dateOfBirth"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Date of Birth
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

              {/* Marriage Date */}
              <div>
                <Label
                  htmlFor="marriageDate"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Marriage Date
                </Label>
                <Input
                  id="marriageDate"
                  type="date"
                  {...register("marriageDate")}
                />
                {errors.marriageDate && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.marriageDate.message}
                  </p>
                )}
              </div>

              {/* Refer By */}
              <div>
                <Label
                  htmlFor="referBy"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Refer By
                </Label>
                <Input
                  id="referBy"
                  {...register("referBy")}
                  placeholder="Enter reference"
                />
                {errors.referBy && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.referBy.message}
                  </p>
                )}
              </div>
            </div>

            {/* Address Details */}
            <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-8">
              Address Details
            </CardTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
              {/* Address 1 */}
              <div>
                <Label
                  htmlFor="address1"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Address Line 1
                </Label>
                <Input
                  id="address1"
                  {...register("address1")}
                  placeholder="Enter address line 1"
                />
                {errors.address1 && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.address1.message}
                  </p>
                )}
              </div>

              {/* Address 2 */}
              <div>
                <Label
                  htmlFor="address2"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Address Line 2
                </Label>
                <Input
                  id="address2"
                  {...register("address2")}
                  placeholder="Enter address line 2"
                />
                {errors.address2 && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.address2.message}
                  </p>
                )}
              </div>

              {/* State */}
              <div>
                <Label
                  htmlFor="stateId"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  State
                </Label>
                <Select
                  onValueChange={(value) => {
                    setValue("stateId", value);
                    setStateId(value);
                    setValue("cityId", ""); // Reset city when state changes
                  }}
                  value={watch("stateId")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a state" />
                  </SelectTrigger>
                  <SelectContent>
                    {indianStates?.map((state) => (
                      <SelectItem key={state.id} value={String(state.id)}>
                        {state.stateName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* City */}
              <div>
                <Label
                  htmlFor="cityId"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  City
                </Label>
                <Select
                  onValueChange={(value) => setValue("cityId", value)}
                  value={watch("cityId")}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a city" />
                  </SelectTrigger>
                  <SelectContent>
                    {cities?.map((city) => (
                      <SelectItem key={city.id} value={String(city.id)}>
                        {city.cityName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Pincode */}
              <div>
                <Label
                  htmlFor="pincode"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Pincode
                </Label>
                <Input
                  id="pincode"
                  {...register("pincode")}
                  placeholder="Enter pincode"
                />
                {errors.pincode && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.pincode.message}
                  </p>
                )}
              </div>
            </div>

            {/* Contact Details */}
            <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-8">
              Contact Details
            </CardTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
              {/* Mobile 1 */}
              <div>
                <Label
                  htmlFor="mobile1"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Mobile 1
                </Label>
                <Input
                  id="mobile1"
                  {...register("mobile1")}
                  placeholder="Enter primary mobile number"
                />
                {errors.mobile1 && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.mobile1.message}
                  </p>
                )}
              </div>

              {/* Mobile 2 */}
              <div>
                <Label
                  htmlFor="mobile2"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Mobile 2
                </Label>
                <Input
                  id="mobile2"
                  {...register("mobile2")}
                  placeholder="Enter secondary mobile number"
                />
                {errors.mobile2 && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.mobile2.message}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <Label
                  htmlFor="email"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Email
                </Label>
                <Input
                  id="email"
                  {...register("email")}
                  placeholder="Enter email"
                />
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.email.message}
                  </p>
                )}
              </div>
            </div>

            {/* Other Details */}
            <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-8">
              Other Details
            </CardTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
              {/* GSTIN */}
              <div>
                <Label
                  htmlFor="gstin"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  GSTIN
                </Label>
                <Input
                  id="gstin"
                  {...register("gstin")}
                  placeholder="Enter GSTIN"
                />
                {errors.gstin && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.gstin.message}
                  </p>
                )}
              </div>

              {/* Passport Number */}
              <div>
                <Label
                  htmlFor="passportNo"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Passport Number
                </Label>
                <Input
                  id="passportNo"
                  {...register("passportNo")}
                  placeholder="Enter passport number"
                />
                {errors.passportNo && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.passportNo.message}
                  </p>
                )}
              </div>

              {/* PAN Number */}
              <div>
                <Label
                  htmlFor="panNo"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  PAN Number
                </Label>
                <Input
                  id="panNo"
                  {...register("panNo")}
                  placeholder="Enter PAN number"
                />
                {errors.panNo && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.panNo.message}
                  </p>
                )}
              </div>

              {/* Aadhar Number */}
              <div>
                <Label
                  htmlFor="aadharNo"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Aadhar Number
                </Label>
                <Input
                  id="aadharNo"
                  {...register("aadharNo")}
                  placeholder="Enter Aadhar number"
                />
                {errors.aadharNo && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.aadharNo.message}
                  </p>
                )}
              </div>
            </div>

            {/* start */}
            <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-8">
              Family & Friends
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
                  {fields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell>
                        <Input
                          {...register(`familyFriends.${index}.name`)}
                          placeholder="Enter name"
                        />
                        {errors.familyFriends?.[index]?.name && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.familyFriends[index]?.name?.message}
                          </p>
                        )}
                        <div className="mt-2">
                          <Label
                            htmlFor={`familyFriends.${index}.anniversaryDate`}
                            className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300"
                          >
                            Anniversary Date
                          </Label>
                          <Input
                            type="date"
                            id={`familyFriends.${index}.anniversaryDate`}
                            {...register(
                              `familyFriends.${index}.anniversaryDate`
                            )}
                          />
                          {errors.familyFriends?.[index]?.anniversaryDate && (
                            <p className="text-red-500 text-xs mt-1">
                              {
                                errors.familyFriends[index]?.anniversaryDate
                                  ?.message
                              }
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Select
                          onValueChange={(value) =>
                            setValue(`familyFriends.${index}.gender`, value)
                          }
                          value={watch(`familyFriends.${index}.gender`)}
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
                            htmlFor={`familyFriends.${index}.foodType`}
                            className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300"
                          >
                            Food Type
                          </Label>
                          <Select
                            onValueChange={(value) =>
                              setValue(`familyFriends.${index}.foodType`, value)
                            }
                            value={watch(`familyFriends.${index}.foodType`)}
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
                          {...register(`familyFriends.${index}.relation`)}
                          placeholder="Enter relation"
                        />
                        {errors.familyFriends?.[index]?.relation && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.familyFriends[index]?.relation?.message}
                          </p>
                        )}
                        <div className="mt-2">
                          <Label
                            htmlFor={`familyFriends.${index}.mobile`}
                            className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300"
                          >
                            Mobile
                          </Label>
                          <Input
                            id={`familyFriends.${index}.mobile`}
                            {...register(`familyFriends.${index}.mobile`)}
                            placeholder="Enter mobile"
                          />
                          {errors.familyFriends?.[index]?.mobile && (
                            <p className="text-red-500 text-xs mt-1">
                              {errors.familyFriends[index]?.mobile?.message}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          {...register(`familyFriends.${index}.aadharNo`)}
                          placeholder="Enter Aadhar No"
                        />
                        {errors.familyFriends?.[index]?.aadharNo && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.familyFriends[index]?.aadharNo?.message}
                          </p>
                        )}
                        <div className="mt-2">
                          <Label
                            htmlFor={`familyFriends.${index}.email`}
                            className="mb-1 block text-xs font-medium text-gray-700 dark:text-gray-300"
                          >
                            Email
                          </Label>
                          <Input
                            id={`familyFriends.${index}.email`}
                            {...register(`familyFriends.${index}.email`)}
                            placeholder="Enter email"
                          />
                          {errors.familyFriends?.[index]?.email && (
                            <p className="text-red-500 text-xs mt-1">
                              {errors.familyFriends[index]?.email?.message}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        <Input
                          type="date"
                          {...register(`familyFriends.${index}.dateOfBirth`)}
                        />
                        {errors.familyFriends?.[index]?.dateOfBirth && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.familyFriends[index]?.dateOfBirth?.message}
                          </p>
                        )}
                      </TableCell>
                      {/* friend id */}
                      <Input
                        type="hidden"
                        {...register(`familyFriends.${index}.friendId`)}
                      />
                      {errors.familyFriends?.[index]?.friendId && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.familyFriends[index]?.friendId?.message}
                        </p>
                      )}
                      {/* friend id */}

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
                    friendId: "",
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
                Add Family/Friend
              </Button>
            </div>
            {/* end */}
          </CardContent>

          {/* Submit/Cancel Buttons */}
          <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 rounded-b-lg">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/clients")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="min-w-[90px]">
              {isLoading ? (
                <LoaderCircle className="animate-spin h-4 w-4" />
              ) : mode === "create" ? (
                "Create Client"
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

export default ClientForm;
