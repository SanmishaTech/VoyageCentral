import React from "react";
import GroupClientBookingReceiptForm from "./GroupClientBookingReceiptForm";

const CreateGroupClientBookingReceipt = () => {
  return (
    <div className="mt-2 p-6">
      <h1 className="text-2xl font-bold mb-6">Create Booking Receipt</h1>
      <GroupClientBookingReceiptForm mode="create" />
    </div>
  );
};

export default CreateGroupClientBookingReceipt;
