import React, { useState, useEffect } from "react";
import { Button, Input } from "@/components/ui";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import MultipleSelector, {
  Option,
} from "@/components/common/multiple-selector"; // Import MultipleSelector from common folder
import { Card, CardContent } from "@/components/ui/card";
import dayjs from "dayjs";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, del, patch } from "@/services/apiService";
import { toast } from "sonner";
import { Separator } from "@/components/ui/separator";
import CustomPagination from "@/components/common/custom-pagination";
import {
  Loader,
  ChevronUp,
  ChevronDown,
  Edit,
  Trash2,
  Filter,
  Download,
  ShieldEllipsis,
  Search,
  PlusCircle,
  MoreHorizontal,
  CheckCircle,
  XCircle,
} from "lucide-react";
import ConfirmDialog from "@/components/common/confirm-dialog";
import { saveAs } from "file-saver";
import { Badge } from "@/components/ui/badge"; // Ensure Badge is imported
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuGroup,
} from "@/components/ui/dropdown-menu";

const HotelBookingList = ({ bookingId }) => {
  const queryClient = useQueryClient();
  const [showConfirmation, setShowConfirmation] = useState(false); // State to show/hide confirmation dialog
  const [hotelBookingToDelete, setHotelBookingToDelete] = useState<
    number | null
  >(null); //
  //  Track the user ID to delete
  const navigate = useNavigate();

  const fetchJourneyBookings = async () => {
    const response = await get(`/hotel-bookings/booking/${bookingId}`);
    return response;
  };

  // Fetch users using react-query
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["hotel-bookings", bookingId],
    queryFn: () => fetchJourneyBookings(),
  });

  const hotelBookings = data?.hotelBookings || [];

  // Mutation for deleting a user
  const deleteMutation = useMutation({
    mutationFn: (id: number) => del(`/hotel-bookings/${id}`),
    onSuccess: () => {
      toast.success("Journey Booking deleted successfully");
      queryClient.invalidateQueries(["hotel-bookings"]);
    },
    onError: (error) => {
      if (error?.message) {
        toast.error(error.message);
      } else {
        toast.error("Failed to delete Hotel Booking");
      }
    },
  });

  const confirmDelete = (id: number) => {
    setHotelBookingToDelete(id);
    setShowConfirmation(true);
  };

  const handleDelete = () => {
    if (hotelBookingToDelete) {
      deleteMutation.mutate(hotelBookingToDelete);
      setShowConfirmation(false);
      setHotelBookingToDelete(null);
    }
  };

  return (
    <div className="mt-2 ">
      <div className="mx-auto ">
        <div className="mb-1 w-full flex flex-wrap justify-between items-center gap-2">
          <div className="text-xl font-bold text-gray-800 tracking-wide  dark:text-white ">
            Hotel Booking
          </div>

          <Button
            onClick={() =>
              navigate(`/bookings/${bookingId}/hotelBooking/create`)
            }
            className="bg-primary text-xs hover:bg-primary/90 text-white shadow-sm transition-all duration-200 hover:shadow-md"
          >
            <PlusCircle className="mr-2 h-5 w-5" />
            Add Hotel Booking
          </Button>
        </div>

        <div>
          {/* Table Section */}
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <Loader className="mr-2 h-8 w-8 animate-spin" />
            </div>
          ) : isError ? (
            <div className="text-center text-red-500">
              Failed to load hotel booking details.
            </div>
          ) : hotelBookings.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer">
                      <div className="flex items-center">
                        <span>Hotel</span>
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer">
                      <div className="flex items-center">
                        <span>City</span>
                      </div>
                    </TableHead>

                    <TableHead className="cursor-pointer">
                      <div className="flex items-center">
                        <span>Check In - Check Out</span>
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer">
                      <div className="flex items-center">
                        <span>Nights</span>
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer">
                      <div className="flex items-center">
                        <span>Plan</span>
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer">
                      <div className="flex items-center">
                        <span>Accommodation</span>
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer text-right">
                      <span>Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {hotelBookings.map((hotel) => (
                    <TableRow key={hotel.id}>
                      <TableCell className="max-w-[100px] px-1 whitespace-normal break-words">
                        {hotel?.hotel?.hotelName}
                      </TableCell>
                      <TableCell className="max-w-[100px] px-1 whitespace-normal break-words">
                        {hotel?.city?.cityName || "N/A"}
                      </TableCell>
                      <TableCell>
                        {" "}
                        {hotel.checkInDate
                          ? dayjs(hotel.checkInDate).format("DD/MM/YYYY")
                          : "N/A"}{" "}
                        To{" "}
                        {hotel.checkOutDate
                          ? dayjs(hotel.checkOutDate).format("DD/MM/YYYY")
                          : "N/A"}
                      </TableCell>
                      <TableCell>{hotel?.nights}</TableCell>
                      <TableCell>{hotel?.plan}</TableCell>

                      <TableCell className="max-w-[100px] px-1 whitespace-normal break-words">
                        {hotel?.accommodation?.accommodationName || "N/A"}
                      </TableCell>
                      <TableCell className="w-20">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              navigate(
                                `/bookings/${bookingId}/hotelBooking/${hotel.id}/edit`
                              )
                            }
                          >
                            <Edit size={16} />
                          </Button>

                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => confirmDelete(hotel.id)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center">No Hotel booking Found.</div>
          )}
        </div>
      </div>

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
