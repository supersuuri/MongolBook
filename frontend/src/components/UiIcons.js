export function IconBase({
  children,
  size = 20,
  color = "currentColor",
  ...props
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      focusable="false"
      style={{ flexShrink: 0 }}
      {...props}
    >
      <g color={color}>{children}</g>
    </svg>
  );
}

export function PinIcon(props) {
  return (
    <IconBase {...props}>
      <path
        d="M12 22s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="11" r="2.4" fill="currentColor" />
    </IconBase>
  );
}

export function UserIcon(props) {
  return (
    <IconBase {...props}>
      <path
        d="M20 21a8 8 0 1 0-16 0"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth="1.8" />
    </IconBase>
  );
}

export function CompassIcon(props) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="m14.8 9.2-1.6 4.4-4.4 1.6 1.6-4.4 4.4-1.6Z"
        fill="currentColor"
      />
    </IconBase>
  );
}

export function StarIcon(props) {
  return (
    <IconBase {...props}>
      <path
        d="m12 3 2.7 5.6 6.2.9-4.5 4.3 1.1 6.2L12 17l-5.5 3 1.1-6.2L3.1 9.5l6.2-.9L12 3Z"
        fill="currentColor"
      />
    </IconBase>
  );
}

export function MoneyIcon(props) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M9.5 14c.4 1 1.4 1.7 2.7 1.7 1.5 0 2.8-.9 2.8-2.2 0-1.4-1.2-1.9-2.6-2.3-1.5-.4-2.8-.9-2.8-2.3 0-1.2 1.1-2.1 2.6-2.1 1.2 0 2.1.5 2.5 1.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M12 5.8v12.4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </IconBase>
  );
}

export function CalendarIcon(props) {
  return (
    <IconBase {...props}>
      <rect
        x="4"
        y="5"
        width="16"
        height="15"
        rx="3"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M4 9h16" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M8 3v4M16 3v4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </IconBase>
  );
}

export function ClockIcon(props) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M12 7v5l3 2"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}

export function ScissorsIcon(props) {
  return (
    <IconBase {...props}>
      <circle cx="7" cy="8" r="2" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="7" cy="16" r="2" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M9 9.5 19 4M9 14.5 19 20M9 9.5l10 10M9 14.5l10-10"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </IconBase>
  );
}

export function LipstickIcon(props) {
  return (
    <IconBase {...props}>
      <path
        d="M10 3h4l1 6h-6l1-6Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M9 9h6v10H9z" stroke="currentColor" strokeWidth="1.8" />
      <path d="M9 14h6" stroke="currentColor" strokeWidth="1.8" />
    </IconBase>
  );
}

export function BilliardIcon(props) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <circle cx="12" cy="12" r="3.2" fill="currentColor" />
    </IconBase>
  );
}

export function RestaurantIcon(props) {
  return (
    <IconBase {...props}>
      <path
        d="M7 3v8M7 11c0 1.7 1 3 2.5 3S12 12.7 12 11V3M12 3v18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M16 3v6c0 1.7 1 3 2 3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M18 3v18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </IconBase>
  );
}

export function ResortIcon(props) {
  return (
    <IconBase {...props}>
      <path
        d="M4 17l4-5 3 3 3-4 6 6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle cx="7" cy="7" r="2" fill="currentColor" />
      <path
        d="M3 20h18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </IconBase>
  );
}

export function ChairIcon(props) {
  return (
    <IconBase {...props}>
      <path
        d="M7 10V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path d="M6 10h12v6H6z" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M8 16v4M16 16v4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </IconBase>
  );
}

export function BarberIcon(props) {
  return <ChairIcon {...props} />;
}

export function CheckIcon(props) {
  return (
    <IconBase {...props}>
      <path
        d="m5 12 4 4 10-10"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBase>
  );
}

export function SearchIcon(props) {
  return (
    <IconBase {...props}>
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M16 16l4 4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </IconBase>
  );
}

export function BellIcon(props) {
  return (
    <IconBase {...props}>
      <path
        d="M8 17h8a2 2 0 0 1-1.8-1.1l-1-2.4A4 4 0 0 1 12 12V9a4 4 0 0 0-8 0v3a4 4 0 0 1-1.2 2.9L2.5 15.9A1 1 0 0 0 3.4 17H8Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M10.5 18a1.5 1.5 0 0 0 3 0"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </IconBase>
  );
}

export function ClipboardIcon(props) {
  return (
    <IconBase {...props}>
      <rect
        x="6"
        y="4"
        width="12"
        height="16"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M9 4.5h6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M8 10h8M8 14h8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </IconBase>
  );
}

export function QuestionIcon(props) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M9.8 9.4A2.4 2.4 0 1 1 13 11.5c-.8.4-1.3 1.1-1.3 2.1v.4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="17" r="1" fill="currentColor" />
    </IconBase>
  );
}

export function MapPinIcon(props) {
  return <PinIcon {...props} />;
}
