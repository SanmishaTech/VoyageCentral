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

  return (
    <>
      <div className="mt-2 p-6">
        <h1 className="text-2xl font-bold mb-6">Booking Details</h1>

        <Card className="mx-auto mt-10">
          <CardContent className="pt-6 space-y-8">
            {/* start */}
            <TourBookingDetailsTable
              editBookingLoading={editBookingLoading}
              isEditBookingError={isEditBookingError}
              editBookingData={editBookingData}
            />
            {/* end */}
            {/* --- Tabs Start --- */}
            <div className=" mt-5 w-full">
              <Tabs defaultValue="JourneyBooking" className="w-full">
                <TabsList className="grid grid-cols-1 md:grid-cols-3 w-full max-w-md mx-auto mb-16 md:mb-4">
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
