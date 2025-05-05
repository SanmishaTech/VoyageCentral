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

const JourneyBookingList = ({ bookingId }) => {
  const queryClient = useQueryClient();
  const [showConfirmation, setShowConfirmation] = useState(false); // State to show/hide confirmation dialog
  const [journeyBookingToDelete, setJourneyBookingToDelete] = useState<
    number | null
  >(null); //
  //  Track the user ID to delete
  const navigate = useNavigate();

  const fetchJourneyBookings = async () => {
    const response = await get(`/journey-bookings/booking/${bookingId}`);
    return response;
  };

  // Fetch users using react-query
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["journey-bookings"],
    queryFn: () => fetchJourneyBookings(),
  });

  const journeyBookings = data?.journeyBookings || [];

  // Mutation for deleting a user
  const deleteMutation = useMutation({
    mutationFn: (id: number) => del(`/journey-bookings/${id}`),
    onSuccess: () => {
      toast.success("Journey Booking deleted successfully");
      queryClient.invalidateQueries(["journey-bookings"]);
    },
    onError: () => {
      toast.error("Failed to delete Journey Booking");
    },
  });

  const confirmDelete = (id: number) => {
    setJourneyBookingToDelete(id);
    setShowConfirmation(true);
  };

  const handleDelete = () => {
    if (journeyBookingToDelete) {
      deleteMutation.mutate(journeyBookingToDelete);
      setShowConfirmation(false);
      setJourneyBookingToDelete(null);
    }
  };

  return (
    <div className="mt-2 ">
      <div className="mx-auto ">
        <div className="mb-1 w-full flex flex-wrap justify-end items-center gap-2">
          <Button className="bg-primary hover:bg-primary/90 text-white shadow-sm transition-all duration-200 hover:shadow-md">
            <PlusCircle className="mr-2 h-5 w-5" />
            Add Airline
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
              Failed to load journey booking details.
            </div>
          ) : journeyBookings.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer">
                      <div className="flex items-center">
                        <span>Mode</span>
                      </div>
                    </TableHead>

                    <TableHead className="cursor-pointer">
                      <div className="flex items-center">
                        <span>From Place</span>
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer">
                      <div className="flex items-center">
                        <span>To Place</span>
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer">
                      <div className="flex items-center">
                        <span>PNR No.</span>
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {journeyBookings.map((journey) => (
                    <TableRow key={journey.id}>
                      <TableCell>{journey.mode}</TableCell>
                      <TableCell>{journey.fromPlace || "N/A"}</TableCell>
                      <TableCell>{journey.toPlace || "N/A"}</TableCell>
                      <TableCell>{journey.pnrNumber || "N/A"}</TableCell>
                      <TableCell className="">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              navigate(`/journeyBookings/${journey.id}/edit`)
                            }
                          >
                            <Edit size={16} />
                          </Button>

                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => confirmDelete(journey.id)}
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
            <div className="text-center">No Journey booking Found.</div>
          )}
        </div>
      </div>

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
