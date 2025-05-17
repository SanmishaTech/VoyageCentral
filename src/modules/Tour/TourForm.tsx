import React, { useEffect, useState } from "react";
import {
  useForm,
  SubmitHandler,
  Controller,
  useFieldArray,
} from "react-hook-form";
import {
  tourTypeOptions,
  statusOptions,
  destinationOptions,
} from "@/config/data";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea"; // adjust path if needed
import { cn } from "@/lib/utils";

import { Card, CardContent, CardTitle } from "@/components/ui/card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import Validate from "@/lib/Handlevalidation";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LoaderCircle,
  Trash2,
  PlusCircle,
  Check,
  ChevronsUpDown,
} from "lucide-react"; // Import the LoaderCircle icon
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";
import { get } from "@/services/apiService";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { post, put } from "@/services/apiService";
import { set } from "date-fns";

// --- Configuration ---
// Define your backend base URL. Use environment variables in a real app.
const BACKEND_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000"; // Adjust if needed

const MAX_ATTACHMENT_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_ATTACHMENT_TYPES = ["image/jpeg", "image/png", "image/jpg"];

const fileSchema = z
  .instanceof(File, { message: "File selection is invalid." }) // Changed message
  .optional()
  .nullable(); // Allow null if needed (e.g., for removal logic if implemented)

const attachmentSchema = fileSchema
  .refine(
    (file) => !file || file.size <= MAX_ATTACHMENT_SIZE,
    `attachment size must be less than 2MB.`
  )
  .refine(
    (file) => !file || ACCEPTED_ATTACHMENT_TYPES.includes(file.type),
    "Invalid attachment file type. Only JPG, JPEG, PNG are allowed."
  );

const ItinerarySchema = z.object({
  itineraryId: z.string().optional(),
  day: z
    .string()
    .refine((val) => !isNaN(Number(val)), {
      message: "Day must be a valid number.",
    })
    .transform((val) => Number(val))
    .pipe(
      z
        .number()
        .int("Day must be an integer.")
        .min(1, "Day field is required.")
        .max(1000, "Day cannot be more than 1000.")
    ),
  description: z
    .string()
    .min(1, "Description is required.")
    .max(2000, "Description must not exceed 2000 characters."),
  cityId: z.string().optional(),
});

const FormSchema = z.object({
  tourTitle: z
    .string()
    .min(1, "Tour title is required.")
    .max(100, "Tour title must not exceed 100 characters."),
  tourType: z
    .string()
    .min(1, "Tour type is required.")
    .max(100, "tour type must not exceed 100 characters."),
  destination: z
    .string()
    .min(1, "destination is required.")
    .max(100, "destination must not exceed 100 characters."),
  status: z
    .string()
    .min(1, "Status is required.")
    .max(100, "Status must not exceed 100 characters."),
  attachment: attachmentSchema,
  notes: z
    .string()
    .max(2000, "Notes must not exceed 2000 characters.")
    .optional(),

  sectorId: z.string().optional(),
  itineraries: z.array(ItinerarySchema).optional(),
});

type FormInputs = z.infer<typeof FormSchema>;

const TourForm = ({ mode }: { mode: "create" | "edit" }) => {
  const { id } = useParams<{ id: string }>();
  const [logoPreview, setAttachmentPreview] = useState<string | null>(null);
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const defaultValues: z.infer<typeof FormSchema> = {
    tourTitle: "",
    tourType: "",
    destination: "",
    status: "",
    notes: "",
    sectorId: "", // Optional, so can be empty
    itineraries: [], // Optional array
  };

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    control,
    setError,
    formState: { errors },
  } = useForm<FormInputs>({
    resolver: zodResolver(FormSchema),
    defaultValues: mode === "create" ? defaultValues : undefined, // Use default values in create mode
  });

  const watchedAttachment = watch("attachment" as any); // Use 'as any' if type inference struggles

  const { fields, append, remove } = useFieldArray({
    control,
    name: "itineraries", // Name of the array in the form schema
  });

  // sectors
  const { data: sectors, isLoading: isSectorsLoading } = useQuery({
    queryKey: ["sectors"],
    queryFn: async () => {
      const response = await get(`/sectors/all`);
      return response; // API returns the sector object directly
    },
  });

  // cities
  const { data: cities, isLoading: isCitiesLoading } = useQuery({
    queryKey: ["cities"],
    queryFn: async () => {
      const response = await get(`/cities/all`);
      return response; // API returns the sector object directly
    },
  });

  const cityOptions = [
    { id: "none", cityName: "---" }, // The 'unselect' option
    ...(cities ?? []),
  ];

  const { data: editTourData, isLoading: editTourLoading } = useQuery({
    queryKey: ["editTour", id],
    queryFn: async () => {
      const response = await get(`/tours/${id}`);
      return response; // API returns the sector object directly
    },
    enabled: !!id && mode === "edit",
  });

  useEffect(() => {
    if (editTourData) {
      setAttachmentPreview(null);

      // ✅ Map familyFriends once
      const itinerariesData =
        editTourData.itineraries?.map((itinerary) => ({
          itineraryId: itinerary.id ? String(itinerary.id) : "",
          day: String(itinerary.day) || "",
          description: itinerary.description || "",
          cityId: itinerary.cityId ? String(itinerary.cityId) : "",
        })) || [];

      // ✅ Reset full form including field array
      reset({
        tourTitle: editTourData.tourTitle || "",
        tourType: editTourData.tourType ? String(editTourData.tourType) : "",
        destination: editTourData.destination || "",
        status: editTourData.status || "",
        notes: editTourData.notes || "",
        sectorId: editTourData.sectorId ? String(editTourData.sectorId) : "",
        // attachment: editTourData.attachment || "",
        itineraries: itinerariesData, // ✅ include this
      });
    }
  }, [editTourData, reset, setValue]);

  useEffect(() => {
    let reader: FileReader;
    let isMounted = true; // Prevent state update on unmounted component

    if (watchedAttachment && watchedAttachment instanceof File) {
      reader = new FileReader();
      reader.onloadend = () => {
        if (isMounted) {
          setAttachmentPreview(reader.result as string);
        }
      };
      reader.readAsDataURL(watchedAttachment);
    } else if (watchedAttachment === null) {
      // If explicitly set to null (e.g., future remove button)
      setAttachmentPreview(null);
    }
    // Don't clear preview here based on agencyData, JSX handles showing existing

    return () => {
      isMounted = false; // Cleanup function
      // Optional: Abort reader if needed, though less critical here
    };
  }, [watchedAttachment]);

  // Mutation for creating a user
  const createMutation = useMutation({
    mutationFn: (data: FormInputs) =>
      post("/tours", data, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries(["tours"]); // Refetch the users list
      toast.success("Tour created successfully");
      navigate("/tours"); // Navigate to the hotels page after successful creation
    },
    onError: (error: any) => {
      console.log(error);
      Validate(error, setError);
      toast.error(error.response?.data?.message || "Failed to create Tour");
    },
  });

  // Mutation for updating a user
  const updateMutation = useMutation({
    mutationFn: (data: FormInputs) =>
      put(`/tours/${id}`, data, {
        headers: { "Content-Type": "multipart/form-data" },
      }),
    onSuccess: () => {
      toast.success("Tour updated successfully");
      queryClient.invalidateQueries(["tours"]);
      navigate("/tours"); // Navigate to the hotels page after successful update
    },
    onError: (error: any) => {
      Validate(error, setError);
      toast.error(error.response?.data?.message || "Failed to update tours");
    },
  });

  // --- Handlers ---
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null; // Use null if no file selected
    const name = e.target.name as keyof FormInputs;
    // Use null instead of undefined if file is cleared
    setValue(name, file, { shouldValidate: true });

    // Manually clear the other type of preview if a file is selected/deselected
    if (name === "attachment") setAttachmentPreview(null);
  };

  // Handle form submission
  // const onSubmit: SubmitHandler<FormInputs> = (data) => {
  //   if (mode === "create") {
  //     createMutation.mutate(data); // Trigger create mutation
  //   } else {
  //     updateMutation.mutate(data); // Trigger update mutation
  //   }
  // };

  const toggleCityPopover = (index) => {
    setOpenCityIds((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const closeCityPopover = (index) => {
    setOpenCityIds((prev) => ({
      ...prev,
      [index]: false,
    }));
  };

  const handleRemoveAndRecalculateDays = (index: number) => {
    console.log("Before remove:", fields); // Log the current state of fields

    // Remove the selected record
    remove(index);

    // Recalculate days for the remaining records
    const updatedFields = [...fields].filter((_, idx) => idx !== index); // Create a new array without the removed record
    updatedFields.forEach((field, idx) => {
      setValue(`itineraries.${idx}.day`, String(idx + 1)); // Always update day

      if (field.cityId) {
        setValue(`itineraries.${idx}.cityId`, field.cityId); // Set cityId only if it exists
      }
    });

    console.log("After remove and recalculate:", updatedFields);
  };

  // start
  const onSubmit: SubmitHandler<FormInputs> = (data) => {
    const formData = new FormData();

    // Append all fields to FormData
    formData.append("tourTitle", data.tourTitle);
    formData.append("tourType", data.tourType);
    formData.append("destination", data.destination);
    formData.append("status", data.status);
    formData.append("notes", data.notes || "");
    formData.append("sectorId", data.sectorId || "");

    // Append attachment if it exists
    if (data.attachment instanceof File) {
      formData.append("attachment", data.attachment);
    }

    // Stringify and append itineraries
    if (data.itineraries) {
      formData.append("itineraries", JSON.stringify(data.itineraries));
    }

    // Trigger the appropriate mutation
    if (mode === "create") {
      createMutation.mutate(formData); // Pass FormData to the mutation
    } else {
      updateMutation.mutate(formData); // Pass FormData to the mutation
    }
  };
  // end

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      {/* JSX Code for HotelForm.tsx */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="mx-auto mt-10">
          <CardContent className="pt-6">
            {/* Client Details */}
            <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200">
              Tour Details
            </CardTitle>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
              {/* Client Name (2 columns) */}
              <div className="col-span-2">
                <Label
                  htmlFor="tourTitle"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Tour title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="tourTitle"
                  {...register("tourTitle")}
                  placeholder="Enter tour title"
                />
                {errors.tourTitle && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.tourTitle.message}
                  </p>
                )}
              </div>

              {/* tourType */}
              <div className="col-span-2 lg:col-span-1">
                <Label
                  htmlFor="tourType"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Tour Type <span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="tourType"
                  control={control}
                  render={({ field }) => (
                    <Select
                      key={field.value}
                      onValueChange={(value) => setValue("tourType", value)}
                      value={watch("tourType")}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select tour type" />
                      </SelectTrigger>
                      <SelectContent>
                        {tourTypeOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.tourType && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.tourType.message}
                  </p>
                )}
              </div>

              {/* destination */}
              <div className="col-span-2 lg:col-span-1">
                <Label
                  htmlFor="destination"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Destination <span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="destination"
                  control={control}
                  render={({ field }) => (
                    <Select
                      key={field.value}
                      onValueChange={(value) => setValue("destination", value)}
                      value={watch("destination")}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select destination" />
                      </SelectTrigger>
                      <SelectContent>
                        {destinationOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.destination && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.destination.message}
                  </p>
                )}
              </div>

              {/* status */}
              <div className="col-span-2 lg:col-span-1">
                <Label
                  htmlFor="status"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Status <span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select
                      key={field.value}
                      onValueChange={(value) => setValue("status", value)}
                      value={watch("status")}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statusOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.status && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.status.message}
                  </p>
                )}
              </div>

              {/* Sector */}
              <div className="col-span-2 lg:col-span-1">
                <Label
                  htmlFor="sectorId"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Sector
                </Label>
                <Controller
                  name="sectorId"
                  control={control}
                  render={({ field }) => (
                    <Select
                      key={field.value}
                      onValueChange={(value) => {
                        setValue("sectorId", value);
                      }}
                      value={watch("sectorId")}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a sector" />
                      </SelectTrigger>
                      <SelectContent>
                        {sectors?.map((sector) => (
                          <SelectItem key={sector.id} value={String(sector.id)}>
                            {sector.sectorName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
              <div className="col-span-2 lg:col-span-3">
                <Label
                  htmlFor="notes"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Notes
                </Label>
                <Textarea
                  id="notes"
                  {...register("notes")}
                  placeholder="Enter notes about the tour"
                  rows={4} // Optional: control height
                />
                {errors.notes && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.notes.message}
                  </p>
                )}
              </div>

              {/* Logo Input & Preview */}
              <div className="col-span-2 lg:col-span-1">
                <Label
                  htmlFor="attachment"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Attachment (JPG, PNG, max 2MB)
                </Label>
                <Input
                  id="attachment"
                  type="file"
                  accept={ACCEPTED_ATTACHMENT_TYPES.join(",")}
                  onChange={handleFileChange}
                  name="attachment"
                  className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-primary/10 file:text-primary dark:file:bg-primary/20 dark:file:text-primary hover:file:bg-primary/20 dark:hover:file:bg-primary/30"
                />
                {/* Logo Preview Area */}
                <div className="mt-2 min-h-[100px] flex items-center justify-center border border-dashed border-gray-300 dark:border-gray-600 rounded-md p-2 bg-gray-50 dark:bg-gray-800/50">
                  {logoPreview ? ( // Prioritize new selection preview
                    <img
                      src={logoPreview}
                      alt="New arrachment Preview"
                      className="max-h-20 w-auto object-contain"
                    />
                  ) : editTourData?.attachmentUrl ? ( // Show existing logo from API URL
                    <img
                      src={`${BACKEND_URL}${editTourData.attachmentUrl}`} // *** USE ABSOLUTE URL ***
                      alt="Current arrachment"
                      className="max-h-20 w-auto object-contain"
                      onError={(e) => {
                        // Handle broken image link
                        (e.target as HTMLImageElement).style.display = "none";
                        const errorPlaceholder =
                          e.target.parentNode?.querySelector(
                            ".error-placeholder"
                          );
                        if (!errorPlaceholder) {
                          (e.target as HTMLImageElement).insertAdjacentHTML(
                            "afterend",
                            '<p class="text-xs text-red-500 error-placeholder">Could not load logo</p>'
                          );
                        }
                      }}
                    />
                  ) : (
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      No Attachment uploaded
                    </span>
                  )}
                </div>
                {errors.attachment && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.attachment.message as string}
                  </p>
                )}
              </div>
            </div>

            {/* start */}
            <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-8">
              Itinerary
            </CardTitle>
            <div className="mt-5">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-22 px-1">Day</TableHead>
                    <TableHead className="w-[400px] px-1">
                      Description
                    </TableHead>
                    <TableHead>Night halt</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell className="w-20 px-1">
                        <Input
                          {...register(`itineraries.${index}.day`)}
                          placeholder="day"
                          className="w-20 m-0"
                        />
                        {errors.itineraries?.[index]?.day && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.itineraries[index]?.day?.message}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[600px] px-1 whitespace-normal break-words">
                        <Textarea
                          {...register(`itineraries.${index}.description`)}
                          placeholder="Enter description"
                          className="w-[400px] lg:w-full"
                          rows={4}
                        />
                        {errors.itineraries?.[index]?.description && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.itineraries[index]?.description?.message}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="w-40">
                        <Controller
                          name={`itineraries.${index}.cityId`}
                          control={control}
                          render={({ field }) => (
                            <Select
                              key={field.value}
                              // onValueChange={(value) => {
                              //   setValue(`itineraries.${index}.cityId`, value);
                              // }}
                              onValueChange={(value) =>
                                setValue(
                                  `itineraries.${index}.cityId`,
                                  value === "none" ? "" : value
                                )
                              }
                              value={watch(`itineraries.${index}.cityId`)}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a city" />
                              </SelectTrigger>
                              <SelectContent>
                                {cityOptions?.map((city) => (
                                  <SelectItem
                                    key={city.id}
                                    value={String(city.id)}
                                  >
                                    {city.cityName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {errors.itineraries?.[index]?.cityId && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.itineraries[index]?.cityId?.message}
                          </p>
                        )}
                      </TableCell>

                      {/* friend id */}
                      <Input
                        type="hidden"
                        {...register(`itineraries.${index}.itineraryId`)}
                      />
                      {errors.itineraries?.[index]?.itineraryId && (
                        <p className="text-red-500 text-xs mt-1">
                          {errors.itineraries[index]?.itineraryId?.message}
                        </p>
                      )}
                      {/* itineraryId id */}

                      <TableCell className="w-20">
                        <Button
                          type="button"
                          variant="destructive"
                          // onClick={() => remove(index)}
                          onClick={() => handleRemoveAndRecalculateDays(index)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Button
                type="button"
                variant="outline"
                className="mt-4"
                // onClick={() =>
                //   append({
                //     itineraryId: "",
                //     day: "",
                //     description: "",
                //     cityId: "",
                //   })
                // }
                onClick={() => {
                  const lastDay =
                    fields.length > 0
                      ? Number(fields[fields.length - 1].day)
                      : 0;
                  append({
                    itineraryId: "",
                    day: String(lastDay + 1), // Increment day based on the last entry
                    description: "",
                    cityId: "",
                  });
                }}
              >
                <PlusCircle className="mr-2 h-5 w-5" />
                Add Itinerary
              </Button>
            </div>
            {/* end */}
          </CardContent>

          {/* Submit/Cancel Buttons */}
          <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 rounded-b-lg">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate("/tours")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="min-w-[90px]">
              {isLoading ? (
                <LoaderCircle className="animate-spin h-4 w-4" />
              ) : mode === "create" ? (
                "Create Tour"
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </Card>
      </form>
    </>
  );
};

export default TourForm;
