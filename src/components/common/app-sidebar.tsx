"use client";

import * as React from "react";
import {
  ArrowUpCircleIcon,
  AudioWaveform,
  BookOpen,
  Bot,
  Command,
  UsersRound,
  GalleryVerticalEnd,
  Map,
  PieChart,
  Settings2,
  SquareTerminal,
  Icon,
} from "lucide-react";

import { NavMain } from "@/components/common/nav-main";
import { NavProjects } from "@/components/common/nav-projects";
import { NavUser } from "@/components/common/nav-user";
// import { TeamSwitcher } from "@/components/common/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import { appName } from "@/config";
const UserData = JSON.parse(localStorage.getItem("user") || "{}");
const agencyDetailsId = UserData?.agency?.id;
// This is sample data.
const initialData = {
  roles: {
    super_admin: {
      projects: [
        {
          name: "Packages",
          url: "/packages",
          icon: UsersRound,
        },
        {
          name: "Agencies",
          url: "/agencies",
          icon: UsersRound,
        },
        {
          name: "Manage Users",
          url: "/users",
          icon: UsersRound,
        },
      ],
      //   navMain: [
      //     {
      //       title: "Masters",
      //       url: "#",
      //       icon: SquareTerminal,
      //       isActive: true,
      //       items: [
      //         { title: "Country", url: "/countries" },
      //         { title: "State", url: "./states" },
      //         { title: "City", url: "/cities" },
      //       ],
      //     },
      //   ],
    },
    admin: {
      projects: [],

      navMain: [
        {
          title: "Masters",
          url: "#",
          icon: SquareTerminal,
          isActive: false,
          items: [
            { title: "Agency", url: `/agencies/profile/${agencyDetailsId}` },
            { title: "Country", url: "/countries" },
            { title: "State", url: "./states" },
            { title: "City", url: "/cities" },
            { title: "Sector", url: "/sectors" },
            { title: "Branches", url: "/branches" },
            { title: "Staff", url: "/staff" },
            { title: "Accommodation", url: "/accommodations" },
            { title: "Vehicle", url: "/vehicles" },
            { title: "Airline", url: "/airlines" },
            { title: "Banks", url: "/banks" },
            { title: "Hotels", url: "/hotels" },
            { title: "Agents", url: "/agents" },
            { title: "Clients", url: "/clients" },
            { title: "Services", url: "/services" },
          ],
        },
        {
          title: "Tours",
          url: "#",
          icon: SquareTerminal,
          isActive: false,
          items: [
            { title: "Tours", url: "/tours" },
            { title: "Tour Enquiries", url: "/tours/enquiries" },
            { title: "Tour Booking", url: "/bookings" },
          ],
        },
      ],
    },
    // branch start
    branch_admin: {
      projects: [],
      navMain: [
        {
          title: "Masters",
          url: "#",
          icon: SquareTerminal,
          isActive: false,
          items: [
            { title: "Country", url: "/countries" },
            { title: "State", url: "./states" },
            { title: "City", url: "/cities" },
            { title: "Sector", url: "/sectors" },
            // { title: "Branches", url: "/branches" },
            { title: "Staff", url: "/staff" },
            { title: "Accommodation", url: "/accommodations" },
            { title: "Vehicle", url: "/vehicles" },
            { title: "Airline", url: "/airlines" },
            { title: "Banks", url: "/banks" },
            { title: "Hotels", url: "/hotels" },
            { title: "Agents", url: "/agents" },
            { title: "Clients", url: "/clients" },
            { title: "Services", url: "/services" },
          ],
        },
        {
          title: "Tours",
          url: "#",
          icon: SquareTerminal,
          isActive: false,
          items: [
            { title: "Tours", url: "/tours" },
            { title: "Tour Enquiries", url: "/tours/enquiries" },
            { title: "Tour Booking", url: "/bookings" },
          ],
        },
      ],
    },
    // branch end
    // user start
    user: {
      projects: [],
      navMain: [
        {
          title: "Masters",
          url: "#",
          icon: SquareTerminal,
          isActive: false,
          items: [
            { title: "Country", url: "/countries" },
            { title: "State", url: "./states" },
            { title: "City", url: "/cities" },
            { title: "Sector", url: "/sectors" },
            // { title: "Branches", url: "/branches" },
            { title: "Staff", url: "/staff" },
            { title: "Accommodation", url: "/accommodations" },
            { title: "Vehicle", url: "/vehicles" },
            { title: "Airline", url: "/airlines" },
            { title: "Banks", url: "/banks" },
            { title: "Hotels", url: "/hotels" },
            { title: "Agents", url: "/agents" },
            { title: "Clients", url: "/clients" },
            { title: "Services", url: "/services" },
          ],
        },
        {
          title: "Tours",
          url: "#",
          icon: SquareTerminal,
          isActive: false,
          items: [
            { title: "Tours", url: "/tours" },
            { title: "Tour Enquiries", url: "/tours/enquiries" },
            { title: "Tour Booking", url: "/bookings" },
          ],
        },
      ],
    },
    // user end
  },
  user: {
    name: "",
    email: "",
    avatar: "",
    avatarName: "",
  },
  teams: [
    {
      name: "Acme Inc",
      logo: GalleryVerticalEnd,
      plan: "Enterprise",
    },
    {
      name: "Acme Corp.",
      logo: AudioWaveform,
      plan: "Startup",
    },
    {
      name: "Evil Corp.",
      logo: Command,
      plan: "Free",
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [data, setData] = React.useState({
    ...initialData,
    projects: [],
    navMain: [],
  });

  // React.useEffect(() => {
  //   const storedUser = localStorage.getItem("user");
  //   if (storedUser) {
  //     try {
  //       const parsedUser = JSON.parse(storedUser);
  //       parsedUser.avatarName = parsedUser.name.charAt(0).toUpperCase();
  //       const role = parsedUser.role || "admin";
  //       const roleData = initialData.roles[role];

  //       setData((prevData) => ({
  //         ...prevData,
  //         projects: roleData?.projects || [],
  //         navMain: roleData?.navMain || [],
  //         user: parsedUser,
  //       }));
  //     } catch (error) {
  //       console.error("Failed to parse user from localStorage", error);
  //     }
  //   }
  // }, []);
  React.useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        parsedUser.avatarName = parsedUser.name.charAt(0).toUpperCase();
        const role = parsedUser.role || "admin";
        const roleData = initialData.roles[role];

        // Extract agencyDetailsId safely here
        const agencyDetailsId = parsedUser?.agency?.id || "";

        // If navMain has URLs that depend on agencyDetailsId, you can replace them here
        let navMainWithAgency =
          roleData?.navMain?.map((section) => {
            if (section.title === "Masters") {
              return {
                ...section,
                items: section.items.map((item) => {
                  if (item.title === "Agency") {
                    return {
                      ...item,
                      url: `/agencies/profile/${agencyDetailsId}`,
                    };
                  }
                  return item;
                }),
              };
            }
            return section;
          }) || [];

        setData((prevData) => ({
          ...prevData,
          projects: roleData?.projects || [],
          navMain: navMainWithAgency,
          user: parsedUser,
        }));
      } catch (error) {
        console.error("Failed to parse user from localStorage", error);
      }
    }
  }, []);

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        {/* <TeamSwitcher teams={data.teams} /> */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:!p-1.5"
            >
              <a href="/dashboard">
                <ArrowUpCircleIcon className="h-5 w-5" />
                <span className="text-base font-semibold">{appName}</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain || []} />
        <NavProjects projects={data.projects || []} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
