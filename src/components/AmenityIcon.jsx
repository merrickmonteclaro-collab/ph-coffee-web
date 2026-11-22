// Outline icons for the shop amenities / filters. Keys match the shop fields
// (has_wifi, is_pet_friendly, ...) so a filter or amenity can render its icon
// straight from its key. All drawn on a 24px grid with one line weight so they
// read as a set; color comes from the surrounding text (currentColor).
const ICONS = {
  has_wifi: (
    <>
      <path d="M2 9a15 15 0 0 1 20 0M5 12.5a10.5 10.5 0 0 1 14 0M8.5 16a5.5 5.5 0 0 1 7 0" />
      <circle cx="12" cy="19.5" r="1" />
    </>
  ),
  is_work_friendly: (
    <>
      <rect x="5" y="5" width="14" height="10" rx="1.5" />
      <path d="M2.5 18.5h19" />
    </>
  ),
  is_pet_friendly: (
    <>
      <circle cx="6.5" cy="10" r="1.6" />
      <circle cx="10" cy="6.5" r="1.6" />
      <circle cx="14" cy="6.5" r="1.6" />
      <circle cx="17.5" cy="10" r="1.6" />
      <path d="M12 12.5c-3 0-5.5 2.6-5.5 5 0 1.6 1.4 2.5 3 2.5 1 0 1.6-.4 2.5-.4s1.5.4 2.5.4c1.6 0 3-.9 3-2.5 0-2.4-2.5-5-5.5-5z" />
    </>
  ),
  has_meals: (
    <path d="M5 3v5a3 3 0 0 0 3 3v10M11 3v5a3 3 0 0 1-3 3M8 3v8M17 21V3c-2.2 1.4-3.5 4-3.5 7v4H17" />
  ),
  has_pastries: (
    <>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="3" />
      <path d="M7.5 8l1.2 1M15.5 7.5l-1 1.3M16.5 14.5l-1.3-.8" />
    </>
  ),
  has_car_parking: (
    <>
      <path d="M5 11l1.6-4.5A1.5 1.5 0 0 1 8 5.5h8a1.5 1.5 0 0 1 1.4 1L19 11" />
      <rect x="3" y="11" width="18" height="6" rx="2" />
      <path d="M6 17v2M18 17v2" />
      <circle cx="7.5" cy="14" r=".7" />
      <circle cx="16.5" cy="14" r=".7" />
    </>
  ),
  has_bike_parking: (
    <>
      <circle cx="6" cy="16" r="3.5" />
      <circle cx="18" cy="16" r="3.5" />
      <path d="M6 16h6l-2.5-7h6L12 16M15.5 9l2.5 7M14.5 6.5H17M8 7.5h3" />
    </>
  ),
  accepts_cards: (
    <>
      <rect x="2.5" y="5.5" width="19" height="13" rx="2" />
      <path d="M2.5 10h19M6 15h4" />
    </>
  ),
  has_toilet_bidet: (
    <>
      <rect x="7" y="3" width="10" height="5.5" rx="1" />
      <path d="M5 10.5h14c0 3.8-2.2 6.7-4.5 7.8V21h-5v-2.7C7.2 17.2 5 14.3 5 10.5z" />
    </>
  ),
}

export default function AmenityIcon({ name, size = 26 }) {
  const icon = ICONS[name]
  if (!icon) return null
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {icon}
    </svg>
  )
}
