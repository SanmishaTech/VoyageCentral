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
import BookingCosting from "./BookingCosting";
import EnquiryCosting from "./EnquiryCosting";
const BookingDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: editBookingData,
    isLoading: editBookingLoading,
    isError: isEditBookingError,
  } = useQuery({
    queryKey: ["editBooking", id],
    queryFn: async () => {
      const response = await get(`/bookings/${id}`);
      return response; // API returns the sector object directly
    },
  });

  // Old TourPro: package unlocks journey/hotel/vehicle tabs
  const showJourney =
    Boolean(editBookingData?.isJourney) || Boolean(editBookingData?.isPackage);
  const showHotel =
    Boolean(editBookingData?.isHotel) || Boolean(editBookingData?.isPackage);
  const showVehicle =
    Boolean(editBookingData?.isVehicle) || Boolean(editBookingData?.isPackage);

  const defaultTab = showJourney
    ? "JourneyBooking"
    : showHotel
      ? "HotelBooking"
      : showVehicle
        ? "VehicleBooking"
        : "ServiceBooking";

  return (
    <>
      <div className="mt-2 p-3 md:p-4 bg-slate-50 min-h-screen">
        <h1 className="text-lg font-semibold mb-3 text-slate-800">
          Booking Details
        </h1>

        <Card className="mx-auto border-slate-200 shadow-sm bg-white">
          <CardContent className="pt-4 space-y-4 text-sm">
            {/* start */}
            <TourBookingDetailsTable
              editBookingLoading={editBookingLoading}
              isEditBookingError={isEditBookingError}
              editBookingData={editBookingData}
            />
            {/* end */}
            {/* --- Tabs Start --- */}
            <div className="mt-3 w-full">
              <Tabs
                key={defaultTab}
                defaultValue={defaultTab}
                className="w-full"
              >
                <TabsList className="grid grid-cols-1 md:grid-cols-7 w-full mb-24 md:mb-3 h-auto gap-1 bg-slate-100 p-1">
                  {showJourney ? (
                    <TabsTrigger
                      value="JourneyBooking"
                      className="px-2 py-1.5 text-xs rounded-md data-[state=active]:bg-[#2a2f68] data-[state=active]:text-white"
                    >
                      Journey Booking
                    </TabsTrigger>
                  ) : null}
                  {showHotel ? (
                    <TabsTrigger
                      value="HotelBooking"
                      className="px-2 py-1.5 text-xs rounded-md data-[state=active]:bg-[#2a2f68] data-[state=active]:text-white"
                    >
                      Hotel Booking
                    </TabsTrigger>
                  ) : null}
                  {showVehicle ? (
                    <TabsTrigger
                      value="VehicleBooking"
                      className="px-2 py-1.5 text-xs rounded-md data-[state=active]:bg-[#2a2e5d] data-[state=active]:text-white"
                    >
                      Vehicle Booking
                    </TabsTrigger>
                  ) : null}
                  <TabsTrigger
                    value="ServiceBooking"
                    className="px-2 py-1.5 text-xs rounded-md data-[state=active]:bg-[#2a2f68] data-[state=active]:text-white"
                  >
                    Service Booking
                  </TabsTrigger>

                  <TabsTrigger
                    value="TourMembers"
                    className="px-2 py-1.5 text-xs rounded-md data-[state=active]:bg-[#2a2f68] data-[state=active]:text-white"
                  >
                    Tour Members
                  </TabsTrigger>
                  <TabsTrigger
                    value="TravelDocument"
                    className="px-2 py-1.5 text-xs rounded-md data-[state=active]:bg-[#2a2f68] data-[state=active]:text-white"
                  >
                    Travel Documents
                  </TabsTrigger>
                  <TabsTrigger
                    value="BookingReceipt"
                    className="px-2 py-1.5 text-xs rounded-md data-[state=active]:bg-[#2a2f68] data-[state=active]:text-white"
                  >
                    Booking Receipt
                  </TabsTrigger>
                </TabsList>

                {showJourney ? (
                  <TabsContent value="JourneyBooking">
                    <JourneyBookingList bookingId={id} />
                  </TabsContent>
                ) : null}
                {showHotel ? (
                  <TabsContent value="HotelBooking">
                    <HotelBookingList bookingId={id} />
                  </TabsContent>
                ) : null}
                {showVehicle ? (
                  <TabsContent value="VehicleBooking">
                    <VehicleBookingList bookingId={id} />
                  </TabsContent>
                ) : null}
                <TabsContent value="ServiceBooking">
                  <ServiceBookingList bookingId={id} />
                </TabsContent>
                <TabsContent value="TourMembers">
                  <TourMemberList bookingId={id} />
                </TabsContent>
                <TabsContent value="TravelDocument">
                  <TravelDocumentList bookingId={id} />
                </TabsContent>
                <TabsContent value="BookingReceipt">
                  <BookingReceiptList bookingId={id} />
                </TabsContent>
              </Tabs>
            </div>
            {/* --- Tabs End --- */}

            {/* Package Costing + Total Costing / Enquiry Costing */}
            {editBookingData?.bookingType === "Enquiry" ? (
              <EnquiryCosting bookingId={id} />
            ) : (
              <BookingCosting bookingId={id} />
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default BookingDetails;
