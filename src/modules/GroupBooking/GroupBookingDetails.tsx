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
import GroupClientBookingList from "./GroupClientBooking/GroupClientBookingList";
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
  Loader,
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import TourBookingDetailsTable from "./TourBookingDetailsTable";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import JourneyBookingList from "./JourneyBooking/JourneyBookingList";
import HotelBookingList from "./HotelBooking/HotelBookingList";
import ServiceBookingList from "./ServiceBooking/ServiceBookingList";
import { Separator } from "@radix-ui/react-separator";
import VehicleBookingList from "./VehicleBooking/VehicleBookingList";
import TravelDocumentList from "./TravelDocument/TravelDocumentList";
import BookingReceiptList from "./BookingReceipt/BookingReceiptList";
import TourMemberList from "./TourMembers/TourMemberList";
const GroupBookingDetails = () => {
  const { groupBookingId } = useParams<{ groupBookingId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: editGroupBookingData,
    isLoading: editGroupBookingLoading,
    isError: isEditGroupBookingError,
  } = useQuery({
    queryKey: ["editGroupBooking", groupBookingId],
    queryFn: async () => {
      const response = await get(`/group-bookings/${groupBookingId}`);
      return response; // API returns the sector object directly
    },
  });

  return (
    <>
      <div className="mt-2 p-6">
        <h1 className="text-2xl font-bold mb-6">Group Tour Booking Details</h1>

        <Card className="mx-auto mt-10 ">
          <CardContent className="pt-6 space-y-8">
            {/* start */}
            <div>
              {/* tour Details */}
              <div className="mb-7">
                <h2 className="text-lg  font-semibold text-gray-900 dark:text-gray-100 mb-1">
                  Tour Details
                </h2>
                <Separator className="mb-4" />

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="text-sm text-gray-800 dark:text-gray-300">
                    <span className="font-medium">Tour Booking No:</span>{" "}
                    {editGroupBookingData?.groupBookingNumber || "N/A"}
                  </div>
                  <div className="text-sm text-gray-800 dark:text-gray-300">
                    <span className="font-medium">Booking Date:</span>{" "}
                    {editGroupBookingData?.groupBookingDate
                      ? dayjs(editGroupBookingData.groupBookingDate).format(
                          "DD/MM/YYYY"
                        )
                      : "N/A"}
                  </div>
                  <div className="text-sm text-gray-800 dark:text-gray-300">
                    <span className="font-medium">Journey Date:</span>{" "}
                    {editGroupBookingData?.journeyDate
                      ? dayjs(editGroupBookingData.journeyDate).format(
                          "DD/MM/YYYY"
                        )
                      : "N/A"}
                  </div>
                  <div className="text-sm text-gray-800 dark:text-gray-300">
                    <span className="font-medium">Branch:</span>{" "}
                    {editGroupBookingData?.branch?.branchName ?? "N/A"}
                  </div>
                  <div className="text-sm text-gray-800 dark:text-gray-300">
                    <span className="font-medium">Tour Name:</span>{" "}
                    {editGroupBookingData?.tour?.tourTitle ?? "N/A"}
                  </div>
                  <div className="text-sm text-gray-800 dark:text-gray-300">
                    <span className="font-medium">Total Adults:</span>{" "}
                    {editGroupBookingData?.totalNumberOfAdults ?? "N/A"}
                  </div>{" "}
                  <div className="text-sm text-gray-800 dark:text-gray-300">
                    <span className="font-medium">Total children 5-11:</span>{" "}
                    {editGroupBookingData?.totalNumberOfChildren5To11 ?? "N/A"}
                  </div>{" "}
                  <div className="text-sm text-gray-800 dark:text-gray-300">
                    <span className="font-medium">Tour children below 5:</span>{" "}
                    {editGroupBookingData?.totalNumberOfChildrenUnder5 ?? "N/A"}
                  </div>
                </div>
              </div>
              <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="item-1">
                  <AccordionTrigger className="bg-slate-100 dark:text-white dark:bg-gray-900 p-2 border">
                    Tour Booking Details
                  </AccordionTrigger>
                  <AccordionContent className="border rounded  p-2">
                    {editGroupBookingLoading ? (
                      <div className="flex justify-center items-center h-32">
                        <Loader className="mr-2 h-8 w-8 animate-spin" />
                      </div>
                    ) : isEditGroupBookingError ? (
                      <div className="text-center text-red-500">
                        Failed to load booking.
                      </div>
                    ) : editGroupBookingData?.groupBookingDetails?.length >
                      0 ? (
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Day</TableHead>
                              <TableHead>Date</TableHead>
                              <TableHead>Description</TableHead>
                              <TableHead>Night Halt</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {editGroupBookingData?.groupBookingDetails?.map(
                              (booking) => (
                                <TableRow className="h-15" key={booking.id}>
                                  <TableCell className="w-10 text-sm text-left align-top">
                                    {booking.day}
                                  </TableCell>
                                  <TableCell className="w-20 text-sm text-left align-top">
                                    {" "}
                                    {booking.date
                                      ? dayjs(booking.date).format("DD/MM/YYYY")
                                      : "N/A"}
                                  </TableCell>
                                  <TableCell className=" text-sm w-[375px] whitespace-normal break-words text-left align-top">
                                    {booking.description}
                                  </TableCell>
                                  <TableCell className="text-sm w-20 text-left whitespace-normal break-words align-top">
                                    {booking?.city?.cityName || "N/A"}
                                  </TableCell>
                                </TableRow>
                              )
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    ) : (
                      <div className="text-center">
                        No Group tour members Found.
                      </div>
                    )}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
            {/* end */}

            {/* tour Members start */}
            <GroupClientBookingList groupBookingId={groupBookingId} />
            {/* tour Members end */}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default GroupBookingDetails;
