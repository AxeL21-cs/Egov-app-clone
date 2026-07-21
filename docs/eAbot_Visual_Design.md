# eAbot Visual Design Specification

**Status:** Approved design direction for the next eAbot webapp rebuild

**Reference:** Supplied eGovPH mobile home-screen screenshot

**Product:** eAbot standalone responsive webapp
**Design intent:** Copy the reference application's component grammar, proportions, softness, spacing, and interaction patterns while using eAbot branding and eAbot product content.

---

## 1. Design directive

The next eAbot interface must feel like it belongs to the same visual family as the supplied screenshot.

The defining qualities are:

- bright white canvas;
- generous vertical whitespace;
- compact, lightweight typography;
- royal-blue actions and outlined icons;
- small Philippine yellow and red details;
- pale blue circular icon wells;
- image-led or illustrated banners;
- pastel utility tiles;
- thin borders with almost invisible shadows;
- modest corner radii rather than oversized “bubble” cards;
- a fixed bottom navigation bar with a raised blue center action.

This is a **utility-first civic interface**, not a marketing landing page. The user's location, search, shortcuts, active journey, and next action should appear before promotional copy.

### One-sentence visual direction

> A calm, airy Filipino public-service dashboard made from crisp white space, compact Poppins typography, pale service circles, soft pastel tiles, and one unmistakable royal-blue primary action.

---

## 2. Webapp constraint

eAbot remains a React/Vite webapp deployable on Vercel.

- It is not a native Android or iOS application.
- It must work as a normal browser website at every viewport width.
- It may use installable webapp metadata, but no design decision may require native APIs.
- Mobile is the reference layout and the first implementation target.
- Tablet and desktop layouts should expand the same components without displaying a decorative phone frame.
- The eGovPH logo, name, official illustrations, user photo, and promotional graphics must not be reused. Only the visual system and layout grammar are being adapted.

### 2.1 Current hackathon scenario

The primary demo citizen is **Mika Reyes**, a fictional 18-year-old incoming college freshman from San Juan City. Mika does not yet know which government education opportunities exist, when they become actionable, or how their supporting documents depend on one another.

The interface must demonstrate this exact product promise:

> eAbot reveals opportunities early, translates their requirements into a dependency-aware plan, and gives the citizen one safe next action at a time.

The current opportunity picker contains three distinct government paths:

1. **Bagong Pilipinas Merit Scholarship Program (CHED)** — a cycle-specific competitive scholarship. The AY 2026–2027 call is shown as closed; the demo builds readiness for a future call.
2. **Tertiary Education Subsidy (CHED / UniFAST)** — a school-mediated grant-in-aid path that generally becomes actionable after enrollment.
3. **AICS Educational Assistance (DSWD)** — short-term crisis assistance subject to a social-worker assessment. It must never be labeled a DSWD scholarship.

All match language must use **“possible match,” “worth checking,” or “prepare for the next call.”** Never say that the citizen is qualified, approved, guaranteed, or already enrolled in a benefit.

### 2.2 Required end-to-end demo flow

```text
Home / opportunity discovery
  → Opportunity picker
  → Program-specific document journey
  → Branching requirement or one-of-document choice
  → Supporting-document details
  → Mock eGov document request
  → Non-functional mock QR payment
  → Mock receipt
  → Updated checklist with the next action unlocked
```

For the main merit-readiness demonstration, the branching checklist contains:

- applicant profile;
- PSA birth certificate;
- certified SF9 / Form 138;
- college admission proof;
- exactly one accepted household-income proof; and
- conditional equity documents that appear only when relevant.

The household-income group uses a visible `oneOf` branch. Example paths include a BIR non-filer/tax-exemption certificate, latest ITR/BIR Form 2316, OFW or seafarer income proof, or an applicable 4Ps certification.

Payment is never presented as a scholarship application fee. The mock QR is used only to demonstrate payment for a separately requested supporting document. It must display **“DEMO — DO NOT PAY,”** offer a button alternative to scanning, and state that no real government, bank, or wallet service is connected.

After the simulated payment:

- the request and payment are complete;
- the requested document is **processing**, not issued;
- the mock receipt is available; and
- the next independent document action becomes available.

---

## 3. What must change from the current eAbot design

This document supersedes the current oversized, high-contrast eAbot styling.

Remove or redesign the following:

- the large dark-blue gradient marketing hero;
- the oversized display headlines occupying most of the first viewport;
- the Bricolage Grotesque display treatment;
- tilted logo tiles, decorative route lines, and large ornamental circles;
- heavy card shadows and elevated dashboard panels;
- thick borders and 22–32px radii on ordinary cards;
- dense explanatory copy on the home screen;
- full desktop sidebar as the dominant visual element;
- large onboarding illustrations that feel like a campaign landing page;
- excessive all-caps eyebrow labels;
- bright color blocks covering most of a component.

The new design should use quiet hierarchy. Blue is strongest in icons, active controls, links, and the center navigation action—not as a full-page background.

---

## 4. Reference-screen anatomy

The home screen should follow this order:

1. Brand, greeting, subtitle, and avatar
2. Location/context row and date
3. Large search field
4. Horizontally scrollable circular shortcuts
5. Rounded promotional or opportunity banner
6. Carousel pagination dots
7. Asymmetric utility grid
8. Featured-services heading
9. Two-option segmented control
10. Featured service content
11. Fixed five-item bottom navigation

For eAbot, map the reference components as follows:

| Reference component | eAbot adaptation |
|---|---|
| eGovPH wordmark | Original eAbot wordmark |
| “Mabuhay, ZARRAH” | “Mabuhay, MIKA” or the active demo citizen |
| City and date row | Citizen's selected city and current date |
| Search Services | Search scholarships, grants, documents, and agencies |
| NGA/LGU/Travel/Health circles | Opportunities, Documents, School, Agencies, Guides, Help |
| Travel information banner | Proactive benefit discovery banner |
| Weather tile | Document-plan progress and active opportunity |
| eTrabaho tile | Best opportunity match or current next action |
| eGov AI tile | Ask eAbot shortcut |
| Featured eGovPH Services | “Opportunities for you” |
| National/Local tabs | “For you” / “Scholarships” / “Assistance” |
| Center Digital ID action | Raised Ask eAbot action |

---

## 5. Design tokens

### 5.1 Color palette

The palette is estimated from the supplied screenshot and normalized for accessible web use.

```css
:root {
  /* Brand and action colors */
  --color-primary: #0753da;
  --color-primary-pressed: #0647bd;
  --color-primary-soft: #eff5ff;
  --color-sun: #f6c700;
  --color-bandila-red: #d93d45;

  /* Neutrals */
  --color-canvas: #ffffff;
  --color-section: #fbfbfd;
  --color-text: #252525;
  --color-text-soft: #515151;
  --color-muted: #8d929a;
  --color-placeholder: #b2b2b2;
  --color-border: #dddddf;
  --color-divider: #ececf0;

  /* Pastel modules */
  --color-pastel-blue: #f2f8ff;
  --color-pastel-pink: #ffe9ea;
  --color-pastel-yellow: #fff4c9;
  --color-pastel-green: #eaf8dd;
  --color-pastel-lilac: #f2edff;

  /* Semantic states */
  --color-success: #248a54;
  --color-success-soft: #eaf7ef;
  --color-warning: #8b6900;
  --color-warning-soft: #fff5ce;
  --color-danger: #c93643;
  --color-danger-soft: #ffeaed;
}
```

### Color usage rules

- White should cover at least 70% of the visible home screen.
- Royal blue is the only dominant action color.
- Yellow appears as a small highlight, selected detail, or icon accent.
- Red is reserved for badges, warnings, reporting, and small brand details.
- Pastels may fill tiles, but ordinary information cards should remain white.
- Never use a purple-on-white AI gradient.
- Never communicate status with color alone; always include an icon and text.

### 5.2 Typography

Use **Poppins** throughout the interface to match the screenshot's geometric, rounded, lightweight character.

```css
--font-interface: 'Poppins', sans-serif;

--weight-light: 300;
--weight-regular: 400;
--weight-medium: 500;
--weight-semibold: 600;
--weight-bold: 700;
```

Do not use Bricolage Grotesque, Inter, Roboto, or a heavy editorial display font in this design.

| Role | Mobile size | Desktop size | Weight | Line height |
|---|---:|---:|---:|---:|
| Greeting name | 18px | 20px | 600 | 1.25 |
| Greeting subtitle | 13px | 14px | 300 | 1.45 |
| Page/section heading | 22px | 26px | 500 | 1.25 |
| Card title | 16px | 17px | 500 | 1.35 |
| Body | 14px | 15px | 300–400 | 1.55 |
| Navigation label | 11px | 12px | 400 | 1.2 |
| Active navigation label | 11px | 12px | 600 | 1.2 |
| Metadata | 11px | 12px | 300–400 | 1.45 |
| Badge | 10px | 10px | 500–600 | 1 |
| Readiness number | 34px | 40px | 500 | 1 |

Typography should feel light and calm. Use weight 700 only for short high-priority phrases or numeric emphasis.

### 5.3 Spacing

Use a 4px base grid.

```css
--space-1: 4px;
--space-2: 8px;
--space-3: 12px;
--space-4: 16px;
--space-5: 20px;
--space-6: 24px;
--space-8: 32px;
--space-10: 40px;
--space-12: 48px;
```

Primary mobile horizontal padding: **18px**.

Compact mobile horizontal padding below 360px: **15px**.

Section-to-section gap: **20–28px**.

Internal card padding: **10–16px**.
Gap between related controls: **8–10px**.

### Compact-density rule

Every icon well must be sized around its content rather than used as empty decoration. Circular shortcuts use 56–60px wells with 26–28px icons; ordinary row icons use 34–44px wells with 18–24px icons. Preserve a 44px interactive hit target even when the visible icon container is smaller. Avoid fixed component heights when content can determine the height.

### 5.4 Shape and elevation

```css
--radius-control: 12px;
--radius-card: 13px;
--radius-large: 16px;
--radius-pill: 999px;

--shadow-control: 0 2px 8px rgba(0, 0, 0, 0.025);
--shadow-nav: 0 -4px 18px rgba(24, 38, 65, 0.06);
--shadow-floating-action: 0 10px 22px rgba(7, 83, 218, 0.22);
```

Rules:

- Default cards use no shadow.
- Search fields use a thin border and extremely subtle shadow.
- Bottom navigation uses only a faint upward shadow or top divider.
- The raised center action is the only strongly elevated element.
- Circular shortcut wells are perfect circles.

### 5.5 Icon style

- Use one consistent outline icon family, preferably Lucide React.
- Default stroke: 2px.
- Primary icon color: royal blue.
- Use yellow for small inner details when an icon supports a second color.
- Category icons should appear inside 58–64px pale-blue circles.
- Ordinary navigation icons should be 22–24px.
- Central navigation icon should be 27–30px and white.
- Do not use filled 3D icons, emoji, or inconsistent illustration styles.

---

## 6. Layout measurements

### Mobile reference frame

Design against a **390px CSS viewport** first.

```css
.mobile-content {
  width: 100%;
  padding-inline: 22px;
  padding-bottom: calc(104px + env(safe-area-inset-bottom));
}
```

Recommended widths:

| Element | Mobile measurement |
|---|---:|
| Header content width | viewport minus 44px |
| Avatar | 48–50px |
| Search field height | 62–64px |
| Category circle | 58–64px |
| Category column width | 68–76px |
| Hero/banner aspect ratio | approximately 3.0:1 |
| Carousel dot hit area | 36–44px |
| Utility-grid gap | 10px |
| Bottom navigation height | 76–80px plus safe area |
| Center navigation action | 60px |

### Tablet

At 700–1023px:

- use 32px page gutters;
- allow four to six shortcut items before horizontal scroll;
- use a two-column home-content layout where helpful;
- preserve the bottom navigation;
- keep the opportunity banner wide and shallow;
- do not enlarge type dramatically.

### Desktop webapp

At 1024px and above:

- use a maximum content width of 1180px;
- center the content without a phone-shaped frame;
- use 36–48px outer gutters;
- place brand/greeting and profile tools in one horizontal header;
- allow shortcut circles to occupy one full row;
- arrange the opportunity banner and quick status panel in a 2:1 grid if needed;
- convert the bottom navigation into a slim top navigation or compact left rail only if it retains the same white, border-light visual language;
- ordinary desktop cards must still use 12–16px radii and minimal shadows.

The desktop experience should look like an expanded version of the reference—not a separate SaaS dashboard.

---

## 7. Component specifications

### 7.1 App header

### Structure

```text
[eAbot wordmark]      [Mabuhay, ROSA] [Avatar]
                     [Welcome to eAbot]
```

### Rules

- White background with no enclosing card.
- Wordmark aligned left.
- Wordmark is text-led rather than placed inside a large app-icon tile: `eAbot` at approximately 30px, weight 600–700, with royal blue as the dominant color and only one small yellow or red accent.
- Do not recreate the official eGovPH multicolor “O”; eAbot must remain a distinct brand.
- Greeting right-aligned on mobile.
- Greeting name uses royal blue and weight 600.
- Subtitle uses dark gray and weight 300.
- Avatar is circular, 48–50px, with no heavy ring.
- Header has 24–30px top breathing room below the browser safe area.
- Do not add a large colored header background.

### 7.2 Context row

### Structure

```text
[location or context icon] SAN JUAN CITY        Tue · Jul 22, 2026
```

### Rules

- One horizontal row.
- 22–24px line icon.
- Location uses uppercase or title case, but not both.
- Date aligns to the opposite edge.
- Body color is near-black.
- No container, border, or background.
- Place 24–28px beneath the greeting header.

### 7.3 Search field

### Structure

```text
[Search goals, benefits, or documents…]      [search icon]
```

### Rules

- 52–56px tall.
- Full content width.
- White background.
- 1px `--color-border` border.
- 12px radius.
- 16px horizontal padding.
- Placeholder weight 300 and color `--color-placeholder`.
- Search icon sits on the right and is visually strong: 28–30px, black or near-black.
- Focus state changes the border to primary blue and adds a 3px pale-blue focus ring.
- No keyboard-shortcut badge.

### 7.4 Circular shortcut rail

Example eAbot shortcuts:

1. Opportunities
2. Documents
3. School
4. Agencies
5. Guides
6. Help

### Rules

- Horizontal scroll with hidden scrollbar.
- Each item is a circle plus a centered label beneath it.
- Circle size: 56–60px.
- Circle fill: `--color-primary-soft`.
- Icons: royal-blue outline with optional yellow detail.
- Labels: 11–12px, weight 400–500.
- Gap: 10–14px.
- Use a small red “Bago” badge on at most one shortcut.
- Do not put shortcut items inside individual rectangular cards.
- Do not scale the selected shortcut; use a slight pale-blue or border change.

### 7.5 Opportunity banner carousel

For eAbot, this replaces the travel advertisement with the primary proactive benefit discovery.

### Example content

```text
Your opportunity map
3 government pathways may fit your next chapter
[See my matches]
```

### Rules

- Approximately 3:1 aspect ratio on mobile.
- 13px radius.
- Use a light image or soft illustration, not a full dark gradient.
- Copy occupies the left 45–55%.
- Human or service illustration occupies the right side.
- Headline should be 20–24px, not 40px+.
- One concise action only.
- Banner must state “posibleng” rather than implying approval.
- Maximum one short sentence of supporting copy.
- Keep text black or dark blue on a very light background.
- No heavy shadow.

### Carousel controls

- Pagination appears immediately below the banner.
- Inactive dots: 7px gray circles.
- Active indicator: 24px × 7px royal-blue pill.
- Each dot's interactive hit area must be at least 36px.
- If auto-rotation is used, include pause behavior and respect reduced motion.
- Prefer manual swipe/arrow navigation for the prototype.

### 7.6 Asymmetric utility grid

The reference uses one tall tile on the left and two smaller stacked tiles on the right.

For the youth-opportunity demo:

```text
┌────────────────┬────────────────┐
│                │ Next Action    │
│  1 OF 5 STEPS  ├────────────────┤
│  Document plan │ Ask eAbot      │
│                │                │
└────────────────┴────────────────┘
```

### Grid rules

- Two equal-width columns.
- 10px gap.
- Left tile spans two rows.
- All tiles use 13px radius.
- No shadows.
- The complete grid should create a balanced rectangle of roughly 205–250px, with each stacked tile using about half that height.

### Readiness tile

- Very pale blue background.
- Readiness number: 32–36px, weight 500.
- Journey name: 14–16px, weight 300–400.
- Supporting label: 11px.
- A subtle geometric pattern may appear at no more than 4% opacity.
- Do not use a large progress ring if it crowds the tile; a number and thin progress bar are sufficient.

### Next-action tile

- Very pale pink background.
- Short label such as “Next available step”.
- One clear action such as “Request PSA birth certificate” or “Add certified SF9”.
- Use a small document preview or outline icon on the right.

### Ask eAbot tile

- Very pale green background.
- Text “Ask eAbot”.
- Use a friendly flat illustration or the eAbot icon on the right.
- The tile opens the assistant; it is not a chat transcript itself.

### 7.7 Section heading

```text
Opportunities for you
```

- 21–22px on mobile.
- Weight 500.
- Near-black text.
- No uppercase eyebrow above it.
- 28–36px top spacing from the previous section.

### 7.8 Segmented control

Example:

```text
[ Para sa Iyo ] [ Hinahanap Mo ]
```

### Rules

- Full width.
- Two equal segments.
- Height: 44–46px.
- Outer radius: 8px.
- Left surface: pale pink.
- Right surface: pale yellow.
- Selected state uses a 3px royal-blue bottom rule or clear blue text emphasis.
- Do not create raised pill buttons.
- Label size: 14px, weight 500–600.

### 7.9 Service rows and cards

Below the segmented control, services should appear as compact rows rather than large dashboard cards.

### Structure

```text
[pale icon well] Service title           [chevron]
                 Agency · 4 steps
```

### Rules

- White background.
- Minimum height: 76–84px.
- 1px bottom divider or 1px border.
- 12–13px radius when shown as separate cards.
- 48px icon well.
- 15–16px title.
- 10–11px metadata.
- No description longer than one line on the home screen.
- Do not use large card illustrations in service rows.

### 7.10 Fixed bottom navigation

Recommended eAbot items:

1. Tahanan
2. Hanap
3. eAbot AI — raised primary item
4. Lakbay
5. Profile

### Rules

- Fixed to the bottom edge on mobile.
- White translucent or solid background.
- 1px top divider.
- Total height: 76–80px plus safe-area inset.
- Four ordinary icons use slate gray.
- Active ordinary item uses royal blue.
- Label is always visible.
- Center action is a 60px royal-blue circle or rounded circle.
- Center action rises approximately 24–30px above the navigation bar.
- Center icon is white and 28px.
- Center action receives the only prominent shadow.
- Main content requires at least 104px bottom padding so the navigation never covers controls.

---

## 8. Secondary-screen templates

### 8.1 Discover screen

- Reuse the same white header and search field.
- Place shortcut circles immediately beneath search.
- Results use compact service rows.
- Filters use the pastel two-segment control or horizontally scrolling text tabs.
- Avoid a large marketing headline.
- First viewport priority: search, category, results.

### 8.2 Journey screen

- White page with a compact title header.
- Show readiness in a pale blue summary tile similar to the reference weather tile.
- The next action should use a pale pink or yellow compact tile.
- Requirement steps use white rows with thin dividers.
- Completed status: green icon plus “Tapos”.
- Current status: blue icon plus “Ngayon”.
- Locked status: gray lock plus explanatory text.
- The Hub request button remains disabled until readiness is complete.
- Avoid a giant hero, giant progress ring, and multiple paragraphs above the next action.

### 8.3 Ask eAbot screen

- White canvas.
- Small centered eAbot icon and title.
- Messages use very pale blue and neutral bubbles.
- Composer is a 58–62px bordered field.
- Quick prompts use thin bordered chips, not saturated pills.
- Maintain the raised eAbot AI center navigation action.
- Show the official-rules disclaimer as small gray text, not a large colored panel.

### 8.4 Profile screen

- Simple avatar, name, and demo status on white.
- Settings use divider-separated rows.
- Easy Mode uses a native-looking blue toggle.
- Consent controls use clear labels and one-sentence descriptions.
- Future eGov integration appears as a small informational section near the bottom.
- Do not use a blue gradient profile hero.

### 8.5 Onboarding

- Use full white background.
- Small eAbot wordmark at top.
- One illustration or photo occupying no more than 35% of the viewport.
- Headline: 26–30px, weight 500–600.
- Body: 14px, weight 300–400.
- Primary button: 52–56px, royal blue, 12px radius.
- Avoid a floating glass card, page-sized rounded container, or campaign-style display headline.

---

## 9. Content and microcopy style

Use short, calm, respectful Taglish.

Preferred examples:

- “Mabuhay, Mika”
- “Incoming college freshman”
- “3 government pathways may fit your next chapter.”
- “Possible match, not approval.”
- “Why did this appear?”
- “1 of 5 steps moved”
- “Next: Request your PSA birth certificate”
- “Choose one accepted income-document path.”
- “Request and payment complete; document processing.”
- “Final eligibility comes from the responsible agency.”

Avoid:

- long feature explanations on the home screen;
- startup slogans in every section;
- excessive English government jargon;
- text that claims confirmed eligibility;
- text that implies live government integration;
- multiple competing calls to action inside one tile.

---

## 10. Motion and interaction

Motion must be quiet and functional.

- Page entry: 160–220ms opacity plus 6px vertical movement.
- Button press: immediate background or opacity response.
- Carousel: 220–280ms horizontal transition.
- Bottom sheet: 240–300ms translate and fade.
- Readiness update: animate the number or thin bar, not the entire page.
- Never use confetti, bouncing icons, large parallax, or continuous decorative animation.
- Respect `prefers-reduced-motion`.
- Every interactive element must have a visible keyboard focus state.
- Do not rely on hover for essential information.

---

## 11. Accessibility requirements

- Minimum touch target: 44 × 44px; prefer 48px.
- Body-text contrast: at least 4.5:1.
- Large-text contrast: at least 3:1.
- Status must combine icon, label, and color.
- Bottom navigation labels must never be icon-only.
- Search must have an accessible label even when using placeholder text.
- Carousel controls must be buttons with labels such as “Show opportunity banner 2 of 3”.
- Modal sheets must trap focus, support Escape, and restore focus.
- Layout must remain usable at 200% zoom and 320px width.
- Easy Mode should enlarge type and targets without changing the basic component style.
- Voice input must always have a keyboard alternative.
- Images and illustrations require useful alternative text unless purely decorative.

---

## 12. Component implementation map

Recommended React components:

```text
AppShell
├── AppHeader
├── ContextRow
├── ServiceSearch
├── ShortcutRail
│   └── ShortcutCircle
├── OpportunityCarousel
│   ├── OpportunityBanner
│   └── CarouselDots
├── UtilityGrid
│   ├── ReadinessTile
│   ├── NextActionTile
│   └── AskEabotTile
├── OpportunityPicker
│   ├── SegmentedControl
│   └── OpportunityCard
├── DocumentJourney
│   ├── ProgressBar
│   ├── RequirementGroup
│   ├── RequirementRow
│   └── OneOfDocumentPicker
├── DocumentDetails
├── MockQrPayment
├── MockReceipt
└── BottomNavigation
    └── RaisedAssistantAction
```

Component states must be data-driven. Requirement status is derived from completion, processing state, and dependencies rather than a hard-coded percentage.

---

## 13. Responsive acceptance criteria

### 320–430px

- No horizontal page overflow.
- Search, shortcut rail, banner, utility grid, and bottom navigation follow the reference proportions.
- Main actions are never covered by bottom navigation.
- Header greeting and avatar fit without text clipping.
- Utility grid remains two columns.

### 700–1023px

- Content uses the additional width without excessive type scaling.
- Banner remains shallow.
- Shortcut rail may show more items but retains circular wells.
- Bottom navigation remains usable.

### 1024px+

- No phone-frame presentation.
- Content is centered inside a maximum 1180px area.
- Components expand into clean columns.
- Visual tokens remain identical to mobile.
- No conversion into a dense admin/SaaS dashboard.

---

## 14. Fidelity checklist

Before approving the rebuilt UI, verify all of the following:

- [ ] Poppins is the primary font.
- [ ] The page background is predominantly white.
- [ ] No large dark-gradient hero appears on the home screen.
- [ ] The header contains brand, greeting, subtitle, and circular avatar.
- [ ] Context and date use a simple unboxed row.
- [ ] The search field is approximately 64px tall with a right-side search icon.
- [ ] Categories use pale blue circles with blue outlined icons.
- [ ] The opportunity banner is shallow, light, and image/illustration-led.
- [ ] Carousel pagination uses one blue pill and gray dots.
- [ ] The utility area uses one tall tile plus two stacked tiles.
- [ ] Pastel fills are light and restrained.
- [ ] Ordinary cards have little or no shadow.
- [ ] Ordinary radii stay near 12–16px.
- [ ] Featured content uses a two-color segmented control.
- [ ] The bottom navigation has five labeled items.
- [ ] Ask eAbot is the raised center action.
- [ ] Bottom navigation never covers page controls.
- [ ] Mobile works at 320px.
- [ ] Desktop expands naturally without a phone frame.
- [ ] All identity, eligibility, appointment, and integration claims remain visibly labeled as demo data.

---

## 15. Final implementation rule

When visual judgment is ambiguous, choose the option that is:

1. whiter;
2. lighter in font weight;
3. smaller in radius;
4. lower in shadow;
5. shorter in copy;
6. more compact in height;
7. closer to the supplied screenshot's component proportions.

The target is not a generic “modern government dashboard.” The target is a visually faithful eAbot adaptation of the exact soft, compact, mobile-first interface shown in the reference image.
