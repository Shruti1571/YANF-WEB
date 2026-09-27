# YANF Digital & Physical Certificate System

## Architectural Specification, Workflow & Design Blueprint

---

## 1. Executive Summary & Core Concept

The YANF Certificate System bridges **pre-event physical certificate preparation** with **live post-event digital verification and PDF delivery**:

```
[ PRE-EVENT ]                                  [ DURING EVENT ]                [ POST-EVENT ]
Admin creates Event                            Event takes place.              Admin enters all 5 details:
   ↳ Uploads Logos (School + YANF)             Winners are chosen.                ↳ Name & Email
   ↳ Uploads Signatures (School + YANF)        Physical awards handed out         ↳ Position & Representation
   ↳ Creates N blank Certificate placeholders  with pre-printed QR code.          ↳ Committee Name
   ↳ Downloads QR images (with Short ID)                                       Winner scans QR:
                                                                                   ↳ Views complete Certificate
                                                                                   ↳ Enters OTP to download PDF
```

---

## 2. Certificate Visual Layout, Logos & Signatures

### Format: **Portrait (A4 — 210mm × 297mm, Aspect Ratio 1 : 1.414)**

### Logo & Signature Placement Architecture: Option A (Margin-Aligned + Dead-Center)

Logos at the top header and Signatures at the bottom share the exact same architectural alignment model:

#### 1. When 3 Entities exist (2 Schools / Partners + 1 YANF):
- **Left Position (School 1):** Aligned flush to the **Left Margin** (aligned with the left signature block below).
- **Center Position (School 2):** Positioned at the **Dead Center** (50% horizontal axis, directly above "CERTIFICATE OF ACHIEVEMENT").
- **Right Position (YANF):** Aligned flush to the **Right Margin** (aligned with the right signature block and QR code below).
- **Distance:** Center-to-center distance between Left and Center equals distance between Center and Right.

#### 2. When 2 Entities exist (1 School / Partner + 1 YANF):
- **Left Position (School 1):** Aligned flush to the **Left Margin**.
- **Right Position (YANF):** Aligned flush to the **Right Margin**.
- **Center Area:** Kept open for clean visual breathing room directly above the certificate title.

---

### Logo Sizing & Aspect Ratio Normalization (Zero Cropping)

The unifying design factor across all logos is a **Universal Height Ceiling (`50px`)** with `object-fit: contain`:

1. **Strict Zero Cropping (`object-fit: contain`):**
   * Institutional logos must never be cropped. Text, borders, and mottos remain 100% intact.
2. **Dimension Standards by Shape:**
   * **Square Crests / Round Seals (1:1):** Render at **`50px × 50px`**.
   * **Wide Rectangular Wordmarks (3:1 to 4:1):** Render up to **`135px × 45px`**.
   * **Standard Rectangles (2:1):** Render at **`100px × 50px`**.
3. **Handling All Permutations Automatically:**
   * **All Square:** All 3 render at `50px × 50px` (Left flushed left, Center dead center, Right flushed right). Perfectly symmetric, like 3 official diplomatic seals.
   * **All Rectangle:** All 3 render at `~130px × 42px` across the top. Clean, institutional header ribbon.
   * **2 Rectangle + 1 Square (or 1 Rectangle + 2 Square):** Because all logos share the **same horizontal midline** and height ceiling (`50px`), the square crest never looks undersized and the rectangular banners never overpower it.
4. **Transparency Support:**
   * Admin dashboard provides a transparent checkerboard preview to ensure uploaded logos do not carry unintended solid white bounding boxes.

---

### Certificate Visual Layout & ASCII Diagram:

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│  ╔════════════════════════════════════════════════════════════════════════════╗  │
│  ║  [School Logo 1]              [School Logo 2]               [YANF Logo]    ║  │
│  ║     (Square)                    (Rectangle)                  (Square)      ║  │
│  ║  ◄─────────── Equal Distance ─────────►◄────────── Equal Distance ───────► ║  │
│  ║                                                                            ║  │
│  ║                         CERTIFICATE OF ACHIEVEMENT                         ║  │
│  ║                                                                            ║  │
│  ║                           This is to certify that                          ║  │
│  ║                                                                            ║  │
│  ║                                ANANYA SHARMA                               ║  │
│  ║                         ───────────────────────────                        ║  │
│  ║                                                                            ║  │
│  ║                         has been duly recognized as                        ║  │
│  ║                                                                            ║  │
│  ║                                BEST DELEGATE                               ║  │
│  ║                         ───────────────────────────                        ║  │
│  ║                                                                            ║  │
│  ║                     Representing  UNITED STATES OF AMERICA                 ║  │
│  ║                                   ────────────────────────                 ║  │
│  ║                                                                            ║  │
│  ║                    In the  UNITED NATIONS SECURITY COUNCIL                 ║  │
│  ║                            ───────────────────────────────                 ║  │
│  ║                                                                            ║  │
│  ║             for outstanding diplomacy and leadership during the            ║  │
│  ║                                                                            ║  │
│  ║                      YANF NATIONAL YOUTH ASSEMBLY 2026                     ║  │
│  ║                 ────────────────────────────────────────────               ║  │
│  ║                                                                            ║  │
│  ║   ┌────────────────┐          ┌────────────────┐         ┌───────────────┐ ║  │
│  ║   │  [Signature]   │          │  [Signature]   │         │  [Signature]  │ ║  │
│  ║   │ ────────────── │          │ ────────────── │         │ ───────────── │ ║  │
│  ║   │ Principal      │          │ MUN Director   │         │ Secretary-Gen │ ║  │
│  ║   │ (School 1)     │          │ (School 2)     │         │ (YANF)        │ ║  │
│  ║   └────────────────┘          └────────────────┘         └───────────────┘ ║  │
│  ║  ◄─────────── Equal Distance ─────────►◄────────── Equal Distance ───────► ║  │
│  ║                                                                            ║  │
│  ║   To verify this certificate, scan the given QR code.         ┌──────────┐ ║  │
│  ║   Certificate ID: YANF-26-8K7Q                                │  [ QR ]  │ ║  │
│  ║                                                               └──────────┘ ║  │
│  ╚════════════════════════════════════════════════════════════════════════════╝  │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### Verification Strip (Below Signatures):

- **Bottom-Left (2 Lines):**
  - Line 1: `To verify this certificate, scan the given QR code.`
  - Line 2: `Certificate ID: YANF-26-8K7Q`
- **Bottom-Right (Parallel):**
  - Clean standalone **QR Code** (without redundant ID text underneath, since it is directly beside it on line 2).

### Dynamic Content Inheritance:

- The **Event Name** is automatically inherited from the Event record and rendered dynamically on the certificate.
- Central text remains 100% horizontally centered along the vertical axis of the certificate.

---

## 3. Certificate Number / ID Standard

- **Default Format:** `YANF-26-XXXX`
  - Prefix: `YANF-`
  - Year: `26-` (current 2-digit year)
  - Random Suffix: `XXXX` (4 unambiguous uppercase alphanumeric characters, e.g. `8K7Q`, `3M9W`)
  - Full Example: **`YANF-26-8K7Q`**
- **Collision Protection:** Random characters exclude easily confused letters (`0/O`, `1/I/L`).
- **Admin Editable:** The admin can modify the certificate number to match custom school numbering (e.g. `DPS-MUN-01`), but the backend strictly checks uniqueness across all events in the database.

---

## 4. End-to-End System Workflow

### Step 1: Pre-Event Admin Setup

1. **Create Event:**
   - Event Title (e.g., _"YANF National Youth Assembly 2026"_).
   - Date & Venue.
   - School Name & Selection:
     - School Logos: 1 or 2 (upload PNG/SVG with transparent backdrops).
     - YANF Logo: standard upload or default platform preset.
     - School Signatories: 1 or 2 (Name, Designation/Position, Signature image).
     - YANF Signatory: 1 (Name, Designation/Position, Signature image).
   - **Incremental Save:** Admins can save drafts with partial information at any time (e.g. even if just the event title is entered).
2. **Batch Certificate Generation (Pre-Event):**
   - Admin inputs the count $N$ of certificates needed (e.g. 50) and clicks **Create**.
   - Admin can also add individual certificates ($N+1$) on demand.
   - The system instantly generates $N$ rows, each with:
     - A unique auto-generated **Certificate ID** (default: `YANF-26-XXXX`, editable with uniqueness check).
     - Its corresponding **QR Code image**.
     - **ALL 5 participant detail fields are left blank pre-event:**
       1. `Recipient Name` (blank)
       2. `Recipient Email` (blank)
       3. `Position` (blank)
       4. `Portfolio` (blank)
       5. `Committee` (blank)
          _(Note: Event Name is automatically inherited from the Event, so it does not need to be entered here)._
   - Admin clicks **"Download All QRs (.ZIP)"** to export all $N$ QR images for physical printing.

3. **Bulk QR Download Action:**
   - One-click **"Download All QRs (.ZIP)"** button.
   - Generates a `.zip` archive containing individual PNG files named strictly as:
     - `YANF-26-8K7Q.png`
     - `YANF-26-4N2P.png`
     - `YANF-26-9B1X.png`

### Step 2: Physical Printing & Live Event

1. Physical certificates are printed with:
   - Event branding, School Logos, and YANF Logo.
   - Decorative border.
   - Template blank lines for Name, Position, Portfolio, and Committee.
   - Event Name printed dynamically from the Event setup (_"for outstanding diplomacy and leadership during the [Event Name]."_).
   - School and YANF Signatures.
   - The unique **pre-printed QR Code image** (with its Certificate ID printed below) in the right margin.
2. The live event takes place; chairs announce winners.
3. The Secretariat writes the winner's details on the physical award:
   - Winner's Name
   - Award Position (e.g., Best Delegate)
   - Portfolio (e.g., United States of America)
   - Committee (e.g., United Nations Security Council)

### Step 3: Post-Event Admin Synchronization

1. Admin opens the Event dashboard or searches for the Certificate ID (e.g. `YANF-26-8K7Q`).
2. Admin fills in all 5 participant details:
   - **Recipient Name**
   - **Recipient Email** (used for OTP download verification)
   - **Position**
   - **Portfolio**
   - **Committee**
     _(Event Name is already linked from the Event)._
3. Clicks **Save & Activate**.
4. The digital record is now live and linked to that certificate's QR code.

### Step 4: Verification & Public Search (`#page-certificates`)

1. **QR Scan Flow:**
   - Scanning the QR on the physical award opens: `https://yanfglobal.com/#page-certificates?id=YANF-26-8K7Q`.
   - Opens the digital certificate directly in high-fidelity view mode.
2. **Public Search Bar:**
   - Available on the public `#page-certificates` page with two search modes:
     1. **Search by Certificate Number** (e.g. `YANF-26-8K7Q`)
     2. **Search by Recipient Name + Registered Email** (e.g. `Ananya Sharma` + `ananya@gmail.com`)
3. **Rich Instructional Layout (Preventing Empty Page Feel):**
   - **Hero Header:** Credential verification title with live status badge.
   - **Dual Search Card:** Interactive tabbed search bar (Certificate ID vs Name + Email).
   - **Step-by-Step Verification Guide:**
     - 📱 _Step 1: Scan Physical QR or Search by ID_
     - 🛡️ _Step 2: Instant Tamper-Proof Visual Verification_
     - 🔐 _Step 3: Secure Owner PDF Export via 2FA Email OTP_
   - **Security Guarantee & FAQ Section:**
     - Why YANF certificates use cryptographic verification.
     - How universities and admissions officers verify authenticity.
     - What to do if an OTP is not received.

### Step 5: Secure PDF Download (Owner Authentication via OTP)

1. Anyone scanning the QR can **view** the certificate to verify authenticity.
2. When the user clicks **"Download Official PDF"**:
   - System prompts: _"To download the official signed certificate, an OTP will be sent to the registered email: an\*\*\*\*@gmail.com"_.
   - User clicks **"Send OTP"**.
   - A 6-digit OTP is delivered to the winner's inbox.
   - User enters the OTP.
   - Upon successful verification, the system generates and downloads the high-resolution, print-ready portrait PDF.

---

## 5. Technical Safeguards & Edge Cases

1. **Early QR Scan (Winner scans before Admin enters the 5 details):**
   - If a winner scans the QR code immediately after receiving the physical award, but before the admin inputs their details into the portal, the page displays:
     > _"Official YANF Certificate Issued. Post-event digital record is currently being synchronized by the Secretariat. Check back shortly."_
   - Shows the Event Name, School Name, and Certificate ID so the delegate knows their certificate is genuine and active.
2. **OTP Rate Limiting & Anti-Spam:**
   - Recipient email address is masked in the UI (`an****@gmail.com`).
   - 60-second cooldown timer between OTP requests.
   - Max 5 OTP requests per hour per certificate ID.
   - OTP expires in 10 minutes.
3. **Print-Ready QR Image Generation:**
   - Single and Bulk QR images are exported with clean white padding, high error-correction level (`H`), and the certificate number rendered in crisp monospace font below the QR.

---

## 6. Database Schema Design

```javascript
// models/Event.js
const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    edition: { type: String },
    date: { type: Date },
    venue: { type: String },
    schoolLogos: [
      {
        url: String,
        altText: String,
      },
    ], // 1 or 2
    yanfLogo: {
      url: String,
      default: "/yanf-logo.svg",
    },
    schoolSignatories: [
      {
        name: String,
        position: String,
        signatureUrl: String,
      },
    ], // 1 or 2
    yanfSignatory: {
      name: { type: String, default: "Secretary General" },
      position: { type: String, default: "YANF Global Secretariat" },
      signatureUrl: String,
    },
    status: {
      type: String,
      enum: ["draft", "active", "archived"],
      default: "draft",
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);

// models/Certificate.js
const certificateSchema = new mongoose.Schema(
  {
    event: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Event",
      required: true,
    },
    certificateNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    recipientName: { type: String, default: "" },
    recipientEmail: { type: String, default: "" },
    position: { type: String, default: "" }, // e.g. Best Delegate (filled post-event)
    portfolio: { type: String, default: "" }, // e.g. United States of America / Portfolio represented
    committee: { type: String, default: "" }, // e.g. UNSC (filled post-event)
    isIssued: { type: Boolean, default: false },
    issuedAt: { type: Date },
    downloadCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

// models/CertificateOtp.js
const certificateOtpSchema = new mongoose.Schema(
  {
    certificateId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Certificate",
      required: true,
    },
    email: { type: String, required: true },
    otp: { type: String, required: true },
    expiresAt: { type: Date, required: true, index: { expires: 0 } },
  },
  { timestamps: true },
);
```
