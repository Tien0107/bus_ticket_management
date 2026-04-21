# Design System: BusGo - Bus Ticket Booking
**Project ID:** 9559426340760532271

## 1. Visual Theme & Atmosphere
Clean, minimal, and trustworthy booking platform. The design prioritizes clarity and ease of use, allowing users to quickly find and book bus tickets. The aesthetic is modern, flat, with subtle depth through soft shadows and hover effects.

## 2. Color Palette & Roles
- **Primary Green** (#4CAF50) – Main brand color, CTA buttons, active states
- **Primary Dark** (#388E3C) – Hover states, emphasis
- **Primary Light** (#C8E6C9) – Backgrounds, badges, highlights
- **Accent Orange** (#FF6D00) – Secondary CTA, alerts, price highlights
- **Background White** (#FFFFFF) – Main background
- **Background Light Gray** (#F5F5F5) – Section backgrounds, card areas
- **Text Dark** (#212121) – Primary text
- **Text Secondary** (#757575) – Secondary text, labels
- **Border Gray** (#E0E0E0) – Borders, dividers
- **Success** (#4CAF50) – Success states
- **Error** (#F44336) – Error states
- **Warning** (#FF9800) – Warning states

## 3. Typography Rules
- **Font Family:** Poppins (Google Fonts)
- **Headings:** Poppins Bold, 24-32px
- **Subheadings:** Poppins SemiBold, 18-20px
- **Body:** Poppins Regular, 14-16px
- **Small text:** Poppins Regular, 12px
- **Line height:** 1.5
- **Letter spacing:** 0.01em

## 4. Component Stylings
* **Buttons:** Rounded (12px radius), solid fill for primary (#4CAF50, white text), outlined for secondary, hover: darken + lift shadow
* **Cards:** 12px border radius, white background, soft shadow (0 2px 8px rgba(0,0,0,0.08)), hover: lift (translateY(-2px) + stronger shadow)
* **Inputs:** 8px radius, 1px border #E0E0E0, focus: #4CAF50 border, padding 12px 16px
* **Navigation:** Clean horizontal nav, white background, subtle bottom border
* **Tags/Badges:** Small rounded pill shape, light green background (#C8E6C9)

## 5. Layout Principles
- Max content width: 1200px, centered
- Section padding: 40-60px vertical
- Card gap: 24px
- Responsive: Desktop-first, breakpoints at 1024px, 768px, 480px
- Whitespace: Generous, clean spacing between elements

## 6. Design System Notes for Stitch Generation
**Copy this block into every baton prompt:**

**DESIGN SYSTEM (REQUIRED):**
- Platform: Web, Desktop-first
- Theme: Light, clean, minimal, flat design
- Background: White (#FFFFFF), sections use Light Gray (#F5F5F5)
- Primary Accent: Green (#4CAF50), Dark Green (#388E3C) for hover
- Secondary Accent: Orange (#FF6D00) for prices and CTAs
- Text Primary: Dark gray (#212121), Secondary: (#757575)
- Font: Poppins (Google Fonts), clean and modern
- Layout: Centered content, max-width 1200px, generous whitespace
- Cards: 12px radius, soft shadow, hover lift effect
- Buttons: 12px radius, primary green solid, secondary outlined
- Input fields: 8px radius, gray border, green focus state
