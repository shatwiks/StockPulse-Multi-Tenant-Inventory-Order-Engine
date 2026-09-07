---
name: StockPulse
description: High-concurrency multi-tenant inventory management & POS order engine
colors:
  primary: "#f59e0b"
  primary-dark: "#d97706"
  accent: "#fbbf24"
  neutral-bg: "#171310"
  surface-card: "#1f1a17"
  surface-card-hover: "#2b2118"
  text-primary: "#f3e8e2"
  text-secondary: "#d6d3d1"
  text-muted: "#a8a29e"
  border-subtle: "rgba(255, 255, 255, 0.1)"
  border-accent: "rgba(245, 158, 11, 0.3)"
  status-in-stock: "#10b981"
  status-low-stock: "#f59e0b"
  status-out-of-stock: "#ef4444"
  status-tenant-deccan: "#14b8a6"
  walnut-deep: "oklch(0.18 0.022 46)"
typography:
  display:
    fontFamily: "Outfit, var(--font-outfit), sans-serif"
    fontSize: "2.25rem"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Outfit, var(--font-outfit), sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Outfit, var(--font-outfit), sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Outfit, var(--font-outfit), sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.025em"
  caption:
    fontFamily: "Inter, var(--font-sans), sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: "0.01em"
  micro:
    fontFamily: "Geist Mono, var(--font-mono), monospace"
    fontSize: "0.625rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "0.05em"
  mono:
    fontFamily: "Geist Mono, var(--font-mono), monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.05em"
rounded:
  sm: "6px"
  md: "8px"
  lg: "12px"
  xl: "16px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  2xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.neutral-bg}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  button-primary-hover:
    backgroundColor: "{colors.primary-dark}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
  card:
    backgroundColor: "{colors.surface-card}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.lg}"
    padding: "16px"
---

# Design System

<!-- impeccable:design-schema 1 -->

## Overview

StockPulse uses a distinctive **Warm Industrial & Concurrency Telemetry** design language. Built specifically for high-velocity supply chain distribution hubs and B2B checkout desks, the interface rejects flat, generic corporate SaaS aesthetics in favor of a physical, tactile material palette: rich deep walnut woods, matte carbon charcoals, and sharp burnt-copper/warm-amber instrumentation accents.

The aesthetic balance combines:
- **Rock-solid operational ergonomics**: High-density data ledgers, legible 12px+ typography, keyboard-navigable POS drawers, and clear tactile feedback.
- **Visual authority**: An isometric 3D warehouse box logo with a continuous heartbeat pulse line, signifying real-time inventory vitality and pessimistic row-level locking.
- **Strict tenant partitioning**: Visual indicators representing multi-tenant partition boundaries without visual noise.

---

## Colors

### Primary Instrumentation & Accents
- **Primary Amber (`#F59E0B`)**: Main interaction color, active states, concurrency stress triggers, and primary CTAs.
- **Deep Copper (`#D97706`)**: Hover states, darker telemetry accents, and secondary button accents.
- **Crisp Gold (`#FBBF24`)**: High-priority indicators, lock nodes, currency symbols, and key telemetry metrics.

### Surfaces & Backgrounds
- **Base Background (`#171310`)**: Deep charcoal-espresso dark base.
- **Surface Card (`#1F1A17`)**: Primary elevated card background, providing subtle warmth over pure black.
- **Elevated Wood Surface (`#2B2118`)**: Header banners, active rows, and highlighted operational modules.
- **Charcoal-Cream (`#F3E8E2`)**: High-contrast, easy-on-the-eyes text color for headings and brand titles.

### Semantic Status
- **In Stock / Healthy (`#10B981`)**: Live database connections, available stock quantities, completed checkouts.
- **Low Stock / Warning (`#F59E0B`)**: Inventory at or below reorder points, held orders.
- **Out of Stock / Danger (`#EF4444`)**: Depleted SKUs, shortage conflicts, 409 concurrency alerts.
- **Tenant Accents**: Teal (`#14B8A6`) for secondary tenant isolation (Deccan Supply Chain).

---

## Typography

- **Display & Headings**: `Plus Jakarta Sans` — bold, geometric sans-serif delivering clear character distinction.
- **Body & Data**: `Inter` — neutral, highly legible sans-serif for catalog tables, receipt lines, and forms.
- **Telemetry & Technical**: `Geist Mono` — fixed-width numerals for SKUs, Indian Rupee (`₹`) pricing, timestamps, latency gauges, and cryptographic JWT claims.

### Hierarchy Rules
- **No undersized interactive text**: All interactive buttons, badges, labels, and table cells must remain at or above **11px** (`text-xs` / `text-[11px]`).
- **No gradient text on body/metrics**: Text must be rendered in solid, high-contrast colors (`#F3E8E2`, `#F59E0B`, `#D6D3D1`) to guarantee WCAG AA legibility against dark surfaces.

---

## Layout

- **Density**: Compact and high-density, tailored for desktop terminals (1366px to 1920px+) with zero horizontal clipping.
- **Sidebar Shell**: Fixed left navigation drawer (240px expanded, 64px collapsed) carrying primary routes (`Inventory`, `Orders POS`, `Analytics`, `Settings`).
- **Split-Screen Workstations**:
  - *Login Screen*: 7-column 3D interactive stage on the left, 5-column glassmorphic authentication console on the right.
  - *Order Desk POS*: 7-column catalog grid on the left, 5-column live cart drawer and checkout summary on the right.
- **Global Header**: Streamlined top bar featuring full-text breadcrumbs, expandable search input (`min-w-[180px] max-w-sm` with `⌘K`), and system health telemetry triggers.

---

## Elevation & Depth

- **Tonal Layering**: Depth is achieved through nuanced tonal steps (`#171310` &rarr; `#1F1A17` &rarr; `#2B2118`) rather than heavy drop shadows.
- **Elevation Shadows**: Directional, neutral shadows (`shadow-md shadow-black/40`) anchored by hairline borders (`border-white/10`).
- **Zero Chromatic Halos**: Avoid zero-offset colored glow halos (`box-shadow: 0 0 15px #f59e0b`). Use crisp borders (`ring-1 ring-amber-500/50`) for focus and active states.
- **Backdrop Diffusion**: Controlled glassmorphic blur (`backdrop-blur-md` to `backdrop-blur-xl`) over dark atmospheric radial vignettes.

---

## Shapes

- **Radius Hierarchy**:
  - `rounded-md` (8px): Inputs, table row controls, action buttons.
  - `rounded-xl` (12px): Persona selector cards, dialog containers, and summary modules.
  - `rounded-2xl` (16px): Main dashboard hero banners and POS catalog cards.
  - `rounded-full`: Status tags, category pills, and avatar badges.
- **Form Language**: Sharp, geometric, precision-machined corners that echo the isometric warehouse cube.

---

## Components

### 1. POS Product Grid Card
- Visual thumbnail with dark wood surface backdrop.
- Product name, SKU (`font-mono`), unit price in `₹` INR, and stock quantity badge.
- Hover transition with subtle elevation and border highlight.

### 2. Live Order Cart & Summary Drawer
- Itemized lines with quantity increments (`+` / `-`) and instant item removal.
- Real-time calculations: Subtotal, Discount selection (0%, 5%, 10%), 18% GST auto-calculation, and Total Due.
- High-visibility action buttons: *Hold Order*, *Clear*, and *Process Payment (₹)*.

### 3. Recruiter Persona Switcher
- Compact horizontal bar beneath the main header.
- 1-click persona buttons (`Aarav ADMIN`, `Priya MGR`, `Rohan CASHIER`, `Ananya ADMIN`, `Vikram MGR`, `Sneha CASHIER`).
- Active persona highlighted in amber/warm-copper with tenant badge and *JWT & Security Inspector* trigger.

### 4. Interactive 3D Cube Mark
- Isometric warehouse box rendered via Three.js.
- Animated neon pulse line tracing the front edge.
- Smooth mouse parallax tilting and click shockwave ping.

---

## Do's and Don'ts

### Do
- **Do** format all currency values in Indian Rupee format (`₹1,499.00` via `Intl.NumberFormat('en-IN')`).
- **Do** keep functional UI text at or above 11px to maintain legibility across high-DPI laptop screens.
- **Do** use directional elevation shadows paired with subtle hairline borders.
- **Do** handle 409 concurrency shortages with itemized conflict modals that let cashiers immediately reconcile stock.
- **Do** provide fallback data tolerance so surfaces stay 100% operational even if backend services are offline.

### Don't
- **Don't** use decorative gradient text (`bg-clip-text`) on body copy, metric numbers, or UI headings.
- **Don't** use generic cyan-on-dark or violet-to-blue AI template color schemes.
- **Don't** use zero-offset colored blur halos (`box-shadow: 0 0 15px color`).
- **Don't** add decorative `animate-pulse` or `animate-ping` to static indicators; reserve motion for genuine live telemetry.
- **Don't** place repetitive two-axis hairline grid line backgrounds across main application pages.
