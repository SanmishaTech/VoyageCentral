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
import { formatCurrency, formatDate, formatDateTime } from "@/lib/formatter.js";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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

const GroupClientBookingList = ({ groupBookingId }) => {
  const queryClient = useQueryClient();
  const [showConfirmation, setShowConfirmation] = useState(false); // State to show/hide confirmation dialog
  const [clientBookingToDelete, setClientBookingToDelete] = useState<
    number | null
  >(null); //
  //  Track the user ID to delete
  const navigate = useNavigate();

  const fetchGroupClientBookings = async () => {
    const response = await get(`/group-client-bookings/all/${groupBookingId}`);
    return response;
  };

  // Fetch users using react-query
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["group-client-bookings", groupBookingId],
    queryFn: () => fetchGroupClientBookings(),
  });

  const groupClients = data?.groupClients || [];

  // Mutation for deleting a user
  const deleteMutation = useMutation({
    mutationFn: (id: number) => del(`/group-client-bookings/${id}`),
    onSuccess: () => {
      toast.success("Client Booking deleted successfully");
      queryClient.invalidateQueries(["group-client-bookings"]);
    },
    onError: (error) => {
      if (error?.message) {
        toast.error(error.message);
      } else {
        toast.error("Failed to delete Client Booking");
      }
    },
  });

  const confirmDelete = (id: number) => {
    setClientBookingToDelete(id);
    setShowConfirmation(true);
  };

  const handleDelete = () => {
    if (clientBookingToDelete) {
      deleteMutation.mutate(clientBookingToDelete);
      setShowConfirmation(false);
      setClientBookingToDelete(null);
    }
  };

  return (
    <div className="mt-2 ">
      <div className="mx-auto ">
        <div className="mb-1 w-full flex flex-wrap justify-between items-center gap-2">
          <div className="text-xl font-bold text-gray-800 tracking-wide  dark:text-white ">
            Members
          </div>

          <Button
            onClick={() =>
              navigate(
                `/groupBookings/${groupBookingId}/groupClientBooking/create`
              )
            }
            className="bg-primary text-xs hover:bg-primary/90 text-white shadow-sm transition-all duration-200 hover:shadow-md"
          >
            <PlusCircle className="mr-2 h-5 w-5" />
            Add Member
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
              Failed to load members details.
            </div>
          ) : groupClients.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="cursor-pointer">
                      <div className="flex items-center">
                        <span>Booking Date</span>
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer">
                      <div className="flex items-center">
                        <span>Name</span>
                      </div>
                    </TableHead>

                    <TableHead className="cursor-pointer">
                      <div className="flex items-center">
                        <span>mobile</span>
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer">
                      <div className="flex items-center">
                        <span>email</span>
                      </div>
                    </TableHead>

                    <TableHead className="cursor-pointer">
                      <div className="flex items-center">
                        <span>Total members</span>
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer">
                      <div className="flex items-center">
                        <span>tour Cost</span>
                      </div>
                    </TableHead>
                    <TableHead className="cursor-pointer text-right">
                      <span>Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupClients.map((client) => (
                    <React.Fragment key={client.id}>
                      {/* Main Client Row */}
                      <TableRow>
                        <TableCell className="max-w-[100px] px-1 whitespace-normal break-words">
                          {client.bookingDate
                            ? dayjs(client.bookingDate).format("DD/MM/YYYY")
                            : "N/A"}
                        </TableCell>
                        <TableCell className="max-w-[100px] px-1 whitespace-normal break-words">
                          {client?.client?.clientName || "N/A"}
                        </TableCell>
                        <TableCell>
                          {client?.client?.mobile1 || "N/A"}
                        </TableCell>
                        <TableCell>{client?.client?.email || "N/A"}</TableCell>
                        <TableCell>{client?.totalMember || "N/A"}</TableCell>
                        <TableCell>
                          {formatCurrency(client?.tourCost) || "N/A"}
                        </TableCell>
                        <TableCell className="w-20">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                navigate(
                                  `/groupBookings/${groupBookingId}/groupClientBooking/${client.id}/edit`
                                )
                              }
                            >
                              <Edit size={16} />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => confirmDelete(client.id)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>

                      {/* Accordion Row */}
                      <TableRow>
                        <TableCell colSpan={7} className="p-0 border-none">
                          <Accordion
                            type="single"
                            collapsible
                            className="w-full"
                          >
                            <AccordionItem value={`members-${client.id}`}>
                              <AccordionTrigger className="bg-slate-100 dark:bg-gray-900 dark:text-white p-2 border">
                                Members
                              </AccordionTrigger>
                              <AccordionContent className="border rounded p-2">
                                {client.groupClientMembers?.length > 0 ? (
                                  <div className="overflow-x-auto">
                                    <Table>
                                      <TableHeader>
                                        <TableRow>
                                          <TableHead>Name</TableHead>
                                          <TableHead>Gender</TableHead>
                                          <TableHead>Food Type</TableHead>
                                          <TableHead>Mobile</TableHead>
                                          <TableHead>Email</TableHead>
                                        </TableRow>
                                      </TableHeader>
                                      <TableBody>
                                        {client.groupClientMembers.map(
                                          (member) => (
                                            <TableRow key={member.id}>
                                              <TableCell>
                                                {member.name || "N/A"}
                                              </TableCell>
                                              <TableCell>
                                                {member.gender || "N/A"}
                                              </TableCell>
                                              <TableCell>
                                                {member.foodType || "N/A"}
                                              </TableCell>
                                              <TableCell>
                                                {member.mobile || "N/A"}
                                              </TableCell>
                                              <TableCell>
                                                {member.email || "N/A"}
                                              </TableCell>
                                            </TableRow>
                                          )
                                        )}
                                      </TableBody>
                                    </Table>
                                  </div>
                                ) : (
                                  <div className="text-center text-sm text-gray-500">
                                    No members found.
                                  </div>
                                )}
                              </AccordionContent>
                            </AccordionItem>
                          </Accordion>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center">No Tour Members Found.</div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={showConfirmation}
        title="Confirm Deletion"
        description="Are you sure you want to delete this Tour member Booking? This action cannot be undone."
        onCancel={() => {
          setShowConfirmation(false);
          setClientBookingToDelete(null);
        }}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default GroupClientBookingList;
