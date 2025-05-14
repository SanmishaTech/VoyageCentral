import React, { useState, useEffect } from "react";
import { Button, Input } from "@/components/ui";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/formatter.js";

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

const ServiceBookingList = ({ bookingId }) => {
  const queryClient = useQueryClient();
  const [showConfirmation, setShowConfirmation] = useState(false); // State to show/hide confirmation dialog
  const [serviceBookingToDelete, setServiceBookingToDelete] = useState<
    number | null
  >(null); //
  //  Track the user ID to delete
  const navigate = useNavigate();

  const fetchServiceBookings = async () => {
    const response = await get(`/service-bookings/booking/${bookingId}`);
    return response;
  };

  // Fetch users using react-query
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["service-bookings"],
    queryFn: () => fetchServiceBookings(),
  });

  const serviceBookings = data?.serviceBookings || [];

  // Mutation for deleting a user
  const deleteMutation = useMutation({
    mutationFn: (id: number) => del(`/service-bookings/${id}`),
    onSuccess: () => {
      toast.success("Service Booking deleted successfully");
      queryClient.invalidateQueries(["service-bookings"]);
    },
    onError: () => {
      toast.error("Failed to delete Service Booking");
    },
  });

  const confirmDelete = (id: number) => {
    setServiceBookingToDelete(id);
    setShowConfirmation(true);
  };

  const handleDelete = () => {
    if (serviceBookingToDelete) {
      deleteMutation.mutate(serviceBookingToDelete);
      setShowConfirmation(false);
      setServiceBookingToDelete(null);
    }
  };

  return (
    <div className="mt-2 ">
      <div className="mx-auto ">
        <div className="mb-1 w-full flex flex-wrap justify-between items-center gap-2">
          <div className="text-xl font-bold text-gray-800 tracking-wide  dark:text-white ">
            Service Booking
          </div>

          <Button
            onClick={() =>
              navigate(`/bookings/${bookingId}/serviceBooking/create`)
            }
            className="bg-primary text-xs hover:bg-primary/90 text-white shadow-sm transition-all duration-200 hover:shadow-md"
          >
            <PlusCircle className="mr-2 h-5 w-5" />
            Add Service Booking
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
              Failed to load service booking details.
            </div>
          ) : serviceBookings.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer">
                      <div className="flex items-center">
                        <span>Description</span>
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer">
                      <div className="flex items-center">
                        <span>Cost</span>
                      </div>
                    </TableHead>

                    <TableHead className="cursor-pointer text-right">
                      <span>Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {serviceBookings.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell className="max-w-[600px] px-1 whitespace-normal break-words">
                        {service?.description}
                      </TableCell>
                      <TableCell> {formatCurrency(service?.cost)}</TableCell>

                      <TableCell className="20">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              navigate(
                                `/bookings/${bookingId}/serviceBooking/${service.id}/edit`
                              )
                            }
                          >
                            <Edit size={16} />
                          </Button>

                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => confirmDelete(service.id)}
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
            <div className="text-center">No Service booking Found.</div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={showConfirmation}
        title="Confirm Deletion"
        description="Are you sure you want to delete this service booking? This action cannot be undone."
        onCancel={() => {
          setShowConfirmation(false);
          setServiceBookingToDelete(null);
        }}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default ServiceBookingList;
