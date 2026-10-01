import type { Profile } from "@/lib/api";

export interface DashboardModule {
  key: string;
  title: string;
  description: string;
  /** Live modules link somewhere real; absent = not yet implemented. */
  href?: string;
}

export const TYPE_LABELS: Record<Profile["type"], string> = {
  traveller: "Traveller",
  planner: "Planner",
  business: "Business",
  host: "Host",
};

export const TYPE_TAGLINES: Record<Profile["type"], string> = {
  traveller: "Travel with people and discover experiences.",
  planner: "Create and organize trips for travellers.",
  host: "Offer spaces or experiences to travellers.",
  business: "Offer travel-related services.",
};

const MANAGE_PROFILE: DashboardModule = {
  key: "manage-profile",
  title: "Profile & details",
  description: "Bio, socials, interests and addresses for this profile.",
  href: "/profile",
};

const PAYOUTS: DashboardModule = {
  key: "payouts",
  title: "Payout accounts",
  description: "Where your earnings will be paid out.",
  href: "/profile",
};

/**
 * Dashboard modules per profile type. Only modules backed by existing B2
 * functionality have an `href`; everything else renders as Coming soon.
 */
export const DASHBOARD_MODULES: Record<Profile["type"], DashboardModule[]> = {
  traveller: [
    { key: "trips", title: "My trips", description: "Trips you've joined or created." },
    {
      key: "discover",
      title: "Discover trips",
      description: "Find crews heading where you want to go.",
    },
    {
      key: "saved",
      title: "Saved experiences",
      description: "Places and experiences you've bookmarked.",
    },
    { key: "activity", title: "Activity", description: "Your recent trips and interactions." },
    MANAGE_PROFILE,
  ],
  planner: [
    { key: "trips", title: "My trips", description: "Trips you're planning and organizing." },
    {
      key: "requests",
      title: "Traveller requests",
      description: "Requests from travellers who want your help.",
    },
    { key: "earnings", title: "Earnings", description: "What you've earned as a planner." },
    { key: "activity", title: "Planner activity", description: "Your recent planning work." },
    PAYOUTS,
    MANAGE_PROFILE,
  ],
  host: [
    { key: "spaces", title: "My spaces", description: "Properties and experiences you host." },
    { key: "requests", title: "Stay requests", description: "Booking requests from travellers." },
    { key: "earnings", title: "Earnings", description: "What you've earned as a host." },
    { key: "activity", title: "Hosting activity", description: "Your recent hosting activity." },
    PAYOUTS,
    MANAGE_PROFILE,
  ],
  business: [
    { key: "services", title: "Services", description: "The travel services you offer." },
    { key: "bookings", title: "Bookings", description: "Bookings for your services." },
    { key: "promotions", title: "Promotions", description: "Promote your business on Unsolo." },
    { key: "earnings", title: "Earnings", description: "What you've earned as a business." },
    PAYOUTS,
    MANAGE_PROFILE,
  ],
};
