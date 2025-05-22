import React from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Loader } from "lucide-react";
import dayjs from "dayjs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

const TourBookingDetailsTable = ({
  editBookingLoading,
  isEditBookingError,
  editBookingData,
}) => {
  return (
    <div>
      <div className="mb-7">
        <h2 className="text-lg mb-1 font-semibold text-gray-900 dark:text-gray-100">
          Client Details
        </h2>
        <Separator className="mb-4" />

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
      <div className="mb-7">
        <h2 className="text-lg  font-semibold text-gray-900 dark:text-gray-100 mb-1">
          Client Booking Details
        </h2>
        <Separator className="mb-4" />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="text-sm text-gray-800 dark:text-gray-300">
            <span className="font-medium">Booking No:</span>{" "}
            {editBookingData?.bookingNumber || "N/A"}
          </div>
          <div className="text-sm text-gray-800 dark:text-gray-300">
            <span className="font-medium">Booking Date:</span>{" "}
            {editBookingData?.bookingDate
              ? dayjs(editBookingData.bookingDate).format("DD/MM/YYYY hh:mm A")
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
            {editBookingData?.branch?.branchName ?? "N/A"}
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
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger className="bg-slate-100 p-2 border">
            Tour Booking Details
          </AccordionTrigger>
          <AccordionContent>
            {editBookingLoading ? (
              <div className="flex justify-center items-center h-32">
                <Loader className="mr-2 h-8 w-8 animate-spin" />
              </div>
            ) : isEditBookingError ? (
              <div className="text-center text-red-500">
                Failed to load booking.
              </div>
            ) : editBookingData?.bookingDetails?.length > 0 ? (
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
                    {editBookingData?.bookingDetails?.map((booking) => (
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
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center">No Booking Details Found.</div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default TourBookingDetailsTable;
