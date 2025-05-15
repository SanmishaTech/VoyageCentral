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

const TravelDocumentList = ({ bookingId }) => {
  const queryClient = useQueryClient();
  const [showConfirmation, setShowConfirmation] = useState(false); // State to show/hide confirmation dialog
  const [travelDocumentToDelete, setTravelDocumentToDelete] = useState<
    number | null
  >(null); //
  //  Track the user ID to delete
  const navigate = useNavigate();

  const fetchTravelDocuments = async () => {
    const response = await get(`/travel-documents/booking/${bookingId}`);
    return response;
  };

  // Fetch users using react-query
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["travel-documents", bookingId],
    queryFn: () => fetchTravelDocuments(),
  });

  const travelDocuments = data?.travelDocuments || [];

  // Mutation for deleting a user
  const deleteMutation = useMutation({
    mutationFn: (id: number) => del(`/travel-documents/${id}`),
    onSuccess: () => {
      toast.success("Travel Document deleted successfully");
      queryClient.invalidateQueries(["travel-documents"]);
    },
    onError: () => {
      toast.error("Failed to delete Travel Document");
    },
  });

  const confirmDelete = (id: number) => {
    setTravelDocumentToDelete(id);
    setShowConfirmation(true);
  };

  const handleDelete = () => {
    if (travelDocumentToDelete) {
      deleteMutation.mutate(travelDocumentToDelete);
      setShowConfirmation(false);
      setTravelDocumentToDelete(null);
    }
  };

  return (
    <div className="mt-2 ">
      <div className="mx-auto ">
        <div className="mb-1 w-full flex flex-wrap justify-between items-center gap-2">
          <div className="text-xl font-bold text-gray-800 tracking-wide  dark:text-white ">
            Travel Documents
          </div>

          <Button
            onClick={() =>
              navigate(`/bookings/${bookingId}/travelDocument/create`)
            }
            className="bg-primary text-xs hover:bg-primary/90 text-white shadow-sm transition-all duration-200 hover:shadow-md"
          >
            <PlusCircle className="mr-2 h-5 w-5" />
            Add Travel Document
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
              Failed to load travel document details.
            </div>
          ) : travelDocuments.length > 0 ? (
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
                        <span>Private Document</span>
                      </div>
                    </TableHead>

                    <TableHead className="cursor-pointer text-right">
                      <span>Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {travelDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell className="max-w-[600px] px-1 whitespace-normal break-words">
                        {doc?.description}
                      </TableCell>
                      <TableCell> {doc.isPrivate ? "Yes" : "No"}</TableCell>

                      <TableCell className="20">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              navigate(
                                `/bookings/${bookingId}/travelDocument/${doc.id}/edit`
                              )
                            }
                          >
                            <Edit size={16} />
                          </Button>

                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => confirmDelete(doc.id)}
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
            <div className="text-center">No Travel Document Found.</div>
          )}
        </div>
      </div>

      <ConfirmDialog
        isOpen={showConfirmation}
        title="Confirm Deletion"
        description="Are you sure you want to delete this travel Document? This action cannot be undone."
        onCancel={() => {
          setShowConfirmation(false);
          setTravelDocumentToDelete(null);
        }}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default TravelDocumentList;
