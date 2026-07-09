import React, { useState, useEffect, useRef } from "react";
import {
  ShieldCheck,
  MapPin,
  MessageSquare,
  Compass,
  DollarSign,
  AlertCircle,
  EyeOff,
  Activity,
  LogOut,
  RefreshCw,
  Clock,
  Sparkles,
  Lock,
  Settings,
  Layers,
  Globe,
  Upload,
  Camera,
  CheckCircle2,
  AlertTriangle,
  Send,
  User,
  X,
  FileText,
  Unlock
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell
} from "recharts";

// TypeScript declarations for state
interface Profile {
  id: string;
  displayName: string;
  age: number;
  role: string;
  locationName: string;
  distance: string;
  headline: string;
  bio: string;
  avatarUrl: string;
  isVerified: boolean;
  safetyRating: string;
  recentActivity: string;
  extendedBio?: string;
  sanitySource?: string;
  gallery?: string[];
  videoUrl?: string;
  languages?: string[];
  interests?: string[];
}

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

interface Message {
  id: string;
  profileId: string;
  sender: "user" | "member";
  text: string;
  timestamp: string;
}

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

interface AuditLog {
  id: string;
  adminId: string;
  action: string;
  details: string;
  timestamp: string;
}

interface AdminStats {
  funnel: Array<{ name: string; value: number }>;
  locationActivity: Array<{ name: string; posts: number; activity: number }>;
  reports: ModerationReport[];
  auditLogs: AuditLog[];
}

interface UserState {
  isVerified: boolean;
  biometricMatchRate: number;
  verificationDetails: string;
  hasAccessPass: boolean;
  accessPassExpiresAt: string;
  activePostId: string | null;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<"discovery" | "ephemeral" | "secure-channels" | "gold-verify" | "admin" | "lister">("discovery");
  
  // Auth states (Supabase or Local simulated registry)
  const [authUser, setAuthUser] = useState<any>(() => {
    const saved = localStorage.getItem("kp_auth_user");
    if (saved) {
      try { return JSON.parse(saved); } catch { return null; }
    }
    return null;
  });
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authRole, setAuthRole] = useState<"browser" | "lister" | "admin">("browser");
  const [isSignUpMode, setIsSignUpMode] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authSuccessMsg, setAuthSuccessMsg] = useState("");
  const [supabaseConfig, setSupabaseConfig] = useState<{ configured: boolean; supabaseUrl: string | null }>({
    configured: false,
    supabaseUrl: null
  });

  const isAdminLoggedIn = authUser?.role === "admin";

  // Lister Creation Form States
  const [listerName, setListerName] = useState("");
  const [listerAge, setListerAge] = useState("28");
  const [listerLocation, setListerLocation] = useState("London, Belgravia");
  const [listerDistance, setListerDistance] = useState("0.4 miles away");
  const [listerHeadline, setListerHeadline] = useState("");
  const [listerBio, setListerBio] = useState("");
  const [listerExtendedBio, setListerExtendedBio] = useState("");
  const [listerAvatarUrl, setListerAvatarUrl] = useState("");
  const [listerGalleryInput, setListerGalleryInput] = useState("");
  const [listerLanguagesInput, setListerLanguagesInput] = useState("English, French");
  const [listerInterestsInput, setListerInterestsInput] = useState("Art Collections, Classical Music");
  const [listerVideoUrl, setListerVideoUrl] = useState("");
  const [isSubmittingListerProfile, setIsSubmittingListerProfile] = useState(false);
  const [listerFormSuccess, setListerFormSuccess] = useState("");
  const [listerFormError, setListerFormError] = useState("");

  // Detailed profile modal state
  const [selectedProfileForModal, setSelectedProfileForModal] = useState<Profile | null>(null);
  
  // State from server
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [encounters, setEncounters] = useState<ActiveEncounter[]>([]);
  const [userState, setUserState] = useState<UserState>({
    isVerified: false,
    biometricMatchRate: 0,
    verificationDetails: "",
    hasAccessPass: false,
    accessPassExpiresAt: "",
    activePostId: null,
  });

  // Chat state
  const [activeChatId, setActiveChatId] = useState<string>("aurelia");
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [chatFlagged, setChatFlagged] = useState(false);

  // Verification state
  const [selectedSelfie, setSelectedSelfie] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [verificationResult, setVerificationResult] = useState<{ approved: boolean; score: number; details: string } | null>(null);

  // Ephemeral Post state
  const [postHeadline, setPostHeadline] = useState("");
  const [postDescription, setPostDescription] = useState("");
  const [postLocation, setPostLocation] = useState("New York, Chelsea");
  const [isSubmittingPost, setIsSubmittingPost] = useState(false);

  // Admin state
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [indexNowResult, setIndexNowResult] = useState<string | null>(null);
  const [isPingingIndexNow, setIsPingingIndexNow] = useState(false);

  // General state
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [screenshotProtection, setScreenshotProtection] = useState(true);
  const [currentTime, setCurrentTime] = useState("");
  const [errorNotification, setErrorNotification] = useState<string | null>(null);

  // References
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Standard preset portraits for quick verification
  const presetSelfies = [
    { name: "Executive Profile A", url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200" },
    { name: "Executive Profile B", url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200" },
    { name: "Executive Profile C", url: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?auto=format&fit=crop&q=80&w=200" }
  ];

  // Tick time
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setCurrentTime(d.toLocaleTimeString("en-US", { hour12: false }) + " UTC");
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch initial data
  useEffect(() => {
    fetchProfiles();
    fetchEncounters();
    fetchUserStatus();
    fetchAdminStats();
    fetchAuthConfig();
  }, []);

  // Sync chat scroll
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Fetch chat messages when active chat profile changes
  useEffect(() => {
    if (activeChatId) {
      fetchChatMessages(activeChatId);
      setChatFlagged(false);
    }
  }, [activeChatId]);

  const fetchProfiles = async () => {
    try {
      const res = await fetch("/api/profiles");
      if (res.ok) {
        const data = await res.json();
        setProfiles(data);
      }
    } catch (e) {
      console.error("Error fetching profiles", e);
    }
  };

  const fetchEncounters = async () => {
    try {
      const res = await fetch("/api/posts");
      if (res.ok) {
        const data = await res.json();
        setEncounters(data);
      }
    } catch (e) {
      console.error("Error fetching posts", e);
    }
  };

  const fetchUserStatus = async () => {
    try {
      const res = await fetch("/api/user/status");
      if (res.ok) {
        const data = await res.json();
        setUserState(data);
      }
    } catch (e) {
      console.error("Error fetching status", e);
    }
  };

  const fetchAdminStats = async () => {
    try {
      const res = await fetch("/api/admin/stats");
      if (res.ok) {
        const data = await res.json();
        setAdminStats(data);
      }
    } catch (e) {
      console.error("Error fetching admin stats", e);
    }
  };

  const fetchAuthConfig = async () => {
    try {
      const res = await fetch("/api/auth/config");
      if (res.ok) {
        const data = await res.json();
        setSupabaseConfig(data);
      }
    } catch (e) {
      console.error("Error fetching auth config", e);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSuccessMsg("");
    
    if (!authEmail || !authPassword) {
      setAuthError("Email and password are required.");
      return;
    }
    
    const endpoint = isSignUpMode ? "/api/auth/register" : "/api/auth/login";
    const payload = isSignUpMode 
      ? { email: authEmail, password: authPassword, role: authRole }
      : { email: authEmail, password: authPassword };
      
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) {
        setAuthError(data.error || "Authentication failed.");
        return;
      }
      
      setAuthUser(data.user);
      localStorage.setItem("kp_auth_user", JSON.stringify(data.user));
      setAuthSuccessMsg(isSignUpMode ? "Aviation credentials logged in!" : "Discreet signature authenticated.");
      
      setTimeout(() => {
        setShowAuthModal(false);
        if (data.user.role === "admin") {
          setActiveTab("admin");
        } else if (data.user.role === "lister") {
          setActiveTab("lister");
        } else {
          setActiveTab("discovery");
        }
        setAuthEmail("");
        setAuthPassword("");
        setAuthSuccessMsg("");
      }, 1200);
      
      if (data.user.role === "admin") {
        fetchAdminStats();
      }
    } catch (err) {
      console.error("Auth error", err);
      setAuthError("An unexpected connection error occurred.");
    }
  };

  const handleSignOut = () => {
    setAuthUser(null);
    localStorage.removeItem("kp_auth_user");
    setActiveTab("discovery");
  };

  const handleListerSubmitProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setListerFormError("");
    setListerFormSuccess("");
    
    if (!listerName || !listerAge || !listerLocation || !listerHeadline || !listerBio) {
      setListerFormError("Please fill out all required fields: Name, Age, Location, Headline, and Bio.");
      return;
    }
    
    setIsSubmittingListerProfile(true);
    
    const payload = {
      displayName: listerName,
      age: parseInt(listerAge) || 28,
      locationName: listerLocation,
      distance: listerDistance,
      headline: listerHeadline,
      bio: listerBio,
      extendedBio: listerExtendedBio,
      avatarUrl: listerAvatarUrl || undefined,
      gallery: listerGalleryInput ? listerGalleryInput.split(",").map(url => url.trim()) : undefined,
      languages: listerLanguagesInput ? listerLanguagesInput.split(",").map(lang => lang.trim()) : undefined,
      interests: listerInterestsInput ? listerInterestsInput.split(",").map(int => int.trim()) : undefined,
      videoUrl: listerVideoUrl || undefined
    };
    
    try {
      const res = await fetch("/api/profiles/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) {
        setListerFormError(data.error || "Failed to create profile.");
        setIsSubmittingListerProfile(false);
        return;
      }
      
      setProfiles(data.profiles);
      setListerFormSuccess(`Successfully registered elite profile: ${listerName}!`);
      
      // Clear lister inputs
      setListerName("");
      setListerAge("28");
      setListerLocation("London, Belgravia");
      setListerDistance("0.4 miles away");
      setListerHeadline("");
      setListerBio("");
      setListerExtendedBio("");
      setListerAvatarUrl("");
      setListerGalleryInput("");
      setListerLanguagesInput("English, French");
      setListerInterestsInput("Art Collections, Classical Music");
      setListerVideoUrl("");
      
      setTimeout(() => {
        setListerFormSuccess("");
        setActiveTab("discovery");
      }, 1500);
    } catch (err) {
      console.error(err);
      setListerFormError("Error establishing connection to backend database.");
    } finally {
      setIsSubmittingListerProfile(false);
    }
  };

  const fetchChatMessages = async (profileId: string) => {
    try {
      const res = await fetch(`/api/chat/${profileId}`);
      if (res.ok) {
        const data = await res.json();
        setChatMessages(data);
      }
    } catch (e) {
      console.error("Error fetching chat", e);
    }
  };

  // Panic button execution
  const triggerPanicButton = async () => {
    try {
      const res = await fetch("/api/panic", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        // Visual cue of total scrubbing, then redirect
        document.body.innerHTML = `
          <div style="background-color: #050505; color: #d4af37; height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; font-family: sans-serif; text-align: center; padding: 20px;">
            <div style="font-size: 40px; font-weight: 300; margin-bottom: 20px; letter-spacing: 2px;">CRITICAL SYSTEM SCRUB</div>
            <div style="font-size: 14px; color: #a1a1aa; max-width: 500px; line-height: 1.6; margin-bottom: 40px;">
              Session destroyed. In-memory temporary channels purged. Biometric tokens deleted.
              Redirecting immediately to neutral channels...
            </div>
            <div style="width: 20px; height: 20px; border: 2px solid #d4af37; border-top-color: transparent; border-radius: 50%; animate: spin 1s linear infinite; animation: spin 0.8s linear infinite;"></div>
          </div>
          <style>
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          </style>
        `;
        setTimeout(() => {
          window.location.href = data.redirect || "https://www.google.com";
        }, 1800);
      }
    } catch (e) {
      window.location.href = "https://www.google.com";
    }
  };

  // Handle message sending
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || isSendingMessage) return;

    const originalInput = messageInput;
    setMessageInput("");
    setIsSendingMessage(true);

    try {
      const res = await fetch("/api/chat/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profileId: activeChatId, messageText: originalInput })
      });

      if (res.ok) {
        const data = await res.json();
        setChatMessages(data.chat);
        if (data.flagged) {
          setChatFlagged(true);
        }
        fetchAdminStats(); // Refresh logs/reports in admin panel
      }
    } catch (e) {
      console.error("Error sending message", e);
    } finally {
      setIsSendingMessage(false);
    }
  };

  // Biometric verification scanning sequence
  const startBiometricScan = async () => {
    if (!selectedSelfie) {
      setErrorNotification("Please select or capture a verification selfie first.");
      return;
    }
    setIsScanning(true);
    setScanProgress(5);
    setVerificationResult(null);

    // Simulate standard security sweep increments
    const interval = setInterval(() => {
      setScanProgress(p => {
        if (p >= 95) {
          clearInterval(interval);
          return 100;
        }
        return p + Math.floor(Math.random() * 15) + 5;
      });
    }, 150);

    // After loading completes, POST selfie for Gemini assessment
    setTimeout(async () => {
      try {
        const res = await fetch("/api/verify/biometrics", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ photoBase64: selectedSelfie })
        });

        if (res.ok) {
          const data = await res.json();
          setVerificationResult(data);
          fetchUserStatus();
          fetchAdminStats();
        }
      } catch (e) {
        console.error("Biometric scan verification failed", e);
      } finally {
        setIsScanning(false);
      }
    }, 2000);
  };

  // Stripe checkout pass simulation
  const purchaseAccessPass = async () => {
    try {
      const res = await fetch("/api/checkout/pass", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setUserState(data.user);
        setShowCheckoutModal(false);
        fetchAdminStats();
      }
    } catch (e) {
      console.error("Checkout failed", e);
    }
  };

  // Handle active ephemeral post creation
  const handlePublishPost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!postHeadline.trim() || !postDescription.trim() || isSubmittingPost) return;

    setIsSubmittingPost(true);
    try {
      const res = await fetch("/api/posts/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          headline: postHeadline,
          description: postDescription,
          locationName: postLocation
        })
      });

      if (res.ok) {
        const data = await res.json();
        setUserState(data.user);
        fetchEncounters();
        fetchAdminStats();
        setPostHeadline("");
        setPostDescription("");
      } else {
        const err = await res.json();
        setErrorNotification(err.error || "Failed to publish encounter.");
      }
    } catch (e) {
      console.error("Encounter publish error", e);
    } finally {
      setIsSubmittingPost(false);
    }
  };

  // Clear live post early
  const handleClearPost = async () => {
    try {
      const res = await fetch("/api/posts/clear", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setUserState(data.user);
        fetchEncounters();
        fetchAdminStats();
      }
    } catch (e) {
      console.error("Clear post failed", e);
    }
  };

  // Admin report moderation action
  const handleReportAction = async (reportId: string, action: "resolve" | "dismiss") => {
    try {
      const res = await fetch("/api/admin/report-action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId, action })
      });
      if (res.ok) {
        fetchAdminStats();
      }
    } catch (e) {
      console.error("Moderation report action error", e);
    }
  };

  // Admin IndexNow ping trigger
  const triggerIndexNow = async () => {
    setIsPingingIndexNow(true);
    setIndexNowResult(null);
    try {
      const res = await fetch("/api/admin/index-now", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setIndexNowResult(data.status);
        fetchAdminStats();
      }
    } catch (e) {
      setIndexNowResult("Failed to contact indexers.");
    } finally {
      setIsPingingIndexNow(false);
    }
  };

  // File picker handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedSelfie(reader.result as string);
        setVerificationResult(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // Trigger file selection
  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  // Pre-select preset selfie for verification
  const selectPresetSelfie = (url: string) => {
    setSelectedSelfie(url);
    setVerificationResult(null);
  };

  // Formatter for remaining time in 72 hours
  const formatRemainingTime = (expiresAtStr: string) => {
    const remainingMs = new Date(expiresAtStr).getTime() - Date.now();
    if (remainingMs <= 0) return "Expired";
    const hours = Math.floor(remainingMs / (3600 * 1000));
    const mins = Math.floor((remainingMs % (3600 * 1000)) / (60 * 1000));
    return `${hours}h ${mins}m left`;
  };

  return (
    <div id="app-container" className="min-h-screen bg-[#050505] text-[#f4f4f5] flex flex-col selection:bg-gold-500 selection:text-black">
      
      {/* SCREENSHOT PROTECTION WATERMARK OVERLAY */}
      {screenshotProtection && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden opacity-[0.03] select-none flex flex-wrap gap-24 p-10 justify-center items-center">
          {Array.from({ length: 16 }).map((_, i) => (
            <span key={i} className="text-sm font-mono tracking-widest text-gold-500 rotate-[-15deg] uppercase">
              KRYSTLES PISTOLS • DISCREET HIGH-END • {currentTime}
            </span>
          ))}
        </div>
      )}

      {/* HEADER SECTION */}
      <header className="border-b border-zinc-900 bg-black/70 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-none bg-gradient-to-br from-gold-600 to-gold-400 flex items-center justify-center shadow-[0_0_15px_rgba(212,175,55,0.3)]">
              <span className="font-serif text-black font-extrabold text-xl">K</span>
            </div>
            <div>
              <h1 className="font-serif text-xl tracking-wider font-semibold text-gold-400">KRYSTLES PISTOLS</h1>
              <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Private Member Club</p>
            </div>
          </div>

          <div className="hidden md:flex items-center space-x-6 text-xs font-mono">
            <div className="flex items-center space-x-2 text-zinc-400">
              <Clock className="h-3.5 w-3.5 text-gold-500" />
              <span>{currentTime}</span>
            </div>

            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.7)]"></span>
              <span className="text-zinc-400 uppercase">Secure Tunnel</span>
            </div>

            {userState.isVerified ? (
              <div className="flex items-center space-x-1.5 bg-gold-950/40 border border-gold-800 px-3 py-1 text-gold-400">
                <ShieldCheck className="h-3 w-3 text-gold-500 fill-gold-500/10" />
                <span className="tracking-wide">GOLD VERIFIED</span>
              </div>
            ) : (
              <div className="flex items-center space-x-1.5 bg-zinc-950 border border-zinc-800 px-3 py-1 text-zinc-500">
                <Lock className="h-3 w-3 text-zinc-600" />
                <span className="tracking-wide">UNVERIFIED GUEST</span>
              </div>
            )}

            {authUser ? (
              <div className="flex items-center space-x-2">
                <div className={`flex items-center space-x-1.5 px-3 py-1 text-xs border ${
                  authUser.role === "admin" 
                    ? "bg-amber-950/40 border-amber-850 text-amber-400"
                    : authUser.role === "lister"
                    ? "bg-purple-950/40 border-purple-800 text-purple-400"
                    : "bg-blue-950/40 border-blue-800 text-blue-400"
                }`}>
                  <User className="h-3 w-3" />
                  <span className="font-mono uppercase tracking-wide">
                    {authUser.role === "admin" ? "ADMIN" : authUser.role === "lister" ? "LISTER" : "BROWSER"}: {authUser.email.split("@")[0]}
                  </span>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-1 border border-zinc-850 hover:border-rose-800 hover:bg-rose-950/20 px-2.5 py-1 text-zinc-500 hover:text-rose-400 transition-all cursor-pointer text-[10px] font-mono"
                  title="Sign out of high-end credentials portal"
                >
                  <Unlock className="h-3 w-3" />
                  <span>SIGN OUT</span>
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setAuthError("");
                  setAuthSuccessMsg("");
                  setShowAuthModal(true);
                }}
                className="flex items-center space-x-1.5 bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 hover:border-zinc-700 px-3 py-1 text-zinc-400 hover:text-gold-400 transition-all cursor-pointer text-xs"
                title="Authenticate via Supabase / Local Registry"
              >
                <Lock className="h-3 w-3 text-zinc-500" />
                <span className="tracking-wide">AUTHENTICATE PORTAL</span>
              </button>
            )}
          </div>

          {/* PANIC BUTTON */}
          <button
            onClick={triggerPanicButton}
            className="group flex items-center space-x-2 bg-rose-950/80 border border-rose-800 text-rose-300 hover:bg-rose-900 transition-colors duration-200 px-4 py-2 font-mono text-xs tracking-wider uppercase rounded-none hover:border-rose-500 hover:text-white"
            title="Instantly clear session data and redirect to google.com"
          >
            <LogOut className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
            <span>Panic Exit</span>
          </button>
        </div>
      </header>

      {/* CORE NAVIGATION BAR */}
      <div className="bg-[#09090b] border-b border-zinc-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-1 md:space-x-4 overflow-x-auto py-2.5">
            <button
              onClick={() => setActiveTab("discovery")}
              className={`flex items-center space-x-2 px-4 py-2 text-xs font-mono uppercase tracking-widest border transition-all duration-300 whitespace-nowrap ${
                activeTab === "discovery"
                  ? "bg-zinc-900 text-gold-400 border-gold-500/50"
                  : "text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-zinc-900/50"
              }`}
            >
              <Compass className="h-3.5 w-3.5 text-gold-500" />
              <span>Discovery</span>
            </button>

            <button
              onClick={() => setActiveTab("ephemeral")}
              className={`flex items-center space-x-2 px-4 py-2 text-xs font-mono uppercase tracking-widest border transition-all duration-300 whitespace-nowrap ${
                activeTab === "ephemeral"
                  ? "bg-zinc-900 text-gold-400 border-gold-500/50"
                  : "text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-zinc-900/50"
              }`}
            >
              <Globe className="h-3.5 w-3.5 text-gold-500" />
              <span>72h Encounters</span>
            </button>

            <button
              onClick={() => setActiveTab("secure-channels")}
              className={`flex items-center space-x-2 px-4 py-2 text-xs font-mono uppercase tracking-widest border transition-all duration-300 whitespace-nowrap ${
                activeTab === "secure-channels"
                  ? "bg-zinc-900 text-gold-400 border-gold-500/50"
                  : "text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-zinc-900/50"
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5 text-gold-500" />
              <span>Secure Chat</span>
            </button>

            <button
              onClick={() => setActiveTab("gold-verify")}
              className={`flex items-center space-x-2 px-4 py-2 text-xs font-mono uppercase tracking-widest border transition-all duration-300 whitespace-nowrap ${
                activeTab === "gold-verify"
                  ? "bg-zinc-900 text-gold-400 border-gold-500/50"
                  : "text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-zinc-900/50"
              }`}
            >
              <ShieldCheck className="h-3.5 w-3.5 text-gold-500" />
              <span>Gold Verification</span>
            </button>

            {authUser?.role === "lister" && (
              <button
                onClick={() => setActiveTab("lister")}
                className={`flex items-center space-x-2 px-4 py-2 text-xs font-mono uppercase tracking-widest border transition-all duration-300 whitespace-nowrap ml-auto ${
                  activeTab === "lister"
                    ? "bg-zinc-900 text-purple-400 border-purple-500/50"
                    : "text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-zinc-900/50"
                }`}
              >
                <FileText className="h-3.5 w-3.5 text-purple-500" />
                <span>Lister Portal</span>
              </button>
            )}

            {isAdminLoggedIn && (
              <button
                onClick={() => setActiveTab("admin")}
                className={`flex items-center space-x-2 px-4 py-2 text-xs font-mono uppercase tracking-widest border transition-all duration-300 whitespace-nowrap ml-auto ${
                  activeTab === "admin"
                    ? "bg-zinc-900 text-amber-400 border-amber-500/50"
                    : "text-zinc-500 border-transparent hover:text-zinc-300 hover:bg-zinc-900/50"
                }`}
              >
                <Settings className="h-3.5 w-3.5 text-amber-500" />
                <span>Executive Panel</span>
              </button>
            )}
          </nav>
        </div>
      </div>

      {/* ERROR / NOTIFICATION TOAST */}
      {errorNotification && (
        <div className="bg-rose-950/80 border-b border-rose-800 text-rose-300 text-xs px-4 py-3 flex justify-between items-center max-w-7xl mx-auto w-full">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
            <span>{errorNotification}</span>
          </div>
          <button onClick={() => setErrorNotification(null)} className="text-rose-400 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* DYNAMIC SCREEN LAYOUTS */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: DISCOVERY */}
          {activeTab === "discovery" && (
            <motion.div
              key="discovery-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Promo Banner / Intro */}
              <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800 p-8 flex flex-col md:flex-row items-center justify-between shadow-[0_0_20px_rgba(212,175,55,0.05)]">
                <div className="space-y-2 text-center md:text-left max-w-2xl">
                  <span className="text-xs font-mono text-gold-500 uppercase tracking-widest">Sophisticated Connections</span>
                  <h2 className="text-2xl md:text-3xl font-serif text-white font-light">Discreet Discovery Ledger</h2>
                  <p className="text-sm text-zinc-400 font-serif italic">
                    "Curated profiles of standard prestige. Each identity is authenticated using secure biometric scans before gold credentials are issued."
                  </p>
                </div>
                <div className="mt-6 md:mt-0 flex gap-4">
                  <button
                    onClick={() => setActiveTab("gold-verify")}
                    className="bg-zinc-900 border border-gold-500/50 hover:border-gold-500 px-6 py-3 font-mono text-xs tracking-widest uppercase text-gold-400 hover:bg-zinc-800/50 transition-all duration-300"
                  >
                    Get Gold Certified
                  </button>
                  <button
                    onClick={() => setScreenshotProtection(!screenshotProtection)}
                    className="border border-zinc-800 hover:border-zinc-700 px-4 py-3 font-mono text-xs tracking-widest uppercase text-zinc-400 hover:text-white transition-all duration-300 flex items-center space-x-1"
                    title="Toggle subtle watermark for discretion"
                  >
                    <EyeOff className="h-3.5 w-3.5 text-gold-500" />
                    <span>{screenshotProtection ? "Hide Watermark" : "Show Watermark"}</span>
                  </button>
                </div>
              </div>

              {/* Verified Profiles Grid */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="font-serif text-lg tracking-wider text-zinc-300 flex items-center space-x-2">
                    <Sparkles className="h-4 w-4 text-gold-500" />
                    <span>Active Premium Members</span>
                  </h3>
                  <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">{profiles.length} Active Cryptographic Matches</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {profiles.map((profile) => (
                    <div
                      key={profile.id}
                      onClick={() => setSelectedProfileForModal(profile)}
                      className="group bg-zinc-950 border border-zinc-900 p-6 flex flex-col justify-between hover:border-gold-500/50 transition-all duration-500 hover:shadow-[0_0_20px_rgba(212,175,55,0.06)] cursor-pointer"
                    >
                      <div>
                        {/* Avatar & Location Header */}
                        <div className="flex justify-between items-start mb-5">
                          <div className="relative">
                            <img
                              src={profile.avatarUrl}
                              alt={profile.displayName}
                              className="h-16 w-16 grayscale group-hover:grayscale-0 transition-all duration-500 border border-zinc-800 object-cover"
                              referrerPolicy="no-referrer"
                            />
                            {profile.isVerified && (
                              <span className="absolute -bottom-1 -right-1 bg-[#050505] p-0.5 border border-gold-500 rounded-full">
                                <ShieldCheck className="h-3.5 w-3.5 text-gold-500 fill-gold-950/50" />
                              </span>
                            )}
                          </div>
                          
                          <div className="text-right">
                            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block">{profile.recentActivity}</span>
                            <span className="text-xs font-serif text-gold-400 italic block">{profile.distance}</span>
                          </div>
                        </div>

                        {/* Name & Headline */}
                        <div className="space-y-1 mb-4">
                          <h4 className="font-serif text-lg text-zinc-100 font-medium group-hover:text-gold-300 transition-colors">
                            {profile.displayName}, {profile.age}
                          </h4>
                          <p className="text-xs font-serif italic text-zinc-400">{profile.headline}</p>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-zinc-500 font-sans leading-relaxed line-clamp-3 mb-6">
                          {profile.bio}
                        </p>
                      </div>

                      {/* Footer Actions */}
                      <div className="border-t border-zinc-900/80 pt-4 mt-2 flex justify-between items-center text-xs font-mono">
                        <div className="flex items-center space-x-1.5 text-[10px] text-zinc-400 tracking-wider">
                          <MapPin className="h-3 w-3 text-gold-500" />
                          <span>{profile.locationName.toUpperCase()}</span>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveChatId(profile.id);
                            setActiveTab("secure-channels");
                          }}
                          className="text-gold-400 hover:text-gold-200 transition-colors flex items-center space-x-1"
                        >
                          <span>Secure Chat</span>
                          <MessageSquare className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 2: EPHEMERAL ENCOUNTERS */}
          {activeTab === "ephemeral" && (
            <motion.div
              key="ephemeral-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Left Column: Feed */}
              <div className="lg:col-span-2 space-y-6">
                <div className="space-y-1.5">
                  <h3 className="font-serif text-2xl text-zinc-200 flex items-center space-x-2">
                    <Globe className="h-5 w-5 text-gold-500" />
                    <span>Active 72-Hour Encounters</span>
                  </h3>
                  <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest">
                    Real-time safety map updates • Expired entries are non-recoverable
                  </p>
                </div>

                <div className="space-y-4">
                  {encounters.length === 0 ? (
                    <div className="border border-zinc-900 bg-zinc-950 p-10 text-center space-y-4">
                      <Clock className="h-8 w-8 text-zinc-700 mx-auto" />
                      <p className="font-serif text-sm text-zinc-500 italic">No active encounters in your area. Use the panel on the right to post your invitation.</p>
                    </div>
                  ) : (
                    encounters.map((encounter) => (
                      <div
                        key={encounter.id}
                        className={`border p-6 bg-zinc-950 transition-all ${
                          encounter.isCustom
                            ? "border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.04)]"
                            : "border-zinc-900 hover:border-gold-500/40"
                        }`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center space-x-3">
                            <img
                              src={encounter.avatarUrl}
                              alt={encounter.displayName}
                              className="h-10 w-10 border border-zinc-800 object-cover grayscale"
                              referrerPolicy="no-referrer"
                            />
                            <div>
                              <h4 className="font-serif text-sm text-zinc-100 font-semibold">{encounter.displayName}</h4>
                              <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                                <MapPin className="h-2.5 w-2.5 text-gold-500" />
                                {encounter.locationName.toUpperCase()}
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-col items-end">
                            <span className="inline-flex items-center space-x-1 bg-amber-950/40 border border-amber-900 px-2.5 py-0.5 rounded-none text-[10px] font-mono text-amber-400">
                              <Clock className="h-3 w-3" />
                              <span>{formatRemainingTime(encounter.expiresAt)}</span>
                            </span>
                            {encounter.isCustom && (
                              <button
                                onClick={handleClearPost}
                                className="mt-2 text-[10px] font-mono text-rose-400 hover:text-rose-300 uppercase underline"
                              >
                                Expire Early
                              </button>
                            )}
                          </div>
                        </div>

                        <h5 className="font-serif text-lg text-gold-300 font-medium mb-2">{encounter.headline}</h5>
                        <p className="text-xs text-zinc-400 leading-relaxed font-sans">{encounter.description}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Right Column: Publish invitation */}
              <div className="space-y-6">
                <div className="bg-[#09090b] border border-zinc-900 p-6 space-y-6">
                  <div className="space-y-1">
                    <h3 className="font-serif text-lg text-zinc-200">Go Live</h3>
                    <p className="text-xs text-zinc-500 font-serif italic">
                      "Publish an ephemeral encounter visible globally. Postings require biometric gold certification and an active pass."
                    </p>
                  </div>

                  {/* Access Verification Alert */}
                  {!userState.isVerified ? (
                    <div className="bg-zinc-950 border border-zinc-800 p-5 text-center space-y-3">
                      <Lock className="h-5 w-5 text-zinc-600 mx-auto" />
                      <p className="text-xs text-zinc-400 font-mono uppercase tracking-wide">Verification Missing</p>
                      <p className="text-xs text-zinc-500">You must pass the Gold Biometric Scan before you can invite other members.</p>
                      <button
                        onClick={() => setActiveTab("gold-verify")}
                        className="w-full bg-zinc-900 border border-gold-500/40 hover:border-gold-500 text-gold-400 font-mono text-xs uppercase py-2 transition-colors"
                      >
                        Run Biometric Scan
                      </button>
                    </div>
                  ) : !userState.hasAccessPass ? (
                    <div className="bg-amber-950/20 border border-amber-900/60 p-5 text-center space-y-3">
                      <DollarSign className="h-5 w-5 text-gold-500 mx-auto" />
                      <p className="text-xs text-gold-400 font-mono uppercase tracking-wide">$100 Access Pass Required</p>
                      <p className="text-xs text-zinc-500 font-serif italic">"Posting requires an active 72-hour pass to discourage spam and protect the community's caliber."</p>
                      <button
                        onClick={() => setShowCheckoutModal(true)}
                        className="w-full bg-amber-500 text-black font-mono text-xs uppercase py-2.5 font-bold hover:bg-amber-400 transition-colors"
                      >
                        Get 3-Day Pass ($100)
                      </button>
                    </div>
                  ) : (
                    // Valid State: Show Post Creation Form
                    <form onSubmit={handlePublishPost} className="space-y-4">
                      {userState.activePostId ? (
                        <div className="bg-emerald-950/20 border border-emerald-900 p-4 text-center space-y-3">
                          <CheckCircle2 className="h-5 w-5 text-emerald-500 mx-auto" />
                          <p className="text-xs text-emerald-400 font-mono uppercase tracking-wide">Encounter is Live</p>
                          <p className="text-xs text-zinc-500">Your post is currently broadcasting. You may clear it at any time to scrub it from servers immediately.</p>
                          <button
                            type="button"
                            onClick={handleClearPost}
                            className="w-full bg-rose-950/80 border border-rose-800 text-rose-300 font-mono text-xs uppercase py-2 hover:bg-rose-900"
                          >
                            Purge Live Post
                          </button>
                        </div>
                      ) : (
                        <>
                          <div className="space-y-1">
                            <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">City Location</label>
                            <select
                              value={postLocation}
                              onChange={(e) => setPostLocation(e.target.value)}
                              className="w-full bg-zinc-950 border border-zinc-800 p-2.5 text-xs text-zinc-200 focus:outline-none focus:border-gold-500"
                            >
                              <option value="New York, Chelsea">New York, Chelsea</option>
                              <option value="London, Mayfair">London, Mayfair</option>
                              <option value="Paris, Le Marais">Paris, Le Marais</option>
                              <option value="Tokyo, Roppongi">Tokyo, Roppongi</option>
                            </select>
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Headline invitation</label>
                            <input
                              type="text"
                              value={postHeadline}
                              onChange={(e) => setPostHeadline(e.target.value)}
                              placeholder="e.g. Fine art collector seeks gallery companion..."
                              className="w-full bg-zinc-950 border border-zinc-800 p-2.5 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-gold-500"
                            />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Discreet Description</label>
                            <textarea
                              rows={4}
                              value={postDescription}
                              onChange={(e) => setPostDescription(e.target.value)}
                              placeholder="Describe your schedule, taste, or standard plan..."
                              className="w-full bg-zinc-950 border border-zinc-800 p-2.5 text-xs text-zinc-200 placeholder-zinc-700 focus:outline-none focus:border-gold-500 resize-none"
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={isSubmittingPost || !postHeadline.trim() || !postDescription.trim()}
                            className="w-full bg-gold-500 text-black font-mono text-xs uppercase py-3 font-bold hover:bg-gold-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          >
                            {isSubmittingPost ? "Publishing..." : "Publish Live Invite"}
                          </button>
                        </>
                      )}
                    </form>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 3: SECURE CHANNELS */}
          {activeTab === "secure-channels" && (
            <motion.div
              key="secure-channels-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-4 gap-8"
            >
              {/* Channels Sidebar List */}
              <div className="lg:col-span-1 bg-zinc-950 border border-zinc-900 p-4 flex flex-col h-[600px]">
                <div className="pb-3 border-b border-zinc-900 mb-4">
                  <h3 className="font-serif text-sm tracking-wider text-zinc-300 uppercase">Channels</h3>
                  <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">End-To-End Discretion</p>
                </div>

                <div className="flex-grow overflow-y-auto space-y-2">
                  {profiles.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setActiveChatId(p.id)}
                      className={`w-full text-left p-3 border transition-all flex items-center space-x-3 rounded-none ${
                        activeChatId === p.id
                          ? "bg-zinc-900 border-gold-500/40 text-gold-400"
                          : "bg-transparent border-transparent text-zinc-400 hover:bg-zinc-900/40 hover:text-zinc-200"
                      }`}
                    >
                      <div className="relative">
                        <img
                          src={p.avatarUrl}
                          alt={p.displayName}
                          className="h-10 w-10 border border-zinc-800 object-cover grayscale"
                          referrerPolicy="no-referrer"
                        />
                        <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border border-zinc-950"></span>
                      </div>
                      <div className="truncate">
                        <div className="flex items-center space-x-1">
                          <span className="font-serif text-xs font-semibold text-zinc-200">{p.displayName}</span>
                          {p.isVerified && <ShieldCheck className="h-3 w-3 text-gold-500" />}
                        </div>
                        <p className="text-[10px] font-mono text-zinc-500 truncate mt-0.5">{p.headline}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat View Area */}
              <div className="lg:col-span-3 bg-[#09090b] border border-zinc-900 flex flex-col h-[600px] justify-between">
                {/* Chat Header */}
                {(() => {
                  const currentProfile = profiles.find(p => p.id === activeChatId);
                  if (!currentProfile) return <div className="p-4 text-center text-zinc-500 text-xs">Select a channel to begin secure connection</div>;
                  
                  return (
                    <>
                      <div className="p-4 border-b border-zinc-900/80 flex items-center justify-between bg-black/40">
                        <div className="flex items-center space-x-3">
                          <img
                            src={currentProfile.avatarUrl}
                            alt={currentProfile.displayName}
                            className="h-10 w-10 border border-zinc-800 object-cover grayscale"
                            referrerPolicy="no-referrer"
                          />
                          <div>
                            <div className="flex items-center space-x-1.5">
                              <h4 className="font-serif text-sm text-zinc-100 font-semibold">{currentProfile.displayName}</h4>
                              <span className="bg-gold-950/40 border border-gold-800 text-[9px] font-mono text-gold-400 px-1.5 py-0.5 uppercase tracking-wide">
                                Gold Verified
                              </span>
                            </div>
                            <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{currentProfile.locationName.toUpperCase()}</span>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-[10px] font-mono text-zinc-500 block">ENCRYPTION PROTOCOL</span>
                          <span className="text-[10px] font-mono text-emerald-500 uppercase">AES-256 ACTIVE</span>
                        </div>
                      </div>

                      {/* Chat Logs */}
                      <div className="flex-grow p-5 overflow-y-auto space-y-4 max-h-[440px]">
                        {/* Ephemeral Warning Banner */}
                        <div className="bg-zinc-950 border border-zinc-900 p-3 text-center text-[10px] font-mono text-zinc-500 tracking-wider">
                          🔒 SHIELD CHANNELS ARE EPHEMERAL. INACTIVE CHATS PRUNED AUTOMATICALLY EVERY 24 HOURS. SCREENSHOT PREVENTION IS RECOMMENDED.
                        </div>

                        {chatMessages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-md p-3.5 text-xs rounded-none ${
                                msg.sender === "user"
                                  ? "bg-zinc-900 border border-zinc-800 text-zinc-200"
                                  : "bg-zinc-950 border border-gold-900/30 text-zinc-300"
                              }`}
                            >
                              <p className="leading-relaxed font-sans">{msg.text}</p>
                              <span className="text-[9px] font-mono text-zinc-500 block mt-1.5 text-right">
                                {new Date(msg.timestamp).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                          </div>
                        ))}

                        {/* Automated Moderation Flag Warning */}
                        {chatFlagged && (
                          <div className="bg-rose-950/30 border border-rose-900 p-3 text-center text-[10px] font-mono text-rose-300 tracking-wider">
                            ⚠️ SAFETY WARNING: AI Moderation detected spam or commercial solicitation keywords. Conversation has been flagged in administrative logs.
                          </div>
                        )}

                        <div ref={chatBottomRef} />
                      </div>

                      {/* Input Actions */}
                      <form onSubmit={handleSendMessage} className="p-4 border-t border-zinc-900 bg-black/20 flex gap-2">
                        <input
                          type="text"
                          value={messageInput}
                          onChange={(e) => setMessageInput(e.target.value)}
                          placeholder={`Encrypt message to ${currentProfile.displayName}...`}
                          className="flex-grow bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 placeholder-zinc-700 px-4 py-3 focus:outline-none focus:border-gold-500 rounded-none"
                        />
                        <button
                          type="submit"
                          disabled={!messageInput.trim() || isSendingMessage}
                          className="bg-gold-500 text-black px-5 font-mono text-xs uppercase font-bold hover:bg-gold-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
                        >
                          <span>Send</span>
                          <Send className="h-3.5 w-3.5" />
                        </button>
                      </form>
                    </>
                  );
                })()}
              </div>
            </motion.div>
          )}

          {/* TAB 4: GOLD BIOMETRIC VERIFICATION */}
          {activeTab === "gold-verify" && (
            <motion.div
              key="gold-verify-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Left Side Instructions */}
              <div className="lg:col-span-1 bg-zinc-950 border border-zinc-900 p-6 space-y-6">
                <div className="space-y-1">
                  <h3 className="font-serif text-xl text-zinc-200">Gold Biometric Evaluation</h3>
                  <p className="text-xs text-zinc-500 font-mono uppercase tracking-widest">Standard Cryptographic Ledger</p>
                </div>

                <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                  To protect the caliber, safety, and legitimacy of Krystles Pistols private member base, all active members must confirm authenticity via a biometric video selfie check.
                </p>

                <div className="space-y-4">
                  <div className="flex items-start space-x-3 text-xs">
                    <CheckCircle2 className="h-4.5 w-4.5 text-gold-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-serif font-bold text-zinc-300">Biometric Facial Check</h4>
                      <p className="text-zinc-500">Secures matches against real physical presence. Evaluated dynamically via server-side secure Gemini vision model.</p>
                    </div>
                  </div>

                  <div className="flex items-start space-x-3 text-xs">
                    <CheckCircle2 className="h-4.5 w-4.5 text-gold-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-serif font-bold text-zinc-300">Privacy Safeguards</h4>
                      <p className="text-zinc-500">We do not store your raw photos. Images are analyzed server-side, checked, and immediately converted into a secure SHA-256 hash token.</p>
                    </div>
                  </div>
                </div>

                {userState.isVerified && (
                  <div className="border border-gold-800 bg-gold-950/20 p-4 text-center">
                    <ShieldCheck className="h-8 w-8 text-gold-500 mx-auto mb-2" />
                    <span className="text-xs font-mono text-gold-400 uppercase tracking-widest block font-bold">Verification Passed</span>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-wider block mt-1">Symmetry Score: {userState.biometricMatchRate}%</span>
                    <p className="text-[11px] text-zinc-400 italic font-serif mt-2">"{userState.verificationDetails}"</p>
                  </div>
                )}
              </div>

              {/* Center & Right interactive scanner */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-[#09090b] border border-zinc-900 p-6 space-y-6">
                  <div className="flex justify-between items-center pb-3 border-b border-zinc-900/60">
                    <h3 className="font-serif text-lg text-zinc-200">Biometric Selfie Capture</h3>
                    <span className="text-xs font-mono text-zinc-500 uppercase tracking-wider">Secure Assessment Module</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Visual capture preview */}
                    <div className="space-y-4">
                      <div className="relative border border-zinc-800 bg-black aspect-video w-full flex items-center justify-center overflow-hidden">
                        {isScanning && (
                          <div className="absolute inset-x-0 top-0 h-0.5 bg-gold-500 animate-[bounce_2s_infinite] shadow-[0_0_10px_#d4af37] z-10"></div>
                        )}

                        {selectedSelfie ? (
                          <img
                            src={selectedSelfie}
                            alt="Verification selfie"
                            className="h-full w-full object-cover grayscale"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="text-center p-6 space-y-2">
                            <Camera className="h-10 w-10 text-zinc-700 mx-auto" />
                            <p className="text-xs text-zinc-500 font-serif">Camera Stream Inactive</p>
                            <p className="text-[10px] text-zinc-600 font-mono">Upload a face or pick an elite profile preset on the right</p>
                          </div>
                        )}

                        {isScanning && (
                          <div className="absolute inset-0 bg-black/60 flex flex-col justify-center items-center space-y-2">
                            <span className="text-xs font-mono text-gold-500 uppercase tracking-widest">Scanning Biometrics...</span>
                            <span className="text-xl font-mono text-white font-bold">{scanProgress}%</span>
                            <div className="w-32 bg-zinc-800 h-1">
                              <div className="bg-gold-500 h-full transition-all" style={{ width: `${scanProgress}%` }}></div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Photo actions */}
                      <div className="flex gap-3">
                        <button
                          onClick={openFilePicker}
                          className="flex-grow border border-zinc-800 hover:border-zinc-700 text-zinc-300 font-mono text-xs uppercase py-2.5 flex items-center justify-center space-x-1"
                        >
                          <Upload className="h-3.5 w-3.5" />
                          <span>Upload File</span>
                        </button>
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept="image/*"
                          className="hidden"
                        />

                        <button
                          onClick={startBiometricScan}
                          disabled={!selectedSelfie || isScanning}
                          className="flex-grow bg-gold-500 text-black font-mono text-xs uppercase py-2.5 font-bold hover:bg-gold-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1"
                        >
                          <Activity className="h-3.5 w-3.5" />
                          <span>Analyze Face</span>
                        </button>
                      </div>
                    </div>

                    {/* Presets and Upload Helpers */}
                    <div className="space-y-4">
                      <div>
                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-2">Preset Elite Portrats (For Instant Testing)</span>
                        <div className="grid grid-cols-3 gap-3">
                          {presetSelfies.map((p, idx) => (
                            <button
                              key={idx}
                              onClick={() => selectPresetSelfie(p.url)}
                              className={`border p-1 bg-zinc-950 transition-all hover:border-gold-500 ${
                                selectedSelfie === p.url ? "border-gold-500" : "border-zinc-800"
                              }`}
                            >
                              <img
                                src={p.url}
                                alt={p.name}
                                className="h-16 w-full object-cover grayscale"
                                referrerPolicy="no-referrer"
                              />
                              <span className="text-[8px] font-mono text-zinc-500 uppercase block text-center truncate mt-1">Profile {idx + 1}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Live feedback analysis */}
                      {verificationResult && (
                        <div className={`border p-4 space-y-2 ${verificationResult.approved ? "border-emerald-800 bg-emerald-950/10 text-emerald-400" : "border-rose-900 bg-rose-950/10 text-rose-400"}`}>
                          <div className="flex items-center space-x-2">
                            {verificationResult.approved ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            ) : (
                              <AlertTriangle className="h-4 w-4 text-rose-500" />
                            )}
                            <h4 className="font-serif text-sm font-semibold">
                              {verificationResult.approved ? "Verification Approved" : "Verification Failed"}
                            </h4>
                          </div>
                          <p className="text-[11px] font-mono text-zinc-400">Match score: {verificationResult.score}% symmetry checked.</p>
                          <p className="text-xs text-zinc-300 font-serif italic">"{verificationResult.details}"</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 4.5: LISTER PORTAL */}
          {activeTab === "lister" && authUser?.role === "lister" && (
            <motion.div
              key="lister-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Left Column: Form and Presets */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-[#09090b] border border-zinc-900 p-6 space-y-6">
                  <div className="flex justify-between items-center pb-3 border-b border-zinc-900/60">
                    <div>
                      <h3 className="font-serif text-lg text-zinc-200">Sourcing & Profile Ledger Registration</h3>
                      <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest mt-1">Publish High-End Profiles directly to the discovery pool</p>
                    </div>
                    <span className="text-[10px] bg-purple-950/40 border border-purple-850 px-2.5 py-1 text-purple-400 font-mono uppercase">
                      Lister Portal Active
                    </span>
                  </div>

                  {/* Form Quick Prefills */}
                  <div>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-2">Automated Sourcing Blueprints</span>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setListerName("Victoria Vance");
                          setListerAge("29");
                          setListerLocation("London, Belgravia");
                          setListerDistance("0.3 miles away");
                          setListerHeadline("Contemporary Art & Fashion Consultant");
                          setListerBio("Avid equestrian, modern art curator, and fashion buyer specializing in high-end bespoke tailoring.");
                          setListerExtendedBio("Victoria studied History of Art at Courtauld Institute. When not analyzing market trends for Private collectors, she competes in show jumping and travels between St. Tropez and London Belgravia. Looking for refined conversation, shared private viewing excursions, and exceptional companionship.");
                          setListerAvatarUrl("https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400");
                          setListerGalleryInput("https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=400, https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400");
                          setListerLanguagesInput("English, French, Russian");
                          setListerInterestsInput("Contemporary Art, Show Jumping, Bespoke Fashion");
                          setListerVideoUrl("https://assets.mixkit.co/videos/preview/mixkit-fashion-woman-posing-with-a-red-light-40285-large.mp4");
                        }}
                        className="border border-zinc-800 hover:border-purple-800 bg-zinc-950 p-3.5 text-left transition-all hover:bg-purple-950/10 cursor-pointer"
                      >
                        <span className="text-xs font-bold text-zinc-200 block">Sourcing: Victoria Vance</span>
                        <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block mt-1">Belgravia Art Collector</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setListerName("Genevieve Thorne");
                          setListerAge("31");
                          setListerLocation("London, Mayfair");
                          setListerDistance("0.5 miles away");
                          setListerHeadline("Luxury Concierge Specialist & Cellist");
                          setListerBio("Classical music enthusiast, sommelier certificant, and luxury hospitality advisor based in Mayfair.");
                          setListerExtendedBio("Genevieve curates bespoke itineraries for global travelers. She is a classically trained cellist who appreciates vintage Bordeaux, polo clubs, and confidential evenings. Speaks three languages and values genuine discretion above all else.");
                          setListerAvatarUrl("https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=400");
                          setListerGalleryInput("https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&q=80&w=400, https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&q=80&w=400");
                          setListerLanguagesInput("English, Italian, Spanish");
                          setListerInterestsInput("Discreet Travel, Vintage Wines, Classical Cello");
                          setListerVideoUrl("");
                        }}
                        className="border border-zinc-800 hover:border-purple-800 bg-zinc-950 p-3.5 text-left transition-all hover:bg-purple-950/10 cursor-pointer"
                      >
                        <span className="text-xs font-bold text-zinc-200 block">Sourcing: Genevieve Thorne</span>
                        <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider block mt-1">Mayfair Sommelier & Cellist</span>
                      </button>
                    </div>
                  </div>

                  {/* Creation Form */}
                  <form onSubmit={handleListerSubmitProfile} className="space-y-4">
                    {listerFormError && (
                      <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 text-xs font-mono">
                        {listerFormError}
                      </div>
                    )}
                    {listerFormSuccess && (
                      <div className="p-3 bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs font-mono">
                        {listerFormSuccess}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">Display Alias *</label>
                        <input
                          type="text"
                          value={listerName}
                          onChange={(e) => setListerName(e.target.value)}
                          placeholder="e.g. Victoria Vance"
                          className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 text-zinc-100 text-xs py-2 px-3 font-mono focus:outline-none"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">Age *</label>
                        <input
                          type="number"
                          value={listerAge}
                          onChange={(e) => setListerAge(e.target.value)}
                          placeholder="e.g. 29"
                          className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 text-zinc-100 text-xs py-2 px-3 font-mono focus:outline-none"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">Location (Neighborhood) *</label>
                        <input
                          type="text"
                          value={listerLocation}
                          onChange={(e) => setListerLocation(e.target.value)}
                          placeholder="e.g. London, Chelsea"
                          className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 text-zinc-100 text-xs py-2 px-3 font-mono focus:outline-none"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">Distance Label</label>
                        <input
                          type="text"
                          value={listerDistance}
                          onChange={(e) => setListerDistance(e.target.value)}
                          placeholder="e.g. 0.4 miles away"
                          className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 text-zinc-100 text-xs py-2 px-3 font-mono focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">Elegant Headline *</label>
                      <input
                        type="text"
                        value={listerHeadline}
                        onChange={(e) => setListerHeadline(e.target.value)}
                        placeholder="e.g. Fashion Buyer & Modern Equestrian"
                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 text-zinc-100 text-xs py-2 px-3 font-mono focus:outline-none"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">Teaser Bio (Short description for card) *</label>
                      <textarea
                        value={listerBio}
                        onChange={(e) => setListerBio(e.target.value)}
                        placeholder="Brief summary shown on the main discovery cards..."
                        rows={2}
                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 text-zinc-100 text-xs py-2 px-3 font-sans focus:outline-none resize-none"
                        required
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">Detailed Bio (Extended background modal)</label>
                      <textarea
                        value={listerExtendedBio}
                        onChange={(e) => setListerExtendedBio(e.target.value)}
                        placeholder="Detailed background story, interests, match preferences..."
                        rows={4}
                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 text-zinc-100 text-xs py-2 px-3 font-sans focus:outline-none resize-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">Portrait Avatar Image URL</label>
                      <input
                        type="text"
                        value={listerAvatarUrl}
                        onChange={(e) => setListerAvatarUrl(e.target.value)}
                        placeholder="Unsplash image link or custom HTTPS URL"
                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 text-zinc-100 text-xs py-2 px-3 font-mono focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">Gallery Assets (Comma-separated URLs)</label>
                      <input
                        type="text"
                        value={listerGalleryInput}
                        onChange={(e) => setListerGalleryInput(e.target.value)}
                        placeholder="URL1, URL2, URL3..."
                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 text-zinc-100 text-xs py-2 px-3 font-mono focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">Languages spoken (Comma-separated)</label>
                        <input
                          type="text"
                          value={listerLanguagesInput}
                          onChange={(e) => setListerLanguagesInput(e.target.value)}
                          placeholder="e.g. English, French, Italian"
                          className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 text-zinc-100 text-xs py-2 px-3 font-mono focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">Interests & Tags (Comma-separated)</label>
                        <input
                          type="text"
                          value={listerInterestsInput}
                          onChange={(e) => setListerInterestsInput(e.target.value)}
                          placeholder="e.g. Fine Wine, Sailing, Polo"
                          className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 text-zinc-100 text-xs py-2 px-3 font-mono focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-[10px] font-mono text-zinc-400 uppercase tracking-widest block">Vimeo or Video Loop URL (Optional)</label>
                      <input
                        type="text"
                        value={listerVideoUrl}
                        onChange={(e) => setListerVideoUrl(e.target.value)}
                        placeholder="Bespoke cinematic MP4 or video source"
                        className="w-full bg-zinc-950 border border-zinc-800 focus:border-purple-500 text-zinc-100 text-xs py-2 px-3 font-mono focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmittingListerProfile}
                      className="w-full bg-purple-900 hover:bg-purple-800 text-white font-mono text-xs uppercase tracking-widest py-3.5 transition-all font-bold cursor-pointer disabled:opacity-50"
                    >
                      {isSubmittingListerProfile ? "SECURING SANITY.IO REGISTRY INTEGRATION..." : "PUBLISH TO DISCOVERY PORTAL"}
                    </button>
                  </form>
                </div>
              </div>

              {/* Right Column: Information guidelines & preview */}
              <div className="lg:col-span-1 space-y-6">
                {/* Preview Card */}
                <div className="bg-[#09090b] border border-zinc-900 p-6 space-y-4">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block border-b border-zinc-900 pb-2">LEDGER LIVE PREVIEW</span>
                  
                  <div className="border border-zinc-900 bg-[#050505] p-4 space-y-4">
                    <div className="relative aspect-square w-full bg-zinc-950 border border-zinc-900 flex items-center justify-center overflow-hidden">
                      {listerAvatarUrl ? (
                        <img
                          src={listerAvatarUrl}
                          alt="Avatar Preview"
                          className="h-full w-full object-cover grayscale"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="text-zinc-700 text-center p-4">
                          <Camera className="h-8 w-8 mx-auto mb-2 text-zinc-800" />
                          <span className="text-[10px] font-mono block">NO AVATAR URL DEFINED</span>
                        </div>
                      )}
                      
                      <div className="absolute top-3 right-3 bg-zinc-950/80 border border-zinc-800 px-2.5 py-0.5 text-[8.5px] font-mono text-gold-400 uppercase tracking-widest rounded-none">
                        GOLD LEVEL MATCH
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-baseline space-x-2">
                        <h4 className="font-serif text-md text-zinc-200">{listerName || "Untitled Candidate"}</h4>
                        <span className="font-serif text-sm text-zinc-400">{listerAge || "??"}</span>
                      </div>
                      <p className="text-[10px] font-mono text-zinc-500 uppercase">{listerLocation || "No location set"}</p>
                    </div>

                    <p className="text-xs font-serif font-bold text-zinc-300 italic">
                      "{listerHeadline || "Sourcing Blueprint Headline..."}"
                    </p>

                    <p className="text-xs text-zinc-400 font-sans leading-relaxed">
                      {listerBio || "No description preview available. Enter matching candidates biography to start."}
                    </p>
                  </div>
                </div>

                {/* Sourcing Guidelines */}
                <div className="bg-[#09090b] border border-zinc-900 p-6 space-y-4">
                  <div className="space-y-1">
                    <h4 className="font-serif text-sm tracking-wider text-zinc-300 uppercase">Sanity.io Ledger Integrity</h4>
                    <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Aviation & Sourcing Protocol</p>
                  </div>

                  <p className="text-xs text-zinc-400 leading-relaxed font-serif italic">
                    "All profile assets published on Krystles Pistols are securely hosted on Sanity.io cloud databases and indexed statically via the IndexNow standard protocol. Profiles registered by listers require no downstream administrator action and become active in client Discovery feeds immediately."
                  </p>

                  <div className="space-y-2 pt-2 border-t border-zinc-900 text-xs font-mono text-zinc-500">
                    <div className="flex justify-between">
                      <span>DATABASES:</span>
                      <span className="text-purple-400">SANITY PRODUCTION</span>
                    </div>
                    <div className="flex justify-between">
                      <span>STATUS:</span>
                      <span className="text-emerald-500">SYNCHRONIZED (LIVE)</span>
                    </div>
                    <div className="flex justify-between">
                      <span>SECURED VIA:</span>
                      <span className="text-gold-400 font-bold">CRYSTAL GUARD</span>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 5: ADMIN/MODERATOR PANEL */}
          {activeTab === "admin" && isAdminLoggedIn && (
            <motion.div
              key="admin-tab"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              {/* Row 1: Executive Stats overview */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-[#09090b] border border-zinc-900 p-5 space-y-1">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Total Free Browsers</span>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-serif font-light text-zinc-200">2,420</span>
                    <span className="text-[10px] font-mono text-emerald-500">+14% / wk</span>
                  </div>
                </div>

                <div className="bg-[#09090b] border border-zinc-900 p-5 space-y-1">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Gold Verified Users</span>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-serif font-light text-gold-400">{840 + (userState.isVerified ? 1 : 0)}</span>
                    <span className="text-[10px] font-mono text-emerald-500">+8.5%</span>
                  </div>
                </div>

                <div className="bg-[#09090b] border border-zinc-900 p-5 space-y-1">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Access Pass holders</span>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-serif font-light text-amber-500">{290 + (userState.hasAccessPass ? 1 : 0)}</span>
                    <span className="text-[10px] font-mono text-gold-500">$29k Gross</span>
                  </div>
                </div>

                <div className="bg-[#09090b] border border-zinc-900 p-5 space-y-1">
                  <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Live Encounters</span>
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-serif font-light text-zinc-200">{encounters.length}</span>
                    <span className="text-[10px] font-mono text-zinc-500">Active Board</span>
                  </div>
                </div>
              </div>

              {/* Row 2: Recharts Charts Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Chart A: Funnel Recharts */}
                <div className="bg-[#09090b] border border-zinc-900 p-6 space-y-4">
                  <div className="space-y-1">
                    <h3 className="font-serif text-sm tracking-wider text-zinc-300 uppercase">Conversion Conversion Funnel</h3>
                    <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Free Browsers vs. $100 Verified Pass Subscribers</p>
                  </div>

                  {adminStats && (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          layout="vertical"
                          data={[
                            { name: "1. Free Browsers", value: 2420 },
                            { name: "2. Gold Verified", value: 840 + (userState.isVerified ? 1 : 0) },
                            { name: "3. $100 Pass Subscribers", value: 290 + (userState.hasAccessPass ? 1 : 0) }
                          ]}
                          margin={{ left: 20, right: 30, top: 20, bottom: 5 }}
                        >
                          <XAxis type="number" stroke="#52525b" fontSize={10} fontStyle="mono" />
                          <YAxis dataKey="name" type="category" stroke="#52525b" fontSize={10} fontStyle="mono" width={110} />
                          <Tooltip
                            contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a", fontSize: "11px" }}
                            itemStyle={{ color: "#d4af37" }}
                          />
                          <Bar dataKey="value" fill="#d4af37" barSize={20}>
                            <Cell fill="#a1a1aa" />
                            <Cell fill="#d4af37" />
                            <Cell fill="#f59e0b" />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Chart B: Location Activity levels */}
                <div className="bg-[#09090b] border border-zinc-900 p-6 space-y-4">
                  <div className="space-y-1">
                    <h3 className="font-serif text-sm tracking-wider text-zinc-300 uppercase">Global Area Activity levels</h3>
                    <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Active invitations & density ratio</p>
                  </div>

                  {adminStats && (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={adminStats.locationActivity}
                          margin={{ top: 20, right: 10, left: 0, bottom: 5 }}
                        >
                          <XAxis dataKey="name" stroke="#52525b" fontSize={10} fontStyle="mono" />
                          <YAxis stroke="#52525b" fontSize={10} fontStyle="mono" />
                          <Tooltip
                            contentStyle={{ backgroundColor: "#09090b", borderColor: "#27272a", fontSize: "11px" }}
                            itemStyle={{ color: "#d4af37" }}
                          />
                          <Bar dataKey="activity" fill="#8e7220" radius={[2, 2, 0, 0]}>
                            {adminStats.locationActivity.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={index % 2 === 0 ? "#d4af37" : "#b2912b"} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>

              {/* Row 3: Reported Content Queue & System Audit Logs */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Queue */}
                <div className="bg-[#09090b] border border-zinc-900 p-6 space-y-4">
                  <div className="space-y-1 pb-3 border-b border-zinc-900/60">
                    <h3 className="font-serif text-sm tracking-wider text-zinc-300 uppercase">Automated safety reports queue</h3>
                    <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Real-time flagged member conversations</p>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                    {adminStats?.reports.length === 0 ? (
                      <p className="text-zinc-500 text-xs italic font-serif py-10 text-center">No reports outstanding. Secure channels clear.</p>
                    ) : (
                      adminStats?.reports.map((rep) => (
                        <div key={rep.id} className="border border-zinc-900 p-4 bg-zinc-950 space-y-3">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center space-x-2">
                              <img src={rep.reportedAvatar} alt="" className="h-8 w-8 object-cover grayscale border border-zinc-800" />
                              <div>
                                <h4 className="font-serif text-xs text-zinc-200 font-bold">{rep.reportedName}</h4>
                                <span className="text-[9px] font-mono text-zinc-500 uppercase">Reporter: {rep.reporterName}</span>
                              </div>
                            </div>
                            <span className={`text-[9px] font-mono px-2 py-0.5 uppercase tracking-wider ${
                              rep.status === "pending"
                                ? "bg-amber-950/40 border border-amber-900 text-amber-400"
                                : rep.status === "resolved"
                                ? "bg-emerald-950/40 border border-emerald-900 text-emerald-400"
                                : "bg-zinc-900 border border-zinc-800 text-zinc-500"
                            }`}>
                              {rep.status}
                            </span>
                          </div>

                          <div className="space-y-1 bg-black/40 p-2.5 border border-zinc-900">
                            <span className="text-[8px] font-mono text-zinc-600 block uppercase">Flagged Excerpt</span>
                            <p className="text-xs text-zinc-400 font-serif italic">"{rep.chatExcerpt}"</p>
                          </div>

                          <p className="text-[10px] font-mono text-rose-300">Reason: {rep.reason}</p>

                          {rep.status === "pending" && (
                            <div className="flex gap-2 pt-1">
                              <button
                                onClick={() => handleReportAction(rep.id, "resolve")}
                                className="flex-grow bg-emerald-900/60 hover:bg-emerald-800 text-emerald-200 border border-emerald-800 font-mono text-[9px] uppercase py-1"
                              >
                                Resolve & Warn
                              </button>
                              <button
                                onClick={() => handleReportAction(rep.id, "dismiss")}
                                className="flex-grow bg-zinc-900 border border-zinc-800 text-zinc-400 font-mono text-[9px] uppercase py-1"
                              >
                                Dismiss Report
                              </button>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Audit Logs */}
                <div className="bg-[#09090b] border border-zinc-900 p-6 space-y-4">
                  <div className="space-y-1 pb-3 border-b border-zinc-900/60 flex justify-between items-center">
                    <div>
                      <h3 className="font-serif text-sm tracking-wider text-zinc-300 uppercase">Cryptographic Audit Ledger</h3>
                      <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Un-deletable system actions</p>
                    </div>

                    <button
                      onClick={fetchAdminStats}
                      className="border border-zinc-800 hover:border-zinc-700 text-zinc-400 hover:text-white p-1.5 rounded-none"
                    >
                      <RefreshCw className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto pr-2 font-mono text-[10px] leading-relaxed">
                    {adminStats?.auditLogs.map((log) => (
                      <div key={log.id} className="border-b border-zinc-900/40 pb-2 space-y-1">
                        <div className="flex justify-between text-zinc-500">
                          <span className="text-gold-500">[{log.adminId}]</span>
                          <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </div>
                        <p className="text-zinc-300 font-bold">{log.action}</p>
                        <p className="text-zinc-400 text-[9px]">{log.details}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 4: SEO and IndexNow Utilities */}
              <div className="bg-[#09090b] border border-zinc-900 p-6 space-y-4">
                <div className="space-y-1">
                  <h3 className="font-serif text-sm tracking-wider text-zinc-300 uppercase">SEO & AI Search Discovery Settings</h3>
                  <p className="text-[10px] text-zinc-500 font-mono uppercase tracking-widest">Ping global indexing services and register static content guides</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                  <div className="space-y-2 border border-zinc-900 p-4 bg-zinc-950">
                    <span className="text-xs font-serif font-bold text-zinc-300 block">Structured Data Schema</span>
                    <p className="text-[11px] text-zinc-500">JSON-LD LocalBusiness and Person schemas mapped dynamically to help search engines catalog safe dates protocols correctly.</p>
                    <span className="inline-block bg-emerald-950 text-emerald-400 text-[8px] font-mono border border-emerald-900 px-2 py-0.5 uppercase">Registered</span>
                  </div>

                  <div className="space-y-2 border border-zinc-900 p-4 bg-zinc-950">
                    <span className="text-xs font-serif font-bold text-zinc-300 block">AI Discovery (Perplexity / ChatGPT)</span>
                    <p className="text-[11px] text-zinc-500 font-serif italic">"Safe Dating Protocols & Discreet Privacy Guides index optimized to ensure organic AI recommendations."</p>
                    <span className="inline-block bg-emerald-950 text-emerald-400 text-[8px] font-mono border border-emerald-900 px-2 py-0.5 uppercase">Active</span>
                  </div>

                  <div className="space-y-2 border border-zinc-900 p-4 bg-zinc-950 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-serif font-bold text-zinc-300 block">IndexNow Dynamic Pinger</span>
                      <p className="text-[11px] text-zinc-500">Instantly notify global indexers of changes in our safety and protocols guides.</p>
                    </div>

                    <div className="space-y-2 pt-2">
                      <button
                        onClick={triggerIndexNow}
                        disabled={isPingingIndexNow}
                        className="w-full bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 hover:border-gold-500 text-gold-400 hover:text-gold-200 font-mono text-[10px] uppercase py-2 flex items-center justify-center space-x-1"
                      >
                        <RefreshCw className={`h-3 w-3 ${isPingingIndexNow ? "animate-spin" : ""}`} />
                        <span>{isPingingIndexNow ? "Pinging IndexNow..." : "Ping IndexNow"}</span>
                      </button>

                      {indexNowResult && (
                        <div className="text-[10px] font-mono text-emerald-400 text-center">{indexNowResult}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* STRIPE $100 PASS CHECKOUT MODAL SIMULATOR */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#09090b] border border-gold-500/50 max-w-md w-full p-6 space-y-6 shadow-[0_0_50px_rgba(212,175,55,0.15)]">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-serif text-xl text-zinc-100 font-bold">Stripe Premium Gateway</h3>
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Secure 128-bit Encrypted Transaction</p>
              </div>
              <button onClick={() => setShowCheckoutModal(false)} className="text-zinc-500 hover:text-white cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="border border-zinc-900 bg-zinc-950 p-4 space-y-3 font-mono text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Pass Tier:</span>
                <span className="text-gold-400">72-Hour Elite Invitation Pass</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Duration:</span>
                <span>72 Hours (Dynamic Expire)</span>
              </div>
              <div className="flex justify-between border-t border-zinc-900 pt-2 text-zinc-200 font-bold">
                <span>Total Due:</span>
                <span className="text-gold-500">$100.00 USD</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-zinc-500 uppercase block">Card Details (Simulated Gateway)</span>
                <div className="bg-zinc-950 border border-zinc-800 p-3 flex justify-between items-center text-xs font-mono text-zinc-400">
                  <span>•••• •••• •••• 4242</span>
                  <span>12/28</span>
                </div>
              </div>

              <button
                onClick={purchaseAccessPass}
                className="w-full bg-gold-500 text-black font-mono text-xs uppercase py-3 font-extrabold hover:bg-gold-400 transition-colors shadow-[0_0_15px_rgba(212,175,55,0.2)]"
              >
                Confirm Payment & Go Live ($100)
              </button>
              
              <p className="text-[10px] text-zinc-600 text-center font-sans">
                By purchasing, you authorize an immediate pass issue. Billing appears as "KP PRIVATE_PASS" for ultimate statement discretion.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* UNIFIED SUPABASE / FALLBACK AUTHENTICATE PORTAL MODAL */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#09090b] border border-gold-500/40 max-w-md w-full p-6 space-y-6 shadow-[0_0_55px_rgba(212,175,55,0.12)]">
            <div className="flex justify-between items-start pb-2 border-b border-zinc-900/60">
              <div>
                <h3 className="font-serif text-lg text-zinc-100 font-bold tracking-wider">
                  {isSignUpMode ? "PORTAL ACCREDITATION REGISTRY" : "SECURE PASS PORTAL AUTH"}
                </h3>
                <p className="text-[9px] font-mono text-zinc-500 uppercase tracking-widest mt-0.5">
                  {isSignUpMode ? "Register new authorized credentials tier" : "Sign in to private member platform"}
                </p>
              </div>
              <button 
                onClick={() => {
                  setShowAuthModal(false);
                  setAuthError("");
                  setAuthSuccessMsg("");
                }} 
                className="text-zinc-500 hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Mode Switcher Buttons */}
            <div className="flex border border-zinc-850 p-1 bg-zinc-950">
              <button
                type="button"
                onClick={() => {
                  setIsSignUpMode(false);
                  setAuthError("");
                }}
                className={`flex-1 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
                  !isSignUpMode ? "bg-gold-500 text-black font-bold" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                DISCREET SIGN IN
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSignUpMode(true);
                  setAuthError("");
                }}
                className={`flex-1 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
                  isSignUpMode ? "bg-gold-500 text-black font-bold" : "text-zinc-400 hover:text-zinc-200"
                }`}
              >
                PORTAL REGISTRY
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authError && (
                <div className="p-3 bg-rose-950/40 border border-rose-800 text-rose-300 text-xs font-mono">
                  {authError}
                </div>
              )}
              {authSuccessMsg && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs font-mono text-center">
                  {authSuccessMsg}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Accreditation Email</label>
                <input
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="e.g. member@krystles.com"
                  className="w-full bg-zinc-950 border border-zinc-800 p-2.5 text-xs text-zinc-200 placeholder-zinc-800 focus:outline-none focus:border-gold-500 rounded-none font-mono"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Access Password</label>
                <input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••••••••"
                  className="w-full bg-zinc-950 border border-zinc-800 p-2.5 text-xs text-zinc-200 placeholder-zinc-800 focus:outline-none focus:border-gold-500 rounded-none font-mono"
                  required
                />
              </div>

              {/* REGISTER ONLY FIELDS: Role select tier */}
              {isSignUpMode && (
                <div className="space-y-2 pt-2">
                  <label className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Accreditation Sourcing Tier (Role)</label>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setAuthRole("browser")}
                      className={`border p-2 bg-zinc-950 text-center transition-all cursor-pointer flex flex-col justify-between h-20 ${
                        authRole === "browser" ? "border-gold-500" : "border-zinc-900"
                      }`}
                    >
                      <span className="text-[10px] font-bold text-zinc-200 block">BROWSER</span>
                      <span className="text-[8px] text-zinc-500 font-sans block leading-tight mt-1">Discreet Member Explorations</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAuthRole("lister")}
                      className={`border p-2 bg-zinc-950 text-center transition-all cursor-pointer flex flex-col justify-between h-20 ${
                        authRole === "lister" ? "border-gold-500" : "border-zinc-900"
                      }`}
                    >
                      <span className="text-[10px] font-bold text-zinc-200 block">LISTER</span>
                      <span className="text-[8px] text-zinc-500 font-sans block leading-tight mt-1">Profile Sourcing & Ledger</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAuthRole("admin")}
                      className={`border p-2 bg-zinc-950 text-center transition-all cursor-pointer flex flex-col justify-between h-20 ${
                        authRole === "admin" ? "border-gold-500" : "border-zinc-900"
                      }`}
                    >
                      <span className="text-[10px] font-bold text-zinc-200 block">ADMIN</span>
                      <span className="text-[8px] text-zinc-500 font-sans block leading-tight mt-1">Platform Moderation & Audit</span>
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-gold-500 hover:bg-gold-400 text-black font-mono text-xs uppercase py-2.5 font-bold transition-colors cursor-pointer block text-center"
              >
                {isSignUpMode ? "REGISTER ACCESS PASS CREDENTIALS" : "AUTHENTICATE PRIVATE TOKEN"}
              </button>
            </form>

            {/* SUPABASE STATUS FOOTER ACCENTS */}
            <div className="border-t border-zinc-900/60 pt-4 font-mono text-[9px] uppercase space-y-2">
              <div className="flex items-center space-x-2">
                <span className={`h-1.5 w-1.5 rounded-full ${supabaseConfig.configured ? "bg-emerald-500" : "bg-amber-500"}`}></span>
                <span className="text-zinc-500">
                  {supabaseConfig.configured ? "SUPABASE SECURE CLOUD GATEWAY: ONLINE" : "SIMULATED ENCRYPTED DATABASE: ACTIVE"}
                </span>
              </div>
              
              {!supabaseConfig.configured && (
                <div className="bg-zinc-950/80 border border-zinc-900 p-2.5 text-zinc-400 text-left normal-case space-y-1">
                  <p className="font-bold text-[9px] uppercase text-zinc-500 font-mono tracking-wide">Demo Accounts (For Evaluation):</p>
                  <p className="text-[9.5px]">
                    <span className="text-gold-500 font-mono">admin@krystles.com</span> with <span className="text-gold-500 font-mono">admin123</span>
                  </p>
                  <p className="text-[9.5px]">
                    <span className="text-gold-500 font-mono">lister@krystles.com</span> with <span className="text-gold-500 font-mono">lister123</span>
                  </p>
                  <p className="text-[9.5px]">
                    <span className="text-gold-500 font-mono">browser@krystles.com</span> with <span className="text-gold-500 font-mono">browser123</span>
                  </p>
                  <p className="text-[9.5px] italic text-zinc-500 pt-0.5">
                    Or simply select PORTAL REGISTRY tab above to construct a brand new credentials profile dynamically!
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PROFILE DETAIL MODAL (SANITY.IO SYNCED) */}
      {selectedProfileForModal && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#09090b] border border-gold-500/40 max-w-2xl w-full p-6 md:p-8 space-y-6 shadow-[0_0_60px_rgba(212,175,55,0.12)] max-h-[90vh] overflow-y-auto rounded-none">
            
            {/* Header */}
            <div className="flex justify-between items-start pb-4 border-b border-zinc-900">
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h3 className="font-serif text-2xl text-zinc-100 font-semibold tracking-wide">
                    {selectedProfileForModal.displayName}, {selectedProfileForModal.age}
                  </h3>
                  {selectedProfileForModal.isVerified && (
                    <ShieldCheck className="h-5 w-5 text-gold-500 fill-gold-950/20" />
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-3 text-xs font-mono">
                  <span className="text-gold-400 italic font-serif">{selectedProfileForModal.distance}</span>
                  <span className="text-zinc-600">•</span>
                  <span className="text-zinc-400 flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-gold-500" />
                    {selectedProfileForModal.locationName.toUpperCase()}
                  </span>
                  <span className="text-zinc-600">•</span>
                  <span className="text-emerald-400 uppercase text-[10px] tracking-wider">{selectedProfileForModal.recentActivity}</span>
                </div>
              </div>
              <button 
                onClick={() => setSelectedProfileForModal(null)} 
                className="text-zinc-500 hover:text-white cursor-pointer p-1"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Sanity Live Badge */}
            <div className="bg-gold-950/20 border border-gold-900/30 p-2.5 flex items-center justify-between text-[10px] font-mono tracking-wider text-gold-400 uppercase">
              <div className="flex items-center space-x-2">
                <span className="h-2 w-2 rounded-full bg-gold-500 animate-pulse"></span>
                <span>CDN Connection: live sync verified</span>
              </div>
              <span className="text-zinc-500">{selectedProfileForModal.sanitySource || "sanity.io/krystles-pistols-ledger"}</span>
            </div>

            {/* Grid Layout: Cinematic Media & Core Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Media Column (Looping Vimeo Video or large image) */}
              <div className="space-y-4">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Cinematic Loop</span>
                <div className="relative aspect-square md:aspect-[4/5] bg-black border border-zinc-900 overflow-hidden group">
                  {selectedProfileForModal.videoUrl ? (
                    <video
                      src={selectedProfileForModal.videoUrl}
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700"
                    />
                  ) : (
                    <img
                      src={selectedProfileForModal.avatarUrl}
                      alt={selectedProfileForModal.displayName}
                      className="w-full h-full object-cover grayscale"
                    />
                  )}
                  <div className="absolute bottom-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 border border-zinc-800 text-[8px] font-mono text-zinc-400 uppercase tracking-widest">
                    Live Video Loop
                  </div>
                </div>
              </div>

              {/* Bio & Details Column */}
              <div className="space-y-6 flex flex-col justify-between">
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">Headline Statement</span>
                    <p className="font-serif italic text-sm text-gold-300 leading-relaxed">
                      "{selectedProfileForModal.headline}"
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1.5">Extended Biography</span>
                    <p className="text-xs text-zinc-400 leading-relaxed font-sans font-light">
                      {selectedProfileForModal.extendedBio || selectedProfileForModal.bio}
                    </p>
                  </div>

                  {selectedProfileForModal.languages && (
                    <div>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">Languages Spoken</span>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {selectedProfileForModal.languages.map((lang, index) => (
                          <span key={index} className="bg-zinc-950 border border-zinc-900 text-zinc-400 font-mono text-[10px] px-2 py-0.5 uppercase tracking-wide">
                            {lang}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedProfileForModal.interests && (
                    <div>
                      <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block mb-1">Prestige Tags</span>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {selectedProfileForModal.interests.map((interest, index) => (
                          <span key={index} className="bg-zinc-900/60 border border-gold-950/50 text-gold-400 font-mono text-[9px] px-2 py-0.5 uppercase tracking-widest">
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  onClick={() => {
                    setActiveChatId(selectedProfileForModal.id);
                    setActiveTab("secure-channels");
                    setSelectedProfileForModal(null);
                  }}
                  className="w-full bg-gold-500 text-black font-mono text-xs uppercase py-3 font-extrabold hover:bg-gold-400 transition-colors shadow-[0_0_15px_rgba(212,175,55,0.15)] flex items-center justify-center space-x-2 cursor-pointer"
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Initiate Communication Tunnel</span>
                </button>
              </div>
            </div>

            {/* Sanity Secondary Asset Gallery */}
            {selectedProfileForModal.gallery && selectedProfileForModal.gallery.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-zinc-900">
                <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest block">Secondary Assets (Sourced from Sanity CDN)</span>
                <div className="grid grid-cols-3 gap-3">
                  {selectedProfileForModal.gallery.map((imgUrl, index) => (
                    <div key={index} className="aspect-square bg-zinc-950 border border-zinc-900 overflow-hidden relative group">
                      <img
                        src={imgUrl}
                        alt={`Asset ${index + 1}`}
                        className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                        <span className="text-[8px] font-mono bg-black/80 px-1.5 py-0.5 border border-zinc-800 text-zinc-300">IMAGE_0{index + 1}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* STRIPE $100 PASS CHECKOUT MODAL SIMULATOR */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#09090b] border border-gold-500/50 max-w-md w-full p-6 space-y-6 shadow-[0_0_50px_rgba(212,175,55,0.15)]">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-serif text-xl text-zinc-100 font-bold">Stripe Premium Gateway</h3>
                <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Secure 128-bit Encrypted Transaction</p>
              </div>
              <button onClick={() => setShowCheckoutModal(false)} className="text-zinc-500 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="border border-zinc-900 bg-zinc-950 p-4 space-y-3 font-mono text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Pass Tier:</span>
                <span className="text-gold-400">72-Hour Elite Invitation Pass</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Duration:</span>
                <span>72 Hours (Dynamic Expire)</span>
              </div>
              <div className="flex justify-between border-t border-zinc-900 pt-2 text-zinc-200 font-bold">
                <span>Total Due:</span>
                <span className="text-gold-500">$100.00 USD</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-zinc-500 uppercase block">Card Details (Simulated Gateway)</span>
                <div className="bg-zinc-950 border border-zinc-800 p-3 flex justify-between items-center text-xs font-mono text-zinc-400">
                  <span>•••• •••• •••• 4242</span>
                  <span>12/28</span>
                </div>
              </div>

              <button
                onClick={purchaseAccessPass}
                className="w-full bg-gold-500 text-black font-mono text-xs uppercase py-3 font-extrabold hover:bg-gold-400 transition-colors shadow-[0_0_15px_rgba(212,175,55,0.2)]"
              >
                Confirm Payment & Go Live ($100)
              </button>
              
              <p className="text-[10px] text-zinc-600 text-center font-sans">
                By purchasing, you authorize an immediate pass issue. Billing appears as "KP PRIVATE_PASS" for ultimate statement discretion.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="mt-auto border-t border-zinc-900/60 bg-black/40 py-6 text-center text-xs font-mono text-zinc-600 space-y-1">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-[10px] tracking-wider uppercase">
          <span>© 2026 KRYSTLES PISTOLS. ALL CHANNELS ENCRYPTED.</span>
          <div className="flex space-x-4 mt-2 md:mt-0">
            <span>Server IP: SHA-256 Auth</span>
            <span>Prune TTL: 24h</span>
            <span>Platform: Remix Standard SPA</span>
          </div>
        </div>
      </footer>

    </div>
  );
}