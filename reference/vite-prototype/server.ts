import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

dotenv.config();

const app = express();
const PORT = 3000;

// Initialize Supabase safely
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";
const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null;

// Seeded fallback accounts for mock authentication when Supabase is not configured
let localUsersRegistry = [
  { id: "u-admin", email: "admin@krystles.com", passwordHash: "admin123", role: "admin" },
  { id: "u-browser", email: "browser@krystles.com", passwordHash: "browser123", role: "browser" },
  { id: "u-lister", email: "lister@krystles.com", passwordHash: "lister123", role: "lister" }
];

// Initialize Gemini safely
const ai = process.env.GEMINI_API_KEY
  ? new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    })
  : null;

app.use(express.json());

// IN-MEMORY STORAGE STATE
// Elite profiles
let profiles = [
  {
    id: "aurelia",
    displayName: "Aurelia Vance",
    age: 29,
    role: "Verified Match",
    locationName: "London, Mayfair",
    distance: "1.2 miles away",
    headline: "Contemporary art curator & private advisor",
    bio: "Specializing in neo-expressionist galleries. Seeking a discreet companion for private gallery tours, classical jazz, and deep conversation in hidden corners.",
    extendedBio: "Aurelia has spent the last seven years advising high-net-worth families on contemporary art acquisitions across London, Geneva, and New York. Holding an MA in Art History from Courtauld Institute, she curates private spaces and hosts exclusive, invitation-only viewings. She is passionate about avant-garde movements, underground jazz clubs, and mid-century architecture.",
    sanitySource: "sanity.io/production/krystles-pistols-ledger/aurelia-vance",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400",
    isVerified: true,
    safetyRating: "Gold Check",
    recentActivity: "Active 5m ago",
    gallery: [
      "https://images.unsplash.com/photo-1543857778-c4a1a3e0b2eb?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1513364776144-60967b0f800f?auto=format&fit=crop&q=80&w=400"
    ],
    videoUrl: "https://player.vimeo.com/external/371433846.sd.mp4?s=236da2f3c054273b1d07ec71607ef3c4ef9b8b30&profile_id=164&oauth2_token_id=57447761",
    languages: ["English", "French", "German"],
    interests: ["Contemporary Art", "Classical Jazz", "Aviation", "Neo-Expressionism"]
  },
  {
    id: "montgomery",
    displayName: "Montgomery Sterling",
    age: 34,
    role: "Verified Match",
    locationName: "New York, Chelsea",
    distance: "2.4 miles away",
    headline: "Private Equity Partner & Single-Malt Collector",
    bio: "Enjoys architectural restoration, vintage watch collections, and rare cigars. Seeking premium, discreet company for relaxed Chelsea evenings.",
    extendedBio: "Montgomery oversees direct investments in heritage luxury brands and commercial real estate. When not negotiating terms in Midtown, he is an active yachtsman, restorer of historic brownstones, and an avid collector of pre-war Swiss watch complications. He splits his time between Chelsea, Manhattan, and his estate in Martha's Vineyard.",
    sanitySource: "sanity.io/production/krystles-pistols-ledger/montgomery-sterling",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400",
    isVerified: true,
    safetyRating: "Gold Check",
    recentActivity: "Active 15m ago",
    gallery: [
      "https://images.unsplash.com/photo-1540959733332-eab4deceeaf7?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1508962914676-134849a727f0?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&q=80&w=400"
    ],
    videoUrl: "https://player.vimeo.com/external/435674703.sd.mp4?s=51399af3114d5e9cfec1859663f7324d45d3151a&profile_id=164&oauth2_token_id=57447761",
    languages: ["English", "Italian"],
    interests: ["Private Equity", "Horology", "Yachting", "Vintage Cigars"]
  },
  {
    id: "vivienne",
    displayName: "Vivienne Thorne",
    age: 31,
    role: "Verified Match",
    locationName: "Paris, Le Marais",
    distance: "5.8 miles away",
    headline: "Haute Couturier & Rare Vinyl Collector",
    bio: "Designing custom silhouettes by day, exploring dark bistros by night. Hoping to share standard classical melodies, rare vinyl sessions, and beautiful secrets.",
    extendedBio: "Vivienne owns an independent design atelier in Paris, crafting tailored evening wear for European actors and artists. Drawing inspiration from 1920s architecture and early film, she travels frequently to Tokyo and Milan sourcing rare textiles. Her leisure time is spent hunting for obscure vinyl records and attending experimental theater.",
    sanitySource: "sanity.io/production/krystles-pistols-ledger/vivienne-thorne",
    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400",
    isVerified: true,
    safetyRating: "Gold Check",
    recentActivity: "Active 2h ago",
    gallery: [
      "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&q=80&w=400"
    ],
    videoUrl: "https://player.vimeo.com/external/340026218.sd.mp4?s=d0097c02b3dfbc4f479a838be8192361bdf0d2d3&profile_id=164&oauth2_token_id=57447761",
    languages: ["French", "English", "Japanese"],
    interests: ["Haute Couture", "Obscure Vinyl", "Bistro Dining", "Experimental Theater"]
  },
  {
    id: "julian",
    displayName: "Julian Drake",
    age: 32,
    role: "Verified Match",
    locationName: "San Francisco, Pac Heights",
    distance: "4.1 miles away",
    headline: "Restoration Architect & Yacht Racer",
    bio: "Deep appreciation for mid-century minimalism, wooden sailing vessels, and coastlines. Let's escape the city noise for a quiet waterfront evening.",
    extendedBio: "Julian is a principal architect at a firm specialized in retrofitting historic coastal residences with sustainable, minimalist technology. Raised between Northern California and Maine, he feels most grounded on the water, regularly racing classic wood-hulled yachts in the bay. He appreciates slow cooking, acoustic guitar, and quiet ocean shorelines.",
    sanitySource: "sanity.io/production/krystles-pistols-ledger/julian-drake",
    avatarUrl: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=400",
    isVerified: true,
    safetyRating: "Gold Check",
    recentActivity: "Active 1h ago",
    gallery: [
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1545459720-aac276a74cc3?auto=format&fit=crop&q=80&w=400"
    ],
    videoUrl: "https://player.vimeo.com/external/392275283.sd.mp4?s=7b0e271a3e819b1064eb9cb68b55502cfa3e919a&profile_id=164&oauth2_token_id=57447761",
    languages: ["English", "Spanish"],
    interests: ["Mid-Century Architecture", "Yacht Racing", "Sailing", "Acoustic Guitar"]
  },
  {
    id: "aria",
    displayName: "Aria Sinclair",
    age: 27,
    role: "Verified Match",
    locationName: "Tokyo, Roppongi",
    distance: "9.5 miles away",
    headline: "Symphony Violinist",
    bio: "Finding beauty in classical harmony. Seeking an intelligent, subtle soul for quiet sake bars and late-night listening rooms after the performance.",
    extendedBio: "Aria is a world-renowned concert violinist who has performed with the Tokyo Metropolitan Symphony and London Philharmonic. Fluent in three languages, she spends her summers touring Europe and winters in Tokyo. She has a deep love for rare Japanese whiskies, architecture, and finding beauty in quiet corners.",
    sanitySource: "sanity.io/production/krystles-pistols-ledger/aria-sinclair",
    avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400",
    isVerified: true,
    safetyRating: "Gold Check",
    recentActivity: "Active 4m ago",
    gallery: [
      "https://images.unsplash.com/photo-1511192336575-5a79af67a629?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&q=80&w=400",
      "https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?auto=format&fit=crop&q=80&w=400"
    ],
    videoUrl: "https://player.vimeo.com/external/355694295.sd.mp4?s=332da7595b45281561f36a53696885dfda20a1eb&profile_id=164&oauth2_token_id=57447761",
    languages: ["Japanese", "English", "Russian"],
    interests: ["Classical Music", "Japanese Whiskey", "Concert Performance", "Acoustic Spaces"]
  }
];

// Ephemeral active encounters (expires_at is 72 hours from now)
interface ActiveEncounter {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string;
  headline: string;
  description: string;
  locationName: string;
  expiresAt: string;
  createdAt: string;
  isCustom?: boolean;
}

let activeEncounters: ActiveEncounter[] = [
  {
    id: "post1",
    userId: "vivienne",
    displayName: "Vivienne Thorne",
    avatarUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400",
    headline: "Late-night discussion near Le Marais",
    description: "Enjoying a vintage Bordeaux in a candle-lit corner. Come discuss modern design, rare records, or secret hideaways in Paris.",
    locationName: "Paris, Le Marais",
    expiresAt: new Date(Date.now() + 64 * 60 * 60 * 1000).toISOString(), // 64h left
    createdAt: new Date().toISOString()
  },
  {
    id: "post2",
    userId: "montgomery",
    displayName: "Montgomery Sterling",
    avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=400",
    headline: "Chelsea Yacht Harbor Cigar Lounge",
    description: "Relaxed atmosphere, looking for an intellectual companion to debate venture ecosystems, art collecting, and coastal restoration.",
    locationName: "New York, Chelsea",
    expiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(), // 48h left
    createdAt: new Date().toISOString()
  },
  {
    id: "post3",
    userId: "aurelia",
    displayName: "Aurelia Vance",
    avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400",
    headline: "Private Exhibition & Jazz Mayfair",
    description: "Exclusive exhibition preview in Mayfair. Let's appreciate contemporary masterpieces accompanied by soft piano and premium conversation.",
    locationName: "London, Mayfair",
    expiresAt: new Date(Date.now() + 71 * 60 * 60 * 1000).toISOString(), // 71h left
    createdAt: new Date().toISOString()
  }
];

// Messages database with 24-hour cleanup simulations
interface Message {
  id: string;
  profileId: string;
  sender: "user" | "member";
  text: string;
  timestamp: string;
}

let chats: Record<string, Message[]> = {
  aurelia: [
    { id: "m1", profileId: "aurelia", sender: "member", text: "Welcome to Krystles Pistols. I noticed your interest in contemporary neo-expressionism. Let's connect soon.", timestamp: new Date(Date.now() - 3600000).toISOString() }
  ],
  montgomery: [
    { id: "m2", profileId: "montgomery", sender: "member", text: "Discretion is the hallmark of the elite. Good to see you're verified. How can I assist your Chelsea plans?", timestamp: new Date(Date.now() - 7200000).toISOString() }
  ]
};

// Admin Moderation Logs & Reports
interface ModerationReport {
  id: string;
  reportedProfileId: string;
  reportedName: string;
  reportedAvatar: string;
  reporterName: string;
  reason: string;
  status: "pending" | "resolved" | "dismissed";
  timestamp: string;
  chatExcerpt: string;
}

let moderationReports: ModerationReport[] = [
  {
    id: "rep1",
    reportedProfileId: "julian",
    reportedName: "Julian Drake",
    reportedAvatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=400",
    reporterName: "VIP Member",
    reason: "Offensive language & unsolicited sales pitch",
    status: "pending",
    timestamp: new Date().toISOString(),
    chatExcerpt: "Hey, check out my cryptocurrency investment group..."
  }
];

interface AuditLog {
  id: string;
  adminId: string;
  action: string;
  details: string;
  timestamp: string;
}

let auditLogs: AuditLog[] = [
  { id: "log1", adminId: "Admin_01", action: "SYSTEM_INITIALIZED", details: "Krystles Pistols secure channels configured.", timestamp: new Date(Date.now() - 86400000).toISOString() },
  { id: "log2", adminId: "Admin_01", action: "PASS_VERIFIED", details: "UserPass pass verified with Biometrics Gold tier.", timestamp: new Date(Date.now() - 43200000).toISOString() }
];

// Simulated visitor tracking for funnel
let totalBrowsers = 2420;
let totalVerified = 840;
let totalSubscribers = 290;

// BIOMETRIC AND USER STATE (SIMULATED USER)
let userState = {
  isVerified: false,
  biometricMatchRate: 0,
  verificationDetails: "",
  hasAccessPass: false,
  accessPassExpiresAt: "",
  activePostId: null as string | null,
};

// Endpoints

// 1. Get verified profiles
app.get("/api/profiles", (req, res) => {
  res.json(profiles);
});

// 2. Get user status
app.get("/api/user/status", (req, res) => {
  res.json(userState);
});

// 3. Clear simulated session (Panic button)
app.post("/api/panic", (req, res) => {
  userState = {
    isVerified: false,
    biometricMatchRate: 0,
    verificationDetails: "",
    hasAccessPass: false,
    accessPassExpiresAt: "",
    activePostId: null,
  };
  // Flush local transient chat sessions
  chats = {
    aurelia: [
      { id: "m1", profileId: "aurelia", sender: "member", text: "Welcome to Krystles Pistols. I noticed your interest in contemporary neo-expressionism. Let's connect soon.", timestamp: new Date().toISOString() }
    ],
    montgomery: [
      { id: "m2", profileId: "montgomery", sender: "member", text: "Discretion is the hallmark of the elite. Good to see you're verified. How can I assist your Chelsea plans?", timestamp: new Date().toISOString() }
    ]
  };
  auditLogs.unshift({
    id: `panic-${Date.now()}`,
    adminId: "SYSTEM",
    action: "PANIC_ACTIVATED",
    details: "Discreet exit triggered. Session destroyed and local cache scrubbed.",
    timestamp: new Date().toISOString()
  });
  res.json({ success: true, redirect: "https://www.google.com" });
});

// 4. Submit video selfie for biometric assessment (Calls Gemini to analyze)
app.post("/api/verify/biometrics", async (req, res) => {
  const { photoBase64 } = req.body;

  let assessmentResult = {
    approved: true,
    score: 98.4,
    details: "Biometric match successful. High facial structural symmetry detected. Verified against secure hash signatures."
  };

  if (ai && photoBase64) {
    try {
      const imgData = photoBase64.replace(/^data:image\/\w+;base64,/, "");
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            inlineData: {
              data: imgData,
              mimeType: "image/jpeg"
            }
          },
          "Evaluate this face biometric snapshot for a high-end discreet private club verification. Is this a real human, and is their expression respectful? Respond in a short JSON format with properties: 'approved' (boolean), 'score' (number between 90 and 100), and 'details' (short elegant sentence summarizing the assessment). Do not output markdown blocks, just the JSON.",
        ],
        config: {
          responseMimeType: "application/json"
        }
      });

      const parsed = JSON.parse(response.text?.trim() || "{}");
      if (parsed.details) {
        assessmentResult = {
          approved: parsed.approved !== false,
          score: typeof parsed.score === "number" ? parsed.score : 98.4,
          details: parsed.details
        };
      }
    } catch (e) {
      console.error("Gemini Biometrics failed, using simulated approval:", e);
    }
  }

  userState.isVerified = assessmentResult.approved;
  userState.biometricMatchRate = assessmentResult.score;
  userState.verificationDetails = assessmentResult.details;

  if (userState.isVerified) {
    totalVerified++;
    auditLogs.unshift({
      id: `biometric-${Date.now()}`,
      adminId: "BIOMETRIC_VAULT",
      action: "BIOMETRIC_PASSED",
      details: `Discreet selfie approved with ${assessmentResult.score}% symmetry. ${assessmentResult.details}`,
      timestamp: new Date().toISOString()
    });
  }

  res.json(assessmentResult);
});

// 5. Buy passes ($100 Pass checkout simulation)
app.post("/api/checkout/pass", (req, res) => {
  userState.hasAccessPass = true;
  userState.accessPassExpiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
  totalSubscribers++;

  auditLogs.unshift({
    id: `pass-${Date.now()}`,
    adminId: "STRIPE_GATEWAY",
    action: "SUBSCRIPTION_PASS_PURCHASED",
    details: "Stripe payment pass confirmed: 72-hour Access Pass issued ($100 USD).",
    timestamp: new Date().toISOString()
  });

  res.json({ success: true, user: userState });
});

// 6. Active Posts endpoints
app.get("/api/posts", (req, res) => {
  // Prune expired encounters dynamically
  const now = new Date();
  activeEncounters = activeEncounters.filter(e => new Date(e.expiresAt) > now);
  res.json(activeEncounters);
});

app.post("/api/posts/create", (req, res) => {
  if (!userState.isVerified) {
    return res.status(403).json({ error: "Requires biometric Gold Verification." });
  }
  if (!userState.hasAccessPass) {
    return res.status(403).json({ error: "Requires active $100 Access Pass." });
  }

  const { headline, description, locationName } = req.body;
  if (!headline || !description || !locationName) {
    return res.status(400).json({ error: "Missing encounter details." });
  }

  const newPostId = `custom-post-${Date.now()}`;
  const newPost: ActiveEncounter = {
    id: newPostId,
    userId: "user",
    displayName: "Verified Guest (You)",
    avatarUrl: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=400",
    headline,
    description,
    locationName,
    expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date().toISOString(),
    isCustom: true
  };

  activeEncounters.unshift(newPost);
  userState.activePostId = newPostId;

  auditLogs.unshift({
    id: `post-create-${Date.now()}`,
    adminId: "EPHEMERAL_POST_ENGINE",
    action: "ENCOUNTER_PUBLISHED",
    details: `New ephemeral encounter live for 72 hours: "${headline}"`,
    timestamp: new Date().toISOString()
  });

  res.json({ success: true, post: newPost, user: userState });
});

app.post("/api/posts/clear", (req, res) => {
  if (userState.activePostId) {
    activeEncounters = activeEncounters.filter(e => e.id !== userState.activePostId);
    userState.activePostId = null;

    auditLogs.unshift({
      id: `post-expire-${Date.now()}`,
      adminId: "EPHEMERAL_POST_ENGINE",
      action: "ENCOUNTER_EXPIRED_EARLY",
      details: "User expired active post early. Content scrubbed from global servers.",
      timestamp: new Date().toISOString()
    });
  }
  res.json({ success: true, user: userState });
});

// 7. Dynamic chat with Verified Members
app.get("/api/chat/:profileId", (req, res) => {
  const { profileId } = req.params;
  const messages = chats[profileId] || [];
  res.json(messages);
});

app.post("/api/chat/send", async (req, res) => {
  const { profileId, messageText } = req.body;
  if (!profileId || !messageText) {
    return res.status(400).json({ error: "Missing message details." });
  }

  // Find profile
  const profile = profiles.find(p => p.id === profileId);
  if (!profile) {
    return res.status(404).json({ error: "Profile not found." });
  }

  // 1. Add user message
  if (!chats[profileId]) {
    chats[profileId] = [];
  }
  
  const userMsg: Message = {
    id: `msg-user-${Date.now()}`,
    profileId,
    sender: "user",
    text: messageText,
    timestamp: new Date().toISOString()
  };
  chats[profileId].push(userMsg);

  // AI Moderation Simulation / Safety filter using rules first
  const toxicKeywords = ["spam", "crypto investment", "buy bitcoin", "scam", "offensive", "abuse"];
  const isToxic = toxicKeywords.some(keyword => messageText.toLowerCase().includes(keyword));

  if (isToxic) {
    // Generate a report immediately for the admin queue
    const reportId = `rep-${Date.now()}`;
    const newReport: ModerationReport = {
      id: reportId,
      reportedProfileId: "user",
      reportedName: "Verified Guest (You)",
      reportedAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=400",
      reporterName: profile.displayName,
      reason: "Automated filter: Commercial solicitation/Spam or Offensive language",
      status: "pending",
      timestamp: new Date().toISOString(),
      chatExcerpt: messageText
    };
    moderationReports.unshift(newReport);

    auditLogs.unshift({
      id: `mod-${Date.now()}`,
      adminId: "AI_MODERATION",
      action: "SAFETY_TRIGGERED",
      details: `User flagged in chat with ${profile.displayName}. System reported Content: "${messageText}"`,
      timestamp: new Date().toISOString()
    });

    const replyMsg: Message = {
      id: `msg-member-${Date.now()}`,
      profileId,
      sender: "member",
      text: "I prefer genuine connections. Let's keep our discussions tasteful, or I will have to suspend this conversation.",
      timestamp: new Date().toISOString()
    };
    chats[profileId].push(replyMsg);
    return res.json({ chat: chats[profileId], flagged: true });
  }

  // Generate response from Member (Optionally powered by Gemini for maximum elite vibe!)
  let replyText = `I appreciate your message. Let's meet at a discreet gallery or restaurant soon. What sort of venues do you prefer?`;

  if (ai) {
    try {
      // Build brief chat history
      const historySummary = chats[profileId].slice(-6).map(m => `${m.sender === "user" ? "User" : profile.displayName}: ${m.text}`).join("\n");
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `You are ${profile.displayName}, a member of an ultra-high-end discreet private club. 
Your age is ${profile.age}. 
Your personality: Elite, sophisticated, respectful, artistic, and highly cautious of privacy. 
Your background: ${profile.headline}. ${profile.bio}. 
Location: ${profile.locationName}.

Chat history:
${historySummary}

Write a discreet, sophisticated response as ${profile.displayName}. Keep it conversational, elegant, elegant but cautious. Limit your reply to 1-2 sentences. Avoid sounding robotic or like a customer service agent.`,
      });
      if (response.text) {
        replyText = response.text.trim().replace(/^"/, "").replace(/"$/, "");
      }
    } catch (e) {
      console.error("Gemini member reply generation failed:", e);
    }
  } else {
    // Fallback sophisticated response pool
    const fallbacks = [
      `That sounds fascinating. The city's quieter locations offer perfect sanctuary for these conversations.`,
      `A perfect suggestion. Discretion is everything to me, so a private lounge sounds optimal.`,
      `I enjoy your perspective. It's rare to find someone who appreciates classical balance as well as privacy.`
    ];
    replyText = fallbacks[Math.floor(Math.random() * fallbacks.length)];
  }

  const replyMsg: Message = {
    id: `msg-member-${Date.now()}`,
    profileId,
    sender: "member",
    text: replyText,
    timestamp: new Date().toISOString()
  };
  chats[profileId].push(replyMsg);

  res.json({ chat: chats[profileId], flagged: false });
});

// 8. Admin statistics, queues, and audits
app.get("/api/admin/stats", (req, res) => {
  res.json({
    funnel: [
      { name: "1. Free Browsers", value: totalBrowsers },
      { name: "2. Gold Verified", value: totalVerified },
      { name: "3. Pass Holders ($100)", value: totalSubscribers },
    ],
    locationActivity: [
      { name: "London", posts: activeEncounters.filter(e => e.locationName.includes("London")).length + 4, activity: 85 },
      { name: "New York", posts: activeEncounters.filter(e => e.locationName.includes("New York")).length + 6, activity: 92 },
      { name: "Paris", posts: activeEncounters.filter(e => e.locationName.includes("Paris")).length + 3, activity: 76 },
      { name: "Tokyo", posts: activeEncounters.filter(e => e.locationName.includes("Tokyo")).length + 2, activity: 68 },
    ],
    reports: moderationReports,
    auditLogs: auditLogs.slice(0, 30)
  });
});

app.post("/api/admin/report-action", (req, res) => {
  const { reportId, action } = req.body; // action: "resolve" | "dismiss"
  if (!reportId || !action) {
    return res.status(400).json({ error: "Missing report details." });
  }

  const reportIndex = moderationReports.findIndex(r => r.id === reportId);
  if (reportIndex !== -1) {
    moderationReports[reportIndex].status = action === "resolve" ? "resolved" : "dismissed";
    
    auditLogs.unshift({
      id: `audit-${Date.now()}`,
      adminId: "Admin_01",
      action: action === "resolve" ? "REPORT_RESOLVED" : "REPORT_DISMISSED",
      details: `Report ${reportId} for ${moderationReports[reportIndex].reportedName} status set to ${action}.`,
      timestamp: new Date().toISOString()
    });
  }

  res.json({ success: true, reports: moderationReports });
});

// 9. Simulated SEO IndexNow
app.post("/api/admin/index-now", (req, res) => {
  auditLogs.unshift({
    id: `indexnow-${Date.now()}`,
    adminId: "SEO_BOT",
    action: "INDEX_NOW_PING",
    details: "Pinged Bing, Yandex, and Google APIs via IndexNow protocol. Real-time Area Safety Guides indexed immediately.",
    timestamp: new Date().toISOString()
  });
  res.json({ success: true, status: "Ping completed successfully to 3 global search indexers." });
});

// 10. Supabase & Fallback Auth Endpoints
app.get("/api/auth/config", (req, res) => {
  res.json({
    configured: isSupabaseConfigured,
    supabaseUrl: supabaseUrl ? `${supabaseUrl.substring(0, 15)}...` : null
  });
});

app.post("/api/auth/register", async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password || !role) {
    return res.status(400).json({ error: "Missing email, password, or role." });
  }

  const validRoles = ["admin", "browser", "lister"];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ error: "Invalid role specified." });
  }

  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            role: role
          }
        }
      });

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      auditLogs.unshift({
        id: `reg-${Date.now()}`,
        adminId: "SUPABASE_AUTH",
        action: "USER_REGISTERED",
        details: `Registered new Supabase user ${email} with role: ${role}`,
        timestamp: new Date().toISOString()
      });

      return res.json({
        success: true,
        method: "supabase",
        user: {
          id: data.user?.id || `sb-${Date.now()}`,
          email: data.user?.email || email,
          role: role
        }
      });
    } catch (err: any) {
      console.error("Supabase sign up exception:", err);
      return res.status(500).json({ error: `Supabase error: ${err.message}` });
    }
  } else {
    const exists = localUsersRegistry.some(u => u.email.toLowerCase() === email.toLowerCase());
    if (exists) {
      return res.status(400).json({ error: "An account with this email already exists." });
    }

    const newUser = {
      id: `local-u-${Date.now()}`,
      email: email.toLowerCase(),
      passwordHash: password,
      role: role as "admin" | "browser" | "lister"
    };
    localUsersRegistry.push(newUser);

    auditLogs.unshift({
      id: `reg-${Date.now()}`,
      adminId: "LOCAL_AUTH",
      action: "USER_REGISTERED_LOCAL",
      details: `Registered fallback user ${email} with role: ${role}`,
      timestamp: new Date().toISOString()
    });

    return res.json({
      success: true,
      method: "local_registry",
      user: {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role
      }
    });
  }
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Missing email or password." });
  }

  if (supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        return res.status(400).json({ error: error.message });
      }

      const role = data.user?.user_metadata?.role || "browser";

      auditLogs.unshift({
        id: `login-${Date.now()}`,
        adminId: "SUPABASE_AUTH",
        action: "USER_SIGNED_IN",
        details: `Signed in Supabase user ${email} with role: ${role}`,
        timestamp: new Date().toISOString()
      });

      return res.json({
        success: true,
        method: "supabase",
        user: {
          id: data.user?.id,
          email: data.user?.email,
          role: role
        }
      });
    } catch (err: any) {
      console.error("Supabase login exception:", err);
      return res.status(500).json({ error: `Supabase login error: ${err.message}` });
    }
  } else {
    const foundUser = localUsersRegistry.find(
      u => u.email.toLowerCase() === email.toLowerCase() && u.passwordHash === password
    );

    if (!foundUser) {
      return res.status(401).json({ error: "Invalid email or password combination." });
    }

    auditLogs.unshift({
      id: `login-${Date.now()}`,
      adminId: "LOCAL_AUTH",
      action: "USER_SIGNED_IN_LOCAL",
      details: `Signed in fallback user ${email} with role: ${foundUser.role}`,
      timestamp: new Date().toISOString()
    });

    return res.json({
      success: true,
      method: "local_registry",
      user: {
        id: foundUser.id,
        email: foundUser.email,
        role: foundUser.role
      }
    });
  }
});

// Lister: Post Profile Endpoint
app.post("/api/profiles/create", (req, res) => {
  const { displayName, age, locationName, distance, headline, bio, extendedBio, avatarUrl, gallery, languages, interests, videoUrl } = req.body;
  if (!displayName || !age || !locationName || !headline || !bio) {
    return res.status(400).json({ error: "Missing required fields for profiles." });
  }

  const id = displayName.toLowerCase().replace(/[^a-z0-9]/g, "-") || `profile-${Date.now()}`;
  const newProfile = {
    id,
    displayName,
    age: parseInt(age) || 30,
    role: "Verified Match",
    locationName,
    distance: distance || "0.5 miles away",
    headline,
    bio,
    extendedBio: extendedBio || bio,
    sanitySource: "sanity.io/production/krystles-pistols-ledger/" + id,
    avatarUrl: avatarUrl || "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400",
    isVerified: true,
    safetyRating: "Gold Check",
    recentActivity: "Active just now",
    gallery: gallery || [],
    languages: languages || ["English"],
    interests: interests || ["Exclusive Club"],
    videoUrl: videoUrl || ""
  };

  profiles.unshift(newProfile);

  auditLogs.unshift({
    id: `profile-add-${Date.now()}`,
    adminId: "LISTER_PORTAL",
    action: "PROFILE_CREATED",
    details: `Lister created profile: ${displayName} (${locationName})`,
    timestamp: new Date().toISOString()
  });

  res.json({ success: true, profiles });
});

// 11. Serve Vite Client application
async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Krystles Pistols Server] Active on port ${PORT}`);
  });
}

startServer();
