import React from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { post, get } from "@/services/apiService";
import { Button, Input } from "@/components/ui";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
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
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

const citiesSchema = z.object({
  cityName: z.string().min(1, "City name is required"),
  countryId: z.number().min(0, "Country is required"),
  stateId: z.number().min(0, "State is required"),
});

type CityFormData = z.infer<typeof citiesSchema>;

interface CreateCityProps {
  isOpen: boolean;
  onClose: () => void;
}

interface StateResponse {
  states: {
    id: number;
    stateName: string;
    country: {
      id: number;
      countryName: string;
    };
    createdAt: string;
    updatedAt: string;
  }[];
  page: number;
  totalPages: number;
  totalStates: number;
}

interface CountryResponse {
  countries: {
    id: number;
    countryName: string;
    createdAt: string;
    updatedAt: string;
  }[];
}

const CreateCity: React.FC<CreateCityProps> = ({ isOpen, onClose }) => {
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
    resolver: zodResolver(citiesSchema),
    defaultValues: {
      cityName: "",
      countryId: undefined,
      stateId: undefined,
    },
  });

  const selectedCountryId = watch("countryId");

  const { data: statesData } = useQuery<StateResponse>({
    queryKey: ["states", selectedCountryId],
    queryFn: () =>
      selectedCountryId ? get(`/states?countryId=${selectedCountryId}`) : null,
    enabled: !!selectedCountryId,
  });

  // Replace the filteredStates memo with direct states access
  const states = statesData?.states ?? [];

  const createCityMutation = useMutation({
    mutationFn: (newCity: CityFormData) => post("/cities", newCity),
    onSuccess: () => {
      toast.success("City created successfully");
      queryClient.invalidateQueries(["cities"]);
      reset();
      onClose();
    },
    onError: () => {
      toast.error("Failed to create cities");
    },
  });

  const onSubmit = (data: CityFormData) => {
    createCityMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid gap-4">
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
              type="button"
              variant="outline"
              onClick={onClose}
              className="ml-2"
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-primary text-white">
              Create
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateCity;
