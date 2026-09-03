# KISHOLOY Design System

## Brand Core
- **Name:** KISHOLOY (কিশলয়) - Translates to "New Leaf" or "Young Shoot"
- **Vibe:** Premium, trustworthy, organic, modern.

## Color Palette
The color palette avoids default generic blues/purples and opts for an earthy, grounded, and highly legible scheme suitable for a premium Bangladeshi e-commerce experience.

- **Primary (Pine Green):** Represents growth, trust, and the "new leaf" brand identity.
  - Base: `#115e59` (Tailwind `teal-800`)
  - Hover/Dark: `#134e4a` (Tailwind `teal-900`)
- **Neutrals (Warm Stone):** Replaces harsh standard grays with warm, earthy stone tones to feel organic and premium.
  - Backgrounds: `#fafaf9` (Tailwind `stone-50`)
  - Surface: `#ffffff` (White)
  - Text (Primary): `#1c1917` (Tailwind `stone-900`)
  - Text (Secondary): `#57534e` (Tailwind `stone-500`)
  - Borders: `#e7e5e4` (Tailwind `stone-200`)
- **Semantics:**
  - Success: `#166534` (Green 800) on `#dcfce7` (Green 100)
  - Error: `#991b1b` (Red 800) on `#fee2e2` (Red 100)
  - Warning: `#92400e` (Amber 800) on `#fef3c7` (Amber 100)

## Typography
- **Headings (English):** `Playfair Display` - A high-contrast serif font providing a premium, editorial feel for product titles and section headers.
- **Body (English):** `Plus Jakarta Sans` - A highly legible, modern sans-serif for UI elements, descriptions, and buttons.
- **Bangla Font:** `Hind Siliguri` - Ensures native, highly legible, and beautifully rendered Bengali script across both headings and body text.
- *Mathematical Scaling:*
  - H1: 2.25rem (36px)
  - H2: 1.5rem (24px)
  - Body: 1rem (16px) with 1.5 line-height

## Shapes & Radii
- **Radii:** Avoid extreme pill-shapes unless for specific badges.
  - Interactive elements (Buttons, Inputs): `6px` (`rounded-md`)
  - Containers/Cards: `8px` (`rounded-lg`) or `12px` (`rounded-xl`)
- **Shadows:** Kept subtle and crisp. No large, soft glowing dropshadows. Focus on borders for definition, using `shadow-sm` for floating elements.

## UI Component Systems
- **Buttons:** Solid primary, subdued secondary, crisp outlines. Horizontal padding is 2x vertical padding.
- **Inputs:** Clean, structured with clear focus rings (`ring-2 ring-primary-800`).
- **Cards:** Flat design, utilizing white backgrounds against `stone-50` with subtle `stone-200` borders instead of heavy shadows.
- **Status:** Defined badge system for Order/Payment states.
