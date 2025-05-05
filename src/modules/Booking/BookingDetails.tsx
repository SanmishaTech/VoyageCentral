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
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import JourneyBookingList from "./JourneyBooking/JourneyBookingList";
const BookingDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: editBookingData, isLoading: editBookingLoading } = useQuery({
    queryKey: ["editBooking", id],
    queryFn: async () => {
      const response = await get(`/bookings/${id}`);
      return response; // API returns the sector object directly
    },
  });

  return (
    <>
      <div className="mt-2 p-6">
        <h1 className="text-2xl font-bold mb-6">Booking Details</h1>

        <Card className="mx-auto mt-10">
          <CardContent className="pt-6">
            {/* Heading */}
            <CardTitle className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4">
              Client Details
            </CardTitle>

            <div className="w-full mx-auto space-y-6">
              {/* Client Name */}
              <div>
                <p className="text-sm text-gray-800 font-medium">
                  Client Name:{" "}
                  <span className="font-normal">
                    {editBookingData?.client?.clientName || "-"}
                  </span>
                </p>
              </div>

              {/* Adults & Children Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <p className="text-sm text-gray-800 font-medium">
                  No. of Adults:{" "}
                  <span className="font-normal">
                    {editBookingData?.numberOfAdults ?? "-"}
                  </span>
                </p>
                <p className="text-sm text-gray-800 font-medium">
                  Children (5–11 yrs):{" "}
                  <span className="font-normal">
                    {editBookingData?.numberOfChildren5To11 ?? "-"}
                  </span>
                </p>
                <p className="text-sm text-gray-800 font-medium">
                  Children (under 5 yrs):{" "}
                  <span className="font-normal">
                    {editBookingData?.numberOfChildrenUnder5 ?? "-"}
                  </span>
                </p>
              </div>

              {/* Booking Info Heading */}
              <CardTitle className="text-sm font-semibold text-gray-800 dark:text-gray-200 mb-4">
                Client Booking Details
              </CardTitle>

              {/* Booking Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <p className="text-sm text-gray-800 font-medium">
                  Booking No:{" "}
                  <span className="font-normal">
                    {editBookingData?.bookingNumber || "-"}
                  </span>
                </p>
                <p className="text-sm text-gray-800 font-medium">
                  Booking Date:{" "}
                  <span className="font-normal">
                    {new Date(
                      editBookingData?.bookingDate
                    ).toLocaleDateString() || "-"}
                  </span>
                </p>
                <p className="text-sm text-gray-800 font-medium">
                  Journey Date:{" "}
                  <span className="font-normal">
                    {new Date(
                      editBookingData?.journeyDate
                    ).toLocaleDateString() || "-"}
                  </span>
                </p>
                <p className="text-sm text-gray-800 font-medium">
                  Branch:{" "}
                  <span className="font-normal">
                    {editBookingData?.branchId ?? "-"}
                  </span>
                </p>
              </div>

              {/* Tour and Booking Detail */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <p className="text-sm text-gray-800 font-medium">
                  Tour Name:{" "}
                  <span className="font-normal">
                    {editBookingData?.tour?.tourTitle ?? "-"}
                  </span>
                </p>
                <p className="text-sm text-gray-800 font-medium">
                  Booking Detail:{" "}
                  <span className="font-normal">
                    {editBookingData?.bookingDetail || "-"}
                  </span>
                </p>
              </div>
            </div>

            {/* --- Tabs Start --- */}
            <div className="w-full">
              <Tabs defaultValue="account" className="w-full">
                <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto mb-4">
                  <TabsTrigger value="account">Account</TabsTrigger>
                  <TabsTrigger value="password">Password</TabsTrigger>
                  <TabsTrigger value="JourneyBooking">
                    Journey Booking
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="account">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Account</CardTitle>
                      <CardDescription className="text-xs">
                        Make changes to your account here. Click save when
                        you're done.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="space-y-1">
                        <Label htmlFor="name">Name</Label>
                        <Input id="name" defaultValue="Pedro Duarte" />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="username">Username</Label>
                        <Input id="username" defaultValue="@peduarte" />
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button>Save changes</Button>
                    </CardFooter>
                  </Card>
                </TabsContent>

                <TabsContent value="password">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Password</CardTitle>
                      <CardDescription className="text-xs">
                        Change your password here. After saving, you'll be
                        logged out.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="space-y-1">
                        <Label htmlFor="current">Current password</Label>
                        <Input id="current" type="password" />
                      </div>
                      <div className="space-y-1">
                        <Label htmlFor="new">New password</Label>
                        <Input id="new" type="password" />
                      </div>
                    </CardContent>
                    <CardFooter>
                      <Button>Save password</Button>
                    </CardFooter>
                  </Card>
                </TabsContent>

                <TabsContent value="JourneyBooking">
                  <JourneyBookingList bookingId={id} />
                </TabsContent>
              </Tabs>
            </div>
            {/* --- Tabs End --- */}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default BookingDetails;
