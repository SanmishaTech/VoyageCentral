import React, { useState, useEffect } from "react";
import { Button, Input } from "@/components/ui";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import dayjs from "dayjs";

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
  SquarePen,
  BookText,
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

const fetchBookings = async (
  page: number,
  sortBy: string,
  sortOrder: string,
  search: string,
  fromBookingDate: string,
  toBookingDate: string,
  tourTitle: string,
  recordsPerPage: number
) => {
  const response = await get(
    `/group-bookings?page=${page}&sortBy=${sortBy}&sortOrder=${sortOrder}&search=${search}&fromBookingDate=${fromBookingDate}&toBookingDate=${toBookingDate}&tourTitle=${tourTitle}&limit=${recordsPerPage}`
  );
  return response;
};

const GroupBookingList = () => {
  const queryClient = useQueryClient();
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10); // Add recordsPerPage state
  const [sortBy, setSortBy] = useState("groupBookingNumber"); // Default sort column
  const [sortOrder, setSortOrder] = useState("asc"); // Default sort order
  const [search, setSearch] = useState(""); // Search query
  const [showConfirmation, setShowConfirmation] = useState(false); // State to show/hide confirmation dialog
  const [groupBookingToDelete, setGroupBookingToDelete] = useState<
    number | null
  >(null); //
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [fromBookingDate, setFromBookingDate] = useState("");
  const [toBookingDate, setToBookingDate] = useState("");
  const [tourTitle, setTourTitle] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  //  Track the user ID to delete
  const navigate = useNavigate();

  // Fetch users using react-query
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: [
      "group-bookings",
      currentPage,
      sortBy,
      sortOrder,
      search,
      fromBookingDate,
      toBookingDate,
      tourTitle,
      recordsPerPage,
    ],
    queryFn: () =>
      fetchBookings(
        currentPage,
        sortBy,
        sortOrder,
        search,
        fromBookingDate,
        toBookingDate,
        tourTitle,
        recordsPerPage
      ),
  });

  const groupBookings = data?.groupBookings || [];
  const totalPages = data?.totalPages || 1;
  const totalGroupBookings = data?.totalGroupBookings || 0;

  // Mutation for deleting a user
  const deleteMutation = useMutation({
    mutationFn: (id: number) => del(`/group-bookings/${id}`),
    onSuccess: () => {
      toast.success("Group Booking deleted successfully");
      queryClient.invalidateQueries(["group-bookings"]);
    },
    onError: (error) => {
      if (error?.message) {
        toast.error(error.message);
      } else {
        toast.error("Failed to delete Group Booking");
      }
    },
  });

  const confirmDelete = (id: number) => {
    setGroupBookingToDelete(id);
    setShowConfirmation(true);
  };

  const handleDelete = () => {
    if (groupBookingToDelete) {
      deleteMutation.mutate(groupBookingToDelete);
      setShowConfirmation(false);
      setGroupBookingToDelete(null);
    }
  };

  // Handle sorting
  const handleSort = (column: string) => {
    if (sortBy === column) {
      // Toggle sort order if the same column is clicked
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      // Set new column and default to ascending order
      setSortBy(column);
      setSortOrder("asc");
    }
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setCurrentPage(1); // Reset to the first page
  };

  // Handle filter changes
  const handleFromBookingDateChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFromBookingDate(e.target.value);
    setCurrentPage(1);
  };

  const handleToBookingDateChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setToBookingDate(e.target.value);
    setCurrentPage(1);
  };

  const handleTourTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTourTitle(e.target.value);
    setCurrentPage(1);
  };

  return (
    <div className="mt-2 p-4 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
        {/* Booking Management */}
        Group Tour Booking
      </h1>
      <Card className="mx-auto mt-6 sm:mt-10">
        <CardContent>
          {/* Toolbar */}
          <div className="flex flex-wrap gap-4 mb-6">
            {/* Search Input */}
            <div className="flex-grow">
              <Input
                placeholder="Search Group tour bookings..."
                value={search}
                onChange={handleSearchChange}
                className="w-full"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant={showFilters ? "default" : "outline"}
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="mr-2 h-4 w-4" />
                Filters
              </Button>
              <Button
                onClick={() => navigate("/groupBookings/create")}
                className="bg-primary hover:bg-primary/90 text-white shadow-sm transition-all duration-200 hover:shadow-md"
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                Add Group Tour Booking
              </Button>
            </div>
          </div>

          {/* Collapsible Filters Section */}
          {showFilters && (
            <Card className="p-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {/* From Booking Date */}
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    From Booking Date
                  </label>
                  <Input
                    type="date"
                    value={fromBookingDate}
                    onChange={handleFromBookingDateChange}
                    className="w-full"
                  />
                </div>

                {/* To Booking Date */}
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    To Booking Date
                  </label>
                  <Input
                    type="date"
                    value={toBookingDate}
                    onChange={handleToBookingDateChange}
                    className="w-full"
                  />
                </div>

                {/* Tour Title */}
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    Tour Title
                  </label>
                  <Input
                    type="text"
                    value={tourTitle}
                    onChange={handleTourTitleChange}
                    placeholder="Enter tour title"
                    className="w-full"
                  />
                </div>
              </div>
              {/* Clear Filters Button */}
              <div className="flex justify-end mt-2">
                <Button
                  size="sm"
                  onClick={() => {
                    setSearch("");
                    setToBookingDate("");
                    setFromBookingDate("");
                    setTourTitle("");
                    setCurrentPage(1);
                    setShowFilters(false); // Optionally hide the filters panel after clearing
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </Card>
          )}

          <Separator className="mb-4" />

          {/* Table Section */}
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <Loader className="mr-2 h-8 w-8 animate-spin" />
            </div>
          ) : isError ? (
            <div className="text-center text-red-500">
              Failed to load grpup bookings.
            </div>
          ) : groupBookings.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      onClick={() => handleSort("groupBookingNumber")}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center">
                        <span>Group Booking No.</span>
                        {sortBy === "groupBookingNumber" && (
                          <span className="ml-1">
                            {sortOrder === "asc" ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                          </span>
                        )}
                      </div>
                    </TableHead>

                    <TableHead
                      onClick={() => handleSort("groupBookingDate")}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center">
                        <span>Group Booking Date</span>
                        {sortBy === "groupBookingDate" && (
                          <span className="ml-1">
                            {sortOrder === "asc" ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                          </span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead
                      onClick={() => handleSort("journeyDate")}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center">
                        <span>Journey Date</span>
                        {sortBy === "journeyDate" && (
                          <span className="ml-1">
                            {sortOrder === "asc" ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                          </span>
                        )}
                      </div>
                    </TableHead>
                    {/* <TableHead
                      onClick={() => handleSort("followUpDate")}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center">
                        <span>Follow-Up Date</span>
                        {sortBy === "followUpDate" && (
                          <span className="ml-1">
                            {sortOrder === "asc" ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                          </span>
                        )}
                      </div>
                    </TableHead> */}
                    <TableHead
                      onClick={() => handleSort("branchName")}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center">
                        <span>Branch</span>
                        {sortBy === "branchName" && (
                          <span className="ml-1">
                            {sortOrder === "asc" ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                          </span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead
                      onClick={() => handleSort("tourTitle")}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center">
                        <span>Tour</span>
                        {sortBy === "tourTitle" && (
                          <span className="ml-1">
                            {sortOrder === "asc" ? (
                              <ChevronUp size={16} />
                            ) : (
                              <ChevronDown size={16} />
                            )}
                          </span>
                        )}
                      </div>
                    </TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="">
                        {booking.groupBookingNumber}
                      </TableCell>
                      <TableCell>
                        {" "}
                        {booking.groupBookingDate
                          ? dayjs(booking.groupBookingDate).format("DD/MM/YYYY")
                          : "N/A"}
                      </TableCell>
                      <TableCell>
                        {" "}
                        {booking.journeyDate
                          ? dayjs(booking.journeyDate).format("DD/MM/YYYY")
                          : "N/A"}
                      </TableCell>

                      {/* <TableCell>
                        {" "}
                        {booking.followUpDate
                          ? dayjs(booking.followUpDate).format("DD/MM/YYYY")
                          : "N/A"}
                      </TableCell> */}
                      <TableCell className="max-w-[150px] break-words whitespace-normal">
                        {(booking?.branch && booking?.branch.branchName) ||
                          "N/A"}
                      </TableCell>
                      <TableCell className="max-w-[150px] break-words whitespace-normal">
                        {(booking?.tour && booking?.tour.tourTitle) || "N/A"}
                      </TableCell>
                      <TableCell className="flex flex-col items-center justify-end">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() =>
                              navigate(`/groupBookings/${booking.id}/details`)
                            }
                          >
                            Booking
                          </Button>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="w-56">
                            <DropdownMenuGroup>
                              {/* <DropdownMenuItem
                                onClick={() =>
                                  navigate(`/bookings/${booking.id}/followUp`)
                                }
                              >
                                <div className="flex items-center gap-2">
                                  <BookText className="h-4 w-4" />
                                  <span>Follow Up</span>
                                </div>
                              </DropdownMenuItem> */}
                              <DropdownMenuItem
                                onClick={() =>
                                  navigate(`/groupBookings/${booking.id}/edit`)
                                }
                              >
                                <div className="flex items-center gap-2">
                                  <SquarePen className="h-4 w-4" />
                                  <span>Edit</span>
                                </div>
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                // onClick={() => confirmDelete(booking.id)}
                                onClick={() => {
                                  setDropdownOpen(false); // Close the dropdown
                                  setTimeout(
                                    () => confirmDelete(booking.id),
                                    0
                                  ); // Open dialog after dropdown closes
                                }}
                              >
                                <div className="flex items-center gap-2">
                                  <Trash2 className="h-4 w-4" />
                                  <span>Delete</span>
                                </div>
                              </DropdownMenuItem>
                            </DropdownMenuGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <CustomPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalRecords={totalGroupBookings}
                recordsPerPage={recordsPerPage}
                onPageChange={setCurrentPage} // Pass setCurrentPage directly
                onRecordsPerPageChange={(newRecordsPerPage) => {
                  setRecordsPerPage(newRecordsPerPage);
                  setCurrentPage(1); // Reset to the first page when records per page changes
                }}
              />
            </div>
          ) : (
            <div className="text-center">No Group Bookings Found.</div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        isOpen={showConfirmation}
        title="Confirm Deletion"
        description="Are you sure you want to delete this Booking? This action cannot be undone."
        onCancel={() => {
          setShowConfirmation(false);
          setGroupBookingToDelete(null);
        }}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default GroupBookingList;
