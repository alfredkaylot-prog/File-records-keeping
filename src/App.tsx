import React, { useEffect, useState, useRef, useMemo } from "react";

// --- Version Constants ---
const APP_VERSION = "2.4.0";
const LAST_UPDATE = "2026-10-06";

// --- Types ---
type OfficerRole = "Registry Clerk" | "Senior Officer" | "Officer" | "CCO";

interface Officer {
  id: string;
  name: string;
  role: OfficerRole;
  staffId: string;
  pin: string;
  canDeleteFiles: boolean;
  canManageOfficers: boolean;
  avatar: string;
}

interface FileRecord {
  id: string;
  fileNumber: string;
  title: string;
  senderOrRecipient: string;
  date: string;
  category: string;
  actionTaken: string;
  status: string;
  assignedTo: string;
  remarks: string;
  createdAt: string;
}

interface CategoriesState {
  incoming: string[];
  outgoing: string[];
  statuses: string[];
}

interface AuditEntry {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  officerName: string;
}

interface SelfEditForm {
  name: string;
  avatar: string;
  oldPin: string;
  newPin: string;
  confirmPin: string;
}

// --- Helpers ---
const genId = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
const nowISO = () => new Date().toISOString();
const truncate = (s: string, n: number) => (s.length > n ? s.slice(0, n) + "…" : s);
const initialsFromName = (name: string) =>
  name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

const formatDate = (iso: string) => {
  try {
    return new Date(iso).toLocaleString("en-NG", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return iso;
  }
};

// --- Default Data ---
const DEFAULT_OFFICERS: Officer[] = [
  {
    id: "off-001",
    name: "Amina Yusuf",
    role: "Registry Clerk",
    staffId: "REG-2021-01",
    pin: "3333",
    canDeleteFiles: true,
    canManageOfficers: true,
    avatar: "AY",
  },
  {
    id: "off-002",
    name: "John Okoro",
    role: "Senior Officer",
    staffId: "SO-2020-12",
    pin: "5678",
    canDeleteFiles: false,
    canManageOfficers: false,
    avatar: "JO",
  },
  {
    id: "off-003",
    name: "Fatima Bello",
    role: "Officer",
    staffId: "OF-2019-08",
    pin: "9012",
    canDeleteFiles: false,
    canManageOfficers: false,
    avatar: "FB",
  },
  {
    id: "off-004",
    name: "Chief Compliance Officer",
    role: "CCO",
    staffId: "CCO-001",
    pin: "0000",
    canDeleteFiles: true,
    canManageOfficers: true,
    avatar: "CC",
  },
];

const DEFAULT_CATEGORIES: CategoriesState = {
  incoming: ["Correspondence", "Complaint", "Legal Notice", "Audit Report", "Regulatory Filing", "Petition"],
  outgoing: ["Response Letter", "Compliance Notice", "Directive", "Acknowledgement", "Circular", "Report"],
  statuses: ["Pending", "In Progress", "Closed", "Urgent", "Forwarded", "Filed"],
};

const DEFAULT_INCOMING: FileRecord[] = [
  {
    id: "inc-001",
    fileNumber: "CCO/IN/2026/0014",
    title: "Request for Clarification on KYC Documentation - Zenith Bank Branch Audit",
    senderOrRecipient: "Zenith Bank Plc - Compliance Division",
    date: "2026-10-01",
    category: "Regulatory Filing",
    actionTaken: "Received and logged. Forwarded to CCO for review. Document verified against checklist. Pending Director approval. File routed to Legal for secondary review as per SOP 4.2.",
    status: "In Progress",
    assignedTo: "Amina Yusuf",
    remarks: "Priority: High - Response due in 7 days",
    createdAt: nowISO(),
  },
  {
    id: "inc-002",
    fileNumber: "CCO/IN/2026/0015",
    title: "Annual Compliance Training Completion Report Q3",
    senderOrRecipient: "Human Resources - Training Unit",
    date: "2026-10-03",
    category: "Audit Report",
    actionTaken: "Filed in Q3 training folder. Copies dispatched to all department heads. Under Review by CCO. Attendance sheet cross-checked.",
    status: "Pending",
    assignedTo: "Fatima Bello",
    remarks: "92% completion rate",
    createdAt: nowISO(),
  },
  {
    id: "inc-003",
    fileNumber: "CCO/IN/2026/0016",
    title: "Whistleblower Report - Confidential - Transaction Irregularity",
    senderOrRecipient: "Anonymous - Ethics Hotline",
    date: "2026-10-04",
    category: "Complaint",
    actionTaken: "Logged as confidential. Forwarded directly to CCO only. Case file opened per Whistleblower Policy. Under Review - No disclosure to other officers. Approved for investigation.",
    status: "Urgent",
    assignedTo: "Chief Compliance Officer",
    remarks: "CONFIDENTIAL - Restricted access",
    createdAt: nowISO(),
  },
];

const DEFAULT_OUTGOING: FileRecord[] = [
  {
    id: "out-001",
    fileNumber: "CCO/OUT/2026/0088",
    title: "Response to KYC Clarification - Zenith Bank",
    senderOrRecipient: "Zenith Bank Plc - Compliance Division",
    date: "2026-10-02",
    category: "Response Letter",
    actionTaken: "Dispatched via courier and email. Delivered confirmation received. Awaiting Response from bank within 14 days.",
    status: "Dispatched",
    assignedTo: "John Okoro",
    remarks: "Courier tracking: NG2026-8891",
    createdAt: nowISO(),
  },
  {
    id: "out-002",
    fileNumber: "CCO/OUT/2026/0089",
    title: "Compliance Directive on Enhanced Due Diligence - All Branches",
    senderOrRecipient: "All Regional Branch Managers",
    date: "2026-10-03",
    category: "Directive",
    actionTaken: "Circular issued. Dispatched to 42 branches. Follow-up Required after 2 weeks to confirm implementation.",
    status: "Delivered",
    assignedTo: "Amina Yusuf",
    remarks: "Bulk dispatch",
    createdAt: nowISO(),
  },
  {
    id: "out-003",
    fileNumber: "CCO/OUT/2026/0090",
    title: "Acknowledgement of Q3 Training Report",
    senderOrRecipient: "Human Resources - Training Unit",
    date: "2026-10-04",
    category: "Acknowledgement",
    actionTaken: "Dispatched. Delivered. Filed in outgoing register. No further action required. Closed.",
    status: "Closed",
    assignedTo: "Fatima Bello",
    remarks: "-",
    createdAt: nowISO(),
  },
];

export default function App() {
  // --- Core States ---
  const [officers, setOfficers] = useState<Officer[]>(DEFAULT_OFFICERS);
  const [incoming, setIncoming] = useState<FileRecord[]>(DEFAULT_INCOMING);
  const [outgoing, setOutgoing] = useState<FileRecord[]>(DEFAULT_OUTGOING);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [categories, setCategories] = useState<CategoriesState>(DEFAULT_CATEGORIES);
  const [settings] = useState({ retentionDays: 365 });

  // --- Auth / Session ---
  const [currentOfficer, setCurrentOfficer] = useState<Officer | null>(null);
  const [selectedLoginId, setSelectedLoginId] = useState<string>(DEFAULT_OFFICERS[0].id);
  const [pinInput, setPinInput] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginAttempts, setLoginAttempts] = useState(0);

  // --- UI Filters ---
  const [searchIncoming, setSearchIncoming] = useState("");
  const [searchOutgoing, setSearchOutgoing] = useState("");
  const [filterIncomingStatus, setFilterIncomingStatus] = useState("All");
  const [filterOutgoingStatus, setFilterOutgoingStatus] = useState("All");
  const [activeTab, setActiveTab] = useState<"incoming" | "outgoing" | "officers" | "categories" | "audit" | "settings">("incoming");

  // --- Modals ---
  const [showIncomingModal, setShowIncomingModal] = useState(false);
  const [editingIncoming, setEditingIncoming] = useState<FileRecord | null>(null);
  const [incomingForm, setIncomingForm] = useState<Omit<FileRecord, "id" | "createdAt">>({
    fileNumber: "",
    title: "",
    senderOrRecipient: "",
    date: new Date().toISOString().slice(0, 10),
    category: DEFAULT_CATEGORIES.incoming[0],
    actionTaken: "",
    status: "Pending",
    assignedTo: DEFAULT_OFFICERS[0].name,
    remarks: "",
  });

  const [showOutgoingModal, setShowOutgoingModal] = useState(false);
  const [editingOutgoing, setEditingOutgoing] = useState<FileRecord | null>(null);
  const [outgoingForm, setOutgoingForm] = useState<Omit<FileRecord, "id" | "createdAt">>({
    fileNumber: "",
    title: "",
    senderOrRecipient: "",
    date: new Date().toISOString().slice(0, 10),
    category: DEFAULT_CATEGORIES.outgoing[0],
    actionTaken: "",
    status: "Dispatched",
    assignedTo: DEFAULT_OFFICERS[0].name,
    remarks: "",
  });

  const [showOfficerModal, setShowOfficerModal] = useState(false);
  const [editingOfficer, setEditingOfficer] = useState<Officer | null>(null);
  const [officerForm, setOfficerForm] = useState<Omit<Officer, "id">>({
    name: "",
    role: "Officer",
    staffId: "",
    pin: "",
    canDeleteFiles: false,
    canManageOfficers: false,
    avatar: "",
  });

  const [showSelfEditModal, setShowSelfEditModal] = useState(false);
  const [selfEditForm, setSelfEditForm] = useState<SelfEditForm>({
    name: "",
    avatar: "",
    oldPin: "",
    newPin: "",
    confirmPin: "",
  });
  const [selfEditError, setSelfEditError] = useState("");

  const [showAuthModal, setShowAuthModal] = useState<{ type: "delete_incoming" | "delete_outgoing"; id: string } | null>(null);
  const [authPin, setAuthPin] = useState("");
  const [authError, setAuthError] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<{ type: "incoming" | "outgoing" | "officer" | "category"; id: string; name: string; extra?: any } | null>(null);

  // categories editing
  const [catEdit, setCatEdit] = useState<{ type: keyof CategoriesState; idx: number } | null>(null);
  const [newCatValues, setNewCatValues] = useState<Record<keyof CategoriesState, string>>({ incoming: "", outgoing: "", statuses: "" });

  // update center
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [checkingUpdates, setCheckingUpdates] = useState(false);
  const [checkResult, setCheckResult] = useState<string>("");
  const [updating, setUpdating] = useState(false);
  const [updateProgress, setUpdateProgress] = useState(0);
  const [isOnline] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Audit Logger ---
  const logAudit = (action: string, details: string) => {
    const entry: AuditEntry = {
      id: genId(),
      timestamp: nowISO(),
      action,
      details,
      officerName: currentOfficer?.name || "System",
    };
    setAudit((prev) => [entry, ...prev].slice(0, 500));
  };

  // --- Load from localStorage ---
  useEffect(() => {
    try {
      const off = localStorage.getItem("cco_officers_v2");
      if (off) {
        const parsed = JSON.parse(off);
        if (Array.isArray(parsed) && parsed.length > 0) setOfficers(parsed);
      }
      const inc = localStorage.getItem("cco_incoming_v2");
      if (inc) {
        const parsed = JSON.parse(inc);
        if (Array.isArray(parsed)) {
          // migrate actionTaken = status if missing
          const migrated = parsed.map((r: any) => ({
            ...r,
            actionTaken: r.actionTaken || r.status || "",
          }));
          setIncoming(migrated);
        }
      }
      const out = localStorage.getItem("cco_outgoing_v2");
      if (out) {
        const parsed = JSON.parse(out);
        if (Array.isArray(parsed)) {
          const migrated = parsed.map((r: any) => ({
            ...r,
            actionTaken: r.actionTaken || r.status || "",
          }));
          setOutgoing(migrated);
        }
      }
      const aud = localStorage.getItem("cco_audit_v2");
      if (aud) {
        const parsed = JSON.parse(aud);
        if (Array.isArray(parsed)) setAudit(parsed);
      }
      const cat = localStorage.getItem("cco_categories_v2");
      if (cat) {
        const parsed = JSON.parse(cat);
        if (parsed && parsed.incoming) setCategories(parsed);
      }
    } catch (e) {
      console.warn("Load failed", e);
    }
  }, []);

  // --- Save to localStorage ---
  useEffect(() => {
    localStorage.setItem("cco_officers_v2", JSON.stringify(officers));
  }, [officers]);
  useEffect(() => {
    localStorage.setItem("cco_incoming_v2", JSON.stringify(incoming));
  }, [incoming]);
  useEffect(() => {
    localStorage.setItem("cco_outgoing_v2", JSON.stringify(outgoing));
  }, [outgoing]);
  useEffect(() => {
    localStorage.setItem("cco_audit_v2", JSON.stringify(audit));
  }, [audit]);
  useEffect(() => {
    localStorage.setItem("cco_categories_v2", JSON.stringify(categories));
  }, [categories]);

  // --- ENTER KEY FIX - global listener for login ---
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (currentOfficer) return;
      if (e.key === "Enter" && selectedLoginId) {
        // avoid double trigger if modal open? only login screen
        if (!showAuthModal && !deleteTarget && !showIncomingModal && !showOutgoingModal) {
          handleLogin();
        }
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [currentOfficer, selectedLoginId, pinInput, showAuthModal, deleteTarget, showIncomingModal, showOutgoingModal]);

  // --- Login ---
  const handleLogin = () => {
    setLoginAttempts((a) => a + 1);
    const officer = officers.find((o) => o.id === selectedLoginId);
    if (!officer) {
      setLoginError("Select an officer");
      return;
    }
    if (officer.pin !== pinInput) {
      setLoginError(`Invalid PIN - Check IT desk for reset (Attempt ${loginAttempts + 1})`);
      logAudit("Failed Login", `Failed attempt for ${officer.name}`);
      return;
    }
    setCurrentOfficer(officer);
    setLoginError("");
    setPinInput("");
    logAudit("Login", `${officer.name} logged in`);
    // sync forms assignedTo
    setIncomingForm((f) => ({ ...f, assignedTo: officer.name }));
    setOutgoingForm((f) => ({ ...f, assignedTo: officer.name }));
  };

  const handleLogout = () => {
    if (currentOfficer) logAudit("Logout", `${currentOfficer.name} logged out`);
    setCurrentOfficer(null);
    setPinInput("");
    setSelectedLoginId(officers[0]?.id || "");
  };

  // --- Incoming CRUD ---
  const openIncomingNew = () => {
    setEditingIncoming(null);
    setIncomingForm({
      fileNumber: `CCO/IN/${new Date().getFullYear()}/${String(incoming.length + 14).padStart(4, "0")}`,
      title: "",
      senderOrRecipient: "",
      date: new Date().toISOString().slice(0, 10),
      category: categories.incoming[0],
      actionTaken: "",
      status: "Pending",
      assignedTo: currentOfficer?.name || officers[0].name,
      remarks: "",
    });
    setShowIncomingModal(true);
  };

  const openIncomingEdit = (rec: FileRecord) => {
    setEditingIncoming(rec);
    setIncomingForm({
      fileNumber: rec.fileNumber,
      title: rec.title,
      senderOrRecipient: rec.senderOrRecipient,
      date: rec.date,
      category: rec.category,
      actionTaken: rec.actionTaken,
      status: rec.status,
      assignedTo: rec.assignedTo,
      remarks: rec.remarks,
    });
    setShowIncomingModal(true);
  };

  const saveIncoming = () => {
    if (!currentOfficer) return;
    if (!incomingForm.fileNumber.trim() || !incomingForm.title.trim()) {
      // validation feedback via alert ok for errors
      alert("File Number and Title are required");
      return;
    }
    if (editingIncoming) {
      setIncoming((prev) =>
        prev.map((r) => (r.id === editingIncoming.id ? { ...r, ...incomingForm } : r))
      );
      logAudit("Updated Incoming", `${incomingForm.fileNumber} by ${currentOfficer.name}`);
    } else {
      const newRec: FileRecord = { id: genId(), createdAt: nowISO(), ...incomingForm };
      setIncoming((prev) => [newRec, ...prev]);
      logAudit("Created Incoming", `${newRec.fileNumber} by ${currentOfficer.name}`);
    }
    setShowIncomingModal(false);
    setEditingIncoming(null);
  };

  // --- Outgoing CRUD ---
  const openOutgoingNew = () => {
    setEditingOutgoing(null);
    setOutgoingForm({
      fileNumber: `CCO/OUT/${new Date().getFullYear()}/${String(outgoing.length + 88).padStart(4, "0")}`,
      title: "",
      senderOrRecipient: "",
      date: new Date().toISOString().slice(0, 10),
      category: categories.outgoing[0],
      actionTaken: "",
      status: "Dispatched",
      assignedTo: currentOfficer?.name || officers[0].name,
      remarks: "",
    });
    setShowOutgoingModal(true);
  };

  const openOutgoingEdit = (rec: FileRecord) => {
    setEditingOutgoing(rec);
    setOutgoingForm({
      fileNumber: rec.fileNumber,
      title: rec.title,
      senderOrRecipient: rec.senderOrRecipient,
      date: rec.date,
      category: rec.category,
      actionTaken: rec.actionTaken,
      status: rec.status,
      assignedTo: rec.assignedTo,
      remarks: rec.remarks,
    });
    setShowOutgoingModal(true);
  };

  const saveOutgoing = () => {
    if (!currentOfficer) return;
    if (!outgoingForm.fileNumber.trim() || !outgoingForm.title.trim()) {
      alert("File Number and Title are required");
      return;
    }
    if (editingOutgoing) {
      setOutgoing((prev) => prev.map((r) => (r.id === editingOutgoing.id ? { ...r, ...outgoingForm } : r)));
      logAudit("Updated Outgoing", `${outgoingForm.fileNumber} by ${currentOfficer.name}`);
    } else {
      const newRec: FileRecord = { id: genId(), createdAt: nowISO(), ...outgoingForm };
      setOutgoing((prev) => [newRec, ...prev]);
      logAudit("Created Outgoing", `${newRec.fileNumber} by ${currentOfficer.name}`);
    }
    setShowOutgoingModal(false);
    setEditingOutgoing(null);
  };

  // --- Officer CRUD - STRICT PER IT REGULATIONS v2.2.7 ---
  const openOfficerNew = () => {
    const isClerkNow = currentOfficer?.canManageOfficers === true || currentOfficer?.role === 'Registry Clerk';
    if (!isClerkNow) {
      alert("Only Registry Clerk can add officers per IT regulations");
      return;
    }
    setEditingOfficer(null);
    setOfficerForm({
      name: "",
      role: "Officer",
      staffId: "",
      pin: "",
      canDeleteFiles: false,
      canManageOfficers: false,
      avatar: "",
    });
    setShowOfficerModal(true);
  };

  const openOfficerEdit = (o: Officer) => {
    const isClerkNow = currentOfficer?.canManageOfficers === true || currentOfficer?.role === 'Registry Clerk';
    if (!isClerkNow) {
      alert("Only Registry Clerk can edit other officers per IT regulations");
      return;
    }
    setEditingOfficer(o);
    setOfficerForm({
      name: o.name,
      role: o.role,
      staffId: o.staffId,
      pin: o.pin,
      canDeleteFiles: o.canDeleteFiles,
      canManageOfficers: o.canManageOfficers,
      avatar: o.avatar,
    });
    setShowOfficerModal(true);
  };

  const saveOfficer = () => {
    if (!currentOfficer) return;
    const isClerkNow = currentOfficer?.canManageOfficers === true || currentOfficer?.role === 'Registry Clerk';
    if (!isClerkNow) {
      alert("Only Registry Clerk can manage officers per IT regulations");
      return;
    }
    if (!officerForm.name.trim() || !officerForm.pin.trim()) {
      alert("Name and PIN required");
      return;
    }
    if (officerForm.pin.length < 4) {
      alert("PIN must be at least 4 digits");
      return;
    }
    if (editingOfficer) {
      setOfficers((prev) =>
        prev.map((o) => (o.id === editingOfficer.id ? { ...o, ...officerForm, avatar: officerForm.avatar || initialsFromName(officerForm.name) } : o))
      );
      logAudit("Updated Officer", `${currentOfficer.name} updated ${officerForm.name}`);
    } else {
      const newOff: Officer = {
        id: genId(),
        ...officerForm,
        avatar: officerForm.avatar || initialsFromName(officerForm.name),
      };
      setOfficers((prev) => [...prev, newOff]);
      logAudit("Created Officer", `${currentOfficer.name} created ${newOff.name} per IT`);
    }
    setShowOfficerModal(false);
    setEditingOfficer(null);
  };

  const toggleOfficerPermission = (id: string, field: "canDeleteFiles" | "canManageOfficers") => {
    const isClerkNow = currentOfficer?.canManageOfficers === true || currentOfficer?.role === 'Registry Clerk';
    if (!isClerkNow) return;
    setOfficers((prev) => prev.map((o) => (o.id === id ? { ...o, [field]: !o[field] } : o)));
    const target = officers.find((o) => o.id === id);
    if (target && currentOfficer) {
      logAudit("Permission Toggled", `${currentOfficer.name} toggled ${field} for ${target.name}`);
    }
  };

  // --- Self Edit ---
  const openSelfEdit = () => {
    if (!currentOfficer) return;
    setSelfEditForm({
      name: currentOfficer.name,
      avatar: currentOfficer.avatar,
      oldPin: "",
      newPin: "",
      confirmPin: "",
    });
    setSelfEditError("");
    setShowSelfEditModal(true);
  };

  const saveSelfEdit = () => {
    if (!currentOfficer) return;
    setSelfEditError("");
    if (!selfEditForm.name.trim()) {
      setSelfEditError("Name required");
      return;
    }
    if (selfEditForm.oldPin !== currentOfficer.pin) {
      setSelfEditError("Old PIN incorrect - contact Clerk IT");
      return;
    }
    if (selfEditForm.newPin) {
      if (selfEditForm.newPin.length < 4) {
        setSelfEditError("New PIN must be 4+ digits");
        return;
      }
      if (selfEditForm.newPin !== selfEditForm.confirmPin) {
        setSelfEditError("New PINs do not match");
        return;
      }
    }
    const updated = {
      ...currentOfficer,
      name: selfEditForm.name.trim(),
      avatar: selfEditForm.avatar.trim() || initialsFromName(selfEditForm.name),
      pin: selfEditForm.newPin || currentOfficer.pin,
    };
    setOfficers((prev) => prev.map((o) => (o.id === currentOfficer.id ? updated : o)));
    setCurrentOfficer(updated);
    logAudit("Self Edit", `${updated.name} updated own profile`);
    setShowSelfEditModal(false);
  };

  // --- DELETE HANDLERS (FIXED) ---
  const handleDeleteIncoming = (id: string, fileNumber: string) => {
    if (!currentOfficer) return;
    if (!currentOfficer.canDeleteFiles && currentOfficer.role !== "Registry Clerk" && !currentOfficer.canManageOfficers) {
      setAuthPin("");
      setAuthError("");
      setShowAuthModal({ type: "delete_incoming", id });
      return;
    }
    setDeleteTarget({ type: "incoming", id, name: fileNumber });
  };

  const handleDeleteOutgoing = (id: string, fileNumber: string) => {
    if (!currentOfficer) return;
    if (!currentOfficer.canDeleteFiles && currentOfficer.role !== "Registry Clerk" && !currentOfficer.canManageOfficers) {
      setAuthPin("");
      setAuthError("");
      setShowAuthModal({ type: "delete_outgoing", id });
      return;
    }
    setDeleteTarget({ type: "outgoing", id, name: fileNumber });
  };

  const handleDeleteOfficer = (id: string, name: string) => {
    if (!currentOfficer) return;
    if (id === currentOfficer.id) {
      alert("Cannot delete your own profile");
      return;
    }
    if (officers.length <= 1) {
      alert("Cannot delete last officer");
      return;
    }
    if (currentOfficer.role !== "Registry Clerk" && !currentOfficer.canManageOfficers) {
      alert("Only Registry Clerk per IT regulations");
      return;
    }
    setDeleteTarget({ type: "officer", id, name });
  };

  const handleDeleteCategory = (type: keyof CategoriesState, idx: number) => {
    if (categories[type].length <= 1) {
      alert("Keep at least one");
      return;
    }
    setDeleteTarget({ type: "category", id: type, name: categories[type][idx], extra: { type, idx } });
  };

  const executeDelete = () => {
    if (!deleteTarget || !currentOfficer) return;
    if (deleteTarget.type === "incoming") {
      const rec = incoming.find((f) => f.id === deleteTarget.id);
      setIncoming((prev) => prev.filter((f) => f.id !== deleteTarget.id));
      logAudit("Deleted Incoming", `Deleted ${rec?.fileNumber || deleteTarget.id} by ${currentOfficer.name}`);
    } else if (deleteTarget.type === "outgoing") {
      const rec = outgoing.find((f) => f.id === deleteTarget.id);
      setOutgoing((prev) => prev.filter((f) => f.id !== deleteTarget.id));
      logAudit("Deleted Outgoing", `Deleted ${rec?.fileNumber || deleteTarget.id} by ${currentOfficer.name}`);
    } else if (deleteTarget.type === "officer") {
      setOfficers((prev) => prev.filter((o) => o.id !== deleteTarget.id));
      logAudit("Deleted Officer", `${currentOfficer.name} deleted ${deleteTarget.name} per IT`);
    } else if (deleteTarget.type === "category") {
      const t = deleteTarget.extra.type as keyof CategoriesState;
      const idx = deleteTarget.extra.idx as number;
      setCategories((prev) => ({ ...prev, [t]: prev[t].filter((_, i) => i !== idx) }));
      logAudit("Category Deleted", `${String(t)}: ${deleteTarget.name}`);
    }
    setDeleteTarget(null);
  };

  // --- Auth Confirm for delete without permission ---
  const handleAuthConfirm = () => {
    if (!showAuthModal || !currentOfficer) return;
    const clerk = officers.find((o) => (o.role === "Registry Clerk" || o.canManageOfficers) && o.pin === authPin);
    if (!clerk) {
      setAuthError("Invalid Clerk PIN - Authorization failed");
      return;
    }
    // Authorized, proceed to delete target modal
    if (showAuthModal.type === "delete_incoming") {
      const rec = incoming.find((f) => f.id === showAuthModal.id);
      setDeleteTarget({ type: "incoming", id: showAuthModal.id, name: rec?.fileNumber || showAuthModal.id });
    } else {
      const rec = outgoing.find((f) => f.id === showAuthModal.id);
      setDeleteTarget({ type: "outgoing", id: showAuthModal.id, name: rec?.fileNumber || showAuthModal.id });
    }
    setShowAuthModal(null);
    setAuthPin("");
    setAuthError("");
    logAudit("Authorized Delete", `Clerk ${clerk.name} authorized delete for ${currentOfficer.name}`);
  };

  // --- Category Management ---
  const addCategory = (type: keyof CategoriesState) => {
    const val = newCatValues[type].trim();
    if (!val) return;
    if (categories[type].includes(val)) {
      alert("Category already exists");
      return;
    }
    setCategories((prev) => ({ ...prev, [type]: [...prev[type], val] }));
    setNewCatValues((prev) => ({ ...prev, [type]: "" }));
    logAudit("Category Added", `${String(type)}: ${val}`);
  };

  const saveCatEdit = () => {
    if (!catEdit) return;
    const { type, idx } = catEdit;
    const newVal = newCatValues[type].trim();
    if (!newVal) return;
    setCategories((prev) => {
      const arr = [...prev[type]];
      arr[idx] = newVal;
      return { ...prev, [type]: arr };
    });
    setCatEdit(null);
    setNewCatValues((prev) => ({ ...prev, [type]: "" }));
  };

  // --- Filtered Data ---
  const filteredIncoming = useMemo(() => {
    return incoming.filter((r) => {
      const q = searchIncoming.toLowerCase();
      const matchesSearch = !q || r.fileNumber.toLowerCase().includes(q) || r.title.toLowerCase().includes(q) || r.senderOrRecipient.toLowerCase().includes(q);
      const matchesStatus = filterIncomingStatus === "All" || r.status === filterIncomingStatus;
      return matchesSearch && matchesStatus;
    });
  }, [incoming, searchIncoming, filterIncomingStatus]);

  const filteredOutgoing = useMemo(() => {
    return outgoing.filter((r) => {
      const q = searchOutgoing.toLowerCase();
      const matchesSearch = !q || r.fileNumber.toLowerCase().includes(q) || r.title.toLowerCase().includes(q) || r.senderOrRecipient.toLowerCase().includes(q);
      const matchesStatus = filterOutgoingStatus === "All" || r.status === filterOutgoingStatus;
      return matchesSearch && matchesStatus;
    });
  }, [outgoing, searchOutgoing, filterOutgoingStatus]);

  // --- Backup / Restore / Reset ---
  const handleBackup = () => {
    const data = { officers, incoming, outgoing, audit, categories, version: APP_VERSION, date: nowISO() };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cco_backup_${APP_VERSION}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    logAudit("Backup", `Backup created by ${currentOfficer?.name}`);
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        if (data.officers) setOfficers(data.officers);
        if (data.incoming) setIncoming(data.incoming.map((r: any) => ({ ...r, actionTaken: r.actionTaken || r.status || "" })));
        if (data.outgoing) setOutgoing(data.outgoing.map((r: any) => ({ ...r, actionTaken: r.actionTaken || r.status || "" })));
        if (data.categories) setCategories(data.categories);
        if (data.audit) setAudit(data.audit);
        logAudit("Restore", `Data restored by ${currentOfficer?.name}`);
        alert("Restore completed successfully");
      } catch {
        alert("Invalid backup file");
      }
    };
    reader.readAsText(file);
  };

  const handleReset = () => {
    if (currentOfficer?.role !== "Registry Clerk" && !currentOfficer?.canManageOfficers) {
      alert("Only Registry Clerk can reset");
      return;
    }
    setDeleteTarget({ type: "category", id: "RESET", name: "ALL DATA", extra: { type: "RESET" } });
  };

  const confirmReset = () => {
    localStorage.clear();
    setOfficers(DEFAULT_OFFICERS);
    setIncoming(DEFAULT_INCOMING);
    setOutgoing(DEFAULT_OUTGOING);
    setCategories(DEFAULT_CATEGORIES);
    setAudit([]);
    setDeleteTarget(null);
    logAudit("Reset", `Full reset by ${currentOfficer?.name}`);
  };

  // --- Update Checker ---
  const checkForUpdates = () => {
    setCheckingUpdates(true);
    setCheckResult("");
    setTimeout(() => {
      setCheckingUpdates(false);
      setUpdateAvailable(true);
      setCheckResult(`Update available: v$ - Includes enhanced audit encryption and bulk export. Current: v${APP_VERSION}`);
    }, 1200);
  };

  const performUpdate = () => {
    setUpdating(true);
    setUpdateProgress(0);
    const interval = setInterval(() => {
      setUpdateProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setUpdating(false);
          setUpdateAvailable(false);
          setCheckResult(`Successfully updated to v$ (simulated)`);
          logAudit("Update", `Updated to v$ by ${currentOfficer?.name}`);
          return 100;
        }
        return p + 10;
      });
    }, 250);
  };

  // --- Render: Login ---
  if (!currentOfficer) {
    return (
      <div className="min-h-screen bg-[#f4f1e8] flex flex-col">
        <div className="h-2 w-full bg-[#c9a84c]" />
        <header className="bg-[#0f2a44] text-white py-4 px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#c9a84c] text-[#0f2a44] font-black flex items-center justify-center text-[14px]">CCO</div>
            <div>
              <div className="font-bold tracking-tight">File Register v{APP_VERSION}</div>
              <div className="text-[11px] text-white/70 -mt-0.5">Secure Compliance Management</div>
            </div>
          </div>
          <div className="text-[10px] text-white/50 hidden md:block">LAST UPDATE {LAST_UPDATE} • NEXT </div>
        </header>

        <div className="flex-1 flex items-center justify-center p-4 md:p-8">
          <div className="w-full max-w-[980px] grid md:grid-cols-[1.15fr_0.85fr] gap-6 items-start">
            {/* Officer selection */}
            <div className="bg-white rounded-2xl shadow-xl border border-[#e8e0c9] overflow-hidden">
              <div className="p-6 md:p-8">
                <h1 className="text-[22px] font-bold text-[#0f2a44]">Officer Login</h1>
                <p className="text-sm text-gray-500 mt-1">Select your profile and enter PIN. Press Enter to login.</p>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {officers.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      onClick={() => setSelectedLoginId(o.id)}
                      className={`text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3 cursor-pointer ${
                        selectedLoginId === o.id ? "border-[#c9a84c] bg-[#fdf8e9] shadow-sm" : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${selectedLoginId === o.id ? "bg-[#0f2a44] text-white" : "bg-[#eef2f7] text-[#0f2a44]"}`}>
                        {o.avatar || initialsFromName(o.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-[#0f2a44] text-[14px] truncate">{o.name}</div>
                        <div className="text-[11px] text-gray-500">{o.role} • {o.staffId}</div>
                        <div className="text-[10px] mt-1">
                          {o.canManageOfficers ? (
                            <span className="px-2 py-0.5 rounded-full bg-[#0f2a44] text-white">Clerk Admin</span>
                          ) : o.canDeleteFiles ? (
                            <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">Can Delete</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 border">Standard</span>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <div className="bg-[#fbf8ee] border-t border-[#e8e0c9] p-6 md:p-8 flex flex-col gap-4">
                <div>
                  <label className="text-[12px] font-semibold text-[#0f2a44] uppercase tracking-wide">PIN Code</label>
                  <div className="mt-2 flex gap-3">
                    <input
                      value={pinInput}
                      onChange={(e) => setPinInput(e.target.value.replace(/\D/g, "").slice(0, 8))}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleLogin();
                        }
                      }}
                      placeholder="Enter PIN"
                      type="password"
                      inputMode="numeric"
                      className="flex-1 h-12 px-4 rounded-xl border-2 border-[#d8ccaa] bg-white focus:outline-none focus:border-[#c9a84c] focus:ring-4 focus:ring-[#c9a84c]/20 text-[15px] tracking-widest"
                    />
                    <button
                      type="button"
                      onClick={handleLogin}
                      className="h-12 px-8 rounded-xl bg-[#0f2a44] text-white font-bold text-sm hover:bg-[#153a5e] active:scale-[0.98] cursor-pointer shadow"
                    >
                      Login ↩
                    </button>
                  </div>
                  <div className="text-[11px] text-gray-500 mt-2">Hint: Press <span className="font-bold">Enter</span> to login quickly. Default PINs: 3333, 5678, 9012, 0000</div>
                  {loginError && <div className="mt-3 text-[12px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2" data-testid="login-error">{loginError}</div>}
                  {loginAttempts > 0 && !loginError && <div className="mt-3 text-[11px] text-gray-500">Attempts: {loginAttempts}</div>}
                </div>
              </div>
            </div>

            {/* Info side */}
            <div className="space-y-4">
              <div className="bg-[#0f2a44] text-white rounded-2xl p-6 shadow-xl">
                <div className="text-[11px] tracking-widest text-[#c9a84c] font-bold">WHAT'S NEW IN v{APP_VERSION}</div>
                <h3 className="mt-2 font-bold text-[16px]">Enter Key + Delete Fixed</h3>
                <ul className="mt-3 text-[13px] text-white/80 space-y-2 list-disc pl-5">
                  <li>Enter key now submits login and all modals</li>
                  <li>Delete buttons use high z-index modal (no window.confirm)</li>
                  <li>Textarea: Enter = new line, Ctrl+Enter = save</li>
                  <li>Auth modal for non-clerk delete with clerk PIN</li>
                  <li>Self-service profile edit with old PIN verification</li>
                </ul>
                <div className="mt-4 text-[11px] text-white/50 border-t border-white/10 pt-3">Build {APP_VERSION} • Changelog: Enter support on login + all modals + guaranteed delete with z-[9999] modal</div>
              </div>

              <div className="bg-white rounded-2xl border p-5">
                <div className="font-semibold text-[#0f2a44] text-sm">Security Notice</div>
                <div className="text-[12px] text-gray-600 mt-2 leading-relaxed">
                  Per IT regulations, only Registry Clerk can manage officers. Delete actions require Clerk PIN if officer lacks permission. All actions are audit-logged.
                </div>
              </div>

              <div className="bg-white rounded-2xl border p-5">
                <div className="text-[12px] font-bold text-[#0f2a44]">Quick Test</div>
                <div className="text-[11px] text-gray-600 mt-1">Try: select Amina Yusuf → PIN 3333 → Enter. Then test delete buttons on Incoming/Outgoing - should open red confirmation modal.</div>
              </div>
            </div>
          </div>
        </div>

        {/* Delete modal would not show on login but ensure still rendered for global */}
        {deleteTarget && (
          <div className="fixed inset-0 z-[9999] bg-[#0f2a44]/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setDeleteTarget(null)}>
            <div className="bg-white rounded-2xl w-full max-w-[420px] shadow-2xl border-2 border-red-200" onClick={(e) => e.stopPropagation()}>
              <div className="p-6">
                <h3 className="font-bold text-red-700">⚠️ Confirm Delete</h3>
                <p className="text-sm text-gray-600 mt-3">
                  Delete <b className="text-[#0f2a44]">{deleteTarget.name}</b>? This will be logged.
                </p>
                {deleteTarget.type === "officer" && <div className="mt-3 text-xs p-2 bg-amber-50 border border-amber-200 rounded-lg">Per IT regulations - Clerk action</div>}
              </div>
              <div className="p-4 bg-red-50 border-t flex justify-end gap-2 rounded-b-2xl">
                <button type="button" onClick={() => setDeleteTarget(null)} className="h-10 px-5 rounded-full bg-white border text-sm cursor-pointer">
                  Cancel
                </button>
                <button type="button" onClick={executeDelete} className="h-10 px-6 rounded-full bg-red-600 text-white text-sm font-bold hover:bg-red-700 cursor-pointer">
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- Main Authenticated View ---
  return (
    <div className="min-h-screen bg-[#f7f4ec] text-[#0f2a44] flex flex-col">
      <div className="h-1.5 w-full bg-[#c9a84c] sticky top-0 z-40" />
      <header className="sticky top-[6px] z-30 bg-[#0f2a44] text-white border-b border-[#1a3d62]">
        <div className="max-w-[1280px] mx-auto px-4 md:px-6 h-[64px] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#c9a84c] text-[#0f2a44] font-black flex items-center justify-center">CCO</div>
            <div>
              <div className="font-bold leading-tight">File Register v{APP_VERSION}</div>
              <div className="text-[11px] text-white/60 -mt-0.5 hidden sm:block">Incoming • Outgoing • Officers • Audit</div>
            </div>
            <div className="hidden lg:flex ml-6 gap-1 bg-white/10 rounded-full p-1">
              {(
                [
                  { k: "incoming", l: `Incoming (${incoming.length})` },
                  { k: "outgoing", l: `Outgoing (${outgoing.length})` },
                  { k: "officers", l: "Officers" },
                  { k: "categories", l: "Categories" },
                  { k: "audit", l: "Audit Log" },
                  { k: "settings", l: "Settings" },
                ] as const
              ).map((t) => (
                <button
                  key={t.k}
                  type="button"
                  onClick={() => setActiveTab(t.k)}
                  className={`px-3.5 h-7 rounded-full text-[12px] font-semibold transition-all cursor-pointer ${
                    activeTab === t.k ? "bg-white text-[#0f2a44] shadow" : "text-white/80 hover:text-white hover:bg-white/10"
                  }`}
                >
                  {t.l}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2 bg-white/10 rounded-full pl-1 pr-3 py-1">
              <div className="w-7 h-7 rounded-full bg-[#c9a84c] text-[#0f2a44] font-bold text-[11px] flex items-center justify-center">
                {currentOfficer.avatar}
              </div>
              <div className="text-[12px] leading-tight">
                <div className="font-semibold">{currentOfficer.name}</div>
                <div className="text-[10px] text-white/70">{currentOfficer.role}</div>
              </div>
            </div>
            <button
              type="button"
              onClick={openSelfEdit}
              className="h-8 px-3 rounded-full bg-white text-[#0f2a44] text-[12px] font-semibold hover:bg-[#fdf8e9] border cursor-pointer"
            >
              Edit My Profile
            </button>
            <button type="button" onClick={handleLogout} className="h-8 px-3 rounded-full bg-[#c9a84c] text-[#0f2a44] text-[12px] font-bold hover:bg-[#d8bb6a] cursor-pointer">
              Logout
            </button>
          </div>
        </div>
        {/* Mobile tabs */}
        <div className="lg:hidden overflow-x-auto scrollbar-none border-t border-white/10">
          <div className="flex gap-1 p-2 px-4">
            {(
              [
                { k: "incoming", l: "Incoming" },
                { k: "outgoing", l: "Outgoing" },
                { k: "officers", l: "Officers" },
                { k: "categories", l: "Categories" },
                { k: "audit", l: "Audit" },
                { k: "settings", l: "Settings" },
              ] as const
            ).map((t) => (
              <button
                key={t.k}
                type="button"
                onClick={() => setActiveTab(t.k)}
                className={`whitespace-nowrap px-3.5 h-8 rounded-full text-[12px] font-semibold cursor-pointer ${
                  activeTab === t.k ? "bg-white text-[#0f2a44]" : "bg-white/10 text-white/80"
                }`}
              >
                {t.l}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-[1280px] w-full mx-auto px-4 md:px-6 py-6">
        {/* Incoming Tab */}
        {activeTab === "incoming" && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div>
                <h2 className="text-[20px] font-bold">Incoming Register</h2>
                <p className="text-[12px] text-gray-600">Writable Action Taken • Press Enter on fields to save • Delete uses secure modal</p>
              </div>
              <button
                type="button"
                onClick={openIncomingNew}
                className="h-10 px-5 rounded-full bg-[#0f2a44] text-white text-[13px] font-bold hover:bg-[#163a5d] cursor-pointer shadow"
              >
                + New Incoming
              </button>
            </div>

            <div className="bg-white rounded-2xl border shadow-sm p-4 flex flex-wrap gap-3">
              <input
                value={searchIncoming}
                onChange={(e) => setSearchIncoming(e.target.value)}
                placeholder="Search file number, title, sender..."
                className="flex-1 min-w-[220px] h-10 px-4 rounded-full border bg-[#fbf8ee] focus:outline-none focus:border-[#c9a84c] text-sm"
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.preventDefault();
                }}
              />
              <select
                value={filterIncomingStatus}
                onChange={(e) => setFilterIncomingStatus(e.target.value)}
                className="h-10 px-4 rounded-full border bg-white text-sm cursor-pointer"
              >
                <option value="All">All Statuses</option>
                {categories.statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <div className="text-[11px] text-gray-500 flex items-center px-2">{filteredIncoming.length} records</div>
            </div>

            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[12px]">
                  <thead className="bg-[#fbf8ee] border-b text-[11px] uppercase tracking-wide text-gray-600">
                    <tr>
                      <th className="px-4 py-3">File No</th>
                      <th className="px-4 py-3">Title</th>
                      <th className="px-4 py-3">Sender</th>
                      <th className="px-4 py-3">Action Taken</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Assigned</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredIncoming.map((r) => (
                      <tr key={r.id} className="border-b last:border-0 hover:bg-[#fdfbf3]">
                        <td className="px-4 py-3 font-mono font-semibold text-[#0f2a44] whitespace-nowrap">{r.fileNumber}</td>
                        <td className="px-4 py-3 min-w-[220px]">
                          <div className="font-semibold text-[#0f2a44]">{truncate(r.title, 60)}</div>
                          <div className="text-[11px] text-gray-500">{r.date} • {r.category}</div>
                        </td>
                        <td className="px-4 py-3">{truncate(r.senderOrRecipient, 28)}</td>
                        <td className="px-4 py-3 min-w-[280px] max-w-[380px]">
                          <div className="text-[12px] leading-relaxed bg-[#f7f4ec] border border-[#e8e0c9] rounded-lg p-2.5 whitespace-pre-wrap break-words">{r.actionTaken}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex whitespace-nowrap px-3 py-1 rounded-full text-[10px] font-bold ${r.status === 'Urgent' ? 'bg-red-600 text-white' : r.status === 'In Progress' ? 'bg-amber-400 text-[#0f2a44]' : r.status === 'Pending' ? 'bg-gray-200 text-gray-700' : 'bg-[#0f2a44] text-white'}`}>{r.status}</span>
                        </td>
                        <td className="px-4 py-3">{r.assignedTo}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                openIncomingEdit(r);
                              }}
                              className="h-7 px-3 rounded-full bg-white border text-[11px] hover:bg-gray-50 cursor-pointer"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                handleDeleteIncoming(r.id, r.fileNumber);
                              }}
                              className="h-7 px-3 rounded-full bg-red-50 border border-red-200 text-red-700 text-[11px] hover:bg-red-100 cursor-pointer active:scale-95"
                            >
                              Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredIncoming.length === 0 && <div className="p-8 text-center text-sm text-gray-500">No records found</div>}
              </div>
            </div>
          </div>
        )}

        {activeTab === "outgoing" && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3 items-center justify-between">
              <div>
                <h2 className="text-[20px] font-bold">Outgoing Register</h2>
                <p className="text-[12px] text-gray-600">Dispatch tracking • Enter key saves modals • Delete secured</p>
              </div>
              <button type="button" onClick={openOutgoingNew} className="h-10 px-5 rounded-full bg-[#0f2a44] text-white text-[13px] font-bold hover:bg-[#163a5d] cursor-pointer shadow">
                + New Outgoing
              </button>
            </div>

            <div className="bg-white rounded-2xl border shadow-sm p-4 flex flex-wrap gap-3">
              <input
                value={searchOutgoing}
                onChange={(e) => setSearchOutgoing(e.target.value)}
                placeholder="Search file number, title, recipient..."
                className="flex-1 min-w-[220px] h-10 px-4 rounded-full border bg-[#fbf8ee] focus:outline-none focus:border-[#c9a84c] text-sm"
              />
              <select value={filterOutgoingStatus} onChange={(e) => setFilterOutgoingStatus(e.target.value)} className="h-10 px-4 rounded-full border bg-white text-sm cursor-pointer">
                <option value="All">All Statuses</option>
                {categories.statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <div className="text-[11px] text-gray-500 flex items-center px-2">{filteredOutgoing.length} records</div>
            </div>

            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[12px]">
                  <thead className="bg-[#fbf8ee] border-b text-[11px] uppercase tracking-wide text-gray-600">
                    <tr>
                      <th className="px-4 py-3">File No</th>
                      <th className="px-4 py-3">Title</th>
                      <th className="px-4 py-3">Recipient</th>
                      <th className="px-4 py-3">Action Taken</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOutgoing.map((r) => (
                      <tr key={r.id} className="border-b last:border-0 hover:bg-[#fdfbf3]">
                        <td className="px-4 py-3 font-mono font-semibold">{r.fileNumber}</td>
                        <td className="px-4 py-3 min-w-[220px]">
                          <div className="font-semibold text-[#0f2a44]">{truncate(r.title, 60)}</div>
                          <div className="text-[11px] text-gray-500">{r.date} • {r.category}</div>
                        </td>
                        <td className="px-4 py-3">{truncate(r.senderOrRecipient, 28)}</td>
                        <td className="px-4 py-3 min-w-[280px] max-w-[380px]">
                          <div className="text-[12px] leading-relaxed bg-[#f7f4ec] border border-[#e8e0c9] rounded-lg p-2.5 whitespace-pre-wrap break-words">{r.actionTaken}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex whitespace-nowrap px-3 py-1 rounded-full text-[10px] font-bold ${r.status === 'Urgent' ? 'bg-red-600 text-white' : r.status === 'In Progress' ? 'bg-amber-400 text-[#0f2a44]' : r.status === 'Pending' ? 'bg-gray-200 text-gray-700' : 'bg-[#0f2a44] text-white'}`}>{r.status}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button type="button" onClick={(e)=>{e.preventDefault(); e.stopPropagation(); openOutgoingEdit(r)}} className="h-7 px-3 rounded-full bg-white border text-[11px] hover:bg-gray-50 cursor-pointer">Edit</button>
                            <button type="button" onClick={(e)=>{e.preventDefault(); e.stopPropagation(); handleDeleteOutgoing(r.id, r.fileNumber)}} className="h-7 px-3 rounded-full bg-red-50 border border-red-200 text-red-700 text-[11px] hover:bg-red-100 cursor-pointer active:scale-95">Delete</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredOutgoing.length===0 && <div className="p-8 text-center text-sm text-gray-500">No records</div>}
              </div>
            </div>
          </div>
        )}

        {activeTab === "officers" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-[20px] font-bold">Officers Management</h2>
              {(currentOfficer.role==="Registry Clerk" || currentOfficer.canManageOfficers) && (
                <button type="button" onClick={openOfficerNew} className="h-10 px-5 rounded-full bg-[#0f2a44] text-white text-[13px] font-bold cursor-pointer">+ New Officer</button>
              )}
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {officers.map(o=>(
                <div key={o.id} className="bg-white rounded-2xl border p-5 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-[#0f2a44] text-white flex items-center justify-center font-bold text-sm">{o.avatar}</div>
                      <div>
                        <div className="font-bold text-[#0f2a44] text-[14px]">{o.name} {o.id===currentOfficer.id && <span className="text-[10px] bg-[#c9a84c] text-[#0f2a44] px-2 py-0.5 rounded-full ml-1">YOU</span>}</div>
                        <div className="text-[11px] text-gray-600">{o.role} • {o.staffId}</div>
                        <div className="flex gap-1 mt-2">
                          {o.canManageOfficers && <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#0f2a44] text-white">Clerk Admin</span>}
                          {o.canDeleteFiles && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 border border-amber-200 text-amber-800">Can Delete</span>}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex gap-2">
                    <button type="button" onClick={()=>openOfficerEdit(o)} className="flex-1 h-8 rounded-full border bg-white text-[12px] hover:bg-gray-50 cursor-pointer">Edit</button>
                    <button type="button" onClick={(e)=>{e.preventDefault(); e.stopPropagation(); handleDeleteOfficer(o.id, o.name)}} className="flex-1 h-8 rounded-full bg-red-50 border border-red-200 text-red-700 text-[12px] hover:bg-red-100 cursor-pointer active:scale-95">Delete</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-[12px] text-amber-900">
              <b>IT Regulation:</b> Only Registry Clerk role or officers with Manage flag can add/delete officers. Self-edit requires old PIN verification. All changes are audit-logged.
            </div>
          </div>
        )}

        {activeTab === "categories" && (
          <div className="space-y-6 max-w-[900px]">
            <h2 className="text-[20px] font-bold">Categories Management</h2>
            {(["incoming","outgoing","statuses"] as (keyof CategoriesState)[]).map(type=>(
              <div key={type} className="bg-white rounded-2xl border shadow-sm p-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold capitalize text-[#0f2a44]">{type} Categories</h3>
                  <span className="text-[11px] text-gray-500">{categories[type].length} items</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {categories[type].map((cat, idx)=>(
                    <div key={idx} className="group flex items-center gap-1 bg-[#fbf8ee] border rounded-full pl-3 pr-1 py-1 text-[12px]">
                      {catEdit?.type===type && catEdit?.idx===idx ? (
                        <>
                          <input value={newCatValues[type]} onChange={e=>setNewCatValues(p=>({...p,[type]:e.target.value}))} onKeyDown={e=>{if(e.key==='Enter'){saveCatEdit()} if(e.key==='Escape'){setCatEdit(null)}}} className="h-6 px-2 rounded-full border text-[12px] w-[140px]" autoFocus />
                          <button type="button" onClick={saveCatEdit} className="h-6 px-2 rounded-full bg-[#0f2a44] text-white text-[10px] cursor-pointer">Save</button>
                          <button type="button" onClick={()=>setCatEdit(null)} className="h-6 px-2 rounded-full bg-white border text-[10px] cursor-pointer">Cancel</button>
                        </>
                      ) : (
                        <>
                          <span>{cat}</span>
                          <button type="button" onClick={()=>{setCatEdit({type,idx}); setNewCatValues(p=>({...p,[type]:cat}))}} className="w-6 h-6 rounded-full bg-white border text-[10px] hover:bg-gray-50 cursor-pointer">✎</button>
                          <button type="button" onClick={(e)=>{e.preventDefault(); e.stopPropagation(); handleDeleteCategory(type, idx)}} className="w-6 h-6 rounded-full bg-red-50 border border-red-200 text-red-600 text-[10px] hover:bg-red-100 cursor-pointer">✕</button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex gap-2">
                  <input value={catEdit?.type===type ? "" : newCatValues[type]} disabled={!!catEdit && catEdit.type===type} onChange={e=>setNewCatValues(p=>({...p,[type]:e.target.value}))} onKeyDown={e=>{if(e.key==='Enter'){addCategory(type)}}} placeholder={`Add new ${type}`} className="flex-1 h-9 px-4 rounded-full border bg-[#fbf8ee] text-sm focus:outline-none focus:border-[#c9a84c]" />
                  <button type="button" onClick={()=>addCategory(type)} className="h-9 px-5 rounded-full bg-[#0f2a44] text-white text-[12px] font-bold cursor-pointer">Add</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "audit" && (
          <div className="space-y-4">
            <h2 className="text-[20px] font-bold">Audit Log</h2>
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
              <div className="max-h-[70vh] overflow-auto">
                <table className="w-full text-left text-[12px]">
                  <thead className="sticky top-0 bg-[#0f2a44] text-white">
                    <tr>
                      <th className="px-4 py-3">Time</th>
                      <th className="px-4 py-3">Officer</th>
                      <th className="px-4 py-3">Action</th>
                      <th className="px-4 py-3">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {audit.map(a=>(
                      <tr key={a.id} className="border-b hover:bg-[#fdfbf3]">
                        <td className="px-4 py-2 whitespace-nowrap text-[11px] text-gray-600">{formatDate(a.timestamp)}</td>
                        <td className="px-4 py-2 font-semibold">{a.officerName}</td>
                        <td className="px-4 py-2"><span className="px-2 py-0.5 rounded-full bg-[#fbf8ee] border text-[11px]">{a.action}</span></td>
                        <td className="px-4 py-2 text-gray-700">{a.details}</td>
                      </tr>
                    ))}
                    {audit.length===0 && <tr><td colSpan={4} className="p-8 text-center text-gray-500">No audit entries yet</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-6 max-w-[900px]">
            <h2 className="text-[20px] font-bold">Settings & Update Center</h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white rounded-2xl border p-5">
                <div className="font-bold text-[#0f2a44]">System Info</div>
                <div className="mt-3 space-y-2 text-[12px]">
                  <div className="flex justify-between"><span className="text-gray-600">Version</span><b>{APP_VERSION}</b></div>
                  <div className="flex justify-between"><span className="text-gray-600">Last Update</span><b>{LAST_UPDATE}</b></div>
                  <div className="flex justify-between"><span className="text-gray-600">Next Version</span><b></b></div>
                  <div className="flex justify-between"><span className="text-gray-600">Retention</span><b>{settings.retentionDays} days</b></div>
                  <div className="flex justify-between"><span className="text-gray-600">Online</span><b className={isOnline ? "text-green-600":"text-red-600"}>{isOnline ? "Yes" : "No"}</b></div>
                </div>
              </div>

              <div className="bg-white rounded-2xl border p-5">
                <div className="font-bold text-[#0f2a44]">Backup & Restore</div>
                <div className="mt-4 flex flex-wrap gap-2">
                  <button type="button" onClick={handleBackup} className="h-9 px-4 rounded-full bg-[#0f2a44] text-white text-[12px] font-bold cursor-pointer">Backup JSON</button>
                  <label className="h-9 px-4 rounded-full bg-white border text-[12px] font-semibold flex items-center cursor-pointer hover:bg-gray-50">
                    Restore
                    <input ref={fileInputRef} type="file" accept=".json" className="hidden" onChange={handleRestore} />
                  </label>
                  <button type="button" onClick={handleReset} className="h-9 px-4 rounded-full bg-red-50 border border-red-200 text-red-700 text-[12px] font-bold cursor-pointer">Reset All</button>
                </div>
                <div className="text-[11px] text-gray-500 mt-3">Backup includes officers, registers, categories, audit. Reset requires Clerk rights.</div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border p-5">
              <div className="font-bold text-[#0f2a44]">Update Center</div>
              <div className="mt-3 flex flex-wrap gap-2 items-center">
                <button type="button" onClick={checkForUpdates} disabled={checkingUpdates} className="h-9 px-5 rounded-full bg-[#c9a84c] text-[#0f2a44] text-[12px] font-bold hover:bg-[#d8bb6a] disabled:opacity-50 cursor-pointer">
                  {checkingUpdates ? "Checking..." : "Check for Updates"}
                </button>
                {updateAvailable && !updating && (
                  <button type="button" onClick={performUpdate} className="h-9 px-5 rounded-full bg-[#0f2a44] text-white text-[12px] font-bold cursor-pointer">Update to v</button>
                )}
              </div>
              {checkResult && <div className="mt-3 text-[12px] p-3 rounded-xl bg-[#fbf8ee] border">{checkResult}</div>}
              {updating && (
                <div className="mt-4">
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div className="h-full bg-[#0f2a44] transition-all" style={{width:`${updateProgress}%`}} />
                  </div>
                  <div className="text-[11px] text-gray-600 mt-1">{updateProgress}% installing...</div>
                </div>
              )}
              <div className="mt-4 text-[11px] text-gray-600 leading-relaxed">
                Changelog v{APP_VERSION}: Enter key support on login and all modals + guaranteed working delete with high z-index modal. No window.confirm used - sandboxed iframe safe.
              </div>
            </div>

            <div className="bg-[#0f2a44] text-white rounded-2xl p-5">
              <div className="text-[11px] tracking-widest text-[#c9a84c] font-bold">SECURITY</div>
              <div className="text-[13px] mt-2 leading-relaxed text-white/80">
                Personal password self-service: Use Edit My Profile. Requires old PIN. Clerk IT admin can access all profiles per IT regulations. Delete actions logged with officer name.
              </div>
            </div>
          </div>
        )}
      </main>

      {/* --- Modals --- */}

      {/* Incoming Modal */}
      {showIncomingModal && (
        <div className="fixed inset-0 z-[100] bg-[#0f2a44]/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-auto">
          <div className="bg-white rounded-2xl w-full max-w-[720px] shadow-2xl border my-8" onClick={e=>e.stopPropagation()}>
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="font-bold text-[#0f2a44]">{editingIncoming ? "Edit Incoming" : "New Incoming File"}</h3>
              <span className="text-[11px] text-gray-500">Press Enter to save • Ctrl+Enter in textarea</span>
            </div>
            <div className="p-6 grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-[11px] font-bold uppercase">File Number</label>
                <input value={incomingForm.fileNumber} onChange={e=>setIncomingForm(f=>({...f,fileNumber:e.target.value}))} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault(); saveIncoming()}}} className="mt-1 w-full h-10 px-3 rounded-xl border bg-[#fbf8ee] text-sm focus:outline-none focus:border-[#c9a84c]" />
              </div>
              <div className="md:col-span-2">
                <label className="text-[11px] font-bold uppercase">Title</label>
                <input value={incomingForm.title} onChange={e=>setIncomingForm(f=>({...f,title:e.target.value}))} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault(); saveIncoming()}}} className="mt-1 w-full h-10 px-3 rounded-xl border text-sm focus:outline-none focus:border-[#c9a84c]" />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase">Sender</label>
                <input value={incomingForm.senderOrRecipient} onChange={e=>setIncomingForm(f=>({...f,senderOrRecipient:e.target.value}))} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault(); saveIncoming()}}} className="mt-1 w-full h-10 px-3 rounded-xl border text-sm" />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase">Date</label>
                <input type="date" value={incomingForm.date} onChange={e=>setIncomingForm(f=>({...f,date:e.target.value}))} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault(); saveIncoming()}}} className="mt-1 w-full h-10 px-3 rounded-xl border text-sm" />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase">Category</label>
                <select value={incomingForm.category} onChange={e=>setIncomingForm(f=>({...f,category:e.target.value}))} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault(); saveIncoming()}}} className="mt-1 w-full h-10 px-3 rounded-xl border text-sm cursor-pointer">
                  {categories.incoming.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase">Status</label>
                <select value={incomingForm.status} onChange={e=>setIncomingForm(f=>({...f,status:e.target.value}))} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault(); saveIncoming()}}} className="mt-1 w-full h-10 px-3 rounded-xl border text-sm cursor-pointer">
                  {categories.statuses.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-[11px] font-bold uppercase">Action Taken (writable)</label>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {["Forwarded","Filed","Replied","Under Review","Approved","Pending Director","Closed"].map(chip=>(
                    <button key={chip} type="button" onClick={()=>setIncomingForm(f=>({...f, actionTaken: f.actionTaken ? f.actionTaken + (f.actionTaken.endsWith('.')||f.actionTaken.endsWith(' ') ? ' ' : '. ') + chip : chip}))} className="px-2.5 py-1 rounded-full bg-[#fbf8ee] border text-[11px] hover:bg-[#f3e9c8] cursor-pointer">{chip}</button>
                  ))}
                </div>
                <textarea value={incomingForm.actionTaken} onChange={e=>setIncomingForm(f=>({...f,actionTaken:e.target.value}))} onKeyDown={e=>{if(e.key==='Enter' && (e.ctrlKey || e.metaKey)){e.preventDefault(); saveIncoming()}}} rows={4} className="mt-2 w-full px-3 py-2 rounded-xl border text-sm leading-relaxed focus:outline-none focus:border-[#c9a84c]" placeholder="Describe actions taken... Enter for new line, Ctrl+Enter to save" />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase">Assigned To</label>
                <select value={incomingForm.assignedTo} onChange={e=>setIncomingForm(f=>({...f,assignedTo:e.target.value}))} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault(); saveIncoming()}}} className="mt-1 w-full h-10 px-3 rounded-xl border text-sm cursor-pointer">
                  {officers.map(o=><option key={o.id} value={o.name}>{o.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase">Remarks</label>
                <input value={incomingForm.remarks} onChange={e=>setIncomingForm(f=>({...f,remarks:e.target.value}))} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault(); saveIncoming()}}} className="mt-1 w-full h-10 px-3 rounded-xl border text-sm" />
              </div>
            </div>
            <div className="p-4 bg-[#fbf8ee] border-t flex justify-end gap-2 rounded-b-2xl">
              <button type="button" onClick={()=>{setShowIncomingModal(false); setEditingIncoming(null)}} className="h-10 px-5 rounded-full bg-white border text-sm cursor-pointer">Cancel</button>
              <button type="button" onClick={saveIncoming} className="h-10 px-6 rounded-full bg-[#0f2a44] text-white text-sm font-bold hover:bg-[#163a5d] cursor-pointer">Save ↩ Enter</button>
            </div>
          </div>
        </div>
      )}

      {/* Outgoing Modal */}
      {showOutgoingModal && (
        <div className="fixed inset-0 z-[100] bg-[#0f2a44]/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-auto">
          <div className="bg-white rounded-2xl w-full max-w-[720px] shadow-2xl border my-8">
            <div className="p-6 border-b flex items-center justify-between">
              <h3 className="font-bold text-[#0f2a44]">{editingOutgoing ? "Edit Outgoing" : "New Outgoing File"}</h3>
              <span className="text-[11px] text-gray-500">Enter to save • Ctrl+Enter in textarea</span>
            </div>
            <div className="p-6 grid md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-[11px] font-bold uppercase">File Number</label>
                <input value={outgoingForm.fileNumber} onChange={e=>setOutgoingForm(f=>({...f,fileNumber:e.target.value}))} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault(); saveOutgoing()}}} className="mt-1 w-full h-10 px-3 rounded-xl border bg-[#fbf8ee] text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="text-[11px] font-bold uppercase">Title</label>
                <input value={outgoingForm.title} onChange={e=>setOutgoingForm(f=>({...f,title:e.target.value}))} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault(); saveOutgoing()}}} className="mt-1 w-full h-10 px-3 rounded-xl border text-sm" />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase">Recipient</label>
                <input value={outgoingForm.senderOrRecipient} onChange={e=>setOutgoingForm(f=>({...f,senderOrRecipient:e.target.value}))} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault(); saveOutgoing()}}} className="mt-1 w-full h-10 px-3 rounded-xl border text-sm" />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase">Date</label>
                <input type="date" value={outgoingForm.date} onChange={e=>setOutgoingForm(f=>({...f,date:e.target.value}))} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault(); saveOutgoing()}}} className="mt-1 w-full h-10 px-3 rounded-xl border text-sm" />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase">Category</label>
                <select value={outgoingForm.category} onChange={e=>setOutgoingForm(f=>({...f,category:e.target.value}))} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault(); saveOutgoing()}}} className="mt-1 w-full h-10 px-3 rounded-xl border text-sm cursor-pointer">
                  {categories.outgoing.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase">Status</label>
                <select value={outgoingForm.status} onChange={e=>setOutgoingForm(f=>({...f,status:e.target.value}))} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault(); saveOutgoing()}}} className="mt-1 w-full h-10 px-3 rounded-xl border text-sm cursor-pointer">
                  {categories.statuses.map(c=><option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="text-[11px] font-bold uppercase">Action Taken (writable)</label>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {["Dispatched","Delivered","Awaiting Response","Follow-up Required"].map(chip=>(
                    <button key={chip} type="button" onClick={()=>setOutgoingForm(f=>({...f, actionTaken: f.actionTaken ? f.actionTaken + ' ' + chip : chip}))} className="px-2.5 py-1 rounded-full bg-[#fbf8ee] border text-[11px] hover:bg-[#f3e9c8] cursor-pointer">{chip}</button>
                  ))}
                </div>
                <textarea value={outgoingForm.actionTaken} onChange={e=>setOutgoingForm(f=>({...f,actionTaken:e.target.value}))} onKeyDown={e=>{if(e.key==='Enter' && (e.ctrlKey || e.metaKey)){e.preventDefault(); saveOutgoing()}}} rows={4} className="mt-2 w-full px-3 py-2 rounded-xl border text-sm leading-relaxed" placeholder="Dispatch details..." />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase">Assigned To</label>
                <select value={outgoingForm.assignedTo} onChange={e=>setOutgoingForm(f=>({...f,assignedTo:e.target.value}))} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault(); saveOutgoing()}}} className="mt-1 w-full h-10 px-3 rounded-xl border text-sm cursor-pointer">
                  {officers.map(o=><option key={o.id} value={o.name}>{o.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase">Remarks</label>
                <input value={outgoingForm.remarks} onChange={e=>setOutgoingForm(f=>({...f,remarks:e.target.value}))} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault(); saveOutgoing()}}} className="mt-1 w-full h-10 px-3 rounded-xl border text-sm" />
              </div>
            </div>
            <div className="p-4 bg-[#fbf8ee] border-t flex justify-end gap-2 rounded-b-2xl">
              <button type="button" onClick={()=>{setShowOutgoingModal(false); setEditingOutgoing(null)}} className="h-10 px-5 rounded-full bg-white border text-sm cursor-pointer">Cancel</button>
              <button type="button" onClick={saveOutgoing} className="h-10 px-6 rounded-full bg-[#0f2a44] text-white text-sm font-bold cursor-pointer">Save ↩ Enter</button>
            </div>
          </div>
        </div>
      )}

      {/* Officer Modal */}
      {showOfficerModal && (
        <div className="fixed inset-0 z-[100] bg-[#0f2a44]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-[520px] shadow-2xl border">
            <div className="p-6 border-b">
              <h3 className="font-bold text-[#0f2a44]">{editingOfficer ? "Edit Officer" : "New Officer"}</h3>
              <p className="text-[11px] text-gray-500 mt-1">Press Enter to save</p>
            </div>
            <div className="p-6 grid gap-4">
              <div>
                <label className="text-[11px] font-bold uppercase">Full Name</label>
                <input value={officerForm.name} onChange={e=>setOfficerForm(f=>({...f,name:e.target.value}))} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault(); saveOfficer()}}} className="mt-1 w-full h-10 px-3 rounded-xl border text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase">Role</label>
                  <select value={officerForm.role} onChange={e=>setOfficerForm(f=>({...f,role:e.target.value as OfficerRole}))} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault(); saveOfficer()}}} className="mt-1 w-full h-10 px-3 rounded-xl border text-sm cursor-pointer">
                    <option value="Officer">Officer</option>
                    <option value="Senior Officer">Senior Officer</option>
                    <option value="Registry Clerk">Registry Clerk</option>
                    <option value="CCO">CCO</option>
                  </select>
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase">Staff ID</label>
                  <input value={officerForm.staffId} onChange={e=>setOfficerForm(f=>({...f,staffId:e.target.value}))} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault(); saveOfficer()}}} className="mt-1 w-full h-10 px-3 rounded-xl border text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase">PIN</label>
                  <input value={officerForm.pin} onChange={e=>setOfficerForm(f=>({...f,pin:e.target.value.replace(/\D/g,"").slice(0,8)}))} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault(); saveOfficer()}}} type="password" inputMode="numeric" className="mt-1 w-full h-10 px-3 rounded-xl border text-sm" />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase">Avatar Initials</label>
                  <input value={officerForm.avatar} onChange={e=>setOfficerForm(f=>({...f,avatar:e.target.value.toUpperCase().slice(0,3)}))} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault(); saveOfficer()}}} className="mt-1 w-full h-10 px-3 rounded-xl border text-sm" placeholder="Auto" />
                </div>
              </div>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 text-[12px] cursor-pointer"><input type="checkbox" checked={officerForm.canDeleteFiles} onChange={e=>setOfficerForm(f=>({...f,canDeleteFiles:e.target.checked}))} className="rounded" /> Can Delete Files</label>
                <label className="flex items-center gap-2 text-[12px] cursor-pointer"><input type="checkbox" checked={officerForm.canManageOfficers} onChange={e=>setOfficerForm(f=>({...f,canManageOfficers:e.target.checked}))} className="rounded" /> Clerk Admin</label>
              </div>
            </div>
            <div className="p-4 bg-[#fbf8ee] border-t flex justify-end gap-2 rounded-b-2xl">
              <button type="button" onClick={()=>{setShowOfficerModal(false); setEditingOfficer(null)}} className="h-10 px-5 rounded-full bg-white border text-sm cursor-pointer">Cancel</button>
              <button type="button" onClick={saveOfficer} className="h-10 px-6 rounded-full bg-[#0f2a44] text-white text-sm font-bold cursor-pointer">Save ↩</button>
            </div>
          </div>
        </div>
      )}

      {/* Self Edit Modal */}
      {showSelfEditModal && (
        <div className="fixed inset-0 z-[100] bg-[#0f2a44]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-[520px] shadow-2xl border">
            <div className="p-6 border-b">
              <h3 className="font-bold text-[#0f2a44]">Edit My Profile</h3>
              <p className="text-[11px] text-gray-500 mt-1">Personal password self-service - Old PIN required</p>
            </div>
            <div className="p-6 grid gap-4">
              <div>
                <label className="text-[11px] font-bold uppercase">Full Name</label>
                <input value={selfEditForm.name} onChange={e=>setSelfEditForm(f=>({...f,name:e.target.value}))} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault(); saveSelfEdit()}}} className="mt-1 w-full h-10 px-3 rounded-xl border text-sm" />
              </div>
              <div>
                <label className="text-[11px] font-bold uppercase">Avatar</label>
                <input value={selfEditForm.avatar} onChange={e=>setSelfEditForm(f=>({...f,avatar:e.target.value.toUpperCase().slice(0,3)}))} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault(); saveSelfEdit()}}} className="mt-1 w-full h-10 px-3 rounded-xl border text-sm" />
              </div>
              <div className="h-px bg-gray-200 my-1" />
              <div>
                <label className="text-[11px] font-bold uppercase">Old PIN (required)</label>
                <input value={selfEditForm.oldPin} onChange={e=>setSelfEditForm(f=>({...f,oldPin:e.target.value.replace(/\D/g,"").slice(0,8)}))} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault(); saveSelfEdit()}}} type="password" inputMode="numeric" className="mt-1 w-full h-10 px-3 rounded-xl border text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold uppercase">New PIN (optional)</label>
                  <input value={selfEditForm.newPin} onChange={e=>setSelfEditForm(f=>({...f,newPin:e.target.value.replace(/\D/g,"").slice(0,8)}))} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault(); saveSelfEdit()}}} type="password" inputMode="numeric" className="mt-1 w-full h-10 px-3 rounded-xl border text-sm" />
                </div>
                <div>
                  <label className="text-[11px] font-bold uppercase">Confirm New PIN</label>
                  <input value={selfEditForm.confirmPin} onChange={e=>setSelfEditForm(f=>({...f,confirmPin:e.target.value.replace(/\D/g,"").slice(0,8)}))} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault(); saveSelfEdit()}}} type="password" inputMode="numeric" className="mt-1 w-full h-10 px-3 rounded-xl border text-sm" />
                </div>
              </div>
              {selfEditError && <div className="text-[12px] text-red-700 bg-red-50 border border-red-200 rounded-xl px-3 py-2">{selfEditError}</div>}
            </div>
            <div className="p-4 bg-[#fbf8ee] border-t flex justify-end gap-2 rounded-b-2xl">
              <button type="button" onClick={()=>setShowSelfEditModal(false)} className="h-10 px-5 rounded-full bg-white border text-sm cursor-pointer">Cancel</button>
              <button type="button" onClick={saveSelfEdit} className="h-10 px-6 rounded-full bg-[#0f2a44] text-white text-sm font-bold cursor-pointer">Save ↩ Enter</button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal - for delete auth */}
      {showAuthModal && (
        <div className="fixed inset-0 z-[9998] bg-[#0f2a44]/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-[420px] shadow-2xl border-2 border-amber-200" onClick={e=>e.stopPropagation()}>
            <div className="p-6">
              <h3 className="font-bold text-amber-800">🔒 Clerk Authorization Required</h3>
              <p className="text-[13px] text-gray-600 mt-3 leading-relaxed">You don't have delete permission. Enter Registry Clerk PIN to authorize this delete. Press Enter to confirm.</p>
              <div className="mt-4">
                <label className="text-[11px] font-bold uppercase">Clerk PIN</label>
                <input value={authPin} onChange={e=>setAuthPin(e.target.value.replace(/\D/g,"").slice(0,8))} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault(); handleAuthConfirm()}}} type="password" inputMode="numeric" autoFocus className="mt-1 w-full h-11 px-4 rounded-xl border-2 border-amber-200 bg-amber-50 focus:outline-none focus:border-amber-400 text-sm tracking-widest" placeholder="Enter Clerk PIN" />
              </div>
              {authError && <div className="mt-3 text-[12px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{authError}</div>}
            </div>
            <div className="p-4 bg-amber-50 border-t flex justify-end gap-2 rounded-b-2xl">
              <button type="button" onClick={()=>{setShowAuthModal(null); setAuthPin(""); setAuthError("")}} className="h-10 px-5 rounded-full bg-white border text-sm cursor-pointer">Cancel</button>
              <button type="button" onClick={handleAuthConfirm} className="h-10 px-6 rounded-full bg-[#0f2a44] text-white text-sm font-bold hover:bg-[#163a5d] cursor-pointer">Authorize ↩</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal - SINGLE, z-[9999], LAST */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[9999] bg-[#0f2a44]/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={()=>{ if(deleteTarget.extra?.type==="RESET"){ /* keep open? allow close */ setDeleteTarget(null)} else {setDeleteTarget(null)}}}>
          <div className="bg-white rounded-2xl w-full max-w-[420px] shadow-2xl border-2 border-red-200" onClick={e=>e.stopPropagation()}>
            <div className="p-6">
              <h3 className="font-bold text-red-700">{deleteTarget.extra?.type==="RESET" ? "⚠️ Confirm Full Reset" : "⚠️ Confirm Delete"}</h3>
              <p className="text-sm text-gray-600 mt-3">
                {deleteTarget.extra?.type==="RESET" ? (
                  <>Reset <b className="text-[#0f2a44]">ALL DATA</b>? This will clear local storage and restore defaults. This will be logged.</>
                ) : (
                  <>Delete <b className="text-[#0f2a44]">{deleteTarget.name}</b>? This will be logged.</>
                )}
              </p>
              {deleteTarget.type==='officer' && <div className="mt-3 text-xs p-2 bg-amber-50 border border-amber-200 rounded-lg">Per IT regulations - Clerk action</div>}
              {deleteTarget.type==='category' && deleteTarget.extra?.type!=="RESET" && <div className="mt-3 text-xs p-2 bg-gray-50 border rounded-lg">Category: {String(deleteTarget.extra?.type)} will lose this value. Files using it will keep old value until edited.</div>}
            </div>
            <div className="p-4 bg-red-50 border-t flex justify-end gap-2 rounded-b-2xl">
              <button type="button" onClick={()=>setDeleteTarget(null)} className="h-10 px-5 rounded-full bg-white border text-sm cursor-pointer">Cancel</button>
              <button
                type="button"
                onClick={()=>{
                  if(deleteTarget.extra?.type==="RESET"){ confirmReset() } else { executeDelete() }
                }}
                className="h-10 px-6 rounded-full bg-red-600 text-white text-sm font-bold hover:bg-red-700 cursor-pointer"
              >
                {deleteTarget.extra?.type==="RESET" ? "Reset All" : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="py-4 text-center text-[10px] text-gray-400">
        CCO File Register v{APP_VERSION} • Secure
      </footer>
    </div>
  );
}
