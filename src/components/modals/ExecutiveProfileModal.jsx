import React, { useState, useContext } from 'react';
import {
  User, Mail, Phone, Building, GraduationCap, Shield, ShieldCheck,
  X, Check, CheckCircle2, Lock, AlertCircle, Loader2, Sparkles,
  Eye, EyeOff, Award, IdCard
} from 'lucide-react';
import api from '../../utils/api';
import { AuthContext } from '../../context/AuthContext';
import { getMediaUrl, handleImageError } from '../../utils/media';
import { 
  FACULTIES, 
  DEPARTMENTS, 
  getDepartmentsForFaculty, 
  findFacultyForDepartment 
} from '../../utils/academicCatalog';

/**
 * Universal Executive Staff & Faculty Profile Modal
 * Supports:
 * - Society Presidents (role === 'president')
 * - Faculty Advisors (role === 'faculty')
 * - Executive Staff / Cabinet Members (role === 'student' / 'cabinet' with is_cabinet_member)
 * - Super Admins (role === 'admin')
 * 
 * Includes:
 * - Avatar / Photo upload from local storage, mobile gallery, or camera
 * - Name, Phone, Department, Faculty Division, Gender, CNIC editing
 * - Change Password in-modal
 * - Synchronization with AuthContext and parent state
 */
const ExecutiveProfileModal = ({ isOpen, onClose, onProfileUpdated, customTitle = null }) => {
  const { user, updateUser } = useContext(AuthContext);

  if (!isOpen) return null;

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // Form State
  const [form, setForm] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    phone_number: user?.phone_number || '',
    gender: user?.gender || '',
    department: user?.department || '',
    faculty_name: user?.faculty_name || '',
    designation: user?.designation || user?.student_designation || '',
    cnic: user?.cnic || '',
    avatar_url: user?.avatar_url || user?.profile_photo_url || '',
  });

  const availableDepartments = React.useMemo(() => {
    if (form.faculty_name) {
      return getDepartmentsForFaculty(form.faculty_name);
    }
    return DEPARTMENTS;
  }, [form.faculty_name]);

  const handleFacultyChange = (newFac) => {
    const deptsInFac = getDepartmentsForFaculty(newFac);
    const keepDept = deptsInFac.includes(form.department);
    setForm(prev => ({
      ...prev,
      faculty_name: newFac,
      department: keepDept ? prev.department : ''
    }));
  };

  const handleDepartmentChange = (newDept) => {
    const parentFac = findFacultyForDepartment(newDept);
    setForm(prev => ({
      ...prev,
      department: newDept,
      faculty_name: parentFac || prev.faculty_name
    }));
  };

  // Password Change State
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showNewPwd, setShowNewPwd] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const roleLabel = user?.role === 'president'
    ? 'Society President'
    : user?.role === 'faculty'
      ? 'Faculty Advisor'
      : user?.is_cabinet_member
        ? `Executive Cabinet • ${user?.cabinet_role || 'Staff'}`
        : user?.role === 'admin'
          ? 'Super Administrator'
          : 'Executive Member';

  const societyDisplay = user?.society_name || user?.cabinet_society_name || (
    user?.advised_societies?.length > 0
      ? user.advised_societies.map(s => s.name).join(', ')
      : user?.presided_societies?.length > 0
        ? user.presided_societies.map(s => s.name).join(', ')
        : 'Assigned Campus Society'
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleCnicChange = (e) => {
    const d = e.target.value.replace(/\D/g, '');
    let formatted = d;
    if (d.length > 5 && d.length <= 12) {
      formatted = `${d.slice(0, 5)}-${d.slice(5)}`;
    } else if (d.length > 12) {
      formatted = `${d.slice(0, 5)}-${d.slice(5, 12)}-${d.slice(12, 13)}`;
    }
    setForm(prev => ({ ...prev, cnic: formatted }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!form.first_name.trim()) {
      setError('First name is required.');
      return;
    }

    // Password validation if user entered password fields
    if (newPassword || currentPassword) {
      if (!currentPassword) {
        setError('Current password is required to set a new password.');
        return;
      }
      if (newPassword.length < 8) {
        setError('New password must be at least 8 characters long.');
        return;
      }
      if (newPassword !== confirmPassword) {
        setError('New passwords do not match.');
        return;
      }
    }

    setSaving(true);
    try {
      // 1. Update Profile Fields
      const profilePayload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone_number: form.phone_number.trim(),
        gender: form.gender,
        department: form.department.trim(),
        faculty_name: form.faculty_name.trim(),
        designation: form.designation.trim(),
        cnic: form.cnic.trim(),
        avatar_url: form.avatar_url,
        profile_photo_url: form.avatar_url,
      };

      const res = await api.patch('auth/profile/', profilePayload);
      const updatedUser = res.data;

      // 2. Change password if requested
      if (currentPassword && newPassword) {
        await api.post('auth/change-password/', {
          current_password: currentPassword,
          new_password: newPassword,
        });
        setPasswordSuccess(true);
      }

      // Update global user state in context
      if (updateUser) {
        updateUser(updatedUser);
      }

      setSuccess(true);
      if (onProfileUpdated) {
        onProfileUpdated(updatedUser);
      }

      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);

    } catch (err) {
      console.error('Failed to update executive profile:', err);
      const errMsg = err.response?.data?.error ||
        err.response?.data?.detail ||
        (Array.isArray(err.response?.data?.non_field_errors) ? err.response.data.non_field_errors.join(' ') : null) ||
        'Failed to save profile. Please review the details and try again.';
      setError(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/75 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden relative my-auto">
        
        {/* MODAL HEADER */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 sm:p-7 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 w-9 h-9 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition cursor-pointer"
            title="Close"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-black uppercase tracking-wider text-indigo-300 bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-400/30 flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-indigo-400" />
              {roleLabel}
            </span>
            <span className="text-[11px] font-bold text-slate-300 bg-white/10 px-3 py-1 rounded-full">
              {societyDisplay}
            </span>
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <User className="text-indigo-400" size={24} />
            {customTitle || `${roleLabel} Profile`}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-lg font-medium">
            Manage your official executive profile photo, personal credentials, campus department, and contact information.
          </p>
        </div>

        {/* NOTIFICATIONS */}
        {error && (
          <div className="mx-6 sm:mx-8 mt-5 p-3.5 bg-rose-50 border border-rose-200 rounded-2xl text-xs font-bold text-rose-700 flex items-center gap-2.5">
            <AlertCircle size={17} className="text-rose-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mx-6 sm:mx-8 mt-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-800 flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 size={17} className="text-emerald-500 shrink-0" />
            <span>Profile and photo updated successfully! Synchronizing system changes...</span>
          </div>
        )}

        {/* PROFILE FORM */}
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* 1. PROFILE PHOTO / AVATAR UPLOAD */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-indigo-600" /> Executive Profile Photo
                </h4>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Upload your high-resolution official photo. Supports device gallery, PC local storage, or phone camera.
                </p>
              </div>
            </div>

            <ImageUploader
              label=""
              hint="Tap to browse local storage, mobile photos, or snap a picture"
              shape="avatar"
              folder="avatars"
              value={form.avatar_url}
              onChange={(url) => setForm(prev => ({ ...prev, avatar_url: url }))}
            />
          </div>

          {/* 2. PERSONAL DETAILS GRID */}
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <User size={14} className="text-indigo-600" /> Personal Identity & Contact
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    name="first_name"
                    value={form.first_name}
                    onChange={handleChange}
                    placeholder="Enter first name"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-bold text-slate-900 outline-none transition"
                  />
                  <User size={15} className="absolute left-3 top-3 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
                  Last Name
                </label>
                <input
                  type="text"
                  name="last_name"
                  value={form.last_name}
                  onChange={handleChange}
                  placeholder="Enter last name"
                  className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-bold text-slate-900 outline-none transition"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
                  Contact Phone Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="phone_number"
                    value={form.phone_number}
                    onChange={handleChange}
                    placeholder="e.g. +92 300 1234567"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-bold text-slate-900 outline-none transition"
                  />
                  <Phone size={15} className="absolute left-3 top-3 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
                  Gender
                </label>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-bold text-slate-900 outline-none transition cursor-pointer"
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other / Prefer not to say</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
                  National CNIC Number
                </label>
                <div className="relative">
                  <input
                    type="text"
                    name="cnic"
                    value={form.cnic}
                    onChange={handleCnicChange}
                    maxLength={15}
                    placeholder="e.g. 31202-1234567-1"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-mono font-bold text-slate-900 outline-none transition"
                  />
                  <IdCard size={15} className="absolute left-3 top-3 text-slate-400" />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
                  Primary Campus Email <span className="text-[10px] text-slate-400 font-normal lowercase">(read-only)</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    disabled
                    value={user?.email || ''}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-medium text-slate-500 cursor-not-allowed"
                  />
                  <Mail size={15} className="absolute left-3 top-3 text-slate-400" />
                </div>
              </div>
            </div>
          </div>

          {/* 3. ACADEMIC & INSTITUTIONAL AFFILIATION */}
          <div className="space-y-4">
            <div className="border-b border-slate-100 pb-2">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Building size={14} className="text-indigo-600" /> Academic Affiliation
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Faculty Division */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
                  Faculty Division
                </label>
                <div className="relative">
                  <select
                    name="faculty_name"
                    value={form.faculty_name}
                    onChange={e => handleFacultyChange(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-bold text-slate-900 outline-none transition cursor-pointer"
                  >
                    <option value="">-- Select Faculty --</option>
                    {FACULTIES.map(fac => (
                      <option key={fac} value={fac}>{fac}</option>
                    ))}
                  </select>
                  <GraduationCap size={15} className="absolute left-3 top-3 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Department */}
              <div>
                <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
                  Department
                </label>
                <div className="relative">
                  <select
                    name="department"
                    value={form.department}
                    onChange={e => handleDepartmentChange(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-bold text-slate-900 outline-none transition cursor-pointer"
                  >
                    <option value="">-- Select Department --</option>
                    {form.department && !availableDepartments.includes(form.department) && (
                      <option value={form.department}>{form.department} (Current)</option>
                    )}
                    {availableDepartments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                  <Building size={15} className="absolute left-3 top-3 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1.5">
                Official Designation / Title
              </label>
              <div className="relative">
                <input
                  type="text"
                  name="designation"
                  value={form.designation}
                  onChange={handleChange}
                  placeholder={user?.role === 'faculty' ? "e.g. Associate Professor / Department Chair" : "e.g. Society President / Executive Member"}
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 hover:bg-slate-100/70 focus:bg-white border border-slate-200 focus:border-indigo-500 rounded-xl text-xs font-bold text-slate-900 outline-none transition"
                />
                <Award size={15} className="absolute left-3 top-3 text-slate-400" />
              </div>
            </div>
          </div>

          {/* 4. SECURITY & PASSWORD CHANGE ACCORDION */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <button
              type="button"
              onClick={() => setShowPasswordChange(prev => !prev)}
              className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 hover:bg-slate-100 transition text-left cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Lock size={15} className="text-indigo-600" />
                <span className="text-xs font-black text-slate-800">Change Account Password</span>
                {passwordSuccess && (
                  <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Updated
                  </span>
                )}
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {showPasswordChange ? '▲ Collapse' : '▼ Expand'}
              </span>
            </button>

            {showPasswordChange && (
              <div className="p-4 sm:p-5 bg-white border-t border-slate-100 space-y-3.5 animate-in fade-in">
                <div>
                  <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                    Current Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPwd ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="Enter current password"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-indigo-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                      New Password (Min 8 chars)
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPwd ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="At least 8 characters"
                        className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-indigo-500"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPwd(!showNewPwd)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                      >
                        {showNewPwd ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold uppercase text-slate-600 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat new password"
                      className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ACTION BUTTONS */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 transition flex items-center gap-2 cursor-pointer"
            >
              {saving ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Saving Profile...
                </>
              ) : (
                <>
                  <Check size={15} />
                  Save Changes
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default ExecutiveProfileModal;
