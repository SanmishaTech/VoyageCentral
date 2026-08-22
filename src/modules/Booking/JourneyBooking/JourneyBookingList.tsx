import React, { useState } from "react";
import { Button } from "@/components/ui";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, del } from "@/services/apiService";
import { toast } from "sonner";
import { Loader, Edit, Trash2, PlusCircle } from "lucide-react";
import ConfirmDialog from "@/components/common/confirm-dialog";
import { cn } from "@/lib/utils";

const th =
  "h-7 px-2 text-[11px] font-semibold uppercase tracking-wide text-slate-700 bg-slate-100 border-b border-slate-200";
const td = "py-1.5 px-2 text-xs text-slate-800 border-b border-slate-100 align-middle";

const JourneyBookingList = ({ bookingId }) => {
  const queryClient = useQueryClient();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [journeyBookingToDelete, setJourneyBookingToDelete] = useState<
    number | null
  >(null);
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["journey-bookings", bookingId],
    queryFn: async () => get(`/journey-bookings/booking/${bookingId}`),
  });

  const journeyBookings = data?.journeyBookings || [];

  const deleteMutation = useMutation({
    mutationFn: (id: number) => del(`/journey-bookings/${id}`),
    onSuccess: () => {
      toast.success("Journey Booking deleted successfully");
      queryClient.invalidateQueries(["journey-bookings"]);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete Journey Booking");
    },
  });

  const handleDelete = () => {
    if (journeyBookingToDelete) {
      deleteMutation.mutate(journeyBookingToDelete);
      setShowConfirmation(false);
      setJourneyBookingToDelete(null);
    }
  };

  return (
    <div className="rounded border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-slate-100 border-b border-slate-200">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-700">
          Journey Booking
        </h3>
        <Button
          size="sm"
          className="h-7 text-xs px-2"
          onClick={() =>
            navigate(`/bookings/${bookingId}/journeyBooking/create`)
          }
        >
          <PlusCircle className="mr-1 h-3.5 w-3.5" />
          Add
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-24">
          <Loader className="h-5 w-5 animate-spin text-slate-500" />
        </div>
      ) : isError ? (
        <div className="text-center text-xs text-red-500 py-6">
          Failed to load journey booking details.
        </div>
      ) : journeyBookings.length > 0 ? (
        <div className="overflow-x-auto">
          <Table className="w-full table-fixed">
            <TableHeader>
              <TableRow className="hover:bg-transparent border-0">
                <TableHead className={cn(th, "w-[22%]")}>From – To</TableHead>
                <TableHead className={cn(th, "w-[10%]")}>Mode</TableHead>
                <TableHead className={cn(th, "w-[18%]")}>From Place</TableHead>
                <TableHead className={cn(th, "w-[18%]")}>To Place</TableHead>
                <TableHead className={cn(th, "w-[14%]")}>PNR No.</TableHead>
                <TableHead className={cn(th, "w-[18%] text-right")}>
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {journeyBookings.map((journey, idx) => (
                <TableRow
                  key={journey.id}
                  className={cn(
                    "hover:bg-slate-50/80 border-0",
                    idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"
                  )}
                >
                  <TableCell className={td}>
                    <div className="leading-tight">
                      {journey.fromDepartureDate
                        ? dayjs(journey.fromDepartureDate).format(
                            "DD/MM/YYYY HH:mm"
                          )
                        : "—"}
                      <span className="text-slate-400 mx-1">→</span>
                      {journey.toArrivalDate
                        ? dayjs(journey.toArrivalDate).format(
                            "DD/MM/YYYY HH:mm"
                          )
                        : "—"}
                    </div>
                  </TableCell>
                  <TableCell className={td}>{journey.mode || "—"}</TableCell>
                  <TableCell className={cn(td, "break-words")}>
                    {journey.fromPlace || "—"}
                  </TableCell>
                  <TableCell className={cn(td, "break-words")}>
                    {journey.toPlace || "—"}
                  </TableCell>
                  <TableCell className={td}>
                    {journey.pnrNumber || "—"}
                  </TableCell>
                  <TableCell className={cn(td, "text-right")}>
                    <div className="inline-flex gap-1 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() =>
                          navigate(
                            `/bookings/${bookingId}/journeyBooking/${journey.id}/edit`
                          )
                        }
                      >
                        <Edit size={12} />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => {
                          setJourneyBookingToDelete(journey.id);
                          setShowConfirmation(true);
                        }}
                      >
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="text-center text-xs text-slate-500 py-6">
          No journey booking found.
        </div>
      )}

      <ConfirmDialog
        isOpen={showConfirmation}
        title="Confirm Deletion"
        description="Are you sure you want to delete this journey booking? This action cannot be undone."
        onCancel={() => {
          setShowConfirmation(false);
          setJourneyBookingToDelete(null);
        }}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default JourneyBookingList;
