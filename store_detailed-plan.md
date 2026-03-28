# Traditional Clothing Store - Current Project Plan (Updated)

## 1) Project Snapshot

This project is now implemented as:

- **Frontend:** Next.js (App Router) + CSS (`Client/`)
- **Backend:** Flask API (`Server/`)
- **Current focus:** Responsive premium landing page with modern diagonal composition and upgraded 3D product cards.

Core design intent:

- Heritage + modern fusion
- Elegant typography and iconography
- Floating depth and geometric overlays
- Mobile-first conversion-focused UX

---

## 2) Confirmed Tech Architecture

## Frontend (Client)

- Framework: Next.js
- Rendering approach: Static shell + client hydration for API-driven sections
- Styling: Custom global CSS (no Tailwind used in current implementation)
- Data source: Flask endpoints via `NEXT_PUBLIC_API_BASE_URL`

### Frontend files

- `Client/app/layout.js`
- `Client/app/page.js`
- `Client/app/globals.css`
- `Client/package.json`

## Backend (Server)

- Runtime: Python + Flask
- CORS enabled for client consumption
- Endpoints:
  - `GET /health`
  - `GET /api/landing-summary`
  - `GET /api/featured-products`
  - `GET /api/testimonials`

### Backend files

- `Server/app.py`
- `Server/requirements.txt`

---

## 3) Implemented Landing Sections

1. Announcement bar
2. Sticky responsive navigation (desktop + mobile menu)
3. Hero with diagonal overlays + floating chips
4. Value pillars (icon cards)
5. Featured categories
6. Signature collection highlight
7. Best sellers (API-hydrated product cards)
8. Craft story
9. Testimonials (API-hydrated)
10. FAQ accordion
11. Final CTA band
12. Footer + newsletter UI

---

## 4) Product Card Redesign (Latest Update)

## New Direction

Product cards are upgraded to an Aura-inspired modern visual treatment with a subtle 3D interaction model:

- Layered glass-like shell with soft gradients
- Depth-based card composition (`transform-style: preserve-3d`)
- Dynamic tilt on pointer movement (rotateX / rotateY)
- Elevated media layer with dark image gradient overlay
- Floating tag chip over image
- CTA action button inside card meta row
- Motion-safe fallback using `prefers-reduced-motion`

## UX Outcome

- Stronger visual hierarchy for featured items
- More premium, interactive product browsing feel
- Better perceived quality and modernity without heavy animation overhead

---

## 5) Responsive Behavior Standards

- Mobile-first layout from 320px+
- Breakpoints:
  - Mobile: 320-767px
  - Tablet: 768-1023px
  - Desktop: 1024px+
- Product grid scales:
  - 1 column (mobile)
  - 2 columns (tablet)
  - 4 columns (desktop)
- Touch-safe interactions for mobile (3D tilt only on pointer hover-capable devices)

---

## 6) Current Data Contract (Frontend <-> Flask)

## `GET /api/landing-summary`

- `announcement`
- `hero_title`
- `top_chip`
- `mid_chip`
- `bottom_chip`

## `GET /api/featured-products`

Array of products with:

- `tag`
- `name`
- `fabric_note`
- `price_inr`
- `image_url`
- `alt`

## `GET /api/testimonials`

Array with:

- `quote`
- `author`
- `city`

---

## 7) Performance and Accessibility Baseline

## Performance

- CSS-based effects prioritized over JS-heavy animation
- API hydration uses fallback content if backend unavailable
- Static build compatible with Next.js production optimization

## Accessibility

- Semantic layout and heading hierarchy
- Keyboard-usable menu and FAQ interactions
- Reduced-motion support included
- Alt text on product/media images

---

## 8) Runbook (Local Development)

## Flask API

```bash
cd Server
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

## Next.js Client

```bash
cd Client
npm install
npm run dev
```

Environment variable:

- `NEXT_PUBLIC_API_BASE_URL` (default: `http://127.0.0.1:5000`)

---

## 9) Next Execution Phases

## Phase A - Product Card Enhancements

- Add optional quick actions (wishlist/cart)
- Add card badges for discount and stock state
- Add device-aware tilt intensity controls

## Phase B - Commerce Integration

- Convert "View" CTA to route-aware product detail links
- Add product slug/id support in API
- Introduce category filter state + API query params

## Phase C - Visual Refinement

- Fine-tune diagonal rhythm between sections
- Improve typography scale consistency across desktop
- Add subtle section-to-section transition harmony

## Phase D - Conversion Features

- Add newsletter submit integration
- Add trust indicators near pricing and CTA
- Add analytics events for hero and product card clicks

---

## 10) Definition of Done (Current Milestone)

This milestone is complete when:

- Next.js frontend runs and builds successfully
- Flask API serves dynamic homepage content
- 3D-inspired premium product cards are integrated and responsive
- Layout quality remains consistent across mobile/tablet/desktop
- Reduced-motion accessibility path is preserved

---

## 11) Reference

Design card direction inspired by:

- [Aura Component Reference](https://www.aura.build/component/72A2C)
