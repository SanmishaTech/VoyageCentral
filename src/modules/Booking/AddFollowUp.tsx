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
import dayjs from "dayjs";

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

const FormSchema = z.object({
  followUpDate: z
    .string()
    .min(1, "Date is required.")
    .max(100, "Date must not exceed 100 characters."),
  nextFollowUpDate: z
    .string()
    .min(1, "Date is required.")
    .max(100, "Date must not exceed 100 characters."),
  remarks: z
    .string()
    .min(1, "Remark field is required.")
    .max(2000, "Remark field must not exceed 2000 characters."),
});

type FormInputs = z.infer<typeof FormSchema>;

const AddFollowUp = () => {
  const { id } = useParams<{ id: string }>();

  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const defaultValues: FormInputs = {
    remarks: "",
    followUpDate: new Date().toISOString().split("T")[0], // Today's date
    nextFollowUpDate: "",
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
    defaultValues: defaultValues,
  });

  // followUps
  const { data: followUps, isLoading: isFollowUpsLoading } = useQuery({
    queryKey: ["followUps", id],
    queryFn: async () => {
      const response = await get(`/follow-ups/booking/${id}`);
      return response; // API returns the sector object directly
    },
  });

  // Mutation for creating a user
  const createMutation = useMutation({
    mutationFn: (data: FormInputs) => post(`/follow-ups/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["followUps"]); // Refetch the users list
      toast.success("Follow up created successfully");
      navigate("/bookings"); // Navigate to the hotels page after successful creation
    },
    onError: (error: any) => {
      Validate(error, setError);
      toast.error(
        error.response?.data?.message || "Failed to create Follow up"
      );
    },
  });

  // Handle form submission
  const onSubmit: SubmitHandler<FormInputs> = (data) => {
    createMutation.mutate(data); // Trigger create mutation
  };

  const isLoading = createMutation.isPending;

  return (
    <>
      {/* JSX Code for HotelForm.tsx */}
      <div className="mt-2 p-6">
        <h1 className="text-2xl font-bold mb-6">Add Follow-Up</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <Card className="mx-auto mt-10">
            <CardContent className="pt-6">
              {/* Client Details */}
              <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                Follow-Up
              </CardTitle>

              {/* start code */}
              {/* start code */}
              <div className="w-full max-w-screen-lg mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4 mt-5">
                  {/* Follow up Date */}
                  <div className="col-span-2 lg:col-span-1">
                    <Label
                      htmlFor="followUpDate"
                      className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Follow-Up Date <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="followUpDate"
                      type="date"
                      min={new Date().toISOString().split("T")[0]} // Prevent past dates
                      max={
                        new Date(
                          new Date().setFullYear(new Date().getFullYear() + 2)
                        )
                          .toISOString()
                          .split("T")[0]
                      } // Today + 2 years
                      {...register("followUpDate")}
                    />
                    {errors.followUpDate && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.followUpDate.message}
                      </p>
                    )}
                  </div>

                  {/* Next follow up Date */}
                  <div className="col-span-2 lg:col-span-1">
                    <Label
                      htmlFor="nextFollowUpDate"
                      className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Next Follow-Up Date
                    </Label>
                    <Input
                      id="nextFollowUpDate"
                      type="date"
                      min={new Date().toISOString().split("T")[0]} // Prevent past dates
                      max={
                        new Date(
                          new Date().setFullYear(new Date().getFullYear() + 2)
                        )
                          .toISOString()
                          .split("T")[0]
                      } // Today + 2 years
                      {...register("nextFollowUpDate")}
                    />
                    {errors.nextFollowUpDate && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.nextFollowUpDate.message}
                      </p>
                    )}
                  </div>

                  {/* Remarks */}
                  <div className="col-span-2">
                    <Label
                      htmlFor="remarks"
                      className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Remarks
                    </Label>
                    <Textarea
                      id="remarks"
                      {...register("remarks")}
                      placeholder="Enter remarks"
                      rows={4} // Optional: control height
                    />
                    {errors.remarks && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.remarks.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
              {/* end code */}
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
              <Button
                type="submit"
                disabled={isLoading}
                className="min-w-[90px]"
              >
                {isLoading ? (
                  <LoaderCircle className="animate-spin h-4 w-4" />
                ) : (
                  "Create Follow-up"
                )}
              </Button>
            </div>
          </Card>
        </form>
        {/* Follow-Ups Table */}
        <div className="mt-10">
          <Card className="">
            <CardContent>
              <h2 className="text-xl font-semibold mb-4">Follow-Ups History</h2>
              {isFollowUpsLoading ? (
                <p>Loading follow-ups...</p>
              ) : followUps.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-15 pr-6">
                        Follow-Up Date
                      </TableHead>
                      <TableHead className="w-15 px-6">
                        Next Follow-Up Date
                      </TableHead>
                      <TableHead className="px-6">Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {followUps.map((followUp) => (
                      <TableRow key={followUp.id}>
                        <TableCell className="w-15 pr-6">
                          {followUp.followUpDate
                            ? dayjs(followUp.followUpDate).format("DD/MM/YYYY")
                            : "N/A"}
                        </TableCell>
                        <TableCell className="w-15 px-6">
                          {followUp.nextFollowUpDate
                            ? dayjs(followUp.nextFollowUpDate).format(
                                "DD/MM/YYYY"
                              )
                            : "N/A"}
                        </TableCell>
                        <TableCell className="max-w-[500px] px-1 whitespace-normal break-words">
                          {followUp.remarks}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center">No Follow-Ups Found.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default AddFollowUp;
