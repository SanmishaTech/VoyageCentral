import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { get } from "@/services/apiService";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader } from "lucide-react";
import CustomPagination from "@/components/common/custom-pagination";
import { Separator } from "@/components/ui/separator";
import dayjs from "dayjs";
const fetchFollowUps = async (page: number, limit: number) => {
  const response = await get(
    `/dashboard/follow-ups?page=${page}&limit=${limit}`
  );
  return response;
};

const AdminDashboard = () => {
  const [currentPage, setCurrentPage] = useState(1);
  const [recordsPerPage, setRecordsPerPage] = useState(10);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["dashboardFollowUps", currentPage, recordsPerPage],
    queryFn: () => fetchFollowUps(currentPage, recordsPerPage),
  });

  const followUps = data?.followUps || [];
  const totalPages = data?.totalPages || 1;
  const total = data?.totalFollowUps || 0;

  return (
    <div className="mt-2 p-4 sm:p-6">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">
        Upcoming Follow-Ups (Next 7 Days)
      </h1>
      <Card className="mx-auto mt-6 sm:mt-10">
        <CardContent>
          {/* <Separator className="mb-4" /> */}
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <Loader className="mr-2 h-8 w-8 animate-spin" />
            </div>
          ) : isError ? (
            <div className="text-center text-red-500">
              Failed to load follow-ups.
            </div>
          ) : followUps.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    {/* <TableHead>Booking Number</TableHead>
                    <TableHead>Next Follow-Up Date</TableHead>
                    <TableHead>Remarks</TableHead> */}
                    <TableHead className="w-15 pr-6">Booking Number</TableHead>
                    <TableHead className="w-15 px-6">
                      Next Follow-Up Date
                    </TableHead>
                    <TableHead className="px-6">Remarks</TableHead>
                    <TableHead className="px-6">Added By</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {followUps.map((fu, idx) => (
                    <TableRow key={idx}>
                      <TableCell className="w-15 pr-6">
                        {fu.bookingNumber}
                      </TableCell>
                      <TableCell className="w-15 pr-6">
                        {fu.nextFollowUpDate
                          ? dayjs(fu.nextFollowUpDate).format("DD/MM/YYYY")
                          : "N/A"}
                      </TableCell>
                      <TableCell className="max-w-[500px] px-1 whitespace-normal break-words">
                        {fu.remarks}
                      </TableCell>
                      <TableCell className="w-15 pr-6">
                        <Button>{fu.userName}</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <CustomPagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalRecords={total}
                recordsPerPage={recordsPerPage}
                onPageChange={setCurrentPage}
                onRecordsPerPageChange={(newRecordsPerPage) => {
                  setRecordsPerPage(newRecordsPerPage);
                  setCurrentPage(1);
                }}
              />
            </div>
          ) : (
            <div className="text-center">No upcoming follow-ups.</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;
