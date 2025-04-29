import React from "react";
import TourEnquiryForm from "./TourEnquiryForm";

const EditTourEnquiry = () => {
  return (
    <div className="mt-2 p-6">
      <h1 className="text-2xl font-bold mb-6">Edit Tour Enquiry</h1>
      <TourEnquiryForm mode="edit" />
    </div>
  );
};

export default EditTourEnquiry;
