import type {
  DB,
  Customer,
  Quote,
  PricingRate,
  Content,
  Settings,
  QuoteInputs,
  QuoteStage,
  AdminUser,
  Team,
} from "./types";
import { calcQuote, ratesFromPricing } from "./quote-engine";

function isoDaysAgo(d: number): string {
  return new Date(Date.now() - d * 86400000).toISOString();
}
function id(p: string, n: number) {
  return p + n.toString().padStart(4, "0");
}

const PRICING: PricingRate[] = [
  { key: "pole", label: "Galvanised pole — supply, dig, concrete, erect", unit: "each installed", rate: 1550, group: "structure" },
  { key: "turnbuckle", label: "Kalahari turnbuckle", unit: "per tension point", rate: 150, group: "structure" },
  { key: "chain", label: "Tensioning chain", unit: "per point", rate: 160, group: "structure" },
  { key: "padEye", label: "Kalahari pad eye — drilled & anchored", unit: "per wall point", rate: 175, group: "structure" },
  { key: "eyeBolt", label: "Eyelet / eye-bolt with nut", unit: "per pole point", rate: 90, group: "structure" },
  { key: "labourBase", label: "Base installation labour", unit: "per job", rate: 1725, group: "labour" },
  { key: "labourM2", label: "Labour per m² of net", unit: "per m²", rate: 90, group: "labour" },
];

const SETTINGS: Settings = {
  company_name: "Elite Shade Solutions",
  company_address: "Cape Town, Western Cape, South Africa",
  vat_number: "4xxxxxxxxx",
  vat_enabled: true,
  deposit_pct: 50,
  payment_mode: "payfast_and_eft",
  email_from: "sales@eliteshadesolutions.co.za",
  sales_email: "sales@eliteshadesolutions.co.za",
  info_email: "info@eliteshadesolutions.co.za",
  notification_emails: "info@eliteshadesolutions.co.za",
  email_provider: "smtp",
  smtp_host: "mail.eliteshadesolutions.co.za",
  smtp_port: 465,
  smtp_secure: true,
  smtp_user: "sales@eliteshadesolutions.co.za",
  smtp_pass: "",
  whatsapp: "27676182422",
  sales_name: "Jean-Pierre Miller",
  sales_role: "Sales",
  sales_phone: "067 618 2422",
  sales_whatsapp: "27676182422",
  marketing_name: "Michael Theron",
  marketing_role: "Marketing / Online sales",
  marketing_phone: "060 949 1197",
  facebook_url: "",
  instagram_url: "",
  admin_password: "eliteshade",
  resend_api_key: "",
  ga_measurement_id: "",
  ga_property_id: "",
  ga_service_account_email: "",
  ga_service_account_private_key: "",
  paygate_merchant_id: "",
  paygate_merchant_key: "",
  paygate_passphrase: "",
  paygate_return_url: "",
  paygate_notify_url: "",
  email_templates: {
    estimate: {
      subject: "Your Elite Shade estimate",
      body: "Hi {{name}}, here is your indicative estimate of {{range}}. This is an estimate — we'll confirm the exact price after a quick free site survey.",
    },
    deposit: {
      subject: "Secure your installation — 50% deposit",
      body: "Hi {{name}}, your firm quote is confirmed at {{total}}. Pay your 50% deposit here to book your install: {{paylink}}",
    },
    scheduled: {
      subject: "Your installation is booked",
      body: "Hi {{name}}, your Elite Shade installation is scheduled for {{date}}. See you then!",
    },
  },
};

interface SeedLead {
  name: string;
  email: string;
  phone: string;
  suburb: string;
  address: string;
  source: string;
  inputs: QuoteInputs;
  stage: QuoteStage;
  final?: number;
  days: number;
}


// Mirrors the §11 kanban sample cards.
const LEADS: SeedLead[] = [
  { name: "M. Daniels", email: "m.daniels@example.co.za", phone: "082 111 2222", suburb: "Constantia", source: "Google Ads", inputs: { length: 5, width: 3, shape: "auto", range: "any", poles: true, colour: "Charcoal" }, stage: "new", days: 0, address: "12 Vineyard Rd, Constantia, 7806" },
  { name: "S. Petersen", email: "s.petersen@example.co.za", phone: "083 222 3333", suburb: "Durbanville", source: "Instagram", inputs: { length: 3.6, width: 3.6, shape: "triangle", range: "Standard", poles: true, colour: "Sand" }, stage: "new", days: 1, address: "3 Buitekant St, Durbanville, 7550" },
  { name: "R. Khan", email: "r.khan@example.co.za", phone: "084 333 4444", suburb: "Rondebosch", source: "Referral", inputs: { length: 5, width: 5, shape: "square", range: "Standard", poles: false, colour: "Black" }, stage: "following_up", days: 3, address: "45 Grove Ave, Rondebosch, 7700" },
  { name: "J. Adams", email: "j.adams@example.co.za", phone: "082 444 5555", suburb: "Somerset West", source: "Google Search", inputs: { length: 5, width: 3, shape: "rectangle", range: "Standard", poles: true, colour: "Charcoal" }, stage: "confirmed", final: 11400, days: 5, address: "8 Somerset Rd, Somerset West, 7130" },
  { name: "L. Naidoo", email: "l.naidoo@example.co.za", phone: "083 555 6666", suburb: "Sea Point", source: "Google Ads", inputs: { length: 5.4, width: 5.4, shape: "square", range: "Extreme", poles: true, colour: "Silver" }, stage: "deposit_paid", final: 19800, days: 7, address: "22 Beach Rd, Sea Point, 8005" },
  { name: "P. Smit", email: "p.smit@example.co.za", phone: "084 666 7777", suburb: "Stellenbosch", source: "Referral", inputs: { length: 5, width: 3, shape: "rectangle", range: "Extreme", poles: true, colour: "Sand" }, stage: "scheduled", final: 14600, days: 10, address: "7 Dorp Str, Stellenbosch, 7600" },
  { name: "T. Mbeki", email: "t.mbeki@example.co.za", phone: "082 777 8888", suburb: "Bishopscourt", source: "Instagram", inputs: { length: 5, width: 5, shape: "square", range: "Standard", poles: true, colour: "Black" }, stage: "installed", final: 13200, days: 18, address: "15 Bishopscourt Dr, Claremont, 7708" },
];

const TEAMS: Team[] = [
  { id: id("team_", 1), name: "Crew A", email: "", members: "Lead installer + assistant", active: true, created_at: isoDaysAgo(60) },
  { id: id("team_", 2), name: "Crew B", email: "", members: "Overflow / second crew", active: true, created_at: isoDaysAgo(45) },
];

const GALLERY: Partial<Content>[] = [
  { title: "Poolside sail — Constantia", body: "5×5m Standard square, four galvanised poles. Built for the Southeaster.", image: "/site-photos/hero-house-sail.jpg", meta: { suburb: "Constantia", tag: "Pool" } },
  { title: "Patio shade — Durbanville", body: "Triangle sail wall-fixed over an entertainment patio.", image: "/site-photos/patio-terrace-sail.jpg", meta: { suburb: "Durbanville", tag: "Patio" } },
  { title: "Carport cover — Somerset West", body: "Extreme 5.4m square, 285 GSM reinforced for wind exposure.", image: "/site-photos/courtyard-sail.jpg", meta: { suburb: "Somerset West", tag: "Parking" } },
  { title: "Play area — Stellenbosch", body: "Charcoal rectangle sail over a children's play zone.", image: "/site-photos/garden-sail.jpg", meta: { suburb: "Stellenbosch", tag: "Play" } },
];

const POSTS: Partial<Content>[] = [
  {
    slug: "shade-sail-sizes-explained",
    title: "Shade sail sizes explained: how big do you really need?",
    meta: { excerpt: "How to size a Kalahari shade sail for your patio, pool or carport — and why the printed size isn't the limit." },
    image: "/site-photos/hero-house-sail.jpg",
    body:
      "The first mistake people make when buying a shade sail is shopping for the sail before measuring the space. Start the other way around: measure the area you actually want shaded — length and width at the widest points — and let the net follow.\n\nHere's the part most people miss. Kalahari nets are knitted from UV-stabilised HDPE, and that fabric stretches about a metre when it's correctly tensioned. In practice that means a net comfortably reaches up to roughly 0.8m further per side than its nominal printed size. So a net labelled 5 × 3m will cover an area a little larger than that once it's pulled taut between its anchor points. The upshot: the smallest net that fits your space is often a size smaller — and cheaper — than you'd guess by matching numbers exactly.\n\nKalahari sizes are fixed, which is exactly why we can price them online. The ready-made range tops out at 5.4 × 5.4m for a square, 5 × 3m for a rectangle and 5 × 5 × 5m for a triangle. Need more than that? We either combine two sails with a shared centre pole, or build a custom shade-port — both confirmed on a free site survey.\n\nShape matters too. Triangles look light and architectural and only need three anchor points, which can mean fewer poles. Squares and rectangles cover more usable floor area for the same footprint but need four points. Our calculator weighs all of this automatically: enter your area, and it picks the cheapest genuine net that covers you, allowing for the stretch.",
  },
  {
    slug: "standard-vs-extreme-kalahari",
    title: "Standard vs Extreme: which Kalahari range is right for you?",
    meta: { excerpt: "285 GSM, reinforced webbing, and when the heavier Extreme net is worth it." },
    image: "/site-photos/courtyard-sail.jpg",
    body:
      "Kalahari makes two permanent-install ranges, and both block up to 90% of UV with the same breathable, fade-, mould- and mildew-resistant knitted fabric. The question isn't quality — both are genuinely good — it's how much weather you're asking the sail to take.\n\nStandard is the everyday workhorse. For a typical patio, pool or play area in normal Cape conditions it's all you need: it cuts the sun, breathes in a breeze, and lasts for years.\n\nExtreme steps up the build. It uses heavier 285 GSM fabric, wider webbing around the perimeter and reinforced stitching at the corners where the load concentrates. That extra material matters in two situations: relentless, high-exposure sun (think a west-facing yard that bakes all afternoon) and strong, regular wind — which in the Western Cape means most coastal and elevated plots facing the Southeaster.\n\nExtreme always costs a bit more than Standard for the same size, so it's a deliberate choice rather than a default. A rough rule: if your site is sheltered and you're shading for comfort, Standard is plenty. If it's exposed, coastal, or you're spanning a large opening, spend the extra on Extreme — it's cheaper than re-doing a sail that's been stressed beyond its grade.",
  },
  {
    slug: "pole-vs-wall-fixing",
    title: "Pole vs wall fixing: which anchoring is right for your space?",
    meta: { excerpt: "Pad eyes, eye-bolts, galvanised poles — how each corner of a sail gets held down." },
    image: "/site-photos/patio-terrace-sail.jpg",
    body:
      "Every shade sail is only as good as the points it's anchored to. A sail has a tension point at each corner — three for a triangle, four for a square or rectangle — and each point is either fixed to a wall or stood up on a pole.\n\nWall fixing uses a drilled-in pad eye anchored into sound masonry, fascia or a structural beam. Where you already have a solid wall in the right place, this is the neat, economical choice — there's nothing to dig and nothing standing in the yard.\n\nPole fixing uses a galvanised steel post set in a concrete footing, with an eye-bolt at the top. Poles give you total freedom over where the sail sits — out in the middle of a lawn, over a pool, across a driveway — and they're essential when there's simply nothing solid to fix to. The trade-off is cost and a bit of groundwork: each pole is supplied, dug in, concreted and erected.\n\nMost real installs are a mix: two corners on the house wall, two on poles. Whatever the combination, every point also gets a turnbuckle and a length of tensioning chain so we can pull the sail into a proper taut, double-curved shape. Our calculator lets you choose wall-fixed or free-standing and prices the hardware for each point accordingly.",
  },
  {
    slug: "engineered-for-the-cape",
    title: "Engineered for the Cape: surviving the Southeaster",
    meta: { excerpt: "Why DIY sails fail in Cape wind, and what proper tensioning and footings change." },
    image: "/site-photos/garden-sail.jpg",
    body:
      "The Cape Doctor — the summer Southeaster — is what separates a shade sail that lasts from one that's flapping in tatters by February. Most failures aren't the fabric; they're the install.\n\nA shade sail is a tension structure. Done right, it's pulled into a double-curved 'hypar' shape that's taut in every direction. A taut sail sheds wind — the air slides over a rigid curved surface. A slack sail does the opposite: it billows, snaps and shock-loads its fixings until something tears or pulls out. So tensioning isn't a finishing touch, it's the whole engineering principle.\n\nThat's why we use turnbuckles and chain at every point — they let us dial in real tension and re-tension later if the fabric beds in. It's why poles go into proper concrete footings sized for wind load, not just knocked into the ground. And it's why all the metalwork is galvanised or stainless: coastal air eats untreated steel, and a corroded fitting is a future failure point.\n\nDIY kit sails from a hardware store skip all of this — light poles, shallow footings, no real tensioning hardware — which is why they rarely see out a second windy season here. Engineered shade costs more up front and then simply keeps working. For an exposed site, pair that approach with the Extreme 285 GSM net and you've got a structure built for where you actually live.",
  },
  {
    slug: "shade-sail-care-and-maintenance",
    title: "Caring for your shade sail: simple maintenance that adds years",
    meta: { excerpt: "Cleaning, re-tensioning and seasonal checks to keep a Kalahari net performing." },
    image: "/site-photos/hero-house-sail.jpg",
    body:
      "Kalahari nets are low-maintenance by design — UV-stabilised and resistant to mould and mildew — but a little attention keeps them taut, clean and lasting well beyond expectations.\n\nCleaning is easy: hose it down a few times a year, and for stubborn spots use lukewarm water with a mild soap and a soft brush. Avoid harsh detergents, bleach and pressure washers — they can damage the knit and strip the UV stabilisers. Because the fabric is breathable, it dries quickly and doesn't hold water.\n\nRe-tensioning is the one thing worth checking. New fabric can bed in slightly over the first few weeks, and seasons of wind work the fittings. A sail that's gone a touch slack should be re-tensioned at the turnbuckles — it's a five-minute job that protects against wind damage. If you're not comfortable doing it, we can swing by.\n\nSeasonal checks before the windy season: look over the stitching at the corners, check that pad eyes and eye-bolts are still tight, and make sure poles haven't shifted. Catching a loose fitting early is the difference between a quick tighten and a torn sail.\n\nDone consistently, this handful of habits keeps a Kalahari sail looking sharp and performing like new for many years — which is exactly the return a properly engineered install is meant to deliver.",
  },
];

export function seedDB(): DB {
  const rates = ratesFromPricing(PRICING);
  const customers: Customer[] = [];
  const quotes: Quote[] = [];
  const now = Date.now();

  LEADS.forEach((lead, i) => {
    const cid = id("cus_", i + 1);
    customers.push({
      id: cid,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      suburb: lead.suburb,
      address: lead.address,
      source: lead.source,
      created_at: isoDaysAgo(lead.days),
    });
    const r = calcQuote(lead.inputs, rates);
    quotes.push({
      id: id("qte_", i + 1),
      customer_id: cid,
      status: lead.stage,
      inputs: lead.inputs,
      line_items: r.lineItems,
      net_label: r.netLabel,
      subtotal: r.subtotal,
      vat: r.vat,
      estimate_low: r.low,
      estimate_high: r.high,
      final_total: lead.final ?? null,
      final_line_items: lead.final != null ? r.lineItems : null,
      archived: false,
      exceeded: r.exceeded,
      notes: "",
      created_at: isoDaysAgo(lead.days),
      updated_at: isoDaysAgo(lead.days),
    });
  });

  const content: Content[] = [];
  GALLERY.forEach((g, i) =>
    content.push({
      id: id("gal_", i + 1),
      type: "gallery",
      slug: "gallery-" + (i + 1),
      title: g.title!,
      body: g.body!,
      image: g.image || "",
      meta: g.meta || {},
      published: true,
      created_at: isoDaysAgo(i * 4),
    })
  );
  POSTS.forEach((p, i) =>
    content.push({
      id: id("pst_", i + 1),
      type: "post",
      slug: p.slug!,
      title: p.title!,
      body: p.body!,
      image: p.image || "",
      meta: p.meta || {},
      published: true,
      created_at: isoDaysAgo(i * 6 + 2),
    })
  );

  // ── Page blocks — editable CMS sections for the public site ──
  const PAGE_BLOCKS: Partial<Content>[] = [
    {
      slug: "home_hero",
      title: "Home — Hero section",
      meta: {
        headline: "Know your price\nin two minutes.\nInstalled by experts.",
        subheadline: "Premium Kalahari shade sails — engineered for the Southeaster, priced transparently online. No callback, no mystery quote, no pushy sales visit before you see a number.",
        cta: "Get my instant estimate →",
      },
    },
    {
      slug: "home_stats",
      title: "Home — Stats strip",
      meta: {
        items: JSON.stringify([
          { n: "138", suffix: "+", label: "sails installed across the Cape" },
          { n: "2", suffix: " min", label: "to a real online estimate" },
          { n: "90", suffix: "%", label: "UV blocked by Kalahari fabric" },
          { n: "285", suffix: " GSM", label: "Extreme reinforced fabric" },
        ]),
      },
    },
    {
      slug: "home_usps",
      title: "Home — Why Elite cards",
      meta: {
        items: JSON.stringify([
          { title: "Instant estimate", desc: "A self-serve calculator gives a real price range on the spot. Competitors all gate pricing behind a call." },
          { title: "Engineered for the Cape", desc: "Galvanised posts, stainless fittings and correct tensioning, built for the Southeaster — not a patch job." },
          { title: "Genuine Kalahari product", desc: "Permanent-install nets, 90% UV block, breathable UV-stabilised fabric. Extreme range is 285 GSM, reinforced." },
        ]),
      },
    },
    {
      slug: "home_testimonials",
      title: "Home — Testimonials",
      meta: {
        items: JSON.stringify([
          { name: "Megan D.", suburb: "Constantia", text: "Had a real price in minutes instead of waiting a week for a callback. The sail's survived two southeasters without a flutter." },
          { name: "Riaan K.", suburb: "Durbanville", text: "Proper galvanised posts, neat stainless fittings — you can see it's engineered, not bolted on. Worth every rand." },
          { name: "Thandi M.", suburb: "Bishopscourt", text: "Booked the deposit online, install date confirmed the same week. Easiest home project we've done." },
        ]),
      },
    },
    {
      slug: "home_faq",
      title: "Home — FAQ",
      meta: {
        items: JSON.stringify([
          { q: "How accurate is the online estimate?", a: "It's a genuine, itemised range — net, poles, hardware and labour — not a teaser. We only firm it up after a free on-site survey because ground conditions, access and exact fixings vary. In most cases the final quote lands inside the range you saw online." },
          { q: "What makes Kalahari nets different from hardware-store sails?", a: "Kalahari nets are knitted UV-stabilised HDPE built for permanent installation — they block up to 90% of UV, breathe in wind, and resist fading, mould and mildew. The Extreme range adds 285 GSM fabric, wider webbing and reinforced stitching for harsher sun and wind." },
          { q: "Do I need poles, or can you fix to my walls?", a: "Both work. Where you have a sound wall or fascia we anchor with a drilled pad eye — cheaper and tidy. Where there's nothing to fix to, we install galvanised poles set in concrete. The calculator prices either option." },
          { q: "How long does installation take?", a: "A typical single-sail residential install is a one-day job once poles have cured. We confirm the schedule when your deposit is paid and email you the date." },
          { q: "What's the deposit and when do I pay the balance?", a: "A 50% deposit secures the sale and books your install, paid securely via PayFast. The balance is due on completion of installation." },
          { q: "Which areas do you cover?", a: "The greater Cape Metro — Southern Suburbs, Northern Suburbs, Helderberg, Atlantic Seaboard and the Winelands. Site surveys in the Cape Metro are free." },
        ]),
      },
    },
    {
      slug: "contact_info",
      title: "Contact + Footer — Contact details",
      meta: {
        sales_name: "Jean-Pierre Miller",
        sales_role: "Sales",
        sales_phone: "067 618 2422",
        sales_whatsapp: "27676182422",
        marketing_name: "Michael Theron",
        marketing_role: "Marketing / Online sales",
        marketing_phone: "060 949 1197",
        sales_email: "sales@eliteshadesolutions.co.za",
        info_email: "info@eliteshadesolutions.co.za",
        areas: "Southern Suburbs · Northern Suburbs · Helderberg · Atlantic Seaboard · Cape Winelands",
      },
    },
    {
      slug: "footer_info",
      title: "Footer — Company details",
      meta: {
        brand_name: "Elite Shade",
        tagline: "Engineered Shade. Exceptional Spaces.",
        blurb: "Premium Kalahari shade sails, professionally installed in Cape Town with engineered fixings and transparent quoting.",
        location: "Cape Town, Western Cape, South Africa",
        legal_note: "Prices are indicative estimates. Final pricing is confirmed after a free site survey.",
        facebook_url: "",
        instagram_url: "",
      },
    },
  ];

  PAGE_BLOCKS.forEach((b, i) =>
    content.push({
      id: id("blk_", i + 1),
      type: "block",
      slug: b.slug!,
      title: b.title!,
      body: "",
      image: "",
      meta: b.meta || {},
      published: true,
      created_at: isoDaysAgo(0),
    })
  );

  const users: AdminUser[] = [
    { id: "usr_0001", name: "Owner", email: "owner@eliteshade.co.za", password: "eliteshade", role: "admin", active: true, receive_admin_notifications: true, created_at: isoDaysAgo(60) },
    { id: "usr_0002", name: "Partner", email: "partner@eliteshade.co.za", password: "partner123", role: "manager", active: true, receive_admin_notifications: true, created_at: isoDaysAgo(30) },
  ];

  return {
    customers,
    quotes,
    invoices: [],
    installations: [
      {
        id: id("ins_", 1),
        quote_id: id("qte_", 6),
        scheduled_date: new Date(now + 6 * 86400000).toISOString().slice(0, 10),
        installer: "Crew A",
        team_id: id("team_", 1),
        status: "pending",
        notes: "Stellenbosch — rectangle, 4 poles.",
      },
    ],
    teams: TEAMS,
    pricing: PRICING,
    activities: [],
    notifications: [],
    content,
    settings: SETTINGS,
    users,
    emails: [],
    counters: { invoice: 1000 },
  };
}
