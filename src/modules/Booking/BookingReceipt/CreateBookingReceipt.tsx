import React from "react";
import BookingReceiptForm from "./BookingReceiptForm";

const CreateBookingReceipt = () => {
  return (
    <div className="mt-2 p-6">
      <h1 className="text-2xl font-bold mb-6">Create Booking Receipt</h1>
      <BookingReceiptForm mode="create" />
    </div>
  );
};

export default CreateBookingReceipt;
