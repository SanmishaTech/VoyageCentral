import React, { useEffect, useState } from "react";
import {
  useForm,
  SubmitHandler,
  Controller,
  useFieldArray,
} from "react-hook-form";
import dayjs from "dayjs";
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
import HotelBookingList from "./HotelBooking/HotelBookingList";
import ServiceBookingList from "./ServiceBooking/ServiceBookingList";
import { Separator } from "@radix-ui/react-separator";
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
          <CardContent className="pt-6 space-y-8">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Client Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-sm text-gray-800 dark:text-gray-300">
                  <span className="font-medium">Client Name:</span>{" "}
                  {editBookingData?.client?.clientName || "N/A"}
                </div>
                <div className="text-sm text-gray-800 dark:text-gray-300">
                  <span className="font-medium">No. of Adults:</span>{" "}
                  {editBookingData?.numberOfAdults ?? "N/A"}
                </div>
                <div className="text-sm text-gray-800 dark:text-gray-300">
                  <span className="font-medium">Children (5–11 yrs):</span>{" "}
                  {editBookingData?.numberOfChildren5To11 ?? "N/A"}
                </div>
                <div className="text-sm text-gray-800 dark:text-gray-300">
                  <span className="font-medium">Children (under 5 yrs):</span>{" "}
                  {editBookingData?.numberOfChildrenUnder5 ?? "N/A"}
                </div>
              </div>
            </div>

            {/* Booking Details */}
            <div>
              <h2 className="text-lg  font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Client Booking Details
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="text-sm text-gray-800 dark:text-gray-300">
                  <span className="font-medium">Booking No:</span>{" "}
                  {editBookingData?.bookingNumber || "N/A"}
                </div>
                <div className="text-sm text-gray-800 dark:text-gray-300">
                  <span className="font-medium">Booking Date:</span>{" "}
                  {editBookingData?.bookingDate
                    ? dayjs(editBookingData.bookingDate).format(
                        "DD/MM/YYYY hh:mm A"
                      )
                    : "N/A"}
                </div>
                <div className="text-sm text-gray-800 dark:text-gray-300">
                  <span className="font-medium">Journey Date:</span>{" "}
                  {editBookingData?.journeyDate
                    ? dayjs(editBookingData.journeyDate).format("DD/MM/YYYY")
                    : "N/A"}
                </div>
                <div className="text-sm text-gray-800 dark:text-gray-300">
                  <span className="font-medium">Branch:</span>{" "}
                  {editBookingData?.branchId ?? "N/A"}
                </div>
                <div className="text-sm text-gray-800 dark:text-gray-300">
                  <span className="font-medium">Tour Name:</span>{" "}
                  {editBookingData?.tour?.tourTitle ?? "N/A"}
                </div>
                <div className="text-sm text-gray-800 dark:text-gray-300">
                  <span className="font-medium">Booking Detail:</span>{" "}
                  {editBookingData?.bookingDetail || "N/A"}
                </div>
              </div>
            </div>
            {/* --- Tabs Start --- */}
            <div className=" mt-5 w-full">
              <Tabs defaultValue="JourneyBooking" className="w-full">
                <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto mb-4">
                  <TabsTrigger value="JourneyBooking">
                    Journey Booking
                  </TabsTrigger>
                  <TabsTrigger value="HotelBooking">Hotel Booking</TabsTrigger>
                  <TabsTrigger value="ServiceBooking">
                    Service Booking
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="JourneyBooking">
                  <JourneyBookingList bookingId={id} />
                </TabsContent>
                <TabsContent value="HotelBooking">
                  <HotelBookingList bookingId={id} />
                </TabsContent>
                <TabsContent value="ServiceBooking">
                  <ServiceBookingList bookingId={id} />
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
