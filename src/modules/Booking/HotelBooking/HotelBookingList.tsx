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
import { Loader, Edit, Trash2, PlusCircle, ExternalLink } from "lucide-react";
import ConfirmDialog from "@/components/common/confirm-dialog";
import { cn } from "@/lib/utils";

const th =
  "h-7 px-2 text-[11px] font-semibold uppercase tracking-wide text-slate-700 bg-slate-100 border-b border-slate-200";
const td = "py-1.5 px-2 text-xs text-slate-800 border-b border-slate-100 align-middle";

const openVoucher = async (hotelId: number) => {
  try {
    const response = await get(
      `/hotel-bookings/${hotelId}/voucher`,
      undefined,
      { responseType: "blob" }
    );
    const blob = new Blob([response.data], { type: "application/pdf" });
    const url = window.URL.createObjectURL(blob);
    const win = window.open(url, "_blank");
    if (!win) toast.error("Pop-up blocked. Allow pop-ups to view the PDF.");
    setTimeout(() => window.URL.revokeObjectURL(url), 120_000);
  } catch {
    toast.error("Failed to open hotel voucher");
  }
};

const HotelBookingList = ({ bookingId }) => {
  const queryClient = useQueryClient();
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [hotelBookingToDelete, setHotelBookingToDelete] = useState<
    number | null
  >(null);
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["hotel-bookings", bookingId],
    queryFn: async () => get(`/hotel-bookings/booking/${bookingId}`),
  });

  const hotelBookings = data?.hotelBookings || [];

  const deleteMutation = useMutation({
    mutationFn: (id: number) => del(`/hotel-bookings/${id}`),
    onSuccess: () => {
      toast.success("Hotel Booking deleted successfully");
      queryClient.invalidateQueries(["hotel-bookings"]);
    },
    onError: (error: any) => {
      toast.error(error?.message || "Failed to delete Hotel Booking");
    },
  });

  const handleDelete = () => {
    if (hotelBookingToDelete) {
      deleteMutation.mutate(hotelBookingToDelete);
      setShowConfirmation(false);
      setHotelBookingToDelete(null);
    }
  };

  return (
    <div className="rounded border border-slate-200 bg-white shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 bg-slate-100 border-b border-slate-200">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-700">
          Hotel Booking
        </h3>
        <Button
          size="sm"
          className="h-7 text-xs px-2"
          onClick={() =>
            navigate(`/bookings/${bookingId}/hotelBooking/create`)
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
          Failed to load hotel booking details.
        </div>
      ) : hotelBookings.length > 0 ? (
        <div className="overflow-x-auto">
          <Table className="w-full table-fixed">
            <TableHeader>
              <TableRow className="hover:bg-transparent border-0">
                <TableHead className={cn(th, "w-[18%]")}>Hotel</TableHead>
                <TableHead className={cn(th, "w-[12%]")}>City</TableHead>
                <TableHead className={cn(th, "w-[22%]")}>
                  Check In – Out
                </TableHead>
                <TableHead className={cn(th, "w-[8%] text-center")}>
                  Nights
                </TableHead>
                <TableHead className={cn(th, "w-[14%]")}>Plan</TableHead>
                <TableHead className={cn(th, "w-[14%]")}>
                  Accommodation
                </TableHead>
                <TableHead className={cn(th, "w-[12%] text-right")}>
                  Actions
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {hotelBookings.map((hotel, idx) => (
                <TableRow
                  key={hotel.id}
                  className={cn(
                    "hover:bg-slate-50/80 border-0",
                    idx % 2 === 0 ? "bg-white" : "bg-slate-50/60"
                  )}
                >
                  <TableCell className={cn(td, "break-words")}>
                    {hotel?.hotel?.hotelName || "—"}
                  </TableCell>
                  <TableCell className={td}>
                    {hotel?.city?.cityName || "—"}
                  </TableCell>
                  <TableCell className={td}>
                    {hotel.checkInDate
                      ? dayjs(hotel.checkInDate).format("DD/MM/YYYY")
                      : "—"}
                    <span className="text-slate-400 mx-1">→</span>
                    {hotel.checkOutDate
                      ? dayjs(hotel.checkOutDate).format("DD/MM/YYYY")
                      : "—"}
                  </TableCell>
                  <TableCell className={cn(td, "text-center tabular-nums")}>
                    {hotel?.nights ?? "—"}
                  </TableCell>
                  <TableCell className={cn(td, "truncate")} title={hotel?.plan}>
                    {hotel?.plan || "—"}
                  </TableCell>
                  <TableCell className={cn(td, "break-words")}>
                    {hotel?.accommodation?.accommodationName || "—"}
                  </TableCell>
                  <TableCell className={cn(td, "text-right")}>
                    <div className="inline-flex gap-1 justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 px-1.5 text-[10px]"
                        title="Hotel Voucher"
                        onClick={() => openVoucher(hotel.id)}
                      >
                        <ExternalLink size={11} className="mr-0.5" />
                        Voucher
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() =>
                          navigate(
                            `/bookings/${bookingId}/hotelBooking/${hotel.id}/edit`
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
                          setHotelBookingToDelete(hotel.id);
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
          No hotel booking found.
        </div>
      )}

      <ConfirmDialog
        isOpen={showConfirmation}
        title="Confirm Deletion"
        description="Are you sure you want to delete this hotel booking? This action cannot be undone."
        onCancel={() => {
          setShowConfirmation(false);
          setHotelBookingToDelete(null);
        }}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default HotelBookingList;
