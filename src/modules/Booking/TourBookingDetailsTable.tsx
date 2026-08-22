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
import { cn } from "@/lib/utils";

const th =
  "h-7 px-2 text-[11px] font-semibold uppercase tracking-wide text-slate-700 bg-slate-100 border-b border-slate-200";
const td =
  "py-1 px-2 text-xs text-slate-800 border-b border-slate-100 align-top";

const Field = ({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) => (
  <div className="grid grid-cols-[110px_1fr] gap-x-2 items-start min-h-[22px] px-2 py-1 border-b border-slate-100 last:border-0">
    <span className="text-[11px] font-medium text-slate-500">{label}</span>
    <span className="text-xs text-slate-800 break-words">{value ?? "—"}</span>
  </div>
);

const TourBookingDetailsTable = ({
  editBookingLoading,
  isEditBookingError,
  editBookingData,
}) => {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Client Details */}
        <div className="rounded border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-3 py-1.5 bg-slate-100 border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-700">
            Client Details
          </div>
          <div className="bg-white">
            <Field
              label="Client Name"
              value={editBookingData?.client?.clientName}
            />
            <Field
              label="No. of Adults"
              value={editBookingData?.numberOfAdults}
            />
            <Field
              label="Children 5–11"
              value={editBookingData?.numberOfChildren5To11}
            />
            <Field
              label="Children under 5"
              value={editBookingData?.numberOfChildrenUnder5}
            />
          </div>
        </div>

        {/* Client Booking Details */}
        <div className="rounded border border-slate-200 bg-white shadow-sm overflow-hidden">
          <div className="px-3 py-1.5 bg-slate-100 border-b border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-700">
            Client Booking Details
          </div>
          <div className="bg-white">
            <Field
              label="Booking No"
              value={editBookingData?.bookingNumber}
            />
            <Field
              label="Booking Date"
              value={
                editBookingData?.bookingDate
                  ? dayjs(editBookingData.bookingDate).format(
                      "DD/MM/YYYY HH:mm"
                    )
                  : null
              }
            />
            <Field
              label="Journey Date"
              value={
                editBookingData?.journeyDate
                  ? dayjs(editBookingData.journeyDate).format("DD/MM/YYYY")
                  : null
              }
            />
            <Field
              label="Branch"
              value={editBookingData?.branch?.branchName}
            />
            <Field
              label="Tour Name"
              value={editBookingData?.tour?.tourTitle}
            />
            <Field
              label="Booking Detail"
              value={editBookingData?.bookingDetail}
            />
            <Field
              label="Package"
              value={(() => {
                const parts: string[] = [];
                if (editBookingData?.isJourney) parts.push("Journey");
                if (editBookingData?.isHotel) parts.push("Hotel");
                if (editBookingData?.isVehicle) parts.push("Vehicle");
                if (editBookingData?.isPackage) parts.push("Full Package");
                return parts.length > 0 ? parts.join(", ") : "—";
              })()}
            />
          </div>
        </div>
      </div>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem
          value="item-1"
          className="rounded border border-slate-200 bg-white shadow-sm overflow-hidden border-b-0"
        >
          <AccordionTrigger className="px-3 py-1.5 bg-slate-100 text-xs font-semibold uppercase tracking-wide text-slate-700 hover:no-underline">
            Tour Booking Details
          </AccordionTrigger>
          <AccordionContent className="pb-0">
            {editBookingLoading ? (
              <div className="flex justify-center items-center h-20">
                <Loader className="h-5 w-5 animate-spin text-slate-500" />
              </div>
            ) : isEditBookingError ? (
              <div className="text-center text-xs text-red-500 py-4">
                Failed to load booking.
              </div>
            ) : editBookingData?.bookingDetails?.length > 0 ? (
              <div className="overflow-x-auto">
                <Table className="w-full">
                  <TableHeader>
                    <TableRow className="hover:bg-transparent border-0">
                      <TableHead className={cn(th, "w-14")}>Day</TableHead>
                      <TableHead className={cn(th, "w-24")}>Date</TableHead>
                      <TableHead className={th}>Description</TableHead>
                      <TableHead className={cn(th, "w-28")}>Night Halt</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {editBookingData?.bookingDetails?.map((booking, idx) => (
                      <TableRow
                        key={booking.id}
                        className={cn(
                          "hover:bg-slate-50/80 border-0",
                          idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"
                        )}
                      >
                        <TableCell className={cn(td, "tabular-nums")}>
                          {booking.day}
                        </TableCell>
                        <TableCell className={td}>
                          {booking.date
                            ? dayjs(booking.date).format("DD/MM/YYYY")
                            : "—"}
                        </TableCell>
                        <TableCell className={cn(td, "whitespace-pre-wrap")}>
                          {booking.description}
                        </TableCell>
                        <TableCell className={td}>
                          {booking?.city?.cityName || "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center text-xs text-slate-500 py-4">
                No booking details found.
              </div>
            )}
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default TourBookingDetailsTable;
