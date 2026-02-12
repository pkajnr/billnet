# BillNet Design System

## Overview
A comprehensive, unified design system inspired by Amazon Business's clean, professional aesthetic.

## Color Palette

### Primary Colors
- **Primary Orange**: `#FF9900` (Amazon-inspired brand color)
- **Primary Dark**: `#E88B00`
- **Primary Light**: `#FFB84D`

### Secondary Colors  
- **Secondary Dark Blue**: `#232F3E` (Navigation, headers)
- **Secondary Light**: `#37475A`

### Accent
- **Accent Teal**: `#007185` (Links, interactive elements)
- **Accent Hover**: `#006270`

### Neutral Colors
- **Background**: `#FFFFFF`
- **Background Secondary**: `#F7F8FA`
- **Background Tertiary**: `#EAEDED`
- **Border**: `#D5D9D9`
- **Border Dark**: `#8B9196`

### Text Colors
- **Text**: `#0F1111`
- **Text Secondary**: `#565959`
- **Text Muted**: `#8B9196`
- **Text Inverse**: `#FFFFFF`

### Semantic Colors
- **Success**: `#067D62` / Background: `#E6F9F5`
- **Error**: `#C40000` / Background: `#FFF0F0`
- **Warning**: `#F89B0E` / Background: `#FFF9E6`
- **Info**: `#007185` / Background: `#E6F4F5`

## Typography

### Font Family
- Primary: SF Pro Display, SF Pro Text, Helvetica Neue, Arial, sans-serif
- Letter Spacing: `-0.01em`

### Headings
- H1: `2rem` (32px), Weight: 600, Line Height: 1.2
- H2: `1.5rem` (24px), Weight: 600, Line Height: 1.3
- H3: `1.25rem` (20px), Weight: 600, Line Height: 1.4

### Body Text
- Base: `0.875rem` (14px)
- Line Height: 1.5

## Spacing Scale
- **XS**: `0.25rem` (4px)
- **SM**: `0.5rem` (8px)
- **MD**: `1rem` (16px)
- **LG**: `1.5rem` (24px)
- **XL**: `2rem` (32px)
- **2XL**: `3rem` (48px)

## Components

### Buttons
#### Primary Button
```html
<button class="btn btn-primary">Button Text</button>
```
- Background: Orange gradient
- Border: `#C87E00`
- Color: Dark text
- Hover: Lighter gradient + shadow

#### Secondary Button
```html
<button class="btn btn-secondary">Button Text</button>
```
- Background: White
- Border: Dark gray
- Color: Dark text
- Hover: Light gray background

#### Accent Button
```html
<button class="btn btn-accent">Button Text</button>
```
- Background: Teal
- Color: White text

### Cards
```html
<div class="card">
  Card content
</div>
```
- Background: White
- Border: 1px solid gray
- Border Radius: 8px
- Shadow: Subtle
- Hover: Enhanced shadow

### Forms

#### Input Fields
```html
<label class="form-label">Label</label>
<input class="form-input" type="text" />
```
- Border: Dark gray
- Focus: Teal border + shadow
- Border Radius: 4px

#### Select Dropdown
```html
<select class="form-select">
  <option>Option</option>
</select>
```

#### Error Message
```html
<div class="form-error">
  Error message
</div>
```
- Background: Light red
- Border: Red
- Text: Red

### Navigation
```html
<nav class="nav-bar">
  <a class="nav-link">Link</a>
</nav>
```
- Background: Dark blue (`#232F3E`)
- Text: White
- Hover: Lighter background

### Badges
```html
<span class="badge badge-success">Success</span>
<span class="badge badge-warning">Warning</span>
<span class="badge badge-error">Error</span>
<span class="badge badge-info">Info</span>
<span class="badge badge-primary">Primary</span>
```

## Border Radius
- **SM**: `4px`
- **MD**: `8px`
- **LG**: `12px`

## Shadows
- **SM**: `0 1px 2px rgba(15, 17, 17, 0.15)`
- **MD**: `0 2px 8px rgba(15, 17, 17, 0.15)`
- **LG**: `0 4px 16px rgba(15, 17, 17, 0.15)`
- **Focus**: `0 0 0 3px rgba(0, 113, 133, 0.2)`

## Usage Examples

### Authentication Pages
- Background: `var(--color-bg-secondary)` (#F7F8FA)
- Card: White background with border
- Button: Primary button (orange gradient)
- Links: Teal color

### Navigation
- Background: Dark blue (#232F3E)
- Logo: White text with orange accent
- Links: White text, hover with darker background

### Content Pages
- Background: Light gray (#F7F8FA)
- Cards: White with subtle shadow
- Interactive elements: Orange or teal

## Implementation

All design tokens are available as CSS custom properties:
```css
var(--color-primary)
var(--color-secondary)
var(--color-accent)
var(--space-md)
var(--radius-md)
var(--shadow-md)
```

## Accessibility
- Sufficient color contrast ratios
- Focus states clearly visible
- Semantic HTML elements
- ARIA labels where needed

## Consistency Checklist
- [ ] All buttons use `.btn` classes
- [ ] All cards use `.card` class
- [ ] All form inputs use `.form-input` class
- [ ] All colors use CSS variables
- [ ] All spacing uses defined scale
- [ ] All text uses system font stack
- [ ] All interactive elements have hover states
- [ ] All focus states are visible
