import {
  BarberIcon,
  BilliardIcon,
  CompassIcon,
  LipstickIcon,
  RestaurantIcon,
  ResortIcon,
  ScissorsIcon,
} from "../components/UiIcons";

export const CATEGORY_META = {
  barber: { label: "Үсчин", icon: ScissorsIcon },
  salon: { label: "Салон", icon: BarberIcon },
  beauty: { label: "Гоо сайхан", icon: LipstickIcon },
  billiard: { label: "Биллиард", icon: BilliardIcon },
  restaurant: { label: "Ресторан", icon: RestaurantIcon },
  resort: { label: "Амралт, ресорт", icon: ResortIcon },
};

export const CATEGORY_OPTIONS = [
  { value: "all", label: "Бүгд", icon: CompassIcon },
  ...Object.entries(CATEGORY_META).map(([value, meta]) => ({ value, ...meta })),
];

export const STAFF_BASED = ["salon", "barber", "beauty"];
export const TABLE_BASED = ["billiard", "restaurant"];
export const OVERNIGHT_BASED = ["resort"];

export function getBookingMode(category) {
  if (STAFF_BASED.includes(category)) return "staff";
  if (TABLE_BASED.includes(category)) return "table";
  if (OVERNIGHT_BASED.includes(category)) return "overnight";
  return "basic";
}
