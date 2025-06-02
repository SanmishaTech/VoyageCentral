import React, { useEffect, useState } from "react";
import {
  useForm,
  SubmitHandler,
  Controller,
  useFieldArray,
  useWatch,
} from "react-hook-form";
import dayjs from "dayjs";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea"; // adjust path if needed
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { LoaderCircle, Trash2, PlusCircle } from "lucide-react"; // Import the LoaderCircle icon
import { toast } from "sonner";
import { useNavigate, useParams } from "react-router-dom";
import { get } from "@/services/apiService";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { post, put } from "@/services/apiService";
import { noOfVehiclesOptions } from "@/config/data";
import { set } from "date-fns";
import {
  modeOptions,
  foodTypeOptions,
  flightClassOptions,
  trainClassOptions,
  planOptions,
  roomOptions,
  tariffPackageOptions,
  bedOptions,
} from "@/config/data";

const vehicleHotelFormSchema = z.object({
  vehicleHotelId: z.string().optional(),
  checkInDate: z.string().min(1, "Check-in date is required."),
  checkOutDate: z.string().min(1, "Check-out date is required."),

  numberOfNights: z.coerce
    .number()
    .int("Nights must be an integer.")
    .min(0, "Nights field is required."),

  cityId: z.coerce.string().min(1, "City field is required"),

  hotelId: z.coerce.string().min(1, "hotel field is required"),

  plan: z
    .string()
    .min(1, "Plan field is required.")
    .max(100, "Plan must not exceed 100 characters."),

  numberOfRooms: z.string().min(1, "Rooms field is required"),
});

const vehicleItineraryFormSchema = z.object({
  itineraryId: z.string().optional(),
  day: z
    .string()
    .min(1, "Day is required.")
    .max(1000, "Day must not exceed 1000 characters.")
    .regex(/^\d+$/, "Day must contain only digits."),
  description: z
    .string()
    .min(1, "Description is required.")
    .max(1500, "Description must not exceed 1500 characters."),
  date: z
    .string()
    .min(1, "Date is required.")
    .max(100, "Date must not exceed 100 characters."),
  cityId: z.string().optional(),
});

const FormSchema = z.object({
  vehicleBookingDate: z.string().min(1, "Vehicle booking date is required."),
  vehicleHrvNumber: z.string().optional(),
  vehicleId: z.union([
    z.number().min(1, { message: "Vehicle field is required." }),
    z.string().min(1, { message: "Vehicle field is required." }),
  ]),

  numberOfVehicles: z.string().min(1, "Number of vehicles is required."),
  fromDate: z.string().min(1, "From date is required."),

  toDate: z.string().min(1, "To date is required."),

  days: z.coerce
    .number()
    .int("Days must be an integer.")
    .min(0, "Days field is required."),

  cityId: z.union([
    z.number().min(1, { message: "City field is required." }),
    z.string().min(1, { message: "City field is required." }),
  ]),

  agentId: z.union([
    z.number().min(1, { message: "Agent field is required." }),
    z.string().min(1, { message: "Agent field is required." }),
  ]),

  pickupPlace: z
    .string()
    .min(1, "Pickup place is required.")
    .max(180, "Pickup place must not exceed 180 characters."),

  terms: z
    .string()
    .max(1500, "Terms must not exceed 1500 characters.")
    .optional(),

  specialRequest: z
    .string()
    .max(1500, "Special request must not exceed 1500 characters.")
    .optional(),

  vehicleNote: z
    .string()
    .max(1500, "Vehicle note must not exceed 1500 characters.")
    .optional(),

  specialNote: z
    .string()
    .max(1500, "Special note must not exceed 1500 characters.")
    .optional(),

  summaryNote: z
    .string()
    .max(1500, "Summary note must not exceed 1500 characters.")
    .optional(),

  billDescription: z
    .string()
    .max(1500, "Bill description must not exceed 1500 characters.")
    .optional(),
  vehicleItineraries: z.array(vehicleItineraryFormSchema).optional(),
  vehicleHotelBookings: z.array(vehicleHotelFormSchema).optional(),
  amount: z.preprocess(
    (val) => {
      if (typeof val === "string") {
        const parsed = parseFloat(val);
        return isNaN(parsed) ? val : parsed;
      }
      return val;
    },
    z
      .number({
        invalid_type_error: "Amount must be a number",
        required_error: "Amount is required",
      })
      .min(1, "Amount must be greater than 0")
  ),
});

type FormInputs = z.infer<typeof FormSchema>;

const defaultValues: FormInputs = {
  vehicleBookingDate: new Date().toISOString().split("T")[0], // Defaults to today (YYYY-MM-DD)
  vehicleId: "",
  numberOfVehicles: "",
  fromDate: "", // Defaults to today
  toDate: "", // Defaults to today
  days: 0,
  cityId: "",
  agentId: "",
  pickupPlace: "",
  terms: "",
  specialRequest: "",
  vehicleNote: "",
  specialNote: "",
  summaryNote: "",
  billDescription: "",
  vehicleHrvNumber: "",
  vehicleItineraries: [],
  vehicleHotelBookings: [],
  amount: "",
};

const defaultHotelBooking = {
  vehicleHotelId: "",
  cityId: "",
  hotelId: "",
  checkInDate: "",
  checkOutDate: "",
  numberOfRooms: "",
  plan: "",
  numberOfNights: 0,
};

const GroupClientVehicleBookingForm = ({
  mode,
}: {
  mode: "create" | "edit";
}) => {
  const { groupBookingId, groupClientBookingId, vehicleBookingId } = useParams<{
    groupBookingId: string;
    groupClientBookingId: string;
    vehicleBookingId: string;
  }>();
  const [openCityId, setOpenCityId] = useState<boolean>(false);
  const [openVehicleId, setOpenVehicleId] = useState<boolean>(false);
  const [openAgentId, setOpenAgentId] = useState<boolean>(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

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

  const {
    fields: vehicleItinerariesFields,
    append: appendVehicleItineraries,
    remove: removeVehicleItineraries,
  } = useFieldArray({
    control,
    name: "vehicleItineraries", // Name of the array in the form schema
  });

  const {
    fields: vehicleHotelBookingsFields,
    append: appendVehicleHotelBookings,
    remove: removeVehicleHotelBookings,
    insert: insertVehicleHotelBooking,
  } = useFieldArray({
    control,
    name: "vehicleHotelBookings", // Name of the array in the form schema
  });

  // const hotelBookings = watch("vehicleHotelBookings");

  // // Recalculate numberOfNights when any checkInDate or checkOutDate changes in vehicleHotelBookings
  // useEffect(() => {
  //   if (hotelBookings && Array.isArray(hotelBookings)) {
  //     hotelBookings.forEach((booking, index) => {
  //       if (booking.checkInDate && booking.checkOutDate) {
  //         console.log("working");
  //         const nights = dayjs(booking.checkOutDate).diff(
  //           dayjs(booking.checkInDate),
  //           "day"
  //         );
  //         // Update numberOfNights field for the specific record
  //         setValue(`vehicleHotelBookings.${index}.numberOfNights`, nights);
  //       }
  //     });
  //   }
  // }, [hotelBookings, setValue]);
  const AutoCalculateNights = ({ index, control, setValue }) => {
    const checkInDate = useWatch({
      control,
      name: `vehicleHotelBookings.${index}.checkInDate`,
    });
    const checkOutDate = useWatch({
      control,
      name: `vehicleHotelBookings.${index}.checkOutDate`,
    });

    useEffect(() => {
      if (checkInDate && checkOutDate) {
        const nights = dayjs(checkOutDate).diff(dayjs(checkInDate), "day");
        if (nights >= 0) {
          setValue(`vehicleHotelBookings.${index}.numberOfNights`, nights);
        } else {
          setValue(`vehicleHotelBookings.${index}.numberOfNights`, 0);
        }
      }
    }, [checkInDate, checkOutDate, index, setValue]);

    return null; // No UI output
  };

  // cities
  const { data: cities, isLoading: isCityLoading } = useQuery({
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

  // hotels
  const { data: hotels, isLoading: isHotelLoading } = useQuery({
    queryKey: ["hotels"],
    queryFn: async () => {
      const response = await get(`/hotels/all`);
      return response; // API returns the sector object directly
    },
  });

  const hotelOptions = [
    { id: "none", hotelName: "---" }, // The 'unselect' option
    ...(hotels ?? []),
  ];

  // vehicles
  const { data: vehicles, isLoading: isVehiclesLoading } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const response = await get(`/vehicles/all`);
      return response; // API returns the sector object directly
    },
  });

  const vehicleOptions = [
    { id: "none", vehicleName: "---" }, // The 'unselect' option
    ...(vehicles ?? []),
  ];

  // agents
  const { data: agents, isLoading: isAgentsLoading } = useQuery({
    queryKey: ["agents"],
    queryFn: async () => {
      const response = await get(`/agents/all`);
      return response; // API returns the sector object directly
    },
  });

  const vehicleAgents =
    agents?.filter((agent: any) => agent.isVehicle === true) ?? [];
  const agentOptions = [{ id: "none", agentName: "---" }, ...vehicleAgents];

  const { data: editVehicleBookingData, isLoading: editVehicleBookingLoading } =
    useQuery({
      queryKey: ["editVehicleBooking", vehicleBookingId],
      queryFn: async () => {
        const response = await get(
          `/group-client-vehicle-bookings/${vehicleBookingId}`
        );
        return response; // API returns the sector object directly
      },
    });

  const {
    data: editBookingData,
    isLoading: editBookingLoading,
    isError: isEditBookingError,
  } = useQuery({
    queryKey: ["editBooking", groupClientBookingId],
    queryFn: async () => {
      const response = await get(
        `/group-client-bookings/${groupClientBookingId}`
      );
      return response; // API returns the sector object directly
    },
  });

  useEffect(() => {
    if (mode === "create") {
      console.log("create mode");
      if (editBookingData) {
        if (
          editBookingData?.groupBooking?.groupBookingDetails &&
          Array.isArray(editBookingData?.groupBooking?.groupBookingDetails)
        ) {
          removeVehicleItineraries();

          const mappedItineraries =
            editBookingData?.groupBooking?.groupBookingDetails.map(
              (itinerary, index) => ({
                day: String(itinerary.day) || "",
                date: itinerary.date
                  ? new Date(new Date(itinerary.date).getTime())
                      .toISOString()
                      .split("T")[0]
                  : "",
                description: itinerary.description || "",
                cityId: itinerary.cityId ? String(itinerary.cityId) : "",
              })
            );

          appendVehicleItineraries(mappedItineraries);
        }
      }

      // vehicle hotel bookings
      if (editBookingData) {
        if (
          editBookingData?.hotelBookings &&
          Array.isArray(editBookingData?.hotelBookings)
        ) {
          removeVehicleHotelBookings();

          const mappedItineraries = editBookingData?.hotelBookings.map(
            (itinerary, index) => ({
              cityId: String(itinerary.cityId) || "",
              hotelId: String(itinerary.hotelId) || "",
              checkInDate: itinerary.checkInDate
                ? new Date(
                    new Date(itinerary.checkInDate).getTime() +
                      index * 24 * 60 * 60 * 1000
                  )
                    .toISOString()
                    .split("T")[0]
                : "",
              checkOutDate: itinerary.checkOutDate
                ? new Date(
                    new Date(itinerary.checkOutDate).getTime() +
                      index * 24 * 60 * 60 * 1000
                  )
                    .toISOString()
                    .split("T")[0]
                : "",
              numberOfRooms: itinerary.rooms ? String(itinerary.rooms) : "",
              plan: itinerary.plan || "",
              numberOfNights: itinerary.nights ? itinerary.nights : 0,
            })
          );

          appendVehicleHotelBookings(mappedItineraries);
        }
      }
    }
  }, [editBookingData]);

  useEffect(() => {
    if (editVehicleBookingData) {
      const vehicleItineraryData =
        editVehicleBookingData.vehicleItineraries?.map((itinerary) => ({
          itineraryId: itinerary.id ? String(itinerary.id) : "",
          day: String(itinerary.day) || "",
          description: itinerary.description || "",
          cityId: itinerary.cityId ? String(itinerary.cityId) : "",
          date: itinerary.date
            ? new Date(itinerary.date).toISOString().split("T")[0]
            : "",
        })) || [];

      const vehicleHotelBookingData =
        editVehicleBookingData.vehicleHotelBookings?.map((vehicle) => ({
          vehicleHotelId: vehicle.id ? String(vehicle.id) : "",
          cityId: vehicle.cityId ? String(vehicle.cityId) : "",
          hotelId: vehicle.hotelId ? String(vehicle.hotelId) : "",
          checkInDate: vehicle.checkInDate
            ? new Date(vehicle.checkInDate).toISOString().split("T")[0]
            : "",
          checkOutDate: vehicle.checkOutDate
            ? new Date(vehicle.checkOutDate).toISOString().split("T")[0]
            : "",
          plan: String(vehicle.plan) || "",
          numberOfRooms: vehicle.numberOfRooms
            ? String(vehicle.numberOfRooms)
            : "",
          numberOfNights: vehicle.numberOfNights ? vehicle.numberOfNights : 0,
        })) || [];

      reset({
        vehicleHrvNumber: editVehicleBookingData.vehicleHrvNumber || "",

        vehicleBookingDate: editVehicleBookingData.vehicleBookingDate
          ? new Date(editVehicleBookingData.vehicleBookingDate)
              .toISOString()
              .split("T")[0]
          : "",

        vehicleId: editVehicleBookingData.vehicleId
          ? editVehicleBookingData.vehicleId
          : "",

        numberOfVehicles: editVehicleBookingData.numberOfVehicles
          ? String(editVehicleBookingData.numberOfVehicles)
          : "",

        fromDate: editVehicleBookingData.fromDate
          ? new Date(editVehicleBookingData.fromDate)
              .toISOString()
              .split("T")[0]
          : "",

        toDate: editVehicleBookingData.toDate
          ? new Date(editVehicleBookingData.toDate).toISOString().split("T")[0]
          : "",

        days: editVehicleBookingData.days ? editVehicleBookingData.days : 0,

        cityId: editVehicleBookingData.cityId
          ? editVehicleBookingData.cityId
          : "",

        agentId: editVehicleBookingData.agentId
          ? editVehicleBookingData.agentId
          : "",

        pickupPlace: editVehicleBookingData.pickupPlace || "",

        terms: editVehicleBookingData.terms || "",
        amount: editVehicleBookingData.amount
          ? parseFloat(editVehicleBookingData.amount).toFixed(2)
          : "",

        specialRequest: editVehicleBookingData.specialRequest || "",

        vehicleNote: editVehicleBookingData.vehicleNote || "",

        specialNote: editVehicleBookingData.specialNote || "",

        summaryNote: editVehicleBookingData.summaryNote || "",

        billDescription: editVehicleBookingData.billDescription || "",
        vehicleItineraries: vehicleItineraryData,
        vehicleHotelBookings: vehicleHotelBookingData,
      });
    }
  }, [editVehicleBookingData, reset]);

  // Mutation for creating a user
  const createMutation = useMutation({
    mutationFn: (data: FormInputs) =>
      post(`/group-client-vehicle-bookings/${groupClientBookingId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries(["group-client-vehicle-bookings"]); // Refetch the users list
      toast.success("Vehicle Booking added successfully");
      navigate(
        `/groupBookings/${groupBookingId}/groupClientBooking/${groupClientBookingId}/edit`
      );
    },
    onError: (error: any) => {
      Validate(error, setError);
      toast.error(
        error.response?.data?.message || "Failed to create Vehicle booking"
      );
    },
  });

  // Mutation for updating a user
  const updateMutation = useMutation({
    mutationFn: (data: FormInputs) =>
      put(`/group-client-vehicle-bookings/${vehicleBookingId}`, data),
    onSuccess: () => {
      toast.success("Vehicle Booking updated successfully");
      queryClient.invalidateQueries(["group-client-vehicle-bookings"]);
      navigate(
        `/groupBookings/${groupBookingId}/groupClientBooking/${groupClientBookingId}/edit`
      );
    },
    onError: (error: any) => {
      Validate(error, setError);
      console.log("this is error", error);
      toast.error(
        error.response?.data?.message || "Failed to update vehicle booking"
      );
    },
  });
  // const checkInDate = useWatch({ control, name: "checkInDate" });
  // const checkOutDate = useWatch({ control, name: "checkOutDate" });
  const fromDate = watch("fromDate");
  const toDate = watch("toDate");

  useEffect(() => {
    if (fromDate && toDate) {
      const nights = dayjs(toDate).diff(dayjs(fromDate), "day");
      if (nights >= 0) {
        setValue("days", nights);
      }
    }
  }, [fromDate, toDate, setValue]);

  const onSubmit: SubmitHandler<FormInputs> = (data) => {
    if (mode === "create") {
      createMutation.mutate(data);
    } else {
      updateMutation.mutate(data);
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <>
      {/* JSX Code for HotelForm.tsx */}
      {/* {Object.entries(errors).map(([field, error]) => (
        <p key={field} className="text-red-500 text-sm">
          {error?.message as string}
        </p>
      ))} */}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card className="mx-auto mt-10 ">
          <CardContent className="pt-6 space-y-8">
            {/* start */}
            <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-8">
              Vehicle Itinerary
            </CardTitle>
            <div className="mt-5">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-22 px-1">Day</TableHead>
                    <TableHead className="w-36 px-1">Date</TableHead>
                    <TableHead className="w-[400px] px-1">
                      Description
                    </TableHead>
                    <TableHead className="w-[150px] px-1">Night Halt</TableHead>
                    <TableHead className="w-1 px-1 text-end">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicleItinerariesFields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell className="w-20 px-1">
                        <Input
                          {...register(`vehicleItineraries.${index}.day`)}
                          type="text"
                          placeholder="day"
                          className="w-20 m-0"
                        />
                        {errors.vehicleItineraries?.[index]?.day && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.vehicleItineraries[index]?.day?.message}
                          </p>
                        )}
                      </TableCell>

                      <TableCell className="max-w-[100px] px-1">
                        <Input
                          {...register(`vehicleItineraries.${index}.date`)}
                          type="date"
                          className="w-full"
                        />
                        {errors.vehicleItineraries?.[index]?.date && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.vehicleItineraries[index]?.date?.message}
                          </p>
                        )}
                      </TableCell>

                      <TableCell className="max-w-[500px] px-1 whitespace-normal break-words">
                        <Textarea
                          {...register(
                            `vehicleItineraries.${index}.description`
                          )}
                          className="max-w-[500px] lg:w-full"
                          placeholder="description"
                          rows={4}
                        />
                        {errors.vehicleItineraries?.[index]?.description && (
                          <p className="text-red-500 text-xs mt-1">
                            {
                              errors.vehicleItineraries[index]?.description
                                ?.message
                            }
                          </p>
                        )}
                      </TableCell>

                      <TableCell className="max-w-[150px] px-1">
                        <Controller
                          name={`vehicleItineraries.${index}.cityId`}
                          control={control}
                          render={({ field }) => (
                            <Select
                              key={field.value}
                              // onValueChange={(value) => {
                              //   setValue(`itineraries.${index}.cityId`, value);
                              // }}
                              onValueChange={(value) =>
                                setValue(
                                  `vehicleItineraries.${index}.cityId`,
                                  value === "none" ? "" : value
                                )
                              }
                              value={watch(
                                `vehicleItineraries.${index}.cityId`
                              )}
                            >
                              <SelectTrigger className="w-full ">
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
                        {errors.vehicleItineraries?.[index]?.cityId && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.vehicleItineraries[index]?.cityId?.message}
                          </p>
                        )}
                      </TableCell>

                      <Input
                        type="hidden"
                        {...register(`vehicleItineraries.${index}.itineraryId`)}
                      />
                      {errors.vehicleItineraries?.[index]?.itineraryId && (
                        <p className="text-red-500 text-xs mt-1">
                          {
                            errors.vehicleItineraries[index]?.itineraryId
                              ?.message
                          }
                        </p>
                      )}

                      <TableCell className="w-[32px] text-right m-0  p-0">
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="text-right "
                          onClick={() => removeVehicleItineraries(index)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex w-full justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4 "
                  onClick={() => {
                    appendVehicleItineraries({
                      itineraryId: "",
                      day: "",
                      date: "",
                      description: "",
                      cityId: "",
                    });
                  }}
                >
                  <PlusCircle className=" h-5 w-5" />
                </Button>
              </div>
            </div>
            {/* end */}

            {/* vehicleHotel start */}

            {/* start */}
            <CardTitle className="text-lg font-semibold text-gray-800 dark:text-gray-200 mt-8">
              Vehicle Hotel Booking
            </CardTitle>
            <div className="mt-5">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-22 px-1">City</TableHead>
                    <TableHead className="w-[100px] px-1">Hotel</TableHead>
                    <TableHead className="w-[400px] px-1">
                      Check In Date
                    </TableHead>
                    <TableHead className="w-[400px] px-1">
                      Check Out Date
                    </TableHead>
                    <TableHead className="w-40 px-1">No. Of Rooms</TableHead>
                    <TableHead className="w-40 px-1">Plan</TableHead>
                    <TableHead className="w-40 px-1">No. Of Nights</TableHead>
                    <TableHead className="w-1 px-1 text-end">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicleHotelBookingsFields.map((field, index) => (
                    <TableRow key={field.id}>
                      {/* calculate nights */}
                      <AutoCalculateNights
                        index={index}
                        control={control}
                        setValue={setValue}
                      />

                      <TableCell className="max-w-[150px] px-1">
                        <Controller
                          name={`vehicleHotelBookings.${index}.cityId`}
                          control={control}
                          render={({ field }) => (
                            <Select
                              key={field.value}
                              // onValueChange={(value) => {
                              //   setValue(`itineraries.${index}.cityId`, value);
                              // }}
                              onValueChange={(value) =>
                                setValue(
                                  `vehicleHotelBookings.${index}.cityId`,
                                  value === "none" ? "" : value
                                )
                              }
                              value={watch(
                                `vehicleHotelBookings.${index}.cityId`
                              )}
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
                        {errors.vehicleHotelBookings?.[index]?.cityId && (
                          <p className="text-red-500 text-xs mt-1">
                            {
                              errors.vehicleHotelBookings[index]?.cityId
                                ?.message
                            }
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[150px] px-1">
                        <Controller
                          name={`vehicleHotelBookings.${index}.hotelId`}
                          control={control}
                          render={({ field }) => (
                            <Select
                              key={field.value}
                              // onValueChange={(value) => {
                              //   setValue(`itineraries.${index}.cityId`, value);
                              // }}
                              onValueChange={(value) =>
                                setValue(
                                  `vehicleHotelBookings.${index}.hotelId`,
                                  value === "none" ? "" : value
                                )
                              }
                              value={watch(
                                `vehicleHotelBookings.${index}.hotelId`
                              )}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select a hotel" />
                              </SelectTrigger>
                              <SelectContent>
                                {hotelOptions?.map((hotel) => (
                                  <SelectItem
                                    key={hotel.id}
                                    value={String(hotel.id)}
                                  >
                                    {hotel.hotelName}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {errors.vehicleHotelBookings?.[index]?.hotelId && (
                          <p className="text-red-500 text-xs mt-1">
                            {
                              errors.vehicleHotelBookings[index]?.hotelId
                                ?.message
                            }
                          </p>
                        )}
                      </TableCell>

                      <TableCell className="w-36 px-1">
                        <Input
                          {...register(
                            `vehicleHotelBookings.${index}.checkInDate`
                          )}
                          type="date"
                          className="w-full"
                        />
                        {errors.vehicleHotelBookings?.[index]?.checkInDate && (
                          <p className="text-red-500 text-xs mt-1">
                            {
                              errors.vehicleHotelBookings[index]?.checkInDate
                                ?.message
                            }
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="w-36 px-1">
                        <Input
                          {...register(
                            `vehicleHotelBookings.${index}.checkOutDate`
                          )}
                          type="date"
                          className="w-full"
                        />
                        {errors.vehicleHotelBookings?.[index]?.checkOutDate && (
                          <p className="text-red-500 text-xs mt-1">
                            {
                              errors.vehicleHotelBookings[index]?.checkOutDate
                                ?.message
                            }
                          </p>
                        )}
                      </TableCell>

                      <TableCell className="max-w-[500px] px-1 whitespace-normal break-words">
                        <Controller
                          name={`vehicleHotelBookings.${index}.numberOfRooms`}
                          control={control}
                          render={({ field }) => (
                            <Select
                              key={field.value}
                              onValueChange={(value) =>
                                setValue(
                                  `vehicleHotelBookings.${index}.numberOfRooms`,
                                  value === "none" ? "" : value
                                )
                              }
                              value={watch(
                                `vehicleHotelBookings.${index}.numberOfRooms`
                              )}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                                {roomOptions.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={String(option.value)}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {errors.vehicleHotelBookings?.[index]
                          ?.numberOfRooms && (
                          <p className="text-red-500 text-xs mt-1">
                            {
                              errors.vehicleHotelBookings[index]?.numberOfRooms
                                ?.message
                            }
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[150px] px-1 whitespace-normal break-words">
                        <Controller
                          name={`vehicleHotelBookings.${index}.plan`}
                          control={control}
                          render={({ field }) => (
                            <Select
                              key={field.value}
                              onValueChange={(value) =>
                                setValue(
                                  `vehicleHotelBookings.${index}.plan`,
                                  value === "none" ? "" : value
                                )
                              }
                              value={watch(
                                `vehicleHotelBookings.${index}.plan`
                              )}
                            >
                              <SelectTrigger className="w-full">
                                <SelectValue placeholder="Select" />
                              </SelectTrigger>
                              <SelectContent>
                                {planOptions.map((option) => (
                                  <SelectItem
                                    key={option.value}
                                    value={String(option.value)}
                                  >
                                    {option.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        />
                        {errors.vehicleHotelBookings?.[index]?.plan && (
                          <p className="text-red-500 text-xs mt-1">
                            {errors.vehicleHotelBookings[index]?.plan?.message}
                          </p>
                        )}
                      </TableCell>

                      <TableCell className="w-36 px-1">
                        <Input
                          {...register(
                            `vehicleHotelBookings.${index}.numberOfNights`
                          )}
                          type="number"
                          className="w-full"
                        />
                        {errors.vehicleHotelBookings?.[index]
                          ?.numberOfNights && (
                          <p className="text-red-500 text-xs mt-1">
                            {
                              errors.vehicleHotelBookings[index]?.numberOfNights
                                ?.message
                            }
                          </p>
                        )}
                      </TableCell>

                      <Input
                        type="hidden"
                        {...register(
                          `vehicleHotelBookings.${index}.vehicleHotelId`
                        )}
                      />
                      {errors.vehicleHotelBookings?.[index]?.vehicleHotelId && (
                        <p className="text-red-500 text-xs mt-1">
                          {
                            errors.vehicleHotelBookings[index]?.vehicleHotelId
                              ?.message
                          }
                        </p>
                      )}

                      <TableCell className="w-[32px] text-right m-0 p-0">
                        {/* <Button
                          variant="outline"
                          size="icon"
                          type="button"
                          onClick={() =>
                            insertVehicleHotelBooking(
                              index + 1,
                              defaultHotelBooking
                            )
                          }
                        >
                          <PlusCircle className="h-4 w-4" />
                        </Button> */}
                        <Button
                          type="button"
                          variant="destructive"
                          size="icon"
                          className="text-right "
                          onClick={() => removeVehicleHotelBookings(index)}
                        >
                          <Trash2 size={16} />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex w-full justify-end">
                <Button
                  type="button"
                  variant="outline"
                  className="mt-4 "
                  onClick={() => {
                    appendVehicleHotelBookings({
                      vehicleHotelId: "",
                      cityId: "",
                      hotelId: "",
                      checkInDate: "",
                      checkOutDate: "",
                      numberOfRooms: "",
                      plan: "",
                      numberOfNights: 0,
                    });
                  }}
                >
                  <PlusCircle className=" h-5 w-5" />
                </Button>
              </div>
            </div>
            {/* end */}
            {/* vehicle hotel End */}

            <CardTitle className="font-semibold mt-5 text-gray-800 dark:text-gray-200 mb-4">
              Vehicle Booking
            </CardTitle>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {/* HRV number */}
              <div>
                <Label
                  htmlFor="vehicleHrvNumber"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  HRV
                </Label>
                <Input
                  id="vehicleHrvNumber"
                  {...register("vehicleHrvNumber")}
                  readOnly
                  className="bg-gray-200"
                  placeholder="hrv"
                />
                {errors.vehicleHrvNumber && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.vehicleHrvNumber.message}
                  </p>
                )}
              </div>

              {/* vehicle booking Date */}
              <div>
                <Label
                  htmlFor="vehicleBookingDate"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Vehicle Booking Date <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="vehicleBookingDate"
                  type="date"
                  {...register("vehicleBookingDate")}
                />
                {errors.vehicleBookingDate && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.vehicleBookingDate.message}
                  </p>
                )}
              </div>

              {/* Vehicle ID */}
              <div>
                <Label
                  htmlFor="vehicleId"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Vehicle <span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="vehicleId"
                  control={control}
                  render={({ field }) => (
                    <Popover
                      open={openVehicleId}
                      onOpenChange={setOpenVehicleId}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openVehicleId ? "true" : "false"} // This should depend on the popover state
                          className=" w-[300px] justify-between mt-1"
                          onClick={() => setOpenVehicleId((prev) => !prev)} // Toggle popover on button click
                        >
                          {field.value
                            ? vehicleOptions &&
                              vehicleOptions.find(
                                (vehicle) => vehicle.id === field.value
                              )?.vehicleName
                            : "Select vehicle"}
                          <ChevronsUpDown className="opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[325px] p-0">
                        <Command>
                          <CommandInput
                            placeholder="Search vehicle..."
                            className="h-9"
                          />
                          <CommandList>
                            <CommandEmpty>No vehicle found.</CommandEmpty>
                            <CommandGroup>
                              {vehicleOptions &&
                                vehicleOptions.map((vehicle) => (
                                  <CommandItem
                                    key={vehicle.id}
                                    // value={String(vehicle.id)}
                                    value={
                                      vehicle?.vehicleName
                                        ? vehicle.vehicleName.toLowerCase()
                                        : ""
                                    } // 👈 Use accommodation name for filtering
                                    onSelect={(currentValue) => {
                                      if (vehicle.id === "none") {
                                        setValue("vehicleId", ""); // Clear the value
                                      } else {
                                        setValue("vehicleId", vehicle.id);
                                      }
                                      // handleTourSelectChange(airline);
                                      setOpenVehicleId(false);
                                      // Close popover after selection
                                    }}
                                  >
                                    {vehicle.vehicleName}
                                    <Check
                                      className={cn(
                                        "ml-auto",
                                        vehicle.id === field.value
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                />
                {errors.vehicleId && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.vehicleId.message}
                  </p>
                )}
              </div>

              {/* no of vehicles */}
              <div>
                <Label
                  htmlFor="numberOfVehicles"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  No. Of Vehicles <span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="numberOfVehicles"
                  control={control}
                  render={({ field }) => (
                    <Select
                      key={field.value}
                      onValueChange={(value) =>
                        setValue(
                          "numberOfVehicles",
                          value === "none" ? "" : value
                        )
                      }
                      value={watch("numberOfVehicles")}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        {noOfVehiclesOptions.map((option) => (
                          <SelectItem
                            key={option.value}
                            value={String(option.value)}
                          >
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.numberOfVehicles && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.numberOfVehicles.message}
                  </p>
                )}
              </div>
              {/* from  Date */}
              <div>
                <Label
                  htmlFor="fromDate"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  From Date <span className="text-red-500">*</span>
                </Label>
                <Input id="fromDate" type="date" {...register("fromDate")} />
                {errors.fromDate && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.fromDate.message}
                  </p>
                )}
              </div>

              {/* to Date */}
              <div>
                <Label
                  htmlFor="toDate"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  To Date <span className="text-red-500">*</span>
                </Label>
                <Input id="toDate" type="date" {...register("toDate")} />
                {errors.toDate && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.toDate.message}
                  </p>
                )}
              </div>

              {/* days */}
              <div>
                <Label
                  htmlFor="days"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Days
                </Label>
                <Input
                  id="days"
                  readOnly
                  className="bg-gray-200"
                  type="number"
                  {...register("days")}
                />
                {errors.days && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.days.message}
                  </p>
                )}
              </div>

              {/* City ID */}
              <div>
                <Label
                  htmlFor="cityId"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  City <span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="cityId"
                  control={control}
                  render={({ field }) => (
                    <Popover open={openCityId} onOpenChange={setOpenCityId}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openCityId ? "true" : "false"} // This should depend on the popover state
                          className=" w-[320px] overflow-hidden justify-between mt-1"
                          onClick={() => setOpenCityId((prev) => !prev)} // Toggle popover on button click
                        >
                          {field.value
                            ? cityOptions &&
                              cityOptions.find(
                                (city) => city.id === field.value
                              )?.cityName
                            : "Select city"}
                          <ChevronsUpDown className="opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[325px] p-0">
                        <Command>
                          <CommandInput
                            placeholder="Search city..."
                            className="h-9"
                          />
                          <CommandList>
                            <CommandEmpty>No city found.</CommandEmpty>
                            <CommandGroup>
                              {cityOptions &&
                                cityOptions.map((city) => (
                                  <CommandItem
                                    key={city.id}
                                    // value={String(city.id)}
                                    value={
                                      city?.cityName
                                        ? city.cityName.toLowerCase()
                                        : ""
                                    } // 👈 Use city name for filtering
                                    onSelect={(currentValue) => {
                                      if (city.id === "none") {
                                        setValue("cityId", ""); // Clear the value
                                      } else {
                                        setValue("cityId", city.id);
                                      }
                                      // handleTourSelectChange(airline);
                                      setOpenCityId(false);
                                      // Close popover after selection
                                    }}
                                  >
                                    {city.cityName}
                                    <Check
                                      className={cn(
                                        "ml-auto",
                                        city.id === field.value
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                />
                {errors.cityId && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.cityId.message}
                  </p>
                )}
              </div>

              {/* Agent ID */}
              <div>
                <Label
                  htmlFor="agentId"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Agent <span className="text-red-500">*</span>
                </Label>
                <Controller
                  name="agentId"
                  control={control}
                  render={({ field }) => (
                    <Popover open={openAgentId} onOpenChange={setOpenAgentId}>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openAgentId ? "true" : "false"} // This should depend on the popover state
                          className=" w-[320px] overflow-hidden justify-between mt-1"
                          onClick={() => setOpenAgentId((prev) => !prev)} // Toggle popover on button click
                        >
                          {field.value
                            ? agentOptions &&
                              agentOptions.find(
                                (agent) => agent.id === field.value
                              )?.agentName
                            : "Select agent"}
                          <ChevronsUpDown className="opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-[325px] p-0">
                        <Command>
                          <CommandInput
                            placeholder="Search agent..."
                            className="h-9"
                          />
                          <CommandList>
                            <CommandEmpty>No Agent found.</CommandEmpty>
                            <CommandGroup>
                              {agentOptions &&
                                agentOptions.map((agent) => (
                                  <CommandItem
                                    key={agent.id}
                                    // value={String(agent.id)}
                                    value={
                                      agent?.agentName
                                        ? agent.agentName.toLowerCase()
                                        : ""
                                    } // 👈 Use hotel name for filtering
                                    onSelect={(currentValue) => {
                                      if (agent.id === "none") {
                                        setValue("agentId", ""); // Clear the value
                                      } else {
                                        setValue("agentId", agent.id);
                                      }
                                      // handleTourSelectChange(airline);
                                      setOpenAgentId(false);
                                      // Close popover after selection
                                    }}
                                  >
                                    {agent.agentName}
                                    <Check
                                      className={cn(
                                        "ml-auto",
                                        agent.id === field.value
                                          ? "opacity-100"
                                          : "opacity-0"
                                      )}
                                    />
                                  </CommandItem>
                                ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                  )}
                />
                {errors.agentId && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.agentId.message}
                  </p>
                )}
              </div>
              {/* Pickup Place */}
              <div>
                <Label
                  htmlFor="pickupPlace"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Pickup Place <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="pickupPlace"
                  {...register("pickupPlace")}
                  placeholder="Pickup Place"
                />
                {errors.pickupPlace && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.pickupPlace.message}
                  </p>
                )}
              </div>
              {/* Accommodation Note */}
              <div>
                <Label
                  htmlFor="terms"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Terms
                </Label>
                <Textarea
                  id="terms"
                  {...register("terms")}
                  placeholder="terms"
                  rows={4}
                />
                {errors.terms && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.terms.message}
                  </p>
                )}
              </div>

              {/* Special Request */}
              <div>
                <Label
                  htmlFor="specialRequest"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Special Request
                </Label>
                <Textarea
                  id="specialRequest"
                  {...register("specialRequest")}
                  placeholder="Special Request"
                  rows={4}
                />
                {errors.specialRequest && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.specialRequest.message}
                  </p>
                )}
              </div>
              {/* Vehicle Note */}
              <div>
                <Label
                  htmlFor="vehicleNote"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Vehicle Note
                </Label>
                <Textarea
                  id="vehicleNote"
                  {...register("vehicleNote")}
                  placeholder="Vehicle Note"
                  rows={4}
                />
                {errors.vehicleNote && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.vehicleNote.message}
                  </p>
                )}
              </div>
              {/* Special Note */}
              <div>
                <Label
                  htmlFor="specialNote"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Special Note
                </Label>
                <Textarea
                  id="specialNote"
                  {...register("specialNote")}
                  placeholder="Special Note"
                  rows={4}
                />
                {errors.specialNote && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.specialNote.message}
                  </p>
                )}
              </div>
              {/* Summary Note */}
              <div>
                <Label
                  htmlFor="summaryNote"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Summary Note
                </Label>
                <Textarea
                  id="summaryNote"
                  {...register("summaryNote")}
                  placeholder="Summary Note"
                  rows={4}
                />
                {errors.summaryNote && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.summaryNote.message}
                  </p>
                )}
              </div>
              {/* Bill Description */}
              <div>
                <Label
                  htmlFor="billDescription"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Bill Description
                </Label>
                <Textarea
                  id="billDescription"
                  {...register("billDescription")}
                  placeholder="Bill Description"
                  rows={4}
                />
                {errors.billDescription && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.billDescription.message}
                  </p>
                )}
              </div>
              <div className=" md:col-start-3">
                <Label
                  htmlFor="amount"
                  className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
                >
                  Amount <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="amount"
                  {...register("amount")}
                  step="0.01"
                  type="number"
                  placeholder="Enter amount"
                />
                {errors.amount && (
                  <p className="text-red-500 text-xs mt-1">
                    {errors.amount.message}
                  </p>
                )}
              </div>
            </div>
          </CardContent>

          {/* Submit/Cancel Buttons */}
          <div className="flex justify-end gap-3 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 rounded-b-lg">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                navigate(
                  `/groupBookings/${groupBookingId}/groupClientBooking/${groupClientBookingId}/edit`
                )
              }
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading} className="min-w-[90px]">
              {isLoading ? (
                <LoaderCircle className="animate-spin h-4 w-4" />
              ) : mode === "create" ? (
                "Create Vehicle booking"
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

export default GroupClientVehicleBookingForm;
