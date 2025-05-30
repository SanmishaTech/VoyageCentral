import React from "react";
import GroupClientBookingReceiptForm from "./GroupClientBookingReceiptForm";

const EditGroupClientBookingReceipt = () => {
  return (
    <div className="mt-2 p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Booking Receipt</h1>
      <GroupClientBookingReceiptForm mode="edit" />
    </div>
  );
};

export default EditGroupClientBookingReceipt;
