import { MediaImage } from '../../components/common/AuthenticatedMedia';
import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../../context/AuthContext';
import api from '../../utils/api';
import { 
  QrCode, CheckCircle2, XCircle, Search, Users, 
  Calendar, Award, AlertCircle, ArrowRight, ShieldCheck, 
  Download, RefreshCw, Camera, VideoOff, Check,
  UserPlus, Trash2, Clock, MapPin, AlertTriangle
} from 'lucide-react';
import { Link, useSearchParams } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';

const AttendanceManagement = () => {
  const { user } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const eventParam = searchParams.get('event');

  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState(eventParam || '');
  const [registrations, setRegistrations] = useState([]);
  const [ticketInput, setTicketInput] = useState('');
  const [scanFeedback, setScanFeedback] = useState(null);
  const [ticketPreview, setTicketPreview] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [certSuccess, setCertSuccess] = useState(null);
  const [dutyAssignment, setDutyAssignment] = useState(null);

  // Multi-operator Gate Volunteers State
  const [volunteers, setVolunteers] = useState([]);
  const [loadingVolunteers, setLoadingVolunteers] = useState(false);
  const [showVolunteerModal, setShowVolunteerModal] = useState(false);
  const [selectedVolunteerStudent, setSelectedVolunteerStudent] = useState(null);
  const [volunteerRollInput, setVolunteerRollInput] = useState('');
  const [volunteerSearchResults, setVolunteerSearchResults] = useState([]);
  const [isSearchingVolunteer, setIsSearchingVolunteer] = useState(false);
  const [volunteerGateName, setVolunteerGateName] = useState('Gate 1 - Main Entrance');
  const [dutyStart, setDutyStart] = useState('');
  const [dutyEnd, setDutyEnd] = useState('');
  const [appointingVolunteer, setAppointingVolunteer] = useState(false);

  // Camera Scanner State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [cameraFacing, setCameraFacing] = useState('environment'); // 'environment' (rear camera) | 'user' (selfie camera)
  const [cameraError, setCameraError] = useState(null);
  const html5QrCodeRef = useRef(null);
  const qrFileInputRef = useRef(null);

  const selectedEvent = events.find(e => e.id?.toString() === selectedEventId?.toString());
  const isEventExpired = selectedEvent ? Boolean(selectedEvent.is_expired || (selectedEvent.date && new Date(selectedEvent.date) < new Date())) : false;

  useEffect(() => {
    fetchEvents();
    return () => {
      stopCameraScanner();
    };
  }, []);

  useEffect(() => {
    if (selectedEventId) {
      fetchEventRegistrations(selectedEventId);
      if (['admin', 'faculty', 'president'].includes(user?.role)) {
        fetchVolunteers(selectedEventId);
      }
    }
  }, [selectedEventId]);

  const fetchEvents = async () => {
    try {
      const res = await api.get('events/');
      let approved = res.data.filter(e => e.status === 'approved');

      if (user?.role === 'president' || user?.role === 'faculty') {
        if (user?.society) {
          approved = approved.filter(e => e.society === user.society);
        } else {
          approved = [];
        }
      } else if (user?.role === 'student') {
        // Retrieve assigned duties for this student
        try {
          const dutyRes = await api.get('staff-assignments/');
          const activeDuties = Array.isArray(dutyRes.data) ? dutyRes.data.filter(d => d.status === 'assigned') : [];
          const assignedEventIds = activeDuties.map(d => d.event);
          approved = approved.filter(e => assignedEventIds.includes(e.id));
          if (activeDuties.length > 0) {
            setDutyAssignment(activeDuties[0]);
          }
        } catch (e) {
          console.error(e);
        }
      }

      setEvents(approved);
      if (eventParam && approved.some(e => e.id.toString() === eventParam)) {
        setSelectedEventId(eventParam);
      } else if (approved.length > 0 && !selectedEventId) {
        setSelectedEventId(approved[0].id.toString());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchEventRegistrations = async (eventId) => {
    try {
      const res = await api.get('registrations/');
      const filtered = res.data.filter(r => r.event === parseInt(eventId));
      setRegistrations(filtered);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchVolunteers = async (eventId) => {
    if (!eventId) return;
    setLoadingVolunteers(true);
    try {
      const res = await api.get('staff-assignments/');
      const eventVolunteers = Array.isArray(res.data) 
        ? res.data.filter(v => v.event === parseInt(eventId) && v.status === 'assigned') 
        : [];
      setVolunteers(eventVolunteers);
    } catch (err) {
      console.error('Failed to load volunteers', err);
    } finally {
      setLoadingVolunteers(false);
    }
  };

  const openAppointModal = () => {
    setShowVolunteerModal(true);
    setSelectedVolunteerStudent(null);
    setVolunteerRollInput('');
    setVolunteerSearchResults([]);
    setVolunteerGateName('Gate 1 - Main Entrance');
    if (selectedEvent && selectedEvent.date) {
      try {
        const evDate = new Date(selectedEvent.date);
        const startLocal = new Date(evDate.getTime() - (evDate.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
        setDutyStart(startLocal);
        const endLocal = new Date(evDate.getTime() + (3 * 3600000) - (evDate.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);
        setDutyEnd(endLocal);
      } catch {
        setDutyStart('');
        setDutyEnd('');
      }
    } else {
      setDutyStart('');
      setDutyEnd('');
    }
  };

  const handleSearchVolunteers = async (query) => {
    setVolunteerRollInput(query);
    if (!query || query.trim().length < 1) {
      setVolunteerSearchResults([]);
      return;
    }
    setIsSearchingVolunteer(true);
    try {
      const res = await api.get(`users/search_students/?q=${encodeURIComponent(query.trim())}`);
      const results = res.data || [];
      setVolunteerSearchResults(results);
      const exact = results.find(s => s.roll_number && s.roll_number.toLowerCase() === query.trim().toLowerCase());
      if (exact) {
        setSelectedVolunteerStudent(exact);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearchingVolunteer(false);
    }
  };

  const handleSelectVolunteer = (student) => {
    setSelectedVolunteerStudent(student);
    setVolunteerRollInput(student.roll_number || student.username);
    setVolunteerSearchResults([]);
  };

  const handleAppointVolunteer = async (e) => {
    e.preventDefault();
    if (isEventExpired) {
      alert("Cannot assign gate volunteers to an event that has already concluded.");
      return;
    }
    if (!selectedVolunteerStudent || !selectedEventId) {
      alert("Please search by roll number and select a student volunteer.");
      return;
    }
    setAppointingVolunteer(true);
    try {
      await api.post('staff-assignments/', {
        event: parseInt(selectedEventId),
        volunteer: selectedVolunteerStudent.id,
        gate_name: volunteerGateName.trim() || 'Gate 1 - Main Entrance',
        duty_start: dutyStart ? new Date(dutyStart).toISOString() : null,
        duty_end: dutyEnd ? new Date(dutyEnd).toISOString() : null,
        status: 'assigned'
      });
      setShowVolunteerModal(false);
      setSelectedVolunteerStudent(null);
      setVolunteerRollInput('');
      setDutyStart('');
      setDutyEnd('');
      fetchVolunteers(selectedEventId);
    } catch (err) {
      alert(err.response?.data?.error || err.response?.data?.detail || 'Failed to appoint volunteer.');
    } finally {
      setAppointingVolunteer(false);
    }
  };

  const handleRevokeVolunteer = async (assignmentId, volunteerName) => {
    if (!window.confirm(`Are you sure you want to revoke gate pass permissions for ${volunteerName}?`)) return;
    try {
      await api.post(`staff-assignments/${assignmentId}/revoke/`);
      fetchVolunteers(selectedEventId);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to revoke assignment.');
    }
  };

  const previewTicket = async (rawCode) => {
    if (!rawCode || isProcessing) return;
    if (isEventExpired) {
      setScanFeedback({
        success: false,
        message: "Gate Check-in Closed: This event has concluded. All tickets and volunteer shifts are now expired."
      });
      return;
    }
    console.log("QR Scanner detected raw payload:", rawCode);
    setIsProcessing(true);
    setScanFeedback(null);

    let ticketCode = String(rawCode).trim();

    // 1. Try parsing JSON payload if present
    if (ticketCode.startsWith('{') && ticketCode.endsWith('}')) {
      try {
        const parsed = JSON.parse(ticketCode);
        ticketCode = parsed.ticket_uuid || parsed.uuid || parsed.ticket_qr_code || parsed.code || parsed.ticket || ticketCode;
      } catch (e) {
        console.warn("JSON parse fallback error", e);
      }
    }

    // 2. Extract token/UUID if full URL or query parameter was scanned
    try {
      if (ticketCode.startsWith('http://') || ticketCode.startsWith('https://')) {
        const urlObj = new URL(ticketCode);
        const paramCode = urlObj.searchParams.get('token') || urlObj.searchParams.get('ticket') || urlObj.searchParams.get('code') || urlObj.searchParams.get('uuid');
        if (paramCode) {
          ticketCode = paramCode;
        } else {
          const parts = urlObj.pathname.split('/').filter(Boolean);
          ticketCode = parts.pop() || ticketCode;
        }
      } else if (ticketCode.includes('/')) {
        const parts = ticketCode.split('/').filter(Boolean);
        ticketCode = parts.pop() || ticketCode;
      } else if (ticketCode.includes('=')) {
        ticketCode = ticketCode.split('=').pop();
      }
    } catch (e) {
      console.warn("URL extraction fallback error", e);
    }

    ticketCode = ticketCode.replace(/["']/g, '').trim();
    console.log("Processed ticket UUID for verification:", ticketCode);

    try {
      const res = await api.post('registrations/preview_ticket/', {
        ticket_uuid: ticketCode
      });
      setTicketPreview({
        ...res.data,
        ticket_uuid: ticketCode
      });
      setTicketInput('');
    } catch (err) {
      setTicketPreview(null);
      setScanFeedback({
        success: false,
        message: err.response?.data?.error || `Invalid or unverified ticket code: ${ticketCode}`
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmEntry = async (ticketCode) => {
    if (!ticketCode || isProcessing) return;
    if (isEventExpired) {
      setScanFeedback({
        success: false,
        message: "Gate Check-in Closed: This event has concluded. All tickets and volunteer shifts are now expired."
      });
      return;
    }
    setIsProcessing(true);
    try {
      const res = await api.post('registrations/scan_ticket/', {
        ticket_uuid: ticketCode
      });
      setScanFeedback({
        success: true,
        message: `Entry Confirmed: ${res.data.student_name || res.data.student} checked in for ${res.data.event}`
      });
      setTicketPreview(null);
      fetchEventRegistrations(selectedEventId);
    } catch (err) {
      setScanFeedback({
        success: false,
        message: err.response?.data?.error || 'Failed to confirm ticket entry.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleManualScanSubmit = (e) => {
    e.preventDefault();
    if (ticketInput.trim()) {
      previewTicket(ticketInput.trim());
    }
  };

  // Helper to ensure mobile video plays inline without black screen
  const ensureVideoAttributes = () => {
    try {
      const container = document.getElementById("camera-scanner-view");
      if (!container) return;
      const videos = container.querySelectorAll("video");
      videos.forEach(vid => {
        vid.setAttribute("playsinline", "true");
        vid.setAttribute("webkit-playsinline", "true");
        vid.setAttribute("muted", "true");
        vid.muted = true;
        vid.setAttribute("autoplay", "true");
        vid.style.width = "100%";
        vid.style.height = "100%";
        vid.style.objectFit = "cover";
        vid.play().catch(() => {});
      });
    } catch (_) {}
  };

  // Start Camera QR Scanner
  const startCameraScanner = async (overrideFacing = null) => {
    setCameraError(null);
    const targetFacing = overrideFacing || cameraFacing;

    // 1. Verify HTTPS / localhost origin (modern mobile browsers require secure context for MediaDevices)
    if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      setCameraError("Camera requires HTTPS or localhost in modern mobile browsers. If testing on local Wi-Fi, please access via HTTPS or use the 'Snap / Upload QR Photo' button below.");
      return;
    }

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraError("MediaDevices API is not supported in this browser. Please use Chrome/Safari or use 'Snap / Upload QR Photo' below.");
      return;
    }

    // Clean up any previously attached scanner
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      } catch (_) {}
      html5QrCodeRef.current = null;
    }

    // 2. Pre-activate container state so DOM element is visible with non-zero dimensions
    setIsCameraActive(true);
    setIsStartingCamera(true);

    // Yield control so React renders the scanner DOM node before initializing Html5Qrcode
    await new Promise(resolve => setTimeout(resolve, 100));

    try {
      const scannerContainer = document.getElementById("camera-scanner-view");
      if (!scannerContainer) {
        throw new Error("Scanner viewport container could not be found.");
      }

      scannerContainer.innerHTML = '';

      const html5QrCode = new Html5Qrcode("camera-scanner-view", { verbose: false });
      html5QrCodeRef.current = html5QrCode;

      const config = {
        fps: 15,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const edge = Math.min(viewfinderWidth, viewfinderHeight) * 0.75;
          return { width: Math.max(180, Math.floor(edge)), height: Math.max(180, Math.floor(edge)) };
        },
        // DO NOT set fixed aspectRatio: 1.0 because Android/iOS mobile cameras fail on applyConstraints!
      };

      const onScanSuccess = (decodedText) => {
        console.log("Camera scanned decodedText:", decodedText);
        previewTicket(decodedText);
      };

      let started = false;

      // Method 1: Try direct facingMode ("environment" or "user") as accepted by Html5Qrcode
      try {
        const mode = targetFacing === 'user' ? 'user' : 'environment';
        await html5QrCode.start(
          { facingMode: mode },
          config,
          onScanSuccess,
          () => {}
        );
        started = true;
      } catch (nativeFacingErr) {
        console.warn("Direct facingMode constraint failed, falling back to camera enumeration:", nativeFacingErr);
      }

      // Method 2: If direct facingMode fails, query cameras and select preferred lens with fresh instance
      if (!started) {
        try {
          if (html5QrCode.isScanning) await html5QrCode.stop();
          html5QrCode.clear();
        } catch (_) {}
        scannerContainer.innerHTML = '';

        const freshScanner = new Html5Qrcode("camera-scanner-view", { verbose: false });
        html5QrCodeRef.current = freshScanner;

        let cameras = [];
        try {
          cameras = await Html5Qrcode.getCameras();
        } catch (camErr) {
          console.warn("Could not enumerate cameras:", camErr);
        }

        if (cameras && cameras.length > 0) {
          const preferredCam = targetFacing === 'environment'
            ? (cameras.find(c => /back|rear|environment|0/i.test(c.label)) || cameras[cameras.length - 1] || cameras[0])
            : (cameras.find(c => /front|user|face|1/i.test(c.label)) || cameras[0]);
          await freshScanner.start(preferredCam.id, config, onScanSuccess, () => {});
          started = true;
        } else {
          // Fallback to basic user camera
          await freshScanner.start({ facingMode: "user" }, config, onScanSuccess, () => {});
          started = true;
        }
      }

      // Ensure mobile browser video attributes (playsinline, webkit-playsinline, autoplay, muted)
      ensureVideoAttributes();
      setTimeout(ensureVideoAttributes, 200);
      setTimeout(ensureVideoAttributes, 600);
      setTimeout(ensureVideoAttributes, 1200);

      setIsStartingCamera(false);
    } catch (err) {
      console.error("Camera start error:", err);
      let msg = "Camera access denied or device unavailable. Please ensure camera permissions are allowed in your browser address bar.";
      const errStr = String(err?.message || err || '');
      if (err?.name === 'NotReadableError' || err?.name === 'TrackStartError' || /in use/i.test(errStr) || /hardware/i.test(errStr) || /could not start/i.test(errStr)) {
        msg = "Camera is in use by another app or browser tab (e.g. background tabs or camera apps). Please close other tabs and tap retry.";
      } else if (err?.name === 'NotAllowedError' || err?.name === 'PermissionDeniedError' || /permission/i.test(errStr) || /denied/i.test(errStr)) {
        msg = "Camera permission was denied in your browser settings. Tap the lock/site settings in your address bar, set Camera to 'Allow', then tap 'Start In-App Camera' again.";
      } else if (err?.name === 'NotFoundError' || err?.name === 'DevicesNotFoundError' || /not found/i.test(errStr)) {
        msg = "No camera hardware detected on this device. You can use 'Snap / Upload QR Photo' or enter the ticket reference code manually.";
      } else if (err?.name === 'OverconstrainedError' || /constraint/i.test(errStr)) {
        msg = "Camera does not support requested facing mode. Tap 'Flip Camera' or use 'Snap / Upload QR Photo'.";
      } else if (errStr) {
        msg = `Camera unavailable or unsupported format (${errStr}). You can use 'Snap / Upload QR Photo' below.`;
      }
      setCameraError(msg);
      setIsCameraActive(false);
      setIsStartingCamera(false);
    }
  };

  // Flip / Switch Camera
  const flipCamera = async () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
    await stopCameraScanner();
    await startCameraScanner(nextFacing);
  };

  // Stop Camera QR Scanner
  const stopCameraScanner = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop();
        }
        html5QrCodeRef.current.clear();
      } catch (err) {
        console.error("Camera stop error:", err);
      }
      html5QrCodeRef.current = null;
    }
    setIsCameraActive(false);
    setIsStartingCamera(false);
  };

  // Image Upload QR Scanner (Fallback for PCs without webcam or permission issues)
  const handleQrImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCameraError(null);
    try {
      let scanner = html5QrCodeRef.current;
      if (!scanner) {
        scanner = new Html5Qrcode("camera-scanner-view");
        html5QrCodeRef.current = scanner;
      }
      const decodedText = await scanner.scanFile(file, true);
      previewTicket(decodedText);
    } catch (err) {
      console.warn("Scan file error:", err);
      setCameraError("Could not detect a QR code in the uploaded image. Please ensure the ticket QR code is clear and in focus.");
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  const handleToggleAttendance = async (regId) => {
    try {
      await api.post(`registrations/${regId}/toggle_attendance/`);
      fetchEventRegistrations(selectedEventId);
    } catch (err) {
      alert("Failed to toggle attendance.");
    }
  };

  const handleFinalizeAndIssueCertificates = async () => {
    if (!window.confirm("Finalize attendance and generate customized digital certificates in bulk for all students marked present?")) return;
    try {
      const res = await api.post('certificates/generate_bulk/', {
        event_id: parseInt(selectedEventId)
      });
      setCertSuccess(res.data?.status || "Certificates generated successfully!");
      setTimeout(() => setCertSuccess(null), 5000);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to generate certificates.");
    }
  };

  const currentEvent = events.find(e => e.id === parseInt(selectedEventId));
  const isEventConcluded = Boolean(currentEvent?.is_expired || (currentEvent?.date && new Date(currentEvent.date) < new Date()));
  const totalRegistered = registrations.length;
  const presentCount = registrations.filter(r => r.attendance_status).length;
  const pendingOrAbsentCount = Math.max(0, totalRegistered - presentCount);
  const attendanceRate = totalRegistered > 0 ? Math.round((presentCount / totalRegistered) * 100) : 0;

  const filteredRegistrations = registrations.filter(r => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (r.student_name && r.student_name.toLowerCase().includes(q)) ||
           (r.student_roll_number && r.student_roll_number.toLowerCase().includes(q)) ||
           (r.ticket_qr_code && r.ticket_qr_code.toLowerCase().includes(q));
  });

  const backPortalRoute = user?.role === 'admin' ? '/admin-dashboard' :
                          user?.role === 'faculty' ? '/advisor-dashboard' :
                          user?.role === 'president' ? '/president-dashboard' :
                          '/student-dashboard';

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* HEADER */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                On-Site Check-In Console
              </span>
              {dutyAssignment ? (
                <span className="text-xs font-bold text-orange-700 bg-orange-50 border border-orange-200 px-3 py-1 rounded-full flex items-center gap-1">
                  <ShieldCheck size={13} className="text-orange-600" /> Appointed Gate Officer • {dutyAssignment.gate_name || 'Gate 1'}
                </span>
              ) : (
                <span className="text-xs font-bold text-slate-400">Authorized Personnel Only</span>
              )}
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mt-2 flex items-center gap-3">
              <QrCode className="text-emerald-600" size={36} /> Live QR Attendance & Multi-Operator Gate
            </h1>
            <p className="text-slate-500 text-sm mt-1 max-w-2xl font-medium">
              Real-time ticket scanning via in-app camera or barcode scanner, attendee photo verification, multi-operator volunteer management, and bulk certificate generation.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to={backPortalRoute}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
            >
              Back to Portal
            </Link>
            <button
              onClick={() => {
                fetchEventRegistrations(selectedEventId);
                if (['admin', 'faculty', 'president'].includes(user?.role)) {
                  fetchVolunteers(selectedEventId);
                }
              }}
              className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer"
              title="Refresh Roster"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* EVENT SELECTION BAR & BULK CERTIFICATE BUTTON */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Calendar className="text-indigo-600 shrink-0" size={24} />
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-400">
                Select Active Event:
              </label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="mt-0.5 text-base font-black text-slate-900 bg-transparent outline-none cursor-pointer"
              >
                {events.map(e => {
                  const expired = e.is_expired || (e.date && new Date(e.date) < new Date());
                  return (
                    <option key={e.id} value={e.id}>
                      {expired ? '⏹ [CONCLUDED] ' : '🟢 '}
                      {e.title} ({new Date(e.date).toLocaleDateString()}) - {e.society_name}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <button
            onClick={handleFinalizeAndIssueCertificates}
            disabled={totalRegistered === 0 || presentCount === 0}
            className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition cursor-pointer"
          >
            <Award size={16} /> Finalize Attendance & Generate Bulk Certificates
          </button>
        </div>

        {/* EVENT CONCLUDED / EXPIRED BANNER */}
        {isEventExpired && (
          <div className="bg-amber-50 border border-amber-200 rounded-3xl p-5 flex items-start sm:items-center gap-3.5 text-amber-900 shadow-xs animate-in fade-in">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 flex items-center justify-center shrink-0 text-amber-700">
              <AlertTriangle size={22} />
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-black uppercase tracking-wider text-amber-950 flex items-center gap-2">
                Event Concluded • Check-in Lanes & Gate Volunteer Shifts Expired
              </h4>
              <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                This event took place on <strong>{selectedEvent ? new Date(selectedEvent.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'past date'}</strong>. Active gate scanning and volunteer shifts are now closed. Attendance logs remain preserved below for certificate generation.
              </p>
            </div>
          </div>
        )}

        {certSuccess && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 size={18} className="text-emerald-600" />
            <span>{certSuccess}</span>
          </div>
        )}

        {/* ATTENDANCE KPI METRICS */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Registered', count: totalRegistered, color: 'text-slate-900', bg: 'bg-white' },
            { label: 'Checked-In (Present)', count: presentCount, color: 'text-emerald-600', bg: 'bg-white' },
            { label: isEventConcluded ? 'Absent (Concluded)' : 'Awaiting Check-In', count: pendingOrAbsentCount, color: isEventConcluded ? 'text-rose-600' : 'text-amber-600', bg: 'bg-white' },
            { label: 'Attendance Rate', count: `${attendanceRate}%`, color: 'text-indigo-600', bg: 'bg-white' },
          ].map((stat, i) => (
            <div key={i} className={`p-6 rounded-3xl border border-slate-200 shadow-sm ${stat.bg}`}>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400">{stat.label}</span>
              <p className={`text-3xl font-black mt-1 ${stat.color}`}>{stat.count}</p>
            </div>
          ))}
        </div>

        {/* MULTI-OPERATOR GATE OFFICERS & VOLUNTEERS DESK (PRESIDENT / ADVISOR / ADMIN) */}
        {['admin', 'faculty', 'president'].includes(user?.role) && (
          <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                    Multi-Operator Gate Control
                  </span>
                </div>
                <h3 className="text-xl font-black text-slate-900 mt-1 flex items-center gap-2">
                  <Users size={22} className="text-indigo-600" /> Appointed Gate Officers & Volunteers ({volunteers.length})
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Appoint university students as gate operators to scan tickets at specific checkpoints (Gate 1, VIP Gate, Registration Desk).
                </p>
              </div>

              <button
                onClick={openAppointModal}
                disabled={!selectedEventId || isEventExpired}
                className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 transition cursor-pointer shadow-md ${
                  isEventExpired
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                    : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20'
                }`}
                title={isEventExpired ? "Cannot assign volunteers to a concluded event" : "Appoint Gate Volunteer"}
              >
                <UserPlus size={16} /> {isEventExpired ? "Volunteers Locked (Event Concluded)" : "Appoint Gate Volunteer"}
              </button>
            </div>

            {loadingVolunteers ? (
              <div className="p-6 text-center text-slate-400 text-xs">Loading appointed volunteers...</div>
            ) : volunteers.length === 0 ? (
              <div className="p-8 text-center border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 text-xs">
                No student volunteers assigned to checkpoints for this event yet. Click "Appoint Gate Volunteer" to assign gate staff.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {volunteers.map(v => (
                  <div key={v.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50 flex items-center justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      {v.volunteer_photo ? (
                        <MediaImage src={v.volunteer_photo} alt={v.volunteer_name} className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0" />
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 font-black text-sm flex items-center justify-center border border-indigo-200 shrink-0">
                          {v.volunteer_name?.charAt(0) || 'V'}
                        </div>
                      )}
                      <div className="min-w-0 truncate">
                        <p className="font-bold text-slate-900 text-xs truncate">{v.volunteer_name || v.volunteer_username}</p>
                        <p className="text-[10px] text-slate-500 font-mono truncate">{v.volunteer_roll ? `Roll: ${v.volunteer_roll}` : `@${v.volunteer_username}`}</p>
                        {isEventExpired ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded-md mt-1 border border-slate-300">
                            <Clock size={10} /> Shift Expired / Concluded
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md mt-1 border border-indigo-200">
                            <MapPin size={10} /> {v.gate_name || 'Gate 1'}
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRevokeVolunteer(v.id, v.volunteer_name || v.volunteer_username)}
                      className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition cursor-pointer shrink-0"
                      title="Revoke Assignment"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* IN-APP CAMERA SCANNER & RAPID INPUT CONSOLE */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
          {isEventExpired ? (
            <div className="max-w-xl mx-auto py-10 text-center space-y-4">
              <div className="w-16 h-16 rounded-3xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center mx-auto shadow-inner">
                <Clock size={32} />
              </div>
              <div>
                <span className="text-[10px] font-black uppercase tracking-widest text-rose-300 bg-rose-950/80 px-3 py-1 rounded-full border border-rose-500/40">
                  Gate Check-In Lane Expired
                </span>
                <h2 className="text-2xl font-black tracking-tight mt-2 text-white">Event Concluded & Check-In Closed</h2>
                <p className="text-xs text-slate-300 max-w-md mx-auto mt-2 leading-relaxed">
                  This event took place on <strong>{selectedEvent ? new Date(selectedEvent.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : 'past date'}</strong>. Attendance lanes, gate volunteer duties, and ticket scanning for this session are expired.
                </p>
              </div>
              <div className="pt-2">
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3.5 py-1.5 rounded-full inline-flex items-center gap-1.5">
                  <Award size={13} /> Finalized attendance list and certificate generation remains open above
                </span>
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-6 text-center">
            
            <div className="flex items-center justify-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-full border border-emerald-500/40">
                In-App Optical Camera Scanner
              </span>
            </div>

            <h2 className="text-2xl font-black tracking-tight">Real-Time Attendee Check-In</h2>
            <p className="text-xs text-indigo-200 max-w-md mx-auto">
              Scan student ticket QR code using your webcam or mobile camera to inspect attendee photo identity and confirm entry.
            </p>

            {/* CAMERA STREAM VIEWPORT */}
            <div className="max-w-sm w-full mx-auto overflow-hidden rounded-3xl border-2 border-indigo-500/40 bg-black shadow-inner p-2 relative min-h-[260px] sm:min-h-[300px] flex items-center justify-center">
              <div 
                id="camera-scanner-view" 
                className="w-full h-full min-h-[240px] rounded-2xl overflow-hidden bg-black relative" 
              />
              
              {!isCameraActive && (
                <div className="absolute inset-2 z-10 bg-black/95 rounded-2xl p-8 text-slate-400 text-xs flex flex-col items-center justify-center gap-2 text-center">
                  <Camera size={38} className="text-slate-500 mb-1" />
                  <span className="font-semibold text-slate-300">Camera is currently off.</span>
                  <span className="text-[11px] text-slate-400">Tap below to activate camera or snap a photo of the ticket QR.</span>
                </div>
              )}

              {isCameraActive && isStartingCamera && (
                <div className="absolute inset-0 z-20 bg-black/85 flex flex-col items-center justify-center gap-2.5 text-white text-xs font-bold p-4">
                  <div className="w-8 h-8 border-3 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                  <span>Connecting camera sensor...</span>
                  <span className="text-[10px] text-slate-400 font-normal">Opening {cameraFacing === 'environment' ? 'rear autofocus camera' : 'front camera'}</span>
                </div>
              )}

              {isCameraActive && !isStartingCamera && (
                <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-emerald-500/90 text-emerald-950 text-[10px] font-black px-2.5 py-0.5 rounded-full shadow">
                  <span className="w-2 h-2 rounded-full bg-emerald-950 animate-pulse"></span>
                  SCANNING LIVE ({cameraFacing === 'environment' ? 'REAR' : 'FRONT'})
                </div>
              )}
            </div>

            {cameraError && (
              <div className="p-3.5 bg-amber-500/20 border border-amber-400/40 text-amber-200 rounded-2xl text-xs max-w-md mx-auto leading-relaxed text-left flex items-start gap-2.5">
                <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                <span>{cameraError}</span>
              </div>
            )}

            {/* CAMERA CONTROLS & PHOTO UPLOAD */}
            <div className="flex flex-wrap justify-center gap-2.5 sm:gap-3">
              {!isCameraActive ? (
                <button
                  type="button"
                  onClick={() => startCameraScanner()}
                  className="bg-emerald-500 hover:bg-emerald-400 text-emerald-950 px-6 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider transition shadow-lg shadow-emerald-500/30 flex items-center gap-2 cursor-pointer"
                >
                  <Camera size={16} /> Start In-App Camera
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={stopCameraScanner}
                    className="bg-rose-500 hover:bg-rose-400 text-white px-5 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider transition shadow-lg shadow-rose-500/30 flex items-center gap-2 cursor-pointer"
                  >
                    <VideoOff size={16} /> Turn Off Camera
                  </button>

                  <button
                    type="button"
                    onClick={flipCamera}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-2xl font-black text-xs uppercase tracking-wider transition shadow-lg shadow-indigo-600/30 flex items-center gap-2 cursor-pointer"
                    title="Flip between front and rear camera"
                  >
                    <RefreshCw size={15} /> Flip Camera
                  </button>
                </>
              )}

              <input
                ref={qrFileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleQrImageUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => qrFileInputRef.current?.click()}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-5 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 transition cursor-pointer"
              >
                <QrCode size={16} className="text-indigo-400" /> Snap / Upload QR Photo
              </button>
            </div>

            {/* GATE PASS ATTENDEE IDENTITY VERIFICATION CARD */}
            {ticketPreview && (
              <div className="bg-white text-slate-900 rounded-3xl p-6 shadow-2xl border-2 border-indigo-400 max-w-lg mx-auto text-left animate-in zoom-in-95 space-y-4">
                <div className="flex items-start justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3.5">
                    {ticketPreview.photo_url ? (
                      <MediaImage 
                        src={ticketPreview.photo_url} 
                        alt={ticketPreview.student_name}
                        className="w-16 h-16 rounded-2xl object-cover border-2 border-indigo-500 shadow-md"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-black text-xl border-2 border-indigo-300">
                        {ticketPreview.student_name?.charAt(0) || 'S'}
                      </div>
                    )}
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                        Gate Photo Identification
                      </span>
                      <h4 className="text-lg font-black text-slate-900 mt-1 leading-tight">
                        {ticketPreview.student_name}
                      </h4>
                      <p className="text-xs font-mono font-bold text-slate-500">
                        Roll: {ticketPreview.roll_number || 'N/A'} • @{ticketPreview.student_username}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setTicketPreview(null)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 cursor-pointer"
                  >
                    <XCircle size={20} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Department / Program</span>
                    <span className="font-bold text-slate-800">{ticketPreview.department || ticketPreview.program || 'General Campus'}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Batch / Semester</span>
                    <span className="font-bold text-slate-800">{ticketPreview.batch || '2024'} • {ticketPreview.semester || 'Current'}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Payment Verification</span>
                    <span className={`font-bold flex items-center gap-1 ${
                      ticketPreview.payment_status === 'verified' ? 'text-emerald-600' : 'text-rose-600'
                    }`}>
                      {ticketPreview.payment_status === 'verified' ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                      {ticketPreview.payment_status?.toUpperCase() || 'UNVERIFIED'}
                    </span>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Gate Status</span>
                    {ticketPreview.attendance_status ? (
                      <span className="font-bold text-amber-600">Already Checked In</span>
                    ) : (
                      <span className="font-bold text-emerald-600">Ready for Entry</span>
                    )}
                  </div>
                </div>

                {/* DUPLICATE SCAN / ALREADY CHECKED IN WARNING */}
                {ticketPreview.attendance_status ? (
                  <div className="p-4 bg-amber-50 border border-amber-300 text-amber-900 rounded-2xl text-xs space-y-1">
                    <div className="flex items-center gap-2 font-black text-amber-800">
                      <AlertCircle size={18} className="text-amber-600 shrink-0" />
                      <span>DUPLICATE SCAN: Already Checked In</span>
                    </div>
                    <p className="text-[11px] text-amber-700 pl-6">
                      This ticket was checked in on <strong>{ticketPreview.checked_in_at ? new Date(ticketPreview.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : 'earlier'}</strong> by Gate Officer <strong>{ticketPreview.checked_in_by || 'Staff'}</strong>.
                    </p>
                  </div>
                ) : ticketPreview.payment_status !== 'verified' ? (
                  <div className="p-4 bg-rose-50 border border-rose-300 text-rose-900 rounded-2xl text-xs flex items-center gap-2 font-bold">
                    <AlertTriangle size={18} className="text-rose-600 shrink-0" />
                    <span>ADMISSION DENIED: Ticket payment is not verified.</span>
                  </div>
                ) : (
                  <button
                    onClick={() => confirmEntry(ticketPreview.ticket_uuid)}
                    disabled={isProcessing}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3.5 px-4 rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer transition"
                  >
                    <Check size={18} /> Confirm Entry & Mark Present
                  </button>
                )}
              </div>
            )}

            {/* SCAN FEEDBACK ALERT */}
            {scanFeedback && (
              <div className={`p-4 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 max-w-lg mx-auto animate-in zoom-in-95 ${
                scanFeedback.success ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
              }`}>
                {scanFeedback.success ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
                <span>{scanFeedback.message}</span>
              </div>
            )}

            {/* MANUAL / BARCODE INPUT ALTERNATIVE */}
            <div className="pt-4 border-t border-white/10 max-w-md mx-auto">
              <span className="block text-[11px] font-bold text-indigo-300 uppercase tracking-wider mb-2">
                Or Scan with 2D Barcode Gun / Enter Ticket UUID:
              </span>
              <form onSubmit={handleManualScanSubmit} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ticket UUID (e.g. 9b1deb4d-...)"
                  value={ticketInput}
                  onChange={(e) => setTicketInput(e.target.value)}
                  className="flex-1 px-4 py-2.5 bg-white/10 border border-white/20 text-white rounded-xl text-xs font-mono placeholder-indigo-300 outline-none focus:ring-2 focus:ring-emerald-400"
                />
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="bg-white text-slate-900 hover:bg-indigo-50 px-5 py-2.5 rounded-xl font-bold text-xs transition cursor-pointer"
                >
                  Verify
                </button>
              </form>
            </div>

          </div>
          )}
        </div>

        {/* ATTENDEE ROSTER TABLE */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <h3 className="text-xl font-black text-slate-900">
              Participant Attendance Roster ({filteredRegistrations.length})
            </h3>

            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search participant, roll no, UUID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:bg-white outline-none"
              >
              </input>
            </div>
          </div>

          {filteredRegistrations.length === 0 ? (
            <div className="p-12 text-center border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 text-sm">
              No registered participants found for this event.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-black uppercase tracking-wider text-slate-400">
                    <th className="py-3 px-4">Student</th>
                    <th className="py-3 px-4">Ticket QR Hash</th>
                    <th className="py-3 px-4">Payment Status</th>
                    <th className="py-3 px-4">Attendance Status</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                  {filteredRegistrations.map(reg => (
                    <tr key={reg.id} className="hover:bg-slate-50 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        <div className="flex items-center gap-3">
                          {reg.student_avatar ? (
                            <MediaImage
                              src={reg.student_avatar}
                              alt={reg.student_name}
                              className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center border border-indigo-200 shrink-0">
                              {reg.student_name?.charAt(0) || 'S'}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-slate-900">{reg.student_name}</div>
                            <div className="text-[10px] font-mono text-slate-400">
                              {reg.student_roll_number ? `Roll: ${reg.student_roll_number}` : `@${reg.student_username}`}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        {reg.ticket_qr_code ? `${reg.ticket_qr_code.substring(0, 18)}...` : 'Ticket Pending'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          reg.payment_status === 'verified' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                        }`}>
                          {reg.payment_status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`inline-flex flex-col gap-0.5 px-3 py-1.5 rounded-xl text-xs font-bold ${
                          reg.attendance_status 
                            ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                            : isEventConcluded 
                              ? 'bg-rose-50 border border-rose-200 text-rose-700'
                              : 'bg-amber-50 border border-amber-200 text-amber-800'
                        }`}>
                          <span className="flex items-center gap-1.5">
                            {reg.attendance_status ? (
                              <>
                                <CheckCircle2 size={13} className="text-emerald-600" /> Present (Verified)
                              </>
                            ) : isEventConcluded ? (
                              <>
                                <X size={13} className="text-rose-500" /> Absent (Missed)
                              </>
                            ) : (
                              <>
                                <Clock size={13} className="text-amber-500" /> Awaiting Check-In
                              </>
                            )}
                          </span>
                          {reg.attendance_status && (reg.checked_in_at || reg.checked_in_by_name) && (
                            <span className="text-[10px] font-medium text-emerald-600 flex items-center gap-1">
                              <Clock size={10} />
                              {reg.checked_in_at ? new Date(reg.checked_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                              {reg.checked_in_by_name ? ` • by ${reg.checked_in_by_name}` : ''}
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleToggleAttendance(reg.id)}
                          className={`px-3 py-1.5 rounded-xl font-bold text-[11px] transition cursor-pointer ${
                            reg.attendance_status
                              ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                              : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm'
                          }`}
                        >
                          {reg.attendance_status ? 'Mark Absent' : 'Check In'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* APPOINT GATE VOLUNTEER MODAL */}
      {showVolunteerModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 space-y-5 animate-in zoom-in-95 my-8">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                  Multi-Operator Gate Pass
                </span>
                <h3 className="text-xl font-black text-slate-900 mt-1">Appoint Gate Officer</h3>
                <p className="text-xs text-slate-500 font-medium">
                  {selectedEvent ? `Authorizing check-in scanner permissions for "${selectedEvent.title}"` : 'Grant a student scanner permissions for this event.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowVolunteerModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <XCircle size={22} />
              </button>
            </div>

            <form onSubmit={handleAppointVolunteer} className="space-y-4">
              {/* Student Roll Number Search */}
              <div className="space-y-2">
                <label className="block text-xs font-bold uppercase text-slate-700">
                  Search Student by Roll Number <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="relative flex items-center">
                    <Search className="absolute left-3.5 text-slate-400 pointer-events-none" size={16} />
                    <input
                      type="text"
                      placeholder="Enter Roll Number (e.g. F23BINCE1M04114)..."
                      value={volunteerRollInput}
                      onChange={e => handleSearchVolunteers(e.target.value)}
                      className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white outline-none focus:border-indigo-400 transition"
                      autoFocus
                    />
                    {isSearchingVolunteer && (
                      <div className="absolute right-3">
                        <RefreshCw size={14} className="animate-spin text-indigo-500" />
                      </div>
                    )}
                  </div>

                  {/* Dropdown search results */}
                  {volunteerSearchResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-30 max-h-52 overflow-y-auto divide-y divide-slate-100">
                      {volunteerSearchResults.map(s => (
                        <div
                          key={s.id || s.username}
                          onClick={() => handleSelectVolunteer(s)}
                          className="p-3 hover:bg-indigo-50 cursor-pointer flex items-center justify-between text-xs transition"
                        >
                          <div>
                            <span className="font-bold text-slate-900 block">{s.full_name || s.username}</span>
                            <span className="text-[11px] font-mono text-slate-500 font-bold">
                              Roll: {s.roll_number || s.username}
                            </span>
                            {(s.department || s.program) && (
                              <span className="text-[10px] text-slate-400 block mt-0.5">
                                {[s.department, s.program].filter(Boolean).join(' • ')}
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-lg shrink-0">
                            Select
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected Student Information Card */}
                {selectedVolunteerStudent ? (
                  <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-2xl flex items-start justify-between gap-3 animate-in fade-in">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center shrink-0 shadow-sm">
                        {(selectedVolunteerStudent.full_name || selectedVolunteerStudent.username || 'S')[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-black text-slate-900">
                            {selectedVolunteerStudent.full_name || selectedVolunteerStudent.username}
                          </h4>
                          <span className="text-[9px] font-black uppercase text-emerald-700 bg-emerald-100/80 px-1.5 py-0.5 rounded">
                            Verified
                          </span>
                        </div>
                        <div className="text-[11px] font-mono font-bold text-indigo-700 mt-0.5">
                          Roll: {selectedVolunteerStudent.roll_number || selectedVolunteerStudent.username}
                        </div>
                        {(selectedVolunteerStudent.department || selectedVolunteerStudent.program) && (
                          <div className="text-[10px] text-slate-600 mt-0.5">
                            {[selectedVolunteerStudent.department, selectedVolunteerStudent.program].filter(Boolean).join(' • ')}
                          </div>
                        )}
                        {selectedVolunteerStudent.email && (
                          <div className="text-[10px] text-slate-500 font-mono">
                            {selectedVolunteerStudent.email}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedVolunteerStudent(null);
                        setVolunteerRollInput('');
                      }}
                      className="text-[11px] font-bold text-slate-500 hover:text-rose-600 p-1 hover:bg-white rounded-lg transition cursor-pointer shrink-0"
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center">
                    <p className="text-[11px] text-slate-500">
                      Enter roll number above to display verified student profile.
                    </p>
                  </div>
                )}
              </div>

              {/* Check-In Gate / Location */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1">
                  Check-In Gate / Location <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={volunteerGateName}
                  onChange={(e) => setVolunteerGateName(e.target.value)}
                  placeholder="e.g. Gate 1 - Main Entrance"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white outline-none focus:border-indigo-400 transition"
                  required
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {['Gate 1 - Main Entrance', 'Gate 2 - Student Center', 'VIP / Speaker Desk', 'Desk Alpha'].map(preset => (
                    <button
                      type="button"
                      key={preset}
                      onClick={() => setVolunteerGateName(preset)}
                      className="text-[10px] font-bold px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-600 rounded-lg cursor-pointer transition border border-transparent hover:border-indigo-200"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date & Time: Duty Start to Duty End */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1">
                    Duty Start Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={dutyStart}
                    onChange={(e) => setDutyStart(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white outline-none focus:border-indigo-400 transition"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-600 mb-1">
                    Duty End Date & Time
                  </label>
                  <input
                    type="datetime-local"
                    value={dutyEnd}
                    onChange={(e) => setDutyEnd(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white outline-none focus:border-indigo-400 transition"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowVolunteerModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={appointingVolunteer || !selectedVolunteerStudent}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-600/20 cursor-pointer transition flex items-center gap-1.5"
                >
                  {appointingVolunteer ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" /> Appointing...
                    </>
                  ) : (
                    'Confirm Appointment'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AttendanceManagement;
