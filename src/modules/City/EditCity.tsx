import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { get, put } from "@/services/apiService";
import { z } from "zod";
import { toast } from "sonner";
import { Button, Input } from "@/components/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Loader } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

const citySchema = z.object({
  cityName: z.string().min(1, "City name is required"),
  countryId: z.number().min(1, "Country is required"),
  stateId: z.number().min(1, "State is required"),
});

type CityFormData = z.infer<typeof citySchema>;

interface EditCityProps {
  cityId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

interface StateResponse {
  id: number;
  stateName: string;
  country: {
    id: number;
    countryName: string;
  };
}

interface CountryResponse {
  countries: {
    id: number;
    countryName: string;
  }[];
}

interface CityResponse {
  id: number;
  cityName: string;
  state: {
    stateName: string;
    country: {
      countryName: string;
    };
  };
  createdAt: string;
  updatedAt: string;
}

const EditCity = ({ cityId, isOpen, onClose }: EditCityProps) => {
  const queryClient = useQueryClient();
  const [openState, setOpenState] = React.useState(false);
  const [openCountry, setOpenCountry] = React.useState(false);

  const { data: countriesData } = useQuery<CountryResponse>({
    queryKey: ["countries"],
    queryFn: () => get("/countries"),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<CityFormData>({
    resolver: zodResolver(citySchema),
    defaultValues: {
      cityName: "",
      countryId: undefined,
      stateId: undefined,
    },
  });

  const { data: cityData, isLoading: isCityLoading } = useQuery<CityResponse>({
    queryKey: ["cities", cityId],
    queryFn: () => get(`/cities/${cityId}`),
    enabled: !!cityId && isOpen,
  });

  const selectedCountryId = watch("countryId");

  const { data: statesData, isLoading: isStatesLoading } = useQuery<
    StateResponse[]
  >({
    queryKey: ["states", selectedCountryId],
    queryFn: () => {
      if (!selectedCountryId) return null;
      return get(`/states/by-country/${selectedCountryId}`);
    },
    enabled: !!selectedCountryId,
  });

  const states = React.useMemo(() => {
    return statesData || [];
  }, [statesData]);

  useEffect(() => {
    if (cityData) {
      const fetchInitialData = async () => {
        try {
          const countriesResponse = await get("/countries");
          const selectedCountry = countriesResponse.countries.find(
            (country) =>
              country.countryName === cityData.state.country.countryName
          );

          if (selectedCountry) {
            setValue("countryId", selectedCountry.id);

            const statesResponse: StateResponse[] = await get(
              `/states/by-country/${selectedCountry.id}`
            );
            const selectedState = statesResponse.find(
              (state) => state.stateName === cityData.state.stateName
            );

            reset({
              cityName: cityData.cityName,
              countryId: selectedCountry.id,
              stateId: selectedState?.id,
            });
          }
        } catch (error) {
          console.error("Error fetching initial data:", error);
          toast.error("Failed to load city data");
        }
      };

      fetchInitialData();
    }
  }, [cityData, reset, setValue]);

  const updateCityMutation = useMutation({
    mutationFn: (data: CityFormData) => put(`/cities/${cityId}`, data),
    onSuccess: () => {
      toast.success("City updated successfully");
      queryClient.invalidateQueries(["cities"]);
      onClose();
    },
    onError: () => {
      toast.error("Failed to update city");
    },
  });

  const onSubmit = (data: CityFormData) => {
    updateCityMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit City</DialogTitle>
        </DialogHeader>
        {isCityLoading ? (
          <div className="flex justify-center items-center h-[200px]">
            <Loader className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid gap-4">
              {/* Country Selection */}
              <div className="grid gap-2 relative">
                <Label>Select Country</Label>
                <Popover open={openCountry} onOpenChange={setOpenCountry}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openCountry}
                      className="justify-between"
                    >
                      {watch("countryId")
                        ? countriesData?.countries.find(
                            (country) => country.id === watch("countryId")
                          )?.countryName
                        : "Select country..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search country..." />
                      <CommandEmpty>No country found.</CommandEmpty>
                      <CommandGroup>
                        {countriesData?.countries.map((country) => (
                          <CommandItem
                            key={country.id}
                            value={country.id.toString()}
                            onSelect={() => {
                              setValue("countryId", country.id, {
                                shouldValidate: true,
                              });
                              setValue("stateId", undefined);
                              setOpenCountry(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                watch("countryId") === country.id
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {country.countryName}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                {errors.countryId && (
                  <span className="text-red-500 text-sm absolute bottom-0 translate-y-[110%]">
                    {errors.countryId.message}
                  </span>
                )}
              </div>

              {/* State Selection */}
              <div className="grid gap-2 relative">
                <Label>Select State</Label>
                <Popover open={openState} onOpenChange={setOpenState}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={openState}
                      className="justify-between"
                      disabled={!selectedCountryId}
                    >
                      {watch("stateId")
                        ? states.find((state) => state.id === watch("stateId"))
                            ?.stateName
                        : "Select state..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search state..." />
                      <CommandEmpty>No state found.</CommandEmpty>
                      <CommandGroup>
                        {states.map((state) => (
                          <CommandItem
                            key={state.id}
                            value={state.stateName}
                            onSelect={() => {
                              setValue("stateId", state.id);
                              setOpenState(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                watch("stateId") === state.id
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {state.stateName}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
                {errors.stateId && (
                  <span className="text-red-500 text-sm absolute bottom-0 translate-y-[110%]">
                    {errors.stateId.message}
                  </span>
                )}
              </div>

              {/* City Name Input */}
              <div className="grid gap-2 relative">
                <Label htmlFor="cityName">City Name</Label>
                <Input
                  id="cityName"
                  placeholder="Enter City Name..."
                  {...register("cityName")}
                />
                {errors.cityName && (
                  <span className="text-red-500 text-sm absolute bottom-0 translate-y-[110%]">
                    {errors.cityName.message}
                  </span>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button
                type="submit"
                className="bg-primary text-white"
                disabled={updateCityMutation.isLoading}
              >
                Update City
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="ml-2"
              >
                Cancel
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default EditCity;
