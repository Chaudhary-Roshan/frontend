import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { 
  ShieldCheck, Map, CheckSquare, Users, Building, 
  CreditCard, PlusCircle, Trash2, Edit3, QrCode, 
  CheckCircle2, XCircle, Search, Copy, Check, ExternalLink, Calendar,
  FileText, Eye, AlertCircle, Megaphone, MessageSquare, Filter,
  Sparkles, Clock, ArrowUpRight, Lock, RefreshCw, AlertTriangle,
  Globe, Phone, Mail, DollarSign, Layers, BadgeCheck, X, Image as ImageIcon,
  Key, Power, UserCheck, UserX, History, ArrowRightLeft, UserPlus, ShieldAlert, Award, UserCog,
  Download, Send, Radio, RotateCcw
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import { uploadFileToServer } from '../../utils/fileUpload';
import ImageUploader from '../../components/common/ImageUploader';
import EventProposalDocumentModal from '../../components/modals/EventProposalDocumentModal';
import PaymentVerificationDesk from '../../components/ticketing/PaymentVerificationDesk';
import ManualTicketingHub from '../../components/ticketing/ManualTicketingHub';
import MembershipConfiguration from '../../components/membership/MembershipConfiguration';
import { getMediaUrl } from '../../utils/media';

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('societies');
  const [societies, setSocieties] = useState([]);
  const [usersList, setUsersList] = useState([]);
  const [events, setEvents] = useState([]);
  const [proposals, setProposals] = useState([]);
  const [selectedProposalDoc, setSelectedProposalDoc] = useState(null);
  const [proposalOfficeFilter, setProposalOfficeFilter] = useState('all');
  const [paidRegistrations, setPaidRegistrations] = useState([]);
  const [venues, setVenues] = useState([]);
  const [newsList, setNewsList] = useState([]);
  const [complaintsList, setComplaintsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMembershipSocietyId, setSelectedMembershipSocietyId] = useState('');

  // Phase 7: Media Moderation, Content Approvals & Communications
  const [galleryList, setGalleryList] = useState([]);
  const [galleryStatusFilter, setGalleryStatusFilter] = useState('all');
  const [newsStatusFilter, setNewsStatusFilter] = useState('all');
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({ title: '', message: '', target_role: 'all' });
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [restoreTargetBackup, setRestoreTargetBackup] = useState(null);
  const [isRestoringBackup, setIsRestoringBackup] = useState(false);

  // System Infrastructure & Backups
  const [systemHealth, setSystemHealth] = useState(null);
  const [backupsList, setBackupsList] = useState([]);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [systemSettingsForm, setSystemSettingsForm] = useState({
    allowed_email_domains: '@university.edu.pk, @campus.edu.pk',
    timezone: 'Asia/Karachi',
    max_upload_size_mb: 15,
    portal_maintenance_mode: false,
    public_registration_open: true
  });

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [eventStatusFilter, setEventStatusFilter] = useState('all');
  const [credentialsSubTab, setCredentialsSubTab] = useState('executive'); // 'executive' | 'students'

  // Notification Toast
  const [toast, setToast] = useState(null);

  // Custom Delete Confirmation Modal (NO native browser confirm)
  const [deleteTarget, setDeleteTarget] = useState(null); 
  // format: { type: 'society' | 'user' | 'event' | 'venue' | 'news', id, name, details }

  // Society Modal & Form
  const [showSocietyModal, setShowSocietyModal] = useState(false);
  const [editingSociety, setEditingSociety] = useState(null);

  // Bulk Operations State
  const [bulkEventId, setBulkEventId] = useState('');
  const [bulkFile, setBulkFile] = useState(null);
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [societyForm, setSocietyForm] = useState({
    name: '',
    description: '',
    cover_image: '',
    logo: '',
    vision: '',
    mission: '',
    contact_email: '',
    contact_phone: '',
    whatsapp_link: '',
    facebook_link: '',
    website_link: '',
    instagram_link: '',
    advisor: '',
    president: '',
    bank_name: 'Campus Trust Bank',
    bank_account_title: '',
    bank_account_number: '',
    payment_instructions: 'Please transfer registration fee to official society account and submit Transaction ID.'
  });

  const [bankQrFile, setBankQrFile] = useState(null);
  const [existingQrUrl, setExistingQrUrl] = useState('');
  const [presidentSearch, setPresidentSearch] = useState('');

  // User & Credential Modal & Form
  const [showUserModal, setShowUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [issuedCreds, setIssuedCreds] = useState(null);
  const [copiedCreds, setCopiedCreds] = useState(false);
  const [userStatusFilter, setUserStatusFilter] = useState('all'); // all, active, disabled

  // 1. Password Reset State
  const [resetPasswordTarget, setResetPasswordTarget] = useState(null);
  const [newPasswordVal, setNewPasswordVal] = useState('');
  const [resetSubmitting, setResetSubmitting] = useState(false);

  // 2. Change Role & Transfer Society State
  const [roleTransferTarget, setRoleTransferTarget] = useState(null);
  const [newRoleVal, setNewRoleVal] = useState('student');
  const [newSocietyVal, setNewSocietyVal] = useState('');
  const [roleTransferSubmitting, setRoleTransferSubmitting] = useState(false);

  // 3. Account Audit History State
  const [auditTarget, setAuditTarget] = useState(null);
  const [auditData, setAuditData] = useState(null);
  const [auditLoading, setAuditLoading] = useState(false);

  // 4. Student Profile Viewer
  const [selectedStudentProfile, setSelectedStudentProfile] = useState(null);

  const [userForm, setUserForm] = useState({
    username: '', first_name: '', last_name: '', email: '',
    role: 'president', society: '', password: '',
    roll_number: '', father_name: '', program: '', department: '',
    faculty_name: '', phone_number: ''
  });

  // Venue Modal & Form
  const [showVenueModal, setShowVenueModal] = useState(false);
  const [editingVenue, setEditingVenue] = useState(null);
  const [venueForm, setVenueForm] = useState({ name: '', capacity: 100 });

  // News Modal & Form
  const [showNewsModal, setShowNewsModal] = useState(false);
  const [newsForm, setNewsForm] = useState({ title: '', content: '' });

  // Proposal Verification Dossier Modal
  const [selectedProposalForVerify, setSelectedProposalForVerify] = useState(null);
  const [verificationForm, setVerificationForm] = useState({
    advisor_approved: false,
    chairman_approved: false,
    hod_approved: false,
    verification_notes: ''
  });

  // Edit Event Modal State (Poster & Details Update)
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventForm, setEventForm] = useState({
    title: '',
    description: '',
    venue_name: '',
    date: '',
    price: 0,
    is_paid: false,
    poster_image_url: '',
    chief_guest: ''
  });
  const [isUpdatingEvent, setIsUpdatingEvent] = useState(false);
  const [uploadingEventPoster, setUploadingEventPoster] = useState(false);

  const handleOpenEditEvent = (evt) => {
    setEditingEvent(evt);
    setEventForm({
      title: evt.title || '',
      description: evt.description || '',
      venue_name: evt.venue_name || '',
      date: evt.date ? evt.date.substring(0, 16) : '',
      price: evt.price || 0,
      is_paid: Boolean(evt.is_paid),
      poster_image_url: evt.poster_image_url || evt.image || '',
      chief_guest: evt.chief_guest || ''
    });
  };

  const handlePosterUploadForEvent = async (file) => {
    if (!file) return;
    try {
      setUploadingEventPoster(true);
      const url = await uploadFileToServer(file, 'posters');
      setEventForm(prev => ({ ...prev, poster_image_url: url }));
      showToast("Event poster uploaded successfully!");
    } catch (err) {
      alert("Failed to upload poster image.");
    } finally {
      setUploadingEventPoster(false);
    }
  };

  const handleSaveEditEvent = async (e) => {
    e.preventDefault();
    if (!editingEvent) return;
    try {
      setIsUpdatingEvent(true);
      const payload = {
        title: eventForm.title,
        description: eventForm.description,
        venue_name: eventForm.venue_name,
        price: eventForm.price,
        is_paid: eventForm.is_paid,
        chief_guest: eventForm.chief_guest,
        image: eventForm.poster_image_url,
        poster_image_url: eventForm.poster_image_url
      };
      if (eventForm.date) payload.date = eventForm.date;
      const res = await api.patch(`events/${editingEvent.id}/`, payload);
      setEvents(prev => prev.map(ev => ev.id === editingEvent.id ? { ...ev, ...res.data } : ev));
      showToast(`Event '${eventForm.title}' updated successfully.`);
      setEditingEvent(null);
    } catch (err) {
      alert(err.response?.data?.error || "Failed to update event details.");
    } finally {
      setIsUpdatingEvent(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAllData();
    }
  }, [user]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4500);
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [socRes, usersRes, evRes, regRes, venRes, newsRes, compRes, propRes, healthRes, backupRes, settRes, galRes] = await Promise.allSettled([
        api.get('societies/'),
        api.get('users/'),
        api.get('events/'),
        api.get('registrations/'),
        api.get('venues/'),
        api.get('news/'),
        api.get('complaints/'),
        api.get('proposals/'),
        api.get('system/health/'),
        api.get('backups/'),
        api.get('system-settings/'),
        api.get('gallery/')
      ]);

      if (socRes.status === 'fulfilled') setSocieties(socRes.value.data);
      if (usersRes.status === 'fulfilled') setUsersList(usersRes.value.data);
      if (evRes.status === 'fulfilled') setEvents(evRes.value.data);
      if (regRes.status === 'fulfilled') setPaidRegistrations(regRes.value.data);
      if (venRes.status === 'fulfilled') setVenues(venRes.value.data);
      if (newsRes.status === 'fulfilled') setNewsList(newsRes.value.data);
      if (compRes.status === 'fulfilled') setComplaintsList(compRes.value.data);
      if (propRes.status === 'fulfilled') setProposals(propRes.value.data);
      if (healthRes.status === 'fulfilled') setSystemHealth(healthRes.value.data);
      if (backupRes.status === 'fulfilled') setBackupsList(backupRes.value.data);
      if (galRes.status === 'fulfilled') setGalleryList(galRes.value.data);
      if (settRes.status === 'fulfilled' && settRes.value.data?.length > 0) {
        const found = settRes.value.data.find(s => s.key === 'portal_config');
        if (found && found.value) {
          setSystemSettingsForm(found.value);
        }
      }
    } catch (err) {
      console.error(err);
      showToast('Error syncing administrative records.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleTriggerBackup = async () => {
    setIsCreatingBackup(true);
    try {
      const res = await api.post('backups/trigger_backup/', {
        notes: 'Manual snapshot generated from Super Admin Command Center'
      });
      setBackupsList(prev => [res.data, ...prev]);
      showToast(`Database backup "${res.data.filename}" created successfully.`);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to trigger database backup.', 'error');
    } finally {
      setIsCreatingBackup(false);
    }
  };

  const handleDownloadBackup = async (bk) => {
    try {
      const res = await api.get(`backups/${bk.id}/download/`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', bk.filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      showToast(`Backup snapshot "${bk.filename}" downloaded successfully.`);
    } catch (err) {
      showToast('Failed to download backup snapshot.', 'error');
    }
  };

  const handleConfirmRestoreBackup = async () => {
    if (!restoreTargetBackup) return;
    setIsRestoringBackup(true);
    try {
      const res = await api.post(`backups/${restoreTargetBackup.id}/restore/`);
      showToast(res.data.message || `System restored to checkpoint: ${restoreTargetBackup.filename}`);
      setRestoreTargetBackup(null);
      await fetchAllData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to restore snapshot.', 'error');
    } finally {
      setIsRestoringBackup(false);
    }
  };

  const handleApproveNews = async (id, title) => {
    try {
      await api.post(`news/${id}/approve/`);
      setNewsList(prev => prev.map(n => n.id === id ? { ...n, status: 'approved' } : n));
      showToast(`Announcement "${title}" approved & published campus-wide.`);
    } catch (err) {
      showToast('Failed to approve news announcement.', 'error');
    }
  };

  const handleRejectNews = async (id, title) => {
    const reason = prompt(`Enter rejection reason for "${title}":`, 'Requires institutional revision or sensitive content adjustment');
    if (!reason) return;
    try {
      await api.post(`news/${id}/reject/`, { reason });
      setNewsList(prev => prev.map(n => n.id === id ? { ...n, status: 'rejected' } : n));
      showToast(`Announcement "${title}" marked as rejected.`);
    } catch (err) {
      showToast('Failed to reject news announcement.', 'error');
    }
  };

  const handleApproveGallery = async (id) => {
    try {
      await api.post(`gallery/${id}/approve/`);
      setGalleryList(prev => prev.map(g => g.id === id ? { ...g, status: 'approved' } : g));
      showToast('Gallery media item approved & published to campus showcase.');
    } catch (err) {
      showToast('Failed to approve gallery item.', 'error');
    }
  };

  const handleRejectGallery = async (id) => {
    try {
      await api.post(`gallery/${id}/reject/`);
      setGalleryList(prev => prev.map(g => g.id === id ? { ...g, status: 'rejected' } : g));
      showToast('Gallery media item rejected.');
    } catch (err) {
      showToast('Failed to reject gallery item.', 'error');
    }
  };

  const handleBroadcastNotification = async (e) => {
    e.preventDefault();
    if (!broadcastForm.message.trim()) {
      showToast('Broadcast message cannot be empty.', 'error');
      return;
    }
    setIsBroadcasting(true);
    try {
      const res = await api.post('notifications/broadcast/', broadcastForm);
      showToast(res.data.message || 'Notification broadcasted successfully.');
      setShowBroadcastModal(false);
      setBroadcastForm({ title: '', message: '', target_role: 'all' });
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to broadcast notification.', 'error');
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleSaveSystemSettings = async (e) => {
    e.preventDefault();
    try {
      await api.post('system-settings/', {
        key: 'portal_config',
        value: systemSettingsForm
      });
      showToast('System configuration & institutional settings saved live.');
    } catch (err) {
      showToast('Failed to update system settings.', 'error');
    }
  };

  // -------------------------------------------------------------
  // UNIVERSAL SAFE DELETION WITH INSTANT OPTIMISTIC UI
  // -------------------------------------------------------------
  const executeDelete = async () => {
    if (!deleteTarget) return;
    const { type, id, name } = deleteTarget;

    // 1. Optimistic UI update - vanishes instantly from the screen
    if (type === 'user') setUsersList(prev => prev.filter(u => u.id !== id));
    if (type === 'society') setSocieties(prev => prev.filter(s => s.id !== id));
    if (type === 'event') setEvents(prev => prev.filter(e => e.id !== id));
    if (type === 'venue') setVenues(prev => prev.filter(v => v.id !== id));
    if (type === 'news') setNewsList(prev => prev.filter(n => n.id !== id));
    if (type === 'complaint') setComplaintsList(prev => prev.filter(c => c.id !== id));

    setDeleteTarget(null);

    // 2. Perform backend delete
    try {
      const endpoint = 
        type === 'user' ? `users/${id}/` :
        type === 'society' ? `societies/${id}/` :
        type === 'event' ? `events/${id}/` :
        type === 'venue' ? `venues/${id}/` :
        type === 'news' ? `news/${id}/` :
        `complaints/${id}/`;

      await api.delete(endpoint);
      showToast(`${type.toUpperCase()} "${name}" permanently removed.`);
    } catch (err) {
      console.error(err);
      const errorMsg = err.response?.data?.error || err.response?.data?.detail || `Failed to delete ${type}. Re-syncing data.`;
      showToast(errorMsg, 'error');
      // Rollback by refetching fresh data
      fetchAllData();
    }
  };

  // -------------------------------------------------------------
  // SOCIETY CRUD (Deep Profile & Cross-Link Synchronization)
  // -------------------------------------------------------------
  const openEditSociety = (soc) => {
    setEditingSociety(soc);
    setBankQrFile(null);
    setExistingQrUrl(soc.payment_qr || soc.payment_qr_url || '');
    const social = soc.social_links || {};
    setSocietyForm({
      name: soc.name || '',
      description: soc.description || '',
      cover_image: soc.cover_image || '',
      logo: soc.logo || '',
      vision: soc.vision || '',
      mission: soc.mission || '',
      contact_email: soc.contact_email || '',
      contact_phone: soc.contact_phone || '',
      whatsapp_link: social.whatsapp || social.whatsapp_link || '',
      facebook_link: social.facebook || social.facebook_link || '',
      website_link: social.website || social.website_link || '',
      instagram_link: social.instagram || social.instagram_link || '',
      advisor: soc.advisor ? String(soc.advisor) : '',
      president: soc.president ? String(soc.president) : '',
      bank_name: soc.bank_name || 'Campus Trust Bank',
      bank_account_title: soc.bank_account_title || '',
      bank_account_number: soc.bank_account_number || '',
      payment_instructions: soc.payment_instructions || 'Please transfer fee to official society account.'
    });
    setShowSocietyModal(true);
  };

  const handleSaveSociety = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('name', societyForm.name);
      formData.append('description', societyForm.description || '');
      formData.append('cover_image', societyForm.cover_image || '');
      formData.append('logo', societyForm.logo || '');
      formData.append('vision', societyForm.vision || '');
      formData.append('mission', societyForm.mission || '');
      formData.append('contact_email', societyForm.contact_email || '');
      formData.append('contact_phone', societyForm.contact_phone || '');
      formData.append('social_links', JSON.stringify({
        whatsapp: societyForm.whatsapp_link || '',
        facebook: societyForm.facebook_link || '',
        website: societyForm.website_link || '',
        instagram: societyForm.instagram_link || ''
      }));
      if (societyForm.advisor) formData.append('advisor', societyForm.advisor);
      if (societyForm.president) formData.append('president', societyForm.president);
      formData.append('bank_name', societyForm.bank_name || '');
      formData.append('bank_account_title', societyForm.bank_account_title || '');
      formData.append('bank_account_number', societyForm.bank_account_number || '');
      formData.append('payment_instructions', societyForm.payment_instructions || '');

      if (bankQrFile) {
        formData.append('payment_qr', bankQrFile);
      }

      if (editingSociety) {
        const res = await api.put(`societies/${editingSociety.id}/`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setSocieties(prev => prev.map(s => s.id === editingSociety.id ? res.data : s));
        showToast(`Society "${societyForm.name}" updated successfully.`);
        window.dispatchEvent(new CustomEvent('dsms:society_updated', { detail: res.data }));
        localStorage.setItem('dsms:last_society_sync', JSON.stringify({ id: editingSociety.id, timestamp: Date.now() }));
      } else {
        const res = await api.post('societies/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        setSocieties(prev => [res.data, ...prev]);
        showToast(`Society "${societyForm.name}" registered live.`);
        window.dispatchEvent(new CustomEvent('dsms:society_updated', { detail: res.data }));
        localStorage.setItem('dsms:last_society_sync', JSON.stringify({ id: res.data.id, timestamp: Date.now() }));
      }

      setShowSocietyModal(false);
      setEditingSociety(null);
      setBankQrFile(null);
      setExistingQrUrl('');
      fetchAllData();
    } catch (err) {
      showToast(err.response?.data?.name?.[0] || err.response?.data?.error || err.response?.data?.detail || 'Failed to save society details.', 'error');
    }
  };

  // -------------------------------------------------------------
  // USER CREDENTIALS & ACCOUNT MANAGEMENT (Super Admin Powers)
  // -------------------------------------------------------------
  const handleOpenCreateUser = (presetRole = 'president') => {
    setEditingUser(null);
    setUserForm({
      username: '',
      first_name: '',
      last_name: '',
      email: '',
      role: presetRole,
      society: societies.length > 0 ? String(societies[0].id) : '',
      password: '',
      roll_number: '',
      father_name: '',
      program: '',
      department: '',
      faculty_name: '',
      phone_number: ''
    });
    setIssuedCreds(null);
    setShowUserModal(true);
  };

  const handleEditUser = (u) => {
    setEditingUser(u);
    setUserForm({
      username: u.username || '',
      first_name: u.first_name || '',
      last_name: u.last_name || '',
      email: u.email || '',
      role: u.role || 'student',
      society: u.society ? String(u.society) : '',
      password: '',
      roll_number: u.roll_number || '',
      father_name: u.father_name || '',
      program: u.program || '',
      department: u.department || '',
      faculty_name: u.faculty_name || '',
      phone_number: u.phone_number || ''
    });
    setIssuedCreds(null);
    setShowUserModal(true);
  };

  const handleSaveUserCredentials = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        username: userForm.username.toLowerCase().trim(),
        first_name: userForm.first_name,
        last_name: userForm.last_name,
        email: userForm.email,
        role: userForm.role,
        society: userForm.society ? parseInt(userForm.society) : null,
        roll_number: userForm.roll_number || '',
        father_name: userForm.father_name || '',
        program: userForm.program || '',
        department: userForm.department || '',
        faculty_name: userForm.faculty_name || '',
        phone_number: userForm.phone_number || ''
      };

      if (editingUser) {
        if (userForm.password && userForm.password.trim()) {
          payload.password = userForm.password.trim();
        }
        const res = await api.patch(`users/${editingUser.id}/`, payload);
        setUsersList(prev => prev.map(u => u.id === editingUser.id ? res.data : u));
        showToast(`Account details for @${payload.username} updated.`);
        setShowUserModal(false);
        setEditingUser(null);
      } else {
        const generatedPassword = userForm.password.trim() || `Campus@${Math.floor(1000 + Math.random() * 9000)}`;
        payload.password = generatedPassword;

        const res = await api.post('users/', payload);
        setUsersList(prev => [res.data, ...prev]);
        setIssuedCreds({
          username: payload.username,
          password: generatedPassword,
          role: payload.role,
          name: `${payload.first_name} ${payload.last_name}`.trim() || payload.username,
          society: societies.find(s => s.id === parseInt(userForm.society))?.name || 'Campus Wide'
        });
        showToast(`Official ${payload.role.toUpperCase()} account provisioned for @${payload.username}.`);
        setShowUserModal(false);
      }

      setUserForm({
        username: '', first_name: '', last_name: '', email: '',
        role: 'president', society: '', password: '',
        roll_number: '', father_name: '', program: '', department: '',
        faculty_name: '', phone_number: ''
      });
    } catch (err) {
      showToast(err.response?.data?.username?.[0] || err.response?.data?.email?.[0] || err.response?.data?.error || 'Failed to save account.', 'error');
    }
  };

  // Toggle user active status
  const handleToggleUserActive = async (u) => {
    if (u.id === user?.id) {
      showToast('Cannot disable your own active Super Admin session.', 'error');
      return;
    }
    try {
      const res = await api.post(`users/${u.id}/toggle_active/`);
      setUsersList(prev => prev.map(item => item.id === u.id ? { ...item, is_active: res.data.is_active } : item));
      showToast(res.data.message || `Account for @${u.username} status updated.`);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to toggle account status.', 'error');
    }
  };

  // Open reset password modal
  const handleOpenResetPassword = (u) => {
    setResetPasswordTarget(u);
    setNewPasswordVal(`Campus@${Math.floor(1000 + Math.random() * 9000)}`);
  };

  // Execute reset password
  const handleExecuteResetPassword = async (e) => {
    e.preventDefault();
    if (!resetPasswordTarget) return;
    setResetSubmitting(true);
    try {
      const res = await api.post(`users/${resetPasswordTarget.id}/reset_password/`, { password: newPasswordVal });
      setIssuedCreds({
        username: resetPasswordTarget.username,
        password: newPasswordVal,
        role: resetPasswordTarget.role,
        name: `${resetPasswordTarget.first_name || ''} ${resetPasswordTarget.last_name || ''}`.trim() || resetPasswordTarget.username,
        society: resetPasswordTarget.society_name || 'Campus Wide'
      });
      showToast(res.data.message || `Password for @${resetPasswordTarget.username} has been reset.`);
      setResetPasswordTarget(null);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to reset password.', 'error');
    } finally {
      setResetSubmitting(false);
    }
  };

  // Open Role Change & Society Transfer Modal
  const handleOpenRoleTransfer = (u) => {
    setRoleTransferTarget(u);
    setNewRoleVal(u.role || 'student');
    setNewSocietyVal(u.society ? String(u.society) : '');
  };

  // Execute Role Change & Society Transfer
  const handleExecuteRoleTransfer = async (e) => {
    e.preventDefault();
    if (!roleTransferTarget) return;
    setRoleTransferSubmitting(true);
    try {
      const roleChanged = newRoleVal !== roleTransferTarget.role;
      const targetSocId = newSocietyVal ? parseInt(newSocietyVal) : null;
      
      if (roleChanged) {
        await api.post(`users/${roleTransferTarget.id}/change_role/`, {
          role: newRoleVal,
          society_id: targetSocId,
          clear_society: !newSocietyVal
        });
      } else {
        await api.post(`users/${roleTransferTarget.id}/transfer_society/`, {
          society_id: targetSocId
        });
      }

      // Re-fetch users and societies to ensure all linkages are in full sync
      const [usersRes, socRes] = await Promise.all([
        api.get('users/'),
        api.get('societies/')
      ]);
      setUsersList(usersRes.data);
      setSocieties(socRes.data);

      showToast(`Role & Society responsibility updated for @${roleTransferTarget.username}.`);
      setRoleTransferTarget(null);
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update role or transfer society.', 'error');
    } finally {
      setRoleTransferSubmitting(false);
    }
  };

  // Open Audit History Modal
  const handleOpenAuditHistory = async (u) => {
    setAuditTarget(u);
    setAuditLoading(true);
    setAuditData(null);
    try {
      const res = await api.get(`users/${u.id}/audit_history/`);
      setAuditData(res.data);
    } catch (err) {
      showToast('Failed to retrieve user audit history.', 'error');
    } finally {
      setAuditLoading(false);
    }
  };

  // -------------------------------------------------------------
  // EVENTS & PROPOSAL VERIFICATION DESK
  // -------------------------------------------------------------
  const handleApproveEvent = async (id, title) => {
    try {
      await api.post(`events/${id}/approve/`);
      setEvents(prev => prev.map(e => e.id === id ? { ...e, status: 'approved' } : e));
      showToast(`Event "${title}" approved and live on campus calendar.`);
    } catch (e) {
      showToast('Error approving event proposal.', 'error');
    }
  };

  const handleRejectEvent = async (id, title) => {
    const reason = prompt(`Enter rejection reason for "${title}":`, 'Date conflict, incomplete paperwork, or safety review');
    if (!reason) return;
    try {
      await api.post(`events/${id}/reject/`, { reason });
      setEvents(prev => prev.map(e => e.id === id ? { ...e, status: 'rejected' } : e));
      showToast(`Proposal "${title}" returned for revision.`);
    } catch (e) {
      showToast('Error rejecting proposal.', 'error');
    }
  };

  const openVerifyModal = (evt) => {
    setSelectedProposalForVerify(evt);
    setVerificationForm({
      advisor_approved: Boolean(evt.advisor_approved),
      chairman_approved: Boolean(evt.chairman_approved),
      hod_approved: Boolean(evt.hod_approved),
      verification_notes: evt.verification_notes || ''
    });
  };

  const handleSaveVerification = async (actionType = 'save') => {
    if (!selectedProposalForVerify) return;
    try {
      await api.post(`events/${selectedProposalForVerify.id}/verify_proposal/`, {
        advisor_approved: verificationForm.advisor_approved,
        chairman_approved: verificationForm.chairman_approved,
        hod_approved: verificationForm.hod_approved,
        verification_notes: verificationForm.verification_notes,
        action: actionType
      });

      if (actionType === 'approve') {
        setEvents(prev => prev.map(e => e.id === selectedProposalForVerify.id ? { ...e, status: 'approved', ...verificationForm } : e));
        showToast(`Event "${selectedProposalForVerify.title}" fully sanctioned live!`);
      } else if (actionType === 'reject') {
        setEvents(prev => prev.map(e => e.id === selectedProposalForVerify.id ? { ...e, status: 'rejected', ...verificationForm } : e));
        showToast(`Proposal "${selectedProposalForVerify.title}" returned for revisions.`);
      } else {
        setEvents(prev => prev.map(e => e.id === selectedProposalForVerify.id ? { ...e, ...verificationForm } : e));
        showToast("Physical verification checklist saved.");
      }
      setSelectedProposalForVerify(null);
    } catch (err) {
      showToast(err.response?.data?.error || "Failed to update proposal verification.", 'error');
    }
  };

  // -------------------------------------------------------------
  // TICKET RECEIPTS VERIFICATION
  // -------------------------------------------------------------
  const handleVerifyPayment = async (regId, studentName) => {
    try {
      await api.post(`registrations/${regId}/verify_payment/`);
      setPaidRegistrations(prev => prev.map(r => r.id === regId ? { ...r, payment_status: 'verified' } : r));
      showToast(`Payment confirmed for ${studentName}! Digital pass issued.`);
    } catch (err) {
      showToast("Payment verification failed.", 'error');
    }
  };

  const handleBulkApprove = async () => {
    if (!bulkEventId) return showToast("Please select an event.", "error");
    setIsBulkProcessing(true);
    try {
      const res = await api.post('registrations/bulk_approve/', { event_id: bulkEventId });
      showToast(res.data.status);
      fetchAllData();
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to bulk approve.', 'error');
    } finally {
      setIsBulkProcessing(false);
    }
  };

  const handleBulkIssueCSV = async (e) => {
    e.preventDefault();
    if (!bulkEventId) return showToast("Please select an event.", "error");
    if (!bulkFile) return showToast("Please select a file.", "error");
    setIsBulkProcessing(true);

    const ext = bulkFile.name.split('.').pop().toLowerCase();

    const processText = async (text) => {
      try {
        const rollNumbers = text.match(/\b([A-Z0-9-]{6,15})\b/gi) || [];
        if (rollNumbers.length === 0) {
          setIsBulkProcessing(false);
          return showToast("No valid roll numbers found in file.", "error");
        }
        
        const res = await api.post('registrations/bulk_issue_tickets/', {
          event_id: bulkEventId,
          roll_numbers: rollNumbers
        });
        showToast(res.data.status);
        fetchAllData();
        setBulkFile(null); // Clear file input after success
      } catch (err) {
        showToast(err.response?.data?.error || 'Failed to bulk issue tickets.', 'error');
      } finally {
        setIsBulkProcessing(false);
      }
    };

    if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader();
      reader.onload = (event) => {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        let fullText = '';
        workbook.SheetNames.forEach(sheetName => {
          fullText += XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]) + '\n';
        });
        processText(fullText);
      };
      reader.readAsArrayBuffer(bulkFile);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        processText(event.target.result);
      };
      reader.readAsText(bulkFile);
    }
  };

  // -------------------------------------------------------------
  // VENUES MANAGEMENT (Add, Edit, Delete)
  // -------------------------------------------------------------
  const handleSaveVenue = async (e) => {
    e.preventDefault();
    try {
      if (editingVenue) {
        const res = await api.put(`venues/${editingVenue.id}/`, venueForm);
        setVenues(prev => prev.map(v => v.id === editingVenue.id ? res.data : v));
        showToast(`Venue "${venueForm.name}" updated.`);
      } else {
        const res = await api.post('venues/', venueForm);
        setVenues(prev => [...prev, res.data]);
        showToast(`Campus venue "${venueForm.name}" registered.`);
      }
      setShowVenueModal(false);
      setEditingVenue(null);
      setVenueForm({ name: '', capacity: 100 });
    } catch (e) {
      showToast("Failed to save venue.", 'error');
    }
  };

  // -------------------------------------------------------------
  // CAMPUS NEWS / BULLETINS
  // -------------------------------------------------------------
  const handleSaveNews = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post('news/', newsForm);
      setNewsList(prev => [res.data, ...prev]);
      setShowNewsModal(false);
      setNewsForm({ title: '', content: '' });
      showToast("Campus bulletin broadcasted live.");
    } catch (e) {
      showToast("Failed to post news.", 'error');
    }
  };

  // -------------------------------------------------------------
  // COMPLAINT STATUS
  // -------------------------------------------------------------
  const handleUpdateComplaintStatus = async (comp, newStatus) => {
    try {
      const res = await api.patch(`complaints/${comp.id}/`, { status: newStatus });
      setComplaintsList(prev => prev.map(c => c.id === comp.id ? res.data : c));
      showToast(`Complaint status updated to: ${newStatus.toUpperCase()}`);
    } catch (e) {
      showToast("Failed to update complaint status.", 'error');
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white font-sans">
        <div className="bg-slate-900 border border-rose-500/30 p-8 rounded-3xl max-w-md text-center shadow-2xl">
          <ShieldCheck className="text-rose-500 mx-auto mb-3" size={48} />
          <h2 className="text-xl font-black">Restricted Clearance</h2>
          <p className="text-xs text-slate-400 mt-2">Only accredited Super Administrators can access the central command system.</p>
        </div>
      </div>
    );
  }

  // Filtered lists
  const advisorsList = usersList.filter(u => u.role === 'faculty');
  const presidentsList = usersList.filter(u => u.role === 'president');

  const baseUserFilter = (u) => {
    if (userStatusFilter === 'active' && !u.is_active) return false;
    if (userStatusFilter === 'disabled' && u.is_active) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.first_name && u.first_name.toLowerCase().includes(q)) ||
      (u.last_name && u.last_name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.roll_number && u.roll_number.toLowerCase().includes(q)) ||
      (u.society_name && u.society_name.toLowerCase().includes(q))
    );
  };

  // Executive accounts: presidents, faculty advisors, admins
  const filteredExecutiveUsers = usersList.filter(u => {
    if (!['president', 'faculty', 'admin'].includes(u.role)) return false;
    if (roleFilter !== 'all' && !['all', 'president', 'faculty', 'admin'].includes(roleFilter)) return false;
    if (roleFilter !== 'all' && u.role !== roleFilter) return false;
    return baseUserFilter(u);
  });

  // Student accounts only
  const filteredStudentUsers = usersList.filter(u => {
    if (u.role !== 'student') return false;
    return baseUserFilter(u);
  });

  // Legacy alias used in the rest of the file (now points to the active sub-tab's list)
  const filteredUsers = credentialsSubTab === 'executive' ? filteredExecutiveUsers : filteredStudentUsers;

  const filteredEvents = events.filter(e => {
    if (eventStatusFilter !== 'all' && e.status !== eventStatusFilter) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      e.title.toLowerCase().includes(q) ||
      (e.society_name && e.society_name.toLowerCase().includes(q))
    );
  });

  const pendingRegistrations = paidRegistrations.filter(r => r.payment_status === 'pending');
  const pendingEventsCount = events.filter(e => e.status === 'pending').length;
  const totalRevenue = paidRegistrations
    .filter(r => r.payment_status === 'verified')
    .reduce((sum, r) => sum + parseFloat(r.event_price || 0), 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-4 border-slate-800 border-t-rose-500 rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(244,63,94,0.5)]"></div>
        <p className="text-sm font-bold text-slate-400 animate-pulse tracking-widest uppercase">Initializing Admin Console...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8 font-sans selection:bg-rose-500 selection:text-white">
      {/* Background Ambient Glows */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-rose-600/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed bottom-10 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto space-y-8">

        {/* TOAST ALERTS */}
        {toast && (
          <div className={`fixed top-24 right-6 z-50 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border backdrop-blur-xl animate-in fade-in slide-in-from-top-4 ${
            toast.type === 'error' 
              ? 'bg-rose-950/90 text-rose-200 border-rose-500' 
              : 'bg-emerald-950/90 text-emerald-200 border-emerald-500'
          }`}>
            {toast.type === 'error' ? <AlertTriangle size={18} className="text-rose-400" /> : <CheckCircle2 size={18} className="text-emerald-400" />}
            <span className="text-xs font-bold">{toast.msg}</span>
          </div>
        )}

        {/* COMMAND CENTER HEADER */}
        <div className="bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-slate-950/90 border border-slate-800 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <span className="text-[11px] font-black uppercase tracking-wider text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
                Executive Command System
              </span>
              <span className="text-xs font-mono text-slate-400">Total System Authority</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight flex items-center gap-3">
              <ShieldCheck className="text-rose-500" size={38} /> DSMS Administration Console
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm max-w-2xl font-medium">
              Real-time synchronization across university societies, executive credentials, event clearances, paid ticket transactions, and campus venues.
            </p>
          </div>

          {/* Quick Universal Actions */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => {
                setEditingSociety(null);
                setBankQrFile(null);
                setExistingQrUrl('');
                setSocietyForm({
                  name: '', description: '', cover_image: '', logo: '',
                  vision: '', mission: '', contact_email: '', contact_phone: '',
                  whatsapp_link: '', facebook_link: '', website_link: '', instagram_link: '',
                  advisor: '', president: '', bank_name: 'Campus Trust Bank',
                  bank_account_title: '', bank_account_number: '',
                  payment_instructions: 'Please transfer fee to official society account.'
                });
                setShowSocietyModal(true);
              }}
              className="bg-rose-600 hover:bg-rose-500 text-white px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-rose-600/30 transition hover:-translate-y-0.5 cursor-pointer"
            >
              <PlusCircle size={15} /> Add Society
            </button>
            <button
              onClick={() => {
                setEditingUser(null);
                setIssuedCreds(null);
                setUserForm({
                  username: '', first_name: '', last_name: '', email: '',
                  role: 'president', society: '', password: '',
                  roll_number: '', father_name: '', program: '', department: '',
                  faculty_name: '', phone_number: ''
                });
                setShowUserModal(true);
              }}
              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 transition hover:-translate-y-0.5 cursor-pointer"
            >
              <Users size={15} /> Issue Credentials
            </button>
            <button
              onClick={() => setShowNewsModal(true)}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 transition cursor-pointer"
            >
              <Megaphone size={15} /> Broadcast Bulletin
            </button>
            <button
              onClick={() => setShowBroadcastModal(true)}
              className="bg-purple-600 hover:bg-purple-500 text-white px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-purple-600/30 transition cursor-pointer"
            >
              <Send size={15} /> Targeted Alert
            </button>
            <Link
              to="/attendance"
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-emerald-600/30 transition cursor-pointer"
            >
              <QrCode size={15} /> Attendance Scanner
            </Link>
            <Link
              to="/membership-roster"
              className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-lg shadow-sky-600/30 transition cursor-pointer"
            >
              <Users size={15} /> Membership Roster
            </Link>
          </div>
        </div>

        {/* REAL-TIME KPI METRICS RIBBON */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-3xl relative overflow-hidden group hover:border-rose-500/40 transition">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider">Societies</span>
              <Building size={18} className="text-rose-400" />
            </div>
            <p className="text-3xl font-black text-white">{societies.length}</p>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-medium">
              <span className="text-emerald-400 font-bold">{societies.filter(s => s.president).length}</span> with active presidents
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-3xl relative overflow-hidden group hover:border-indigo-500/40 transition">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider">Accounts Vault</span>
              <Users size={18} className="text-indigo-400" />
            </div>
            <p className="text-3xl font-black text-white">{usersList.length}</p>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-medium">
              <span className="text-indigo-400 font-bold">{advisorsList.length}</span> Advisors • <span className="text-violet-400 font-bold">{presidentsList.length}</span> Presidents
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-3xl relative overflow-hidden group hover:border-violet-500/40 transition">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider">Campus Events</span>
              <Calendar size={18} className="text-violet-400" />
            </div>
            <p className="text-3xl font-black text-white">{events.length}</p>
            <p className="text-[11px] text-amber-400 mt-1 font-bold flex items-center gap-1">
              <Clock size={12} /> {pendingEventsCount} pending sanction
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-3xl relative overflow-hidden group hover:border-emerald-500/40 transition">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider">Fee Collection</span>
              <DollarSign size={18} className="text-emerald-400" />
            </div>
            <p className="text-3xl font-black text-emerald-400">PKR {totalRevenue.toFixed(0)}</p>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 font-medium">
              <span className="text-amber-400 font-bold">{pendingRegistrations.length}</span> pending payment slips
            </p>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 p-5 rounded-3xl relative overflow-hidden group hover:border-sky-500/40 transition">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-[11px] font-black uppercase tracking-wider">Venues & Facilities</span>
              <Map size={18} className="text-sky-400" />
            </div>
            <p className="text-3xl font-black text-white">{venues.length}</p>
            <p className="text-[11px] text-sky-400 mt-1 font-medium">Active Campus Spaces</p>
          </div>
        </div>

        {/* TAB CONTROLS & SEARCH BAR */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-3 flex flex-col md:flex-row md:items-center justify-between gap-4 sticky top-20 z-30 backdrop-blur-xl shadow-xl">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            {[
              { id: 'societies', label: `Societies (${societies.length})`, icon: Building },
              { id: 'users', label: `Accounts & Credentials (${usersList.length})`, icon: Users },
              { id: 'events', label: `Events & Clearance (${events.length})`, icon: CheckSquare },
              { id: 'receipts', label: `Fee Receipts (${pendingRegistrations.length} Pending)`, icon: CreditCard },
              { id: 'ticketing', label: `Bulk Ticketing`, icon: Layers },
              { id: 'venues', label: `Venues (${venues.length})`, icon: Map },
              { id: 'news', label: `Campus News (${newsList.length})`, icon: Megaphone },
              { id: 'gallery', label: `Media Showcase (${galleryList.length})`, icon: ImageIcon },
              { id: 'complaints', label: `Complaints (${complaintsList.length})`, icon: MessageSquare },
              { id: 'system', label: 'System & Backups', icon: ShieldAlert }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                    isActive 
                      ? 'bg-rose-600 text-white shadow-lg shadow-rose-600/30' 
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
                  }`}
                >
                  <Icon size={15} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Search box */}
          <div className="relative min-w-[240px]">
            <Search className="absolute left-3.5 top-2.5 text-slate-400" size={15} />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-2xl text-xs font-medium text-white placeholder-slate-500 outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
            />
          </div>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: SOCIETIES REGISTRY (WITH COMPLETE PROFILE & LINKS)  */}
        {/* ========================================================= */}
        {activeTab === 'societies' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Building className="text-rose-500" /> University Societies Registry ({societies.length})
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Manage departmental society profiles, leadership assignments, social media, and banking details.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {societies
                .filter(s => !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase()) || (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase())))
                .map(soc => {
                  const pres = usersList.find(u => u.id === soc.president);
                  const adv = usersList.find(u => u.id === soc.advisor);
                  const social = soc.social_links || {};

                  return (
                    <div 
                      key={soc.id} 
                      className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl hover:border-slate-700 transition flex flex-col justify-between group relative overflow-hidden"
                    >
                      {/* Cover Photo Backdrop if present */}
                      {soc.cover_image && (
                        <div className="absolute top-0 left-0 right-0 h-24 overflow-hidden -z-0 opacity-20 group-hover:opacity-30 transition">
                          <img src={soc.cover_image} alt="" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900" />
                        </div>
                      )}

                      <div className="relative z-10">
                        {/* Header Row */}
                        <div className="flex items-start justify-between gap-3 mb-4">
                          <div className="flex items-center gap-3">
                            {soc.logo ? (
                              <img src={soc.logo} alt="" className="w-12 h-12 rounded-2xl object-cover border border-slate-700 bg-slate-950 p-1 shadow-md" />
                            ) : (
                              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-400 font-black text-lg flex items-center justify-center">
                                {soc.name.substring(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <h3 className="font-black text-white text-base leading-snug group-hover:text-rose-400 transition">
                                {soc.name}
                              </h3>
                              <span className="text-[10px] text-slate-500 font-mono">ID #{soc.id}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 bg-slate-950/80 border border-slate-800 p-1 rounded-xl">
                            <button
                              onClick={() => openEditSociety(soc)}
                              className="p-1.5 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg transition cursor-pointer"
                              title="Edit Full Society Profile & Bank Accounts"
                            >
                              <Edit3 size={14} />
                            </button>
                            <button
                              onClick={() => setDeleteTarget({
                                type: 'society',
                                id: soc.id,
                                name: soc.name,
                                details: 'All associated events, registrations, budgets, and cabinet positions will be unlinked.'
                              })}
                              className="p-1.5 hover:bg-rose-500/20 text-rose-400 rounded-lg transition cursor-pointer"
                              title="Delete Society"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Description */}
                        <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                          {soc.description || 'No description added yet for this departmental society.'}
                        </p>

                        {/* Key Leadership Assignments */}
                        <div className="space-y-2 bg-slate-950/60 border border-slate-800/80 rounded-2xl p-3 text-xs mb-4">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">President</span>
                            <span className="font-semibold text-slate-200">
                              {pres ? `${pres.first_name} ${pres.last_name || ''} (@${pres.username})` : (soc.president_name || 'Unassigned')}
                            </span>
                          </div>
                          <div className="flex items-center justify-between border-t border-slate-800/60 pt-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Faculty Advisor</span>
                            <span className="font-semibold text-indigo-300">
                              {adv ? `${adv.first_name} ${adv.last_name || ''} (@${adv.username})` : (soc.advisor_name || 'Unassigned')}
                            </span>
                          </div>
                          <div className="flex items-center justify-between border-t border-slate-800/60 pt-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Bank Account</span>
                            <span className="font-mono text-[11px] text-emerald-400">
                              {soc.bank_account_number || 'PK82...'}
                            </span>
                          </div>
                        </div>

                        {/* Social Links Row */}
                        <div className="flex items-center gap-2 mb-4 text-xs text-slate-400">
                          {social.whatsapp && (
                            <a href={social.whatsapp} target="_blank" rel="noreferrer" className="p-1.5 bg-slate-800 hover:bg-emerald-600 hover:text-white rounded-lg transition" title="WhatsApp Channel / Group">
                              <Phone size={13} />
                            </a>
                          )}
                          {social.facebook && (
                            <a href={social.facebook} target="_blank" rel="noreferrer" className="p-1.5 bg-slate-800 hover:bg-blue-600 hover:text-white rounded-lg transition" title="Facebook Page">
                              <Globe size={13} />
                            </a>
                          )}
                          {social.website && (
                            <a href={social.website} target="_blank" rel="noreferrer" className="p-1.5 bg-slate-800 hover:bg-indigo-600 hover:text-white rounded-lg transition" title="Official Website">
                              <ExternalLink size={13} />
                            </a>
                          )}
                          {soc.contact_email && (
                            <span className="text-[11px] text-slate-500 truncate" title={soc.contact_email}>
                              {soc.contact_email}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Card Actions: DIRECT CONNECTIONS TO OTHER PAGES */}
                      <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2 text-xs relative z-10">
                        <Link
                          to={`/societies/${soc.id}`}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition"
                          title="Open public society page"
                        >
                          <Eye size={13} /> Public Page
                        </Link>
                        <Link
                          to="/gallery"
                          className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 transition"
                          title="View Society Photo Showcase"
                        >
                          <ImageIcon size={13} /> Showcase
                        </Link>
                        <button
                          onClick={() => openEditSociety(soc)}
                          className="text-rose-400 hover:text-rose-300 font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          Configure <ArrowUpRight size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: OFFICIAL ACCOUNTS & CREDENTIALS VAULT              */}
        {/* ========================================================= */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Sub-Tab Switcher */}
            <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 p-1 rounded-2xl w-fit">
              <button
                onClick={() => { setCredentialsSubTab('executive'); setRoleFilter('all'); setSearchQuery(''); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                  credentialsSubTab === 'executive'
                    ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <UserCog size={14} />
                Executive & Faculty ({filteredExecutiveUsers.length})
              </button>
              <button
                onClick={() => { setCredentialsSubTab('students'); setRoleFilter('all'); setSearchQuery(''); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${
                  credentialsSubTab === 'students'
                    ? 'bg-slate-700 text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Users size={14} />
                Student Accounts ({filteredStudentUsers.length})
              </button>
            </div>

            {/* Sub-Tab Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 p-6 rounded-3xl backdrop-blur-xl">
              <div className="flex items-center gap-2.5">
                <div className={`p-2.5 rounded-2xl border ${credentialsSubTab === 'executive' ? 'bg-violet-600/20 text-violet-400 border-violet-500/30' : 'bg-slate-700/30 text-slate-300 border-slate-700'}`}>
                  {credentialsSubTab === 'executive' ? <UserCog size={22} /> : <Users size={22} />}
                </div>
                <div>
                  {credentialsSubTab === 'executive' ? (
                    <>
                      <h2 className="text-xl font-black text-white">Executive & Faculty Credentials</h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Super Admin authority: Provision President & Faculty accounts, transfer society roles, reset passwords, and manage access.
                      </p>
                    </>
                  ) : (
                    <>
                      <h2 className="text-xl font-black text-white">Student Account Registry</h2>
                      <p className="text-xs text-slate-400 mt-0.5">
                        View-only overview of all registered student accounts. Students self-register and manage their own credentials.
                      </p>
                    </>
                  )}
                </div>
              </div>
              {credentialsSubTab === 'executive' && (
                <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                  <button
                    onClick={() => handleOpenCreateUser('president')}
                    className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-black px-4 py-2.5 rounded-2xl text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/25 transition cursor-pointer"
                  >
                    <UserPlus size={16} />
                    <span>+ Provision Executive Account</span>
                  </button>
                </div>
              )}
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-950/60 border border-slate-800/80 p-3 rounded-2xl">
              {/* Search input */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" size={15} />
                <input
                  type="text"
                  placeholder={credentialsSubTab === 'executive' ? 'Search president/faculty by name, @username, society...' : 'Search student by name, roll no, email...'}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition"
                />
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                {/* Executive role filter — only shown on executive sub-tab */}
                {credentialsSubTab === 'executive' && (
                  <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                    {['all', 'president', 'faculty', 'admin'].map(r => (
                      <button
                        key={r}
                        onClick={() => setRoleFilter(r)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold capitalize transition cursor-pointer ${
                          roleFilter === r ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {r === 'faculty' ? 'Faculty' : r === 'all' ? `All (${filteredExecutiveUsers.length})` : r}
                      </button>
                    ))}
                  </div>
                )}

                {/* Status filter */}
                <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
                  {[
                    { id: 'all', label: 'All Status' },
                    { id: 'active', label: 'Active' },
                    { id: 'disabled', label: 'Disabled' }
                  ].map(s => (
                    <button
                      key={s.id}
                      onClick={() => setUserStatusFilter(s.id)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                        userStatusFilter === s.id ? 'bg-slate-700 text-white font-black' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Credential Slip Alert if newly issued */}
            {issuedCreds && (
              <div className="bg-emerald-950/80 text-emerald-100 rounded-3xl p-6 border border-emerald-500/50 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 animate-in fade-in">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 bg-emerald-900/60 px-2.5 py-1 rounded-full border border-emerald-400/40">
                    Official Login Credentials Generated
                  </span>
                  <h3 className="text-lg font-black mt-2">Issued for {issuedCreds.name} ({issuedCreds.role.toUpperCase()})</h3>
                  <div className="flex flex-wrap gap-4 mt-2 text-xs font-mono">
                    <span className="bg-white/10 px-3 py-1 rounded-lg">Username: <strong>{issuedCreds.username}</strong></span>
                    <span className="bg-white/10 px-3 py-1 rounded-lg">Password: <strong>{issuedCreds.password}</strong></span>
                    <span className="bg-white/10 px-3 py-1 rounded-lg">Society: <strong>{issuedCreds.society}</strong></span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(`DSMS Login Credentials:\nUsername: ${issuedCreds.username}\nPassword: ${issuedCreds.password}\nRole: ${issuedCreds.role}\nPortal URL: ${window.location.origin}/login`);
                    setCopiedCreds(true);
                    setTimeout(() => setCopiedCreds(false), 3000);
                  }}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-5 py-2.5 rounded-2xl text-xs flex items-center gap-1.5 transition cursor-pointer shrink-0"
                >
                  {copiedCreds ? <Check size={16} /> : <Copy size={16} />}
                  <span>{copiedCreds ? 'Copied to Clipboard!' : 'Copy Credentials Slip'}</span>
                </button>
              </div>
            )}

            {/* Users Table */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl shadow-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[11px] font-black uppercase tracking-wider text-slate-400 bg-slate-950/70">
                      <th className="py-3.5 px-5">{credentialsSubTab === 'executive' ? 'Executive Identity' : 'Student Identity'}</th>
                      <th className="py-3.5 px-5">Role & Society</th>
                      <th className="py-3.5 px-5">Status</th>
                      <th className="py-3.5 px-5">Joined</th>
                      <th className="py-3.5 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-xs font-medium text-slate-300">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan="5" className="py-12 text-center text-slate-500 font-medium">
                          No user accounts match the current filter or search criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map(u => (
                        <tr
                          key={u.id}
                          className={`group hover:bg-slate-800/40 transition ${credentialsSubTab === 'students' ? 'cursor-pointer hover:bg-indigo-900/20' : ''}`}
                          onClick={() => credentialsSubTab === 'students' && setSelectedStudentProfile(u)}
                        >
                          {/* 1. Identity */}
                          <td className="py-3.5 px-5">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-2xl overflow-hidden flex items-center justify-center font-bold text-xs uppercase shadow-md ${
                                u.role === 'admin' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                                u.role === 'faculty' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' :
                                u.role === 'president' ? 'bg-violet-500/20 text-violet-400 border border-violet-500/30' :
                                'bg-slate-800 text-slate-300 border border-slate-700'
                              }`}>
                                {u.avatar_url ? (
                                  <img src={u.avatar_url} alt={u.username} className="w-full h-full object-cover" />
                                ) : (
                                  u.first_name ? u.first_name.charAt(0) : u.username.charAt(0)
                                )}
                              </div>
                              <div>
                                <span className="font-bold text-white block text-sm">
                                  {u.first_name || u.last_name ? `${u.first_name} ${u.last_name || ''}` : u.username}
                                </span>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="font-mono text-slate-400 text-[11px]">@{u.username}</span>
                                  {u.roll_number && (
                                    <span className="font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 text-[10px]">
                                      {u.roll_number}
                                    </span>
                                  )}
                                  {u.father_name && (
                                    <span className="text-slate-500 text-[10px] hidden sm:inline">S/D of {u.father_name}</span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-500 mt-0.5">
                                  {u.email || 'No email registered'}
                                </div>
                                {credentialsSubTab === 'students' && (
                                  <div className="mt-1.5 flex items-center gap-1 text-[10px] font-bold text-indigo-400 opacity-0 group-hover:opacity-100 transition">
                                    <Eye size={11} />
                                    <span>Click to view full profile</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* 2. Role & Society */}
                          <td className="py-3.5 px-5">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border inline-flex items-center gap-1 ${
                                  u.role === 'admin' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                                  u.role === 'faculty' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' :
                                  u.role === 'president' ? 'bg-violet-500/10 text-violet-400 border-violet-500/30' :
                                  'bg-slate-800 text-slate-300 border-slate-700'
                                }`}>
                                  {u.role === 'admin' && <ShieldCheck size={11} />}
                                  {u.role === 'president' && <Award size={11} />}
                                  {u.role === 'faculty' && <Users size={11} />}
                                  {u.role === 'faculty' ? 'Faculty Advisor' : u.role}
                                </span>

                                <button
                                  onClick={() => handleOpenRoleTransfer(u)}
                                  className="text-[10px] font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-2 py-0.5 rounded border border-indigo-500/20 transition cursor-pointer flex items-center gap-1"
                                  title="Change User Role & Transfer Society Responsibility"
                                >
                                  <ArrowRightLeft size={10} />
                                  <span>Transfer / Role</span>
                                </button>
                              </div>

                              <div className="text-slate-300">
                                <span className="font-bold text-white text-xs block">
                                  {u.society_name ? `🏛️ ${u.society_name}` : '🌐 Campus Wide'}
                                </span>
                                {u.department && (
                                  <span className="text-[10px] text-slate-400 block">{u.department}</span>
                                )}
                              </div>
                            </div>
                          </td>

                          {/* 3. Account Status (Active vs Disabled) */}
                          <td className="py-3.5 px-5">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                                  u.is_active !== false 
                                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' 
                                    : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${u.is_active !== false ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`}></span>
                                  <span>{u.is_active !== false ? 'Active' : 'Disabled'}</span>
                                </span>
                              </div>

                              {u.id !== user?.id && (
                                <button
                                  onClick={() => handleToggleUserActive(u)}
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold border transition cursor-pointer flex items-center gap-1 ${
                                    u.is_active !== false
                                      ? 'text-rose-400 hover:bg-rose-500/20 border-rose-500/30'
                                      : 'text-emerald-400 hover:bg-emerald-500/20 border-emerald-500/30'
                                  }`}
                                  title={u.is_active !== false ? 'Suspend / Disable user account' : 'Reactivate user account'}
                                >
                                  {u.is_active !== false ? <UserX size={10} /> : <UserCheck size={10} />}
                                  <span>{u.is_active !== false ? 'Disable' : 'Enable'}</span>
                                </button>
                              )}
                            </div>
                          </td>

                          {/* 4. Audit & Activity */}
                          <td className="py-3.5 px-5">
                            <div className="space-y-1">
                              <div className="text-[11px] text-slate-400">
                                Last: <span className="font-mono text-slate-300">{u.last_login ? new Date(u.last_login).toLocaleDateString() : 'Never'}</span>
                              </div>
                              <button
                                onClick={() => handleOpenAuditHistory(u)}
                                className="px-2.5 py-1 bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-300 rounded-lg text-[10px] font-bold transition flex items-center gap-1.5 cursor-pointer border border-slate-700"
                                title="View User Audit Trail & Activity Record"
                              >
                                <History size={11} />
                                <span>Audit Log</span>
                              </button>
                            </div>
                          </td>

                          {/* 5. Actions */}
                          <td className="py-3.5 px-5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Reset Password */}
                              <button
                                onClick={(e) => { e.stopPropagation(); handleOpenResetPassword(u); }}
                                className="p-2 text-amber-400 bg-amber-500/10 hover:bg-amber-600 hover:text-slate-950 rounded-xl transition cursor-pointer border border-amber-500/20"
                                title="Reset User Password & Generate Secure Key"
                              >
                                <Key size={14} />
                              </button>

                              {/* Edit User Profile */}
                              <button
                                onClick={(e) => { e.stopPropagation(); handleEditUser(u); }}
                                className="p-2 text-slate-300 bg-slate-800 hover:bg-indigo-600 hover:text-white rounded-xl transition cursor-pointer border border-slate-700"
                                title="Edit Academic Profile & User Details"
                              >
                                <Edit3 size={14} />
                              </button>

                              {/* Delete User Account */}
                              {u.id !== user?.id && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setDeleteTarget({
                                      type: 'user',
                                      id: u.id,
                                      name: `@${u.username} (${u.first_name || u.role})`,
                                      details: `Are you sure you want to permanently delete @${u.username}? Any assigned roles will be decoupled.`
                                    });
                                  }}
                                  className="p-2 text-rose-400 bg-rose-500/10 hover:bg-rose-600 hover:text-white rounded-xl transition cursor-pointer border border-rose-500/20"
                                  title="Permanently Delete Account"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}


            {/* ===== STUDENT PROFILE VIEWER MODAL ===== */}
            {selectedStudentProfile && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
                onClick={() => setSelectedStudentProfile(null)}
              >
                <div
                  className="relative bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden"
                  onClick={e => e.stopPropagation()}
                >
                  {/* Header Banner */}
                  <div className="bg-gradient-to-br from-indigo-900/80 via-slate-900 to-violet-900/60 px-8 pt-8 pb-6 border-b border-slate-800 relative">
                    <button
                      onClick={() => setSelectedStudentProfile(null)}
                      className="absolute top-5 right-5 p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
                    >
                      <X size={18} />
                    </button>
                    <div className="flex items-center gap-5">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-xl border-2 border-indigo-500/40 shrink-0">
                        {selectedStudentProfile.avatar_url ? (
                          <img src={selectedStudentProfile.avatar_url} alt={selectedStudentProfile.username} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-indigo-600 to-violet-600 flex items-center justify-center text-white font-black text-3xl">
                            {(selectedStudentProfile.first_name || selectedStudentProfile.username).charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div>
                        <h2 className="text-2xl font-black text-white leading-tight">
                          {selectedStudentProfile.first_name || selectedStudentProfile.last_name
                            ? `${selectedStudentProfile.first_name || ''} ${selectedStudentProfile.last_name || ''}`.trim()
                            : selectedStudentProfile.username}
                        </h2>
                        <p className="text-indigo-300 font-mono text-sm mt-0.5">@{selectedStudentProfile.username}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {selectedStudentProfile.roll_number && (
                            <span className="bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-[11px] font-black px-2.5 py-0.5 rounded-full font-mono">
                              {selectedStudentProfile.roll_number}
                            </span>
                          )}
                          <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full inline-flex items-center gap-1 ${
                            selectedStudentProfile.is_active !== false
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${selectedStudentProfile.is_active !== false ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
                            {selectedStudentProfile.is_active !== false ? 'Active' : 'Disabled'}
                          </span>
                          <span className="bg-slate-800 border border-slate-700 text-slate-400 text-[11px] font-bold px-2.5 py-0.5 rounded-full">
                            Student
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="px-8 py-6 space-y-6 max-h-[58vh] overflow-y-auto">

                    {/* Academic */}
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-3 flex items-center gap-2">
                        <BadgeCheck size={13} /> Academic Information
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: 'Program', value: selectedStudentProfile.program },
                          { label: 'Department', value: selectedStudentProfile.department },
                          { label: 'Batch / Year', value: selectedStudentProfile.batch },
                          { label: 'Semester', value: selectedStudentProfile.semester },
                        ].map(({ label, value }) => (
                          <div key={label} className="bg-slate-800/60 border border-slate-700/60 rounded-2xl px-4 py-3">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">{label}</p>
                            <p className="text-sm font-bold text-white">{value || <span className="text-slate-500 font-normal italic">Not provided</span>}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Personal */}
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-violet-400 mb-3 flex items-center gap-2">
                        <Users size={13} /> Personal Information
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: "Father's Name", value: selectedStudentProfile.father_name },
                          { label: 'Gender', value: selectedStudentProfile.gender },
                          { label: 'CNIC / ID', value: selectedStudentProfile.cnic },
                          { label: 'Phone Number', value: selectedStudentProfile.phone_number },
                        ].map(({ label, value }) => (
                          <div key={label} className="bg-slate-800/60 border border-slate-700/60 rounded-2xl px-4 py-3">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">{label}</p>
                            <p className="text-sm font-bold text-white">{value || <span className="text-slate-500 font-normal italic">Not provided</span>}</p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Contact & Account */}
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-3 flex items-center gap-2">
                        <Mail size={13} /> Contact & Account
                      </p>
                      <div className="grid grid-cols-2 gap-3">
                        {[
                          { label: 'Email Address', value: selectedStudentProfile.email },
                          { label: 'Username', value: `@${selectedStudentProfile.username}` },
                          { label: 'Last Login', value: selectedStudentProfile.last_login ? new Date(selectedStudentProfile.last_login).toLocaleString() : 'Never' },
                          { label: 'Account Created', value: selectedStudentProfile.date_joined ? new Date(selectedStudentProfile.date_joined).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' },
                        ].map(({ label, value }) => (
                          <div key={label} className="bg-slate-800/60 border border-slate-700/60 rounded-2xl px-4 py-3">
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">{label}</p>
                            <p className="text-sm font-bold text-white break-all">{value || <span className="text-slate-500 font-normal italic">—</span>}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="px-8 py-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/50">
                    <p className="text-xs text-slate-500 font-medium">
                      System ID: <span className="font-mono text-slate-300">#{selectedStudentProfile.id}</span>
                    </p>
                    <button
                      onClick={() => setSelectedStudentProfile(null)}
                      className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition cursor-pointer border border-slate-700"
                    >
                      Close Profile
                    </button>
                  </div>
                </div>
              </div>
            )}

        {/* ========================================================= */}
        {/* ========================================================= */}
        {/* TAB 3: CENTRAL EVENTS & PROPOSALS CLEARANCE DESK         */}
        {/* ========================================================= */}
        {activeTab === 'events' && (
          <div className="space-y-8">
            
            {/* 1. STATUTORY EVENT PROPOSALS CLEARANCE QUEUE */}
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="text-indigo-400" size={24} />
                    <h2 className="text-xl font-black text-white tracking-tight">
                      Statutory Event Proposals & Executive Clearance ({proposals.length})
                    </h2>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 max-w-3xl">
                    Multi-tier physical dossiers submitted by Society Presidents and endorsed by Faculty Advisors. Verify physical ink signatures against statutory records, perform 5-point verification, and sanction live events.
                  </p>
                </div>

                {/* Filter Pills */}
                <div className="flex flex-wrap items-center gap-1.5 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs">
                  {[
                    { key: 'all', label: `All (${proposals.length})` },
                    { key: 'signed_uploaded', label: `Signed Uploads (${proposals.filter(p => p.status === 'signed_uploaded').length})` },
                    { key: 'approved', label: `Sanctioned (${proposals.filter(p => p.status === 'approved').length})` },
                    { key: 'returned', label: `Returned (${proposals.filter(p => p.status === 'returned').length})` },
                    { key: 'archived', label: `Archived (${proposals.filter(p => p.status === 'archived').length})` }
                  ].map(f => (
                    <button
                      key={f.key}
                      onClick={() => setProposalOfficeFilter(f.key)}
                      className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer ${
                        proposalOfficeFilter === f.key ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Proposals Cards Grid */}
              {proposals.length === 0 ? (
                <div className="p-8 text-center border-2 border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs">
                  No statutory event proposals found in university database.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {proposals
                    .filter(p => proposalOfficeFilter === 'all' || p.status === proposalOfficeFilter)
                    .map(prop => {
                      const hasSignedDoc = Boolean(prop.signed_proposal_file);
                      const statusBadge = {
                        draft: 'bg-slate-800 text-slate-400 border-slate-700',
                        generated: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
                        downloaded: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
                        signed_uploaded: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30 ring-1 ring-indigo-500/40',
                        approved: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
                        returned: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
                        rejected: 'bg-red-500/10 text-red-400 border-red-500/30',
                        archived: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
                      }[prop.status] || 'bg-slate-800 text-slate-400 border-slate-700';

                      return (
                        <div key={prop.id} className="bg-slate-950/70 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between hover:border-slate-700 transition">
                          <div className="space-y-3">
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-mono font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-lg border border-indigo-500/20">
                                  {prop.proposal_no}
                                </span>
                                <span className="text-xs font-bold text-slate-300">
                                  {prop.society_name}
                                </span>
                              </div>

                              <span className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border ${statusBadge}`}>
                                {prop.status}
                              </span>
                            </div>

                            <div>
                              <h4 className="text-base font-bold text-white tracking-tight">{prop.event_title}</h4>
                              <p className="text-xs text-slate-400 mt-1 line-clamp-2">{prop.event_description || prop.objectives}</p>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-[11px] text-slate-400 font-mono">
                              <div>Date: <strong className="text-slate-200">{prop.event_date}</strong></div>
                              <div>Venue: <strong className="text-slate-200">{prop.venue}</strong></div>
                              <div>Budget: <strong className="text-emerald-400">PKR {parseFloat(prop.budget || 0).toFixed(2)}</strong></div>
                              <div>Delegates: <strong className="text-slate-200">{prop.expected_participants}</strong></div>
                            </div>

                            {/* Signed Physical Scan Status */}
                            <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <FileText size={15} className={hasSignedDoc ? "text-emerald-400" : "text-amber-400"} />
                                <div>
                                  <span className="font-bold text-slate-200 block text-[11px]">
                                    {hasSignedDoc ? 'Signed Paper Scan Attached' : 'Awaiting Paper Scan Upload'}
                                  </span>
                                  <span className="text-[10px] text-slate-500">
                                    Advisor: {prop.advisor_name || 'Faculty Advisor'}
                                  </span>
                                </div>
                              </div>
                              {hasSignedDoc && (
                                <a
                                  href={getMediaUrl(prop.signed_proposal_file)}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-[10px] font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-lg flex items-center gap-1"
                                >
                                  <Eye size={12} /> View Scan
                                </a>
                              )}
                            </div>
                          </div>

                          <div className="pt-4 mt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2">
                            <button
                              onClick={() => setSelectedProposalDoc(prop)}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/30 cursor-pointer"
                            >
                              <ShieldCheck size={14} /> Verify & Grant Sanction
                            </button>

                            <button
                              onClick={() => setSelectedProposalDoc(prop)}
                              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                            >
                              <FileText size={13} /> View / Print Form
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* 2. CALENDAR EVENTS REGISTER */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  <Calendar className="text-violet-400" /> Active Campus Calendar Events ({events.length})
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Published events discoverable by students for registration and pass issuance.</p>
              </div>

              {/* Status Filters */}
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-2xl">
                {['all', 'pending', 'approved', 'rejected'].map(st => (
                  <button
                    key={st}
                    onClick={() => setEventStatusFilter(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition cursor-pointer ${
                      eventStatusFilter === st ? 'bg-violet-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {st === 'pending' ? `Pending (${pendingEventsCount})` : st}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredEvents.map(evt => (
                <div key={evt.id} className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between hover:border-slate-700 transition">
                  <div>
                    {/* Event Poster Thumbnail */}
                    {(evt.poster_image_url || evt.image) && (
                      <div className="w-full h-32 rounded-2xl overflow-hidden mb-3 bg-slate-950 border border-slate-800">
                        <img 
                          src={evt.poster_image_url || evt.image} 
                          alt={evt.title} 
                          className="w-full h-full object-cover" 
                        />
                      </div>
                    )}

                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20 font-mono">
                          {evt.proposal_doc_number || `PROP-2026-${evt.id}`}
                        </span>
                        <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                          {evt.event_type || 'Seminar'}
                        </span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                        evt.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                        evt.status === 'rejected' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                        'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
                      }`}>
                        {evt.status}
                      </span>
                    </div>

                    <h3 className="font-bold text-white text-lg">{evt.title}</h3>
                    <p className="text-xs font-semibold text-rose-400 mt-0.5">{evt.society_name}</p>
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2">{evt.description}</p>

                    <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400 font-mono">
                      <div>Date: <strong className="text-slate-200">{new Date(evt.date).toLocaleDateString()}</strong></div>
                      <div>Venue: <strong className="text-slate-200">{evt.venue_name || 'Auditorium'}</strong></div>
                      <div>Budget: <strong className="text-emerald-400">PKR {parseFloat(evt.budget_estimate || 0).toFixed(0)}</strong></div>
                      <div>Entry: <strong className="text-slate-200">{evt.is_paid ? `PKR ${evt.price}` : 'Free'}</strong></div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 border-t border-slate-800 flex items-center justify-between gap-2 mt-4">
                    <button
                      onClick={() => openVerifyModal(evt)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                    >
                      <Eye size={13} /> View Dossier
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditEvent(evt)}
                        className="bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                        title="Edit Event & Poster"
                      >
                        <Edit3 size={13} /> Edit
                      </button>
                      {evt.status !== 'approved' && (
                        <button
                          onClick={() => handleApproveEvent(evt.id, evt.title)}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                        >
                          <Check size={13} /> Sanction Live
                        </button>
                      )}
                      {evt.status === 'pending' && (
                        <button
                          onClick={() => handleRejectEvent(evt.id, evt.title)}
                          className="bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          Reject
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteTarget({
                          type: 'event',
                          id: evt.id,
                          name: evt.title,
                          details: 'All attendee registrations, tickets, and feedback will be deleted.'
                        })}
                        className="p-2 text-rose-400 hover:bg-rose-500/20 rounded-xl transition cursor-pointer"
                        title="Delete Event"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: PAID TICKET RECEIPTS & MEMBERSHIP DRIVE DESK       */}
        {/* ========================================================= */}
        {activeTab === 'receipts' && (
          <div className="space-y-6">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-2">
                Configure Society Membership Drive (Super Admin)
              </label>
              <select
                value={selectedMembershipSocietyId}
                onChange={(e) => setSelectedMembershipSocietyId(e.target.value)}
                className="w-full sm:w-1/2 p-2.5 border border-gray-300 rounded-xl bg-gray-50 text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">-- Select a Society to Configure Membership Drive --</option>
                {societies.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.name} {s.is_membership_open ? '(Live Registration)' : '(Closed)'}
                  </option>
                ))}
              </select>
            </div>

            {selectedMembershipSocietyId && (
              <MembershipConfiguration 
                society={societies.find(s => String(s.id) === String(selectedMembershipSocietyId))} 
                onUpdate={fetchAllData} 
              />
            )}

            <PaymentVerificationDesk events={events} />
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB: BULK & MANUAL TICKETING HUB                         */}
        {/* ========================================================= */}
        {activeTab === 'ticketing' && (
          <div className="space-y-6">
            <ManualTicketingHub events={events} onTicketsIssued={fetchAllData} />
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: CAMPUS VENUES & SPACES MANAGEMENT                 */}
        {/* ========================================================= */}
        {activeTab === 'venues' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Map className="text-sky-400" /> Campus Venues & Auditorium Facilities ({venues.length})
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Configure campus event halls, capacity limits, and equipment availability.</p>
              </div>
              <button
                onClick={() => {
                  setEditingVenue(null);
                  setVenueForm({ name: '', capacity: 100 });
                  setShowVenueModal(true);
                }}
                className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 transition cursor-pointer"
              >
                <PlusCircle size={15} /> Add Campus Venue
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {venues.map(v => (
                <div key={v.id} className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl flex items-center justify-between hover:border-slate-700 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
                      <Map size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base">{v.name}</h4>
                      <p className="text-xs text-slate-400 font-mono">Max Capacity: <strong className="text-sky-400">{v.capacity}</strong> delegates</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setEditingVenue(v);
                        setVenueForm({ name: v.name, capacity: v.capacity });
                        setShowVenueModal(true);
                      }}
                      className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget({
                        type: 'venue',
                        id: v.id,
                        name: v.name,
                        details: 'This venue will be removed from future scheduling.'
                      })}
                      className="p-2 text-rose-400 hover:bg-rose-500/20 rounded-xl transition cursor-pointer"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: CAMPUS BULLETINS & BROADCASTS (NEWS)              */}
        {/* ========================================================= */}
        {activeTab === 'news' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <Megaphone className="text-amber-400" /> Campus News & Official Announcements ({newsList.length})
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">Review, moderate, and broadcast university-wide notices displayed across student feeds.</p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* News Status Filters */}
                <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-2xl">
                  {['all', 'pending', 'approved', 'rejected'].map(st => {
                    const count = st === 'all' ? newsList.length : newsList.filter(n => (n.status || 'approved') === st).length;
                    return (
                      <button
                        key={st}
                        onClick={() => setNewsStatusFilter(st)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition cursor-pointer ${
                          newsStatusFilter === st ? 'bg-amber-600 text-white' : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {st} ({count})
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setShowNewsModal(true)}
                  className="bg-amber-600 hover:bg-amber-500 text-white px-4 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 transition cursor-pointer"
                >
                  <PlusCircle size={15} /> Post Announcement
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {newsList
                .filter(n => {
                  const st = n.status || 'approved';
                  if (newsStatusFilter !== 'all' && st !== newsStatusFilter) return false;
                  if (!searchQuery) return true;
                  const q = searchQuery.toLowerCase();
                  return (n.title && n.title.toLowerCase().includes(q)) || (n.content && n.content.toLowerCase().includes(q));
                })
                .map(n => {
                  const status = n.status || 'approved';
                  return (
                    <div key={n.id} className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between hover:border-slate-700 transition">
                      <div>
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="font-mono text-indigo-400 font-bold">
                            By @{n.author_name || 'Admin'} {n.society_name ? `• ${n.society_name}` : ''}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                              status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                              status === 'rejected' ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' :
                              'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse'
                            }`}>
                              {status}
                            </span>
                            <span className="text-slate-500">{new Date(n.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <h3 className="text-base font-bold text-white mb-2">{n.title}</h3>
                        <p className="text-xs text-slate-400 whitespace-pre-line leading-relaxed">{n.content}</p>
                      </div>

                      <div className="pt-4 border-t border-slate-800 flex items-center justify-between mt-4">
                        <div className="flex items-center gap-2">
                          {status !== 'approved' && (
                            <button
                              onClick={() => handleApproveNews(n.id, n.title)}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition cursor-pointer"
                            >
                              <Check size={12} /> Approve
                            </button>
                          )}
                          {status !== 'rejected' && (
                            <button
                              onClick={() => handleRejectNews(n.id, n.title)}
                              className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-xl text-xs font-bold transition cursor-pointer"
                            >
                              Reject
                            </button>
                          )}
                          <Link to="/news" className="text-xs text-indigo-400 hover:underline flex items-center gap-1 font-bold ml-2">
                            View Live <ExternalLink size={12} />
                          </Link>
                        </div>
                        <button
                          onClick={() => setDeleteTarget({
                            type: 'news',
                            id: n.id,
                            name: n.title,
                            details: 'This announcement will be removed from all public pages.'
                          })}
                          className="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded-xl transition cursor-pointer"
                          title="Delete Bulletin"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6.5: MEDIA GALLERY & SHOWCASE MODERATION             */}
        {/* ========================================================= */}
        {activeTab === 'gallery' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <ImageIcon className="text-pink-400" /> Media Showcase & Visual Moderation ({galleryList.length})
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Review student and society photo submissions before public publishing to the campus gallery.
                </p>
              </div>

              {/* Gallery Status Filter */}
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-2xl">
                {['all', 'pending', 'approved', 'rejected'].map(st => {
                  const count = st === 'all' ? galleryList.length : galleryList.filter(g => (g.status || 'approved') === st).length;
                  return (
                    <button
                      key={st}
                      onClick={() => setGalleryStatusFilter(st)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold capitalize transition cursor-pointer ${
                        galleryStatusFilter === st ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {st} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            {galleryList.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-slate-800 rounded-3xl text-slate-500 text-xs">
                No gallery media uploads recorded.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {galleryList
                  .filter(g => {
                    const st = g.status || 'approved';
                    if (galleryStatusFilter !== 'all' && st !== galleryStatusFilter) return false;
                    if (!searchQuery) return true;
                    const q = searchQuery.toLowerCase();
                    return (
                      (g.title && g.title.toLowerCase().includes(q)) ||
                      (g.album_name && g.album_name.toLowerCase().includes(q)) ||
                      (g.society_name && g.society_name.toLowerCase().includes(q))
                    );
                  })
                  .map(g => {
                    const status = g.status || 'approved';
                    return (
                      <div key={g.id} className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between hover:border-slate-700 transition">
                        <div className="relative aspect-video bg-slate-950 overflow-hidden">
                          <img
                            src={g.image_url || g.image}
                            alt={g.title || 'Gallery item'}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.src = 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&auto=format&fit=crop';
                            }}
                          />
                          <span className={`absolute top-2 right-2 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase backdrop-blur-md border ${
                            status === 'approved' ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40' :
                            status === 'rejected' ? 'bg-rose-950/80 text-rose-300 border-rose-500/40' :
                            'bg-amber-950/80 text-amber-300 border-amber-500/40 animate-pulse'
                          }`}>
                            {status}
                          </span>
                        </div>

                        <div className="p-4 space-y-2">
                          <h4 className="font-bold text-white text-sm line-clamp-1">{g.title || g.album_name || 'Showcase Photo'}</h4>
                          <div className="flex items-center justify-between text-[11px] text-slate-400">
                            <span>{g.society_name || 'Campus Wide'}</span>
                            <span className="font-mono text-slate-500">{new Date(g.created_at).toLocaleDateString()}</span>
                          </div>

                          <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5">
                              {status !== 'approved' && (
                                <button
                                  onClick={() => handleApproveGallery(g.id)}
                                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                                >
                                  <Check size={11} /> Approve
                                </button>
                              )}
                              {status !== 'rejected' && (
                                <button
                                  onClick={() => handleRejectGallery(g.id)}
                                  className="px-2.5 py-1 bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white rounded-lg text-[11px] font-bold transition cursor-pointer"
                                >
                                  Reject
                                </button>
                              )}
                            </div>
                            <button
                              onClick={() => {
                                if (window.confirm("Permanently remove this image from the gallery?")) {
                                  api.delete(`gallery/${g.id}/`).then(() => {
                                    setGalleryList(prev => prev.filter(item => item.id !== g.id));
                                    showToast("Gallery image permanently deleted.");
                                  });
                                }
                              }}
                              className="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded-lg transition cursor-pointer"
                              title="Delete Photo"
                            >
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 7: CAMPUS COMPLAINTS & GRIEVANCES                     */}
        {/* ========================================================= */}
        {activeTab === 'complaints' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <MessageSquare className="text-rose-400" /> Student Complaints & Grievance Oversight ({complaintsList.length})
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">Review issues filed by students regarding societies, events, or administrative concerns.</p>
            </div>

            {complaintsList.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-12 text-center text-slate-500 text-xs">
                No active complaints filed at this time. All campus systems nominal.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {complaintsList.map(c => (
                  <div key={c.id} className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 font-mono">
                          Ticket #{c.id}
                        </span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border ${
                          c.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' :
                          c.status === 'investigating' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' :
                          'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        }`}>
                          {c.status}
                        </span>
                      </div>
                      <h4 className="font-bold text-white text-base">{c.subject}</h4>
                      <p className="text-xs text-slate-400 mt-2 leading-relaxed whitespace-pre-line">{c.description}</p>
                    </div>

                    <div className="pt-4 border-t border-slate-800 flex items-center justify-between mt-4">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleUpdateComplaintStatus(c, 'investigating')}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-indigo-600 hover:text-white rounded-lg text-[11px] font-bold transition cursor-pointer"
                        >
                          Mark Investigating
                        </button>
                        <button
                          onClick={() => handleUpdateComplaintStatus(c, 'resolved')}
                          className="px-2.5 py-1 bg-slate-800 hover:bg-emerald-600 hover:text-white rounded-lg text-[11px] font-bold transition cursor-pointer"
                        >
                          Mark Resolved
                        </button>
                      </div>

                      <button
                        onClick={() => setDeleteTarget({
                          type: 'complaint',
                          id: c.id,
                          name: c.subject,
                          details: 'This grievance record will be permanently purged.'
                        })}
                        className="p-1.5 text-rose-400 hover:bg-rose-500/20 rounded-xl transition cursor-pointer"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 8: SYSTEM HEALTH, DATABASE BACKUPS & INSTITUTIONAL CFG */}
        {/* ========================================================= */}
        {activeTab === 'system' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-white flex items-center gap-2">
                  <ShieldAlert className="text-rose-500" /> Infrastructure Health & Technical Operations
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Centralized control for database backup snapshots, institutional policies, and real-time backend telemetry.
                </p>
              </div>

              <button
                type="button"
                onClick={handleTriggerBackup}
                disabled={isCreatingBackup}
                className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white px-4 py-2.5 rounded-2xl text-xs font-black shadow-lg shadow-rose-600/30 transition flex items-center gap-2 cursor-pointer self-start sm:self-auto"
              >
                <Power size={14} />
                {isCreatingBackup ? 'Generating Snapshot...' : 'Trigger Database Backup'}
              </button>
            </div>

            {/* Live Telemetry KPI Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-3xl">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Engine & ACID</span>
                <p className="text-sm font-black text-white mt-1">{systemHealth?.database_engine || 'SQLite3 ACID'}</p>
                <span className="text-[11px] text-emerald-400 font-bold block mt-0.5">
                  Size: {systemHealth?.database_size_kb || 0} KB
                </span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-3xl">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">API Uptime</span>
                <p className="text-sm font-black text-emerald-400 mt-1">{systemHealth?.api_uptime || '99.98%'}</p>
                <span className="text-[10px] text-slate-400 font-bold block mt-0.5">Zero Downtime</span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-3xl">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Registrations</span>
                <p className="text-sm font-black text-indigo-400 mt-1">{systemHealth?.metrics?.total_registrations || paidRegistrations.length}</p>
                <span className="text-[10px] text-slate-400 font-bold block mt-0.5">Campus Passes</span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-3xl">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Certificates</span>
                <p className="text-sm font-black text-purple-400 mt-1">{systemHealth?.metrics?.total_certificates || 0}</p>
                <span className="text-[10px] text-purple-400/80 font-bold block mt-0.5">Verified Issued</span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-3xl">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Snapshots</span>
                <p className="text-sm font-black text-amber-400 mt-1">{backupsList.length}</p>
                <span className="text-[10px] text-amber-400/80 font-bold block mt-0.5">Local Vault</span>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-3xl">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Portal Mode</span>
                <p className={`text-xs font-black mt-1 ${systemSettingsForm.portal_maintenance_mode ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {systemSettingsForm.portal_maintenance_mode ? 'Maintenance' : 'Operational'}
                </p>
                <span className="text-[10px] text-slate-500 font-bold block mt-0.5">
                  {systemSettingsForm.portal_maintenance_mode ? 'Public Access Blocked' : 'Open Campus'}
                </span>
              </div>
            </div>

            {/* Backups Table & Settings Form Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Backups Table */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <History size={16} className="text-rose-400" /> Database Backup Records
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-lg">
                    {backupsList.length} Files
                  </span>
                </div>

                {backupsList.length === 0 ? (
                  <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl text-slate-500 text-xs">
                    No database snapshots recorded. Click "Trigger Database Backup" above to create an immediate restore checkpoint.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {backupsList.map(bk => (
                      <div key={bk.id} className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-mono font-bold text-slate-200">{bk.filename}</p>
                          <span className="text-[10px] text-slate-500 font-medium">
                            {new Date(bk.created_at).toLocaleString()} • {(bk.file_size_bytes / 1024).toFixed(1)} KB
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-lg border ${
                            bk.status === 'restored' 
                              ? 'text-indigo-400 bg-indigo-950/80 border-indigo-800' 
                              : 'text-emerald-400 bg-emerald-950/80 border-emerald-800'
                          }`}>
                            {bk.status}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDownloadBackup(bk)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition cursor-pointer"
                            title="Download Snapshot File"
                          >
                            <Download size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setRestoreTargetBackup(bk)}
                            className="px-2.5 py-1 text-[11px] font-bold text-amber-400 hover:text-white bg-amber-500/10 hover:bg-amber-600 rounded-lg border border-amber-500/30 transition flex items-center gap-1 cursor-pointer"
                            title="Restore this Snapshot"
                          >
                            <RotateCcw size={12} /> Restore
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Institutional Configuration Form */}
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 space-y-4">
                <div className="pb-3 border-b border-slate-800">
                  <h3 className="text-sm font-black text-white flex items-center gap-2">
                    <Globe size={16} className="text-indigo-400" /> Institutional Portal Settings
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Configure institutional email domain filtering and upload limits.</p>
                </div>

                <form onSubmit={handleSaveSystemSettings} className="space-y-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                      Permitted University Email Domain(s)
                    </label>
                    <input
                      type="text"
                      value={systemSettingsForm.allowed_email_domains}
                      onChange={e => setSystemSettingsForm({ ...systemSettingsForm, allowed_email_domains: e.target.value })}
                      placeholder="@university.edu.pk, @campus.edu.pk"
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-rose-500 font-mono text-xs"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                        System Timezone
                      </label>
                      <input
                        type="text"
                        value={systemSettingsForm.timezone}
                        onChange={e => setSystemSettingsForm({ ...systemSettingsForm, timezone: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-rose-500 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase text-slate-400 mb-1">
                        Max Upload Limit (MB)
                      </label>
                      <input
                        type="number"
                        value={systemSettingsForm.max_upload_size_mb}
                        onChange={e => setSystemSettingsForm({ ...systemSettingsForm, max_upload_size_mb: parseInt(e.target.value) || 10 })}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-rose-500 text-xs"
                      />
                    </div>
                  </div>

                  {/* Maintenance Mode Toggle Switch */}
                  <div className="pt-2">
                    <label className="flex items-center gap-3 p-3 bg-slate-950 border border-slate-800 rounded-2xl cursor-pointer hover:border-slate-700 transition">
                      <input
                        type="checkbox"
                        checked={Boolean(systemSettingsForm.portal_maintenance_mode)}
                        onChange={e => setSystemSettingsForm({ ...systemSettingsForm, portal_maintenance_mode: e.target.checked })}
                        className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500"
                      />
                      <div>
                        <span className="font-bold text-white block">Institutional Maintenance Mode</span>
                        <span className="text-[10px] text-slate-400">
                          When active, public registrations and student features are suspended for maintenance.
                        </span>
                      </div>
                    </label>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-600/30 transition cursor-pointer"
                    >
                      Save Configuration
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ========================================================= */}
      {/* UNIVERSAL CONFIRMATION MODAL (NO NATIVE POPUPS)           */}
      {/* ========================================================= */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/50 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 flex items-center justify-center mb-4">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg font-black text-white">Permanently Remove {deleteTarget.type}?</h3>
            <p className="text-xs text-slate-300 mt-2 font-medium">
              Are you sure you want to permanently delete <strong className="text-white font-bold">{deleteTarget.name}</strong>?
            </p>
            {deleteTarget.details && (
              <p className="text-[11px] text-rose-300/80 bg-rose-950/40 border border-rose-900/50 p-2.5 rounded-xl mt-3">
                {deleteTarget.details}
              </p>
            )}

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={executeDelete}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black shadow-lg shadow-rose-600/30 transition cursor-pointer"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* SOCIETY PROFILE & BANKING CONFIGURATION MODAL             */}
      {/* ========================================================= */}
      {showSocietyModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
                  {editingSociety ? 'Modify Society Configuration' : 'Register New Society'}
                </span>
                <h3 className="text-xl font-black text-white mt-1.5">
                  {editingSociety ? editingSociety.name : 'Create Departmental Society'}
                </h3>
              </div>
              <button
                onClick={() => setShowSocietyModal(false)}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSociety} className="space-y-5 text-xs">
              {/* Basic Details */}
              <div className="space-y-3">
                <h4 className="font-bold text-white text-sm">General Profile</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 uppercase font-bold mb-1">Society Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Cyber Security Student Club"
                      value={societyForm.name}
                      onChange={e => setSocietyForm({ ...societyForm, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-rose-500 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 uppercase font-bold mb-1">Official Contact Email</label>
                    <input
                      type="email"
                      placeholder="e.g. society@university.edu"
                      value={societyForm.contact_email}
                      onChange={e => setSocietyForm({ ...societyForm, contact_email: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-rose-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-400 uppercase font-bold mb-1">Society Description *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="Provide overview of society missions, workshops, and objectives..."
                    value={societyForm.description}
                    onChange={e => setSocietyForm({ ...societyForm, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-rose-500 leading-relaxed"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 uppercase font-bold mb-1">Society Vision</label>
                    <input
                      type="text"
                      placeholder="e.g. Empowering students with cutting-edge tech..."
                      value={societyForm.vision}
                      onChange={e => setSocietyForm({ ...societyForm, vision: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 uppercase font-bold mb-1">Society Mission</label>
                    <input
                      type="text"
                      placeholder="e.g. Practical hands-on seminars and ethical labs..."
                      value={societyForm.mission}
                      onChange={e => setSocietyForm({ ...societyForm, mission: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-rose-500"
                    />
                  </div>
                </div>
              </div>

              {/* Visual Assets (Cover & Logo) */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <h4 className="font-bold text-white text-sm">Visual Branding (Cover & Logo)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ImageUploader
                    label="Society Cover Photo"
                    hint="Browse PC storage or mobile camera"
                    value={societyForm.cover_image}
                    onChange={url => setSocietyForm({ ...societyForm, cover_image: url })}
                  />
                  <ImageUploader
                    label="Official Society Logo"
                    hint="Square emblem or badge"
                    value={societyForm.logo}
                    onChange={url => setSocietyForm({ ...societyForm, logo: url })}
                  />
                </div>
              </div>

              {/* Leadership Assignments */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <h4 className="font-bold text-white text-sm">Leadership Assignments</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 uppercase font-bold mb-1">Faculty Advisor</label>
                    <select
                      value={societyForm.advisor}
                      onChange={e => setSocietyForm({ ...societyForm, advisor: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-rose-500 font-semibold"
                    >
                      <option value="">— Select Faculty Advisor —</option>
                      {advisorsList.map(adv => (
                        <option key={adv.id} value={adv.id}>
                          {adv.first_name} {adv.last_name || ''} (@{adv.username})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 uppercase font-bold mb-1 flex justify-between items-center">
                      <span>Society President</span>
                      <span className="text-[10px] text-slate-500 font-normal normal-case">Search to assign</span>
                    </label>
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="Search student by name or roll no..."
                        value={presidentSearch}
                        onChange={e => setPresidentSearch(e.target.value)}
                        className="w-full px-3.5 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white outline-none focus:border-rose-500 text-sm"
                      />
                      <select
                        value={societyForm.president}
                        onChange={e => setSocietyForm({ ...societyForm, president: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-rose-500 font-semibold"
                      >
                        <option value="">— Select President —</option>
                        {usersList
                          .filter(u => u.role === 'president' || u.role === 'student')
                          .filter(u => {
                            if (!presidentSearch) return u.role === 'president' || String(u.id) === String(societyForm.president);
                            const searchStr = presidentSearch.toLowerCase();
                            return (
                              (u.first_name || '').toLowerCase().includes(searchStr) ||
                              (u.last_name || '').toLowerCase().includes(searchStr) ||
                              (u.roll_number || '').toLowerCase().includes(searchStr) ||
                              (u.username || '').toLowerCase().includes(searchStr)
                            );
                          })
                          .slice(0, 15) // Limit to top 15 results
                          .map(p => (
                            <option key={p.id} value={p.id}>
                              {p.first_name} {p.last_name || ''} ({p.roll_number ? p.roll_number.toUpperCase() : p.username}) {p.role === 'president' ? '- PRESIDENT' : ''}
                            </option>
                          ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Social Channels & Contact Links */}
              <div className="space-y-3 pt-3 border-t border-slate-800">
                <h4 className="font-bold text-white text-sm">Official Social Channels</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 uppercase font-bold mb-1">WhatsApp Group / Channel Link</label>
                    <input
                      type="url"
                      placeholder="https://chat.whatsapp.com/..."
                      value={societyForm.whatsapp_link}
                      onChange={e => setSocietyForm({ ...societyForm, whatsapp_link: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 uppercase font-bold mb-1">Facebook Page Link</label>
                    <input
                      type="url"
                      placeholder="https://facebook.com/..."
                      value={societyForm.facebook_link}
                      onChange={e => setSocietyForm({ ...societyForm, facebook_link: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 uppercase font-bold mb-1">Instagram Profile</label>
                    <input
                      type="url"
                      placeholder="https://instagram.com/..."
                      value={societyForm.instagram_link}
                      onChange={e => setSocietyForm({ ...societyForm, instagram_link: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-rose-500"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 uppercase font-bold mb-1">Official Website / Portal</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={societyForm.website_link}
                      onChange={e => setSocietyForm({ ...societyForm, website_link: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-rose-500"
                    />
                  </div>
                </div>
              </div>

              {/* Official Bank Account Details */}
              <div className="space-y-3 pt-3 border-t border-slate-800 bg-slate-950/80 p-4 rounded-2xl border border-slate-800">
                <h4 className="font-bold text-emerald-400 text-sm flex items-center gap-1.5">
                  <CreditCard size={15} /> Official Bank Account & Registration Inflows
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-slate-400 uppercase font-bold mb-1">Bank Name</label>
                    <input
                      type="text"
                      placeholder="e.g. National Bank"
                      value={societyForm.bank_name}
                      onChange={e => setSocietyForm({ ...societyForm, bank_name: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 uppercase font-bold mb-1">Account Title</label>
                    <input
                      type="text"
                      placeholder="e.g. Cyber Security Society Fund"
                      value={societyForm.bank_account_title}
                      onChange={e => setSocietyForm({ ...societyForm, bank_account_title: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 uppercase font-bold mb-1">Account / IBAN Number</label>
                    <input
                      type="text"
                      placeholder="e.g. PK82UNIV000192837465"
                      value={societyForm.bank_account_number}
                      onChange={e => setSocietyForm({ ...societyForm, bank_account_number: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white font-mono"
                    />
                  </div>
                </div>

                {/* NEW: QR Code Upload */}
                <div className="mt-4 pt-4 border-t border-gray-800">
                  <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Payment QR Code (For Paid Events)</label>
                  <div className="flex items-center gap-4">
                    <input 
                      type="file" 
                      accept="image/png, image/jpeg" 
                      onChange={(e) => setBankQrFile(e.target.files[0])}
                      className="w-full bg-[#151B2B] border border-gray-700 rounded-lg p-2 text-sm text-gray-300 focus:outline-none focus:ring-1 focus:ring-pink-500"
                    />
                    {/* Optional: Show existing QR if one is already saved */}
                    {existingQrUrl && (
                      <img src={existingQrUrl} alt="Saved QR" className="w-10 h-10 rounded bg-white p-1 object-contain" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Students will scan this via banking/wallet apps to pay ticket fees.</p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowSocietyModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-black shadow-lg shadow-rose-600/30 cursor-pointer transition"
                >
                  {editingSociety ? 'Save Society Changes' : 'Register Society Live'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* USER & CREDENTIAL ISSUANCE MODAL                          */}
      {/* ========================================================= */}
      {showUserModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-3 py-1 rounded-full border border-indigo-500/20">
                  Credential Vault
                </span>
                <h3 className="text-xl font-black text-white mt-1.5">
                  {editingUser ? `Edit Account: @${editingUser.username}` : 'Issue New University Credentials'}
                </h3>
              </div>
              <button
                onClick={() => setShowUserModal(false)}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveUserCredentials} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 uppercase font-bold mb-1">System Role *</label>
                  <select
                    value={userForm.role}
                    onChange={e => setUserForm({ ...userForm, role: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500 font-bold"
                  >
                    <option value="student">Student</option>
                    <option value="president">Society President</option>
                    <option value="faculty">Faculty Advisor</option>
                    <option value="admin">Super Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-400 uppercase font-bold mb-1">Assigned Society</label>
                  <select
                    value={userForm.society}
                    onChange={e => setUserForm({ ...userForm, society: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500"
                  >
                    <option value="">— Campus Wide / None —</option>
                    {societies.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 uppercase font-bold mb-1">First Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Roshan"
                    value={userForm.first_name}
                    onChange={e => setUserForm({ ...userForm, first_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 uppercase font-bold mb-1">Last Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Ashraf"
                    value={userForm.last_name}
                    onChange={e => setUserForm({ ...userForm, last_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-400 uppercase font-bold mb-1">Login Username *</label>
                  <input
                    type="text"
                    required
                    disabled={Boolean(editingUser)}
                    placeholder="e.g. roshan_president"
                    value={userForm.username}
                    onChange={e => setUserForm({ ...userForm, username: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500 font-mono disabled:opacity-60"
                  />
                </div>
                <div>
                  <label className="block text-slate-400 uppercase font-bold mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="e.g. student@university.edu"
                    value={userForm.email}
                    onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              {/* Extended Academic Profile */}
              <div className="pt-3 border-t border-slate-800 space-y-3">
                <span className="text-[11px] font-bold text-indigo-400 uppercase tracking-wider block">Academic Verification Details</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 uppercase font-bold mb-1">University Roll Number</label>
                    <input
                      type="text"
                      placeholder="e.g. FA22-BCS-042"
                      value={userForm.roll_number}
                      onChange={e => setUserForm({ ...userForm, roll_number: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 uppercase font-bold mb-1">Father's Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Muhammad Aslam"
                      value={userForm.father_name}
                      onChange={e => setUserForm({ ...userForm, father_name: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-400 uppercase font-bold mb-1">Degree Program</label>
                    <input
                      type="text"
                      placeholder="e.g. BS Computer Science"
                      value={userForm.program}
                      onChange={e => setUserForm({ ...userForm, program: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 uppercase font-bold mb-1">Department</label>
                    <input
                      type="text"
                      placeholder="e.g. Department of Computer Science"
                      value={userForm.department}
                      onChange={e => setUserForm({ ...userForm, department: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div className="pt-3 border-t border-slate-800">
                <label className="block text-slate-400 uppercase font-bold mb-1">
                  {editingUser ? 'Reset Password (Leave blank to keep current)' : 'Password (Leave blank to auto-generate secure PIN)'}
                </label>
                <input
                  type="text"
                  placeholder={editingUser ? "•••••••• (Enter new password to change)" : "e.g. Campus@2026"}
                  value={userForm.password}
                  onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUserModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black shadow-lg shadow-indigo-600/30 cursor-pointer transition"
                >
                  {editingUser ? 'Save Account Changes' : 'Issue Credentials'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 1. RESET PASSWORD MODAL (Super Admin Key Override)        */}
      {/* ========================================================= */}
      {resetPasswordTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
                  <Key size={20} />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    Security Override
                  </span>
                  <h3 className="text-lg font-black text-white mt-1">Reset User Password</h3>
                </div>
              </div>
              <button
                onClick={() => setResetPasswordTarget(null)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Target User Info */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 mb-5 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-white text-sm block">
                    {resetPasswordTarget.first_name || resetPasswordTarget.last_name 
                      ? `${resetPasswordTarget.first_name} ${resetPasswordTarget.last_name || ''}` 
                      : resetPasswordTarget.username}
                  </span>
                  <span className="font-mono text-slate-400 text-[11px]">@{resetPasswordTarget.username}</span>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-800 text-indigo-400 border border-slate-700">
                  {resetPasswordTarget.role}
                </span>
              </div>
              {resetPasswordTarget.society_name && (
                <div className="mt-2 text-[11px] text-slate-400">
                  Society: <strong className="text-slate-200">{resetPasswordTarget.society_name}</strong>
                </div>
              )}
            </div>

            <form onSubmit={handleExecuteResetPassword} className="space-y-4 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                    New Account Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => setNewPasswordVal(`Campus@${Math.floor(1000 + Math.random() * 9000)}`)}
                    className="text-[10px] font-bold text-amber-400 hover:text-amber-300 transition cursor-pointer underline"
                  >
                    Generate Random
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Enter new password (min 4 chars)"
                  value={newPasswordVal}
                  onChange={e => setNewPasswordVal(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl text-white font-mono text-sm outline-none transition"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  The user can immediately login with this password. A copyable credential slip will be displayed.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setResetPasswordTarget(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={resetSubmitting || !newPasswordVal.trim()}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl font-black shadow-lg shadow-amber-500/20 transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Key size={14} />
                  <span>{resetSubmitting ? 'Resetting...' : 'Confirm Password Reset'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. ROLE CHANGE & SOCIETY RESPONSIBILITY TRANSFER MODAL     */}
      {/* ========================================================= */}
      {roleTransferTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-indigo-500/40 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 relative">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-xl border border-indigo-500/20">
                  <ArrowRightLeft size={20} />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                    Governance & Leadership
                  </span>
                  <h3 className="text-lg font-black text-white mt-1">Role & Society Responsibility</h3>
                </div>
              </div>
              <button
                onClick={() => setRoleTransferTarget(null)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Target user badge */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 mb-5 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-bold text-white text-sm block">
                    {roleTransferTarget.first_name || roleTransferTarget.last_name 
                      ? `${roleTransferTarget.first_name} ${roleTransferTarget.last_name || ''}` 
                      : roleTransferTarget.username}
                  </span>
                  <span className="font-mono text-slate-400 text-[11px]">@{roleTransferTarget.username}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block uppercase font-bold">Current Status</span>
                  <span className="font-bold text-indigo-400 capitalize">{roleTransferTarget.role}</span>
                </div>
              </div>
              <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-2">
                <span>Current Assignment:</span>
                <span className="font-bold text-slate-200">
                  {roleTransferTarget.society_name || 'Campus Wide (No Society)'}
                </span>
              </div>
            </div>

            <form onSubmit={handleExecuteRoleTransfer} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-bold uppercase tracking-wider text-[11px] mb-1.5">
                  Assigned System Role *
                </label>
                <select
                  value={newRoleVal}
                  onChange={e => setNewRoleVal(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500 font-bold"
                >
                  <option value="student">Student (General Member)</option>
                  <option value="president">Society President (Executive Head)</option>
                  <option value="faculty">Faculty Advisor (Official Overseer)</option>
                  <option value="admin">Super Admin (University Authority)</option>
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  Note: Demoting a President or Faculty Advisor will detach them from any assigned society leadership positions automatically.
                </p>
              </div>

              <div>
                <label className="block text-slate-300 font-bold uppercase tracking-wider text-[11px] mb-1.5">
                  Transfer Society Leadership Responsibility
                </label>
                <select
                  value={newSocietyVal}
                  onChange={e => setNewSocietyVal(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500 font-bold"
                >
                  <option value="">— Campus Wide / Detach from Society —</option>
                  {societies.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.category || 'General'})
                    </option>
                  ))}
                </select>
                <p className="text-[10px] text-slate-500 mt-1">
                  Selecting a society will link this user as the designated President or Faculty Advisor of the selected departmental society.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setRoleTransferTarget(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={roleTransferSubmitting}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-black shadow-lg shadow-indigo-600/30 transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <ArrowRightLeft size={14} />
                  <span>{roleTransferSubmitting ? 'Transferring...' : 'Apply Role & Society'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. ACCOUNT AUDIT HISTORY MODAL                             */}
      {/* ========================================================= */}
      {auditTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-indigo-600/20 text-indigo-400 rounded-2xl border border-indigo-500/30">
                  <History size={22} />
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20">
                    Activity & Governance Audit
                  </span>
                  <h3 className="text-xl font-black text-white mt-1">
                    Audit Log: @{auditTarget.username}
                  </h3>
                </div>
              </div>
              <button
                onClick={() => setAuditTarget(null)}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {auditLoading ? (
              <div className="py-16 text-center text-slate-400 space-y-3">
                <RefreshCw size={24} className="animate-spin mx-auto text-indigo-400" />
                <p className="text-xs font-bold">Compiling statutory activity records from database...</p>
              </div>
            ) : auditData ? (
              <div className="space-y-6 text-xs">
                {/* User Summary Card */}
                <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h4 className="text-base font-black text-white">{auditData.full_name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-slate-400">@{auditData.username}</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-slate-400">{auditData.email || 'No email'}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                        {auditData.role}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        auditData.is_active ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                      }`}>
                        {auditData.is_active ? 'Active Account' : 'Suspended / Disabled'}
                      </span>
                    </div>
                  </div>

                  {/* Audit Metric Tiles */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800/80 text-center">
                    <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Created On</span>
                      <span className="text-xs font-mono font-bold text-white mt-0.5 block">
                        {auditData.date_joined ? new Date(auditData.date_joined).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Last Login</span>
                      <span className="text-xs font-mono font-bold text-white mt-0.5 block">
                        {auditData.last_login ? new Date(auditData.last_login).toLocaleDateString() : 'Never'}
                      </span>
                    </div>
                    <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Proposals</span>
                      <span className="text-xs font-mono font-black text-indigo-400 mt-0.5 block">
                        {auditData.proposals_count || 0} Submitted
                      </span>
                    </div>
                    <div className="bg-slate-900/60 p-2.5 rounded-xl border border-slate-800">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Event Tickets</span>
                      <span className="text-xs font-mono font-black text-emerald-400 mt-0.5 block">
                        {auditData.event_registrations_count || 0} Registered
                      </span>
                    </div>
                  </div>
                </div>

                {/* Society Leadership Records */}
                <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-indigo-400 block">
                    🏛️ Society Responsibility & Leadership Record
                  </span>
                  {auditData.current_society ? (
                    <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between">
                      <div>
                        <span className="font-bold text-white text-sm">{auditData.current_society.name}</span>
                        <span className="text-[11px] text-slate-400 block">Category: {auditData.current_society.category || 'General'}</span>
                      </div>
                      <span className="px-2.5 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-full text-[10px] font-black uppercase">
                        Current Affiliation
                      </span>
                    </div>
                  ) : (
                    <p className="text-slate-500 text-[11px]">No departmental society currently assigned (Campus Wide profile).</p>
                  )}

                  {auditData.led_societies?.length > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-800 text-[11px]">
                      <span className="font-bold text-slate-400">Presided Societies: </span>
                      <span className="text-slate-200">{auditData.led_societies.map(s => s.name).join(', ')}</span>
                    </div>
                  )}

                  {auditData.advised_societies?.length > 0 && (
                    <div className="mt-1 text-[11px]">
                      <span className="font-bold text-slate-400">Advised Societies: </span>
                      <span className="text-slate-200">{auditData.advised_societies.map(s => s.name).join(', ')}</span>
                    </div>
                  )}
                </div>

                {/* Cabinet History */}
                {auditData.cabinet_history?.length > 0 && (
                  <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-violet-400 block">
                      🎖️ Executive Board & Cabinet Positions Held
                    </span>
                    <div className="divide-y divide-slate-800">
                      {auditData.cabinet_history.map((c, i) => (
                        <div key={i} className="py-2 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-white">{c.position}</span>
                            <span className="text-slate-400 block text-[11px]">{c.society_name} • Term {c.term_year}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 capitalize">
                            {c.status || 'Active'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Event Proposals */}
                {auditData.recent_proposals?.length > 0 && (
                  <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 block">
                      📋 Statutory Event Proposals Submitted
                    </span>
                    <div className="divide-y divide-slate-800">
                      {auditData.recent_proposals.map(p => (
                        <div key={p.id} className="py-2 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-white">{p.title}</span>
                            <span className="text-slate-400 block font-mono text-[10px]">{p.proposal_number} • {new Date(p.created_at).toLocaleDateString()}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-slate-800 text-indigo-300">
                            {p.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recent Event Registrations */}
                {auditData.recent_registrations?.length > 0 && (
                  <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2">
                    <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400 block">
                      🎟️ Event Registrations & Attendances
                    </span>
                    <div className="divide-y divide-slate-800">
                      {auditData.recent_registrations.map((r, i) => (
                        <div key={i} className="py-2 flex items-center justify-between">
                          <div>
                            <span className="font-bold text-white">{r.event_title}</span>
                            <span className="text-slate-400 block text-[10px]">{new Date(r.registered_at).toLocaleDateString()}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 capitalize">
                            {r.status || 'Confirmed'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 text-center text-slate-500 text-xs">
                No audit information available for this user account.
              </div>
            )}

            <div className="flex items-center justify-end pt-5 border-t border-slate-800 mt-6">
              <button
                type="button"
                onClick={() => setAuditTarget(null)}
                className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold cursor-pointer transition text-xs"
              >
                Close Audit History
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* VENUE MODAL                                               */}
      {/* ========================================================= */}
      {showVenueModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-lg font-black text-white mb-4">
              {editingVenue ? 'Edit Campus Venue' : 'Add Campus Venue'}
            </h3>
            <form onSubmit={handleSaveVenue} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 uppercase font-bold mb-1">Venue Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Main Auditorium Hall B"
                  value={venueForm.name}
                  onChange={e => setVenueForm({ ...venueForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-400 uppercase font-bold mb-1">Seating Capacity *</label>
                <input
                  type="number"
                  required
                  min={10}
                  value={venueForm.capacity}
                  onChange={e => setVenueForm({ ...venueForm, capacity: parseInt(e.target.value) || 50 })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-mono font-bold"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowVenueModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-black shadow-lg shadow-sky-600/30"
                >
                  Save Venue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* NEWS BULLETIN MODAL                                       */}
      {/* ========================================================= */}
      {showNewsModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-lg font-black text-white mb-4">Post Campus-Wide News Bulletin</h3>
            <form onSubmit={handleSaveNews} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 uppercase font-bold mb-1">Announcement Headline *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Tech Olympiad Registration Open"
                  value={newsForm.title}
                  onChange={e => setNewsForm({ ...newsForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold"
                />
              </div>
              <div>
                <label className="block text-slate-400 uppercase font-bold mb-1">Bulletin Content *</label>
                <textarea
                  rows={5}
                  required
                  placeholder="Type official notification body text..."
                  value={newsForm.content}
                  onChange={e => setNewsForm({ ...newsForm, content: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white leading-relaxed"
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowNewsModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-black shadow-lg shadow-amber-600/30"
                >
                  Publish Live
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* EVENT PROPOSAL DOSSIER MODAL                              */}
      {/* ========================================================= */}
      {selectedProposalForVerify && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
                  Statutory Proposal Sanction Dossier
                </span>
                <h3 className="text-xl font-black text-white mt-2">{selectedProposalForVerify.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Society: <strong className="text-white">{selectedProposalForVerify.society_name}</strong> • Ref: <span className="font-mono text-indigo-400 font-bold">{selectedProposalForVerify.proposal_doc_number || `PROP-2026-${selectedProposalForVerify.id}`}</span>
                </p>
              </div>
              <button
                onClick={() => setSelectedProposalForVerify(null)}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition"
              >
                <X size={18} />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-5 text-xs">
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">Date</span>
                <span className="font-bold text-white">{new Date(selectedProposalForVerify.date).toLocaleDateString()}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">Venue</span>
                <span className="font-bold text-white">{selectedProposalForVerify.venue_name || 'Auditorium'}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">Budget Est.</span>
                <span className="font-bold text-emerald-400">PKR {parseFloat(selectedProposalForVerify.budget_estimate || 0).toFixed(2)}</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-2xl border border-slate-800">
                <span className="text-[10px] font-bold uppercase text-slate-500 block">Expected Turnout</span>
                <span className="font-bold text-white">{selectedProposalForVerify.expected_attendees || 100} Delegates</span>
              </div>
            </div>

            {selectedProposalForVerify.agenda && (
              <div className="p-4 bg-slate-950 rounded-2xl border border-slate-800 mb-4 text-xs">
                <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Event Agenda</span>
                <p className="text-slate-300 leading-relaxed whitespace-pre-line">{selectedProposalForVerify.agenda}</p>
              </div>
            )}

            {/* Clearances Checklist */}
            <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-2xl space-y-3 mb-5 text-xs">
              <h4 className="font-bold text-white text-sm">Administrative Clearance Sanctions</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={verificationForm.advisor_approved}
                    onChange={e => setVerificationForm({ ...verificationForm, advisor_approved: e.target.checked })}
                    className="w-4 h-4 rounded text-rose-600"
                  />
                  <span className="font-bold text-slate-200">1. Faculty Advisor</span>
                </label>
                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={verificationForm.chairman_approved}
                    onChange={e => setVerificationForm({ ...verificationForm, chairman_approved: e.target.checked })}
                    className="w-4 h-4 rounded text-rose-600"
                  />
                  <span className="font-bold text-slate-200">2. Dept Chairman</span>
                </label>
                <label className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={verificationForm.hod_approved}
                    onChange={e => setVerificationForm({ ...verificationForm, hod_approved: e.target.checked })}
                    className="w-4 h-4 rounded text-rose-600"
                  />
                  <span className="font-bold text-slate-200">3. Dean / HOD</span>
                </label>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">Sanction Notes / Minutes</label>
                <input
                  type="text"
                  placeholder="e.g. Security cleared, medical station allocated, sound system booked"
                  value={verificationForm.verification_notes}
                  onChange={e => setVerificationForm({ ...verificationForm, verification_notes: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => handleSaveVerification('reject')}
                className="px-4 py-2 bg-rose-500/10 hover:bg-rose-600 text-rose-300 hover:text-white rounded-xl font-bold transition text-xs cursor-pointer"
              >
                Return for Revision
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleSaveVerification('save')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold transition text-xs cursor-pointer"
                >
                  Save Checklist
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveVerification('approve')}
                  className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black shadow-lg shadow-emerald-600/30 transition text-xs cursor-pointer"
                >
                  Sanction & Publish Live
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STATUTORY EVENT PROPOSAL VERIFICATION & DOSSIER MODAL */}
      {selectedProposalDoc && (
        <EventProposalDocumentModal
          proposal={selectedProposalDoc}
          currentUser={user}
          onClose={() => setSelectedProposalDoc(null)}
          onProposalUpdated={(updated) => {
            setProposals(prev => prev.map(p => p.id === updated.id ? updated : p));
            setSelectedProposalDoc(updated);
            fetchAllData();
          }}
        />
      )}

      {/* ========================================================= */}
      {/* TARGETED BROADCAST NOTIFICATION MODAL                     */}
      {/* ========================================================= */}
      {showBroadcastModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-purple-500/40 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-5">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
                  <Send size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white">Broadcast Targeted Alert</h3>
                  <p className="text-xs text-slate-400">Push real-time notifications to user notification trays</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowBroadcastModal(false)}
                className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleBroadcastNotification} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 uppercase font-bold mb-1.5">Target Audience *</label>
                <select
                  value={broadcastForm.target_role}
                  onChange={e => setBroadcastForm({ ...broadcastForm, target_role: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-purple-500 font-bold"
                >
                  <option value="all">All University Accounts (Campus-Wide)</option>
                  <option value="student">Registered Students Only</option>
                  <option value="president">Society Presidents Only</option>
                  <option value="faculty">Faculty Advisors Only</option>
                  <option value="admin">System Administrators</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 uppercase font-bold mb-1.5">Notification Title (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Schedule Revision Notice"
                  value={broadcastForm.title}
                  onChange={e => setBroadcastForm({ ...broadcastForm, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-bold outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-slate-400 uppercase font-bold mb-1.5">Notification Message Body *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Type urgent announcement or instructions..."
                  value={broadcastForm.message}
                  onChange={e => setBroadcastForm({ ...broadcastForm, message: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white leading-relaxed outline-none focus:border-purple-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowBroadcastModal(false)}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold cursor-pointer transition text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isBroadcasting}
                  className="px-6 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-xl font-black shadow-lg shadow-purple-600/30 cursor-pointer transition text-xs flex items-center gap-1.5"
                >
                  <Send size={13} />
                  {isBroadcasting ? 'Broadcasting...' : 'Send Broadcast'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* RESTORE DATABASE SNAPSHOT CONFIRMATION MODAL              */}
      {/* ========================================================= */}
      {restoreTargetBackup && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/50 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mb-4">
              <RotateCcw size={24} />
            </div>
            <h3 className="text-lg font-black text-white">Restore Database Snapshot?</h3>
            <p className="text-xs text-slate-300 mt-2 font-medium leading-relaxed">
              You are about to restore the campus portal state to snapshot <strong className="text-amber-400 font-mono">{restoreTargetBackup.filename}</strong>.
            </p>
            <div className="mt-3 p-3 bg-amber-950/40 border border-amber-900/50 rounded-xl text-[11px] text-amber-200/90 space-y-1">
              <p><strong>Safety Protocol:</strong> An automatic pre-restore safety snapshot will be created before overwriting the active database.</p>
              <p className="text-slate-400">Snapshot size: {(restoreTargetBackup.file_size_bytes / 1024).toFixed(1)} KB • Taken {new Date(restoreTargetBackup.created_at).toLocaleString()}</p>
            </div>

            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                type="button"
                onClick={() => setRestoreTargetBackup(null)}
                disabled={isRestoringBackup}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRestoreBackup}
                disabled={isRestoringBackup}
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl text-xs font-black shadow-lg shadow-amber-600/30 transition cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw size={13} />
                {isRestoringBackup ? 'Restoring System...' : 'Confirm Restoration'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT EVENT MODAL */}
      {editingEvent && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 text-xs text-slate-300 shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setEditingEvent(null)}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black uppercase text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/20 font-mono">
                {editingEvent.proposal_doc_number || `EVENT #${editingEvent.id}`}
              </span>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                {editingEvent.society_name}
              </span>
            </div>

            <h3 className="text-lg font-black text-white mb-4">Edit Event Details & Poster</h3>

            <form onSubmit={handleSaveEditEvent} className="space-y-4">
              {/* Event Poster / Cover Image */}
              <div>
                <label className="block text-sm font-bold text-slate-200 mb-1.5">Event Poster / Cover Image</label>
                <input 
                  type="file" 
                  accept="image/png, image/jpeg" 
                  onChange={(e) => handlePosterUploadForEvent(e.target.files[0])}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
                />
                <p className="text-[11px] text-slate-500 mt-1">Recommended size: 1200x630px (16:9 ratio)</p>
                {uploadingEventPoster && (
                  <p className="text-xs text-indigo-400 font-bold mt-1.5 animate-pulse">Uploading new poster to media storage...</p>
                )}
                {eventForm.poster_image_url && (
                  <div className="mt-2.5 relative w-full h-40 rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
                    <img 
                      src={eventForm.poster_image_url} 
                      alt="Event Poster" 
                      className="w-full h-full object-cover" 
                    />
                    <span className="absolute bottom-2 right-2 bg-emerald-600 text-white text-[10px] font-bold px-2.5 py-0.5 rounded-full shadow">
                      Current Poster
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Event Title *</label>
                <input
                  type="text"
                  required
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white font-semibold outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Venue Name</label>
                <input
                  type="text"
                  value={eventForm.venue_name}
                  onChange={(e) => setEventForm({ ...eventForm, venue_name: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Price (PKR)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={eventForm.price}
                    onChange={(e) => setEventForm({ ...eventForm, price: parseFloat(e.target.value) || 0, is_paid: parseFloat(e.target.value) > 0 })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Keynote / Chief Guest</label>
                  <input
                    type="text"
                    value={eventForm.chief_guest}
                    onChange={(e) => setEventForm({ ...eventForm, chief_guest: e.target.value })}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white outline-none focus:border-indigo-500 leading-relaxed"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingEvent(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUpdatingEvent || uploadingEventPoster}
                  className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl font-bold shadow-lg shadow-indigo-600/30 transition flex items-center gap-1.5 cursor-pointer"
                >
                  {isUpdatingEvent ? 'Saving Changes...' : 'Save & Update Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminDashboard;
