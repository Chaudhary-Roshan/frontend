import { clickMediaDownload, MediaImage } from '../components/common/AuthenticatedMedia';
import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { 
  Image as ImageIcon, Folder, FolderOpen, Lock, Globe, Eye, 
  UploadCloud, X, Calendar, Tag, Download, CheckCircle2, 
  ArrowLeft, Sparkles, Filter, ChevronRight, Layers, ExternalLink,
  Trash2
} from 'lucide-react';
import api from '../utils/api';
import ImageUploader from '../components/common/ImageUploader';

const Galleries = () => {
  const { user } = useContext(AuthContext);
  const [albums, setAlbums] = useState([]);
  const [galleries, setGalleries] = useState([]);
  const [societies, setSocieties] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters & Selected Folder View
  const [selectedSociety, setSelectedSociety] = useState('all');
  const [visibilityFilter, setVisibilityFilter] = useState('all'); // 'all' | 'public' | 'private'
  const [selectedFolder, setSelectedFolder] = useState(null); // When set, shows inside folder!

  // Lightbox Modal
  const [activeImage, setActiveImage] = useState(null);
  const [activeImageIdx, setActiveImageIdx] = useState(0);

  // Bulk Upload Modal
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadSociety, setUploadSociety] = useState('');
  const [uploadEvent, setUploadEvent] = useState('');
  const [albumTitle, setAlbumTitle] = useState('');
  const [isPublicToggle, setIsPublicToggle] = useState(true);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const [toastMsg, setToastMsg] = useState(null);

  useEffect(() => {
    fetchGalleryData();
  }, [user]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const fetchGalleryData = async () => {
    setLoading(true);
    try {
      const [albumRes, galRes, socRes, evRes] = await Promise.allSettled([
        api.get('gallery/albums/'),
        api.get('gallery/'),
        api.get('societies/'),
        api.get('events/')
      ]);

      const socData = socRes.status === 'fulfilled' ? socRes.value.data : [];
      const evData = evRes.status === 'fulfilled' ? evRes.value.data : [];
      const galData = galRes.status === 'fulfilled' ? galRes.value.data : [];
      
      setSocieties(socData);
      setEvents(evData);
      setGalleries(galData);

      if (socData.length > 0 && !uploadSociety) {
        const userSocId = user?.society ? (typeof user.society === 'object' ? user.society.id : user.society) : null;
        setUploadSociety(userSocId || socData[0].id);
      }

      // If backend returned grouped albums
      if (albumRes.status === 'fulfilled' && Array.isArray(albumRes.value.data) && albumRes.value.data.length > 0) {
        setAlbums(albumRes.value.data);
      } else {
        // Fallback client-side grouping into Event Folders
        const albumMap = {};
        galData.forEach(item => {
          const key = item.event ? `event_${item.event}` : `album_${item.society}_${item.album_name || item.title || 'General'}`;
          const ev = evData.find(e => e.id === item.event);
          const soc = socData.find(s => s.id === item.society);

          if (!albumMap[key]) {
            albumMap[key] = {
              folder_id: key,
              event_id: item.event,
              event_title: ev ? ev.title : (item.album_name || item.title || 'General Campus Event'),
              album_name: item.album_name || (ev ? `${ev.title} Showcase` : (item.title || 'Event Gallery')),
              society_id: item.society,
              society_name: soc ? soc.name : 'University Society',
              cover_photo: item.image_url,
              is_public: item.is_public !== undefined ? item.is_public : true,
              uploaded_at: item.uploaded_at,
              images: []
            };
          }
          albumMap[key].images.push(item);
        });

        const albumList = Object.values(albumMap);
        albumList.forEach(a => { a.photo_count = a.images.length; });
        setAlbums(albumList);
      }
    } catch (err) {
      console.error("Failed to load gallery albums", err);
    } finally {
      setLoading(false);
    }
  };

  // Check if current logged in user has administrative rights over this gallery folder
  const canManageFolder = (folder) => {
    if (!user) return false;
    if (user.role === 'admin' || user.is_superuser || user.is_staff) return true;
    if (user.role !== 'president' && user.role !== 'faculty') return false;

    const folderSocId = Number(folder?.society_id || folder?.society);
    if (!folderSocId) return false;

    const userSocId = Number(user.society?.id || user.society_id || user.society);
    if (userSocId && userSocId === folderSocId) return true;

    if (user.role === 'president') {
      if (Array.isArray(user.presided_society_ids) && user.presided_society_ids.map(Number).includes(folderSocId)) return true;
      if (user.society_name && folder.society_name && user.society_name.trim().toLowerCase() === folder.society_name.trim().toLowerCase()) return true;
    }
    if (user.role === 'faculty') {
      if (Array.isArray(user.advised_society_ids) && user.advised_society_ids.map(Number).includes(folderSocId)) return true;
      if (user.society_name && folder.society_name && user.society_name.trim().toLowerCase() === folder.society_name.trim().toLowerCase()) return true;
    }
    return false;
  };

  // Delete an individual photograph
  const handleDeletePhoto = async (e, photo) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!photo || !photo.id) {
      alert("Cannot delete photo: missing photo record ID.");
      return;
    }
    const confirmed = window.confirm(`Are you sure you want to permanently delete this photograph ("${photo.title || 'Event photo'}")?`);
    if (!confirmed) return;

    try {
      setIsDeleting(true);
      await api.delete(`gallery/${photo.id}/`);
      showToast("Photograph deleted successfully.");

      if (activeImage && activeImage.id === photo.id) {
        setActiveImage(null);
      }

      if (selectedFolder) {
        setSelectedFolder(prev => ({
          ...prev,
          images: (prev.images || []).filter(img => img.id !== photo.id),
          photo_count: Math.max(0, (prev.images?.length || 1) - 1)
        }));
      }

      await fetchGalleryData();
    } catch (err) {
      console.error("Failed to delete photograph", err);
      alert(err.response?.data?.error || "Failed to delete photograph. Please verify permissions.");
    } finally {
      setIsDeleting(false);
    }
  };

  // Delete an entire album folder and all photos inside it
  const handleDeleteFolder = async (e, folder) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (!folder) return;

    const count = folder.images?.length || folder.photo_count || 0;
    const confirmed = window.confirm(
      `DANGER: Are you sure you want to permanently delete the entire album folder "${folder.album_name}" along with all ${count} photograph(s) inside it?\n\nThis action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      setIsDeleting(true);
      await api.post('gallery/delete_folder/', {
        folder_id: folder.folder_id,
        event_id: folder.event_id,
        album_name: folder.album_name,
        society_id: folder.society_id
      });
      showToast(`Deleted album folder "${folder.album_name}" successfully.`);

      if (selectedFolder && selectedFolder.folder_id === folder.folder_id) {
        setSelectedFolder(null);
      }

      await fetchGalleryData();
    } catch (err) {
      console.error("Failed to delete folder", err);
      alert(err.response?.data?.error || "Failed to delete folder. Please verify permissions.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDownloadSingle = async (e, imageUrl, filename = 'campus-event-photo.jpg') => {
    if (e && e.stopPropagation) e.stopPropagation();
    try {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = filename;
      link.target = '_blank';
      link.rel = 'noreferrer';
      document.body.appendChild(link);
      await clickMediaDownload(link);
      document.body.removeChild(link);
      showToast("Download started!");
    } catch (err) {
      window.open(imageUrl, '_blank');
    }
  };

  // Download all photos in the opened folder
  const handleDownloadAllFolderPhotos = (folder) => {
    if (!folder || !folder.images || folder.images.length === 0) return;
    showToast(`Downloading all ${folder.images.length} photos from "${folder.album_name}"...`);
    folder.images.forEach((img, idx) => {
      setTimeout(async () => {
        const link = document.createElement('a');
        link.href = img.image_url;
        link.download = `${folder.event_title.replace(/\s+/g, '_')}_photo_${idx + 1}.jpg`;
        link.target = '_blank';
        link.rel = 'noreferrer';
        document.body.appendChild(link);
        await clickMediaDownload(link);
        document.body.removeChild(link);
      }, idx * 300);
    });
  };

  // Upload bulk images into a folder
  const handleUploadFolder = async (e) => {
    e.preventDefault();
    if (!uploadEvent) {
      alert("Please select the associated event first.");
      return;
    }

    if (uploadedImages.length === 0) {
      alert("Please select at least 1 image from your PC or mobile gallery.");
      return;
    }

    setIsSubmitting(true);
    const chosenEv = events.find(ev => ev.id === parseInt(uploadEvent));
    const finalAlbumName = albumTitle.trim() || (chosenEv ? `${chosenEv.title} Showcase` : 'Event Album');

    try {
      const payload = {
        images: uploadedImages,
        society_id: uploadSociety ? parseInt(uploadSociety) : (chosenEv ? chosenEv.society : null),
        event_id: parseInt(uploadEvent),
        album_name: finalAlbumName,
        title: finalAlbumName,
        is_public: isPublicToggle
      };

      const res = await api.post('gallery/bulk_create/', payload);
      showToast(`Created folder "${finalAlbumName}" with ${uploadedImages.length} photos!`);
      setShowUploadModal(false);
      setUploadedImages([]);
      setAlbumTitle('');
      setUploadEvent('');
      setIsPublicToggle(true);
      await fetchGalleryData();

      // Automatically open the newly created folder
      if (res.data?.folder) {
        setSelectedFolder(res.data.folder);
      } else if (res.data?.album_name) {
        const matching = albums.find(a => a.album_name === res.data.album_name);
        if (matching) setSelectedFolder(matching);
      }
    } catch (err) {
      alert(err.response?.data?.error || 'Bulk upload failed. Please verify selections.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtered albums
  const filteredAlbums = albums.filter(a => {
    if (selectedSociety !== 'all' && a.society_id !== parseInt(selectedSociety)) return false;
    if (visibilityFilter === 'public' && !a.is_public) return false;
    if (visibilityFilter === 'private' && a.is_public) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">

        {toastMsg && (
          <div className="fixed top-24 right-6 z-50 bg-emerald-900 text-emerald-100 border border-emerald-500 px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-3 animate-in fade-in">
            <CheckCircle2 size={18} className="text-emerald-400" />
            <span className="text-xs font-bold">{toastMsg}</span>
          </div>
        )}

        {/* ========================================================
            VIEW 1: INSIDE OPENED EVENT ALBUM FOLDER
        ======================================================== */}
        {selectedFolder ? (
          <div className="space-y-6 animate-in fade-in">
            {/* Back Button & Breadcrumbs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedFolder(null)}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-800 rounded-2xl border border-slate-200 text-xs font-bold flex items-center gap-2 shadow-sm transition cursor-pointer"
                >
                  <ArrowLeft size={16} /> Back to All Event Folders
                </button>
                <div className="hidden md:flex items-center gap-2 text-xs font-bold text-slate-400">
                  <span>Galleries</span>
                  <ChevronRight size={14} />
                  <span className="text-slate-600">{selectedFolder.society_name}</span>
                  <ChevronRight size={14} />
                  <span className="text-indigo-600 truncate max-w-xs">{selectedFolder.event_title}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 flex-wrap">
                <button
                  onClick={() => handleDownloadAllFolderPhotos(selectedFolder)}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-md shadow-indigo-600/30 transition cursor-pointer"
                >
                  <Download size={15} /> Download All ({selectedFolder.images?.length || 0} Photos)
                </button>

                {(user?.role === 'president' || user?.role === 'faculty' || user?.role === 'admin') && (
                  <button
                    onClick={() => {
                      if (selectedFolder.society_id) setUploadSociety(selectedFolder.society_id);
                      if (selectedFolder.event_id) setUploadEvent(selectedFolder.event_id);
                      setAlbumTitle(selectedFolder.album_name || '');
                      setIsPublicToggle(selectedFolder.is_public !== undefined ? selectedFolder.is_public : true);
                      setShowUploadModal(true);
                    }}
                    className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm transition cursor-pointer"
                  >
                    <UploadCloud size={15} /> + Add More Photos
                  </button>
                )}

                {canManageFolder(selectedFolder) && (
                  <button
                    onClick={(e) => handleDeleteFolder(e, selectedFolder)}
                    disabled={isDeleting}
                    className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-2xl text-xs font-bold flex items-center gap-2 shadow-sm shadow-rose-600/30 transition cursor-pointer disabled:opacity-50"
                    title="Permanently delete this entire event album folder and all photos inside it"
                  >
                    <Trash2 size={15} /> Delete Folder
                  </button>
                )}
              </div>
            </div>

            {/* Folder Header Banner */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-200 text-indigo-600 flex items-center justify-center shrink-0 shadow-inner">
                    <FolderOpen size={28} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-[10px] font-black uppercase text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                        {selectedFolder.society_name}
                      </span>
                      <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                        selectedFolder.is_public 
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                          : 'bg-amber-50 text-amber-700 border-amber-200'
                      }`}>
                        {selectedFolder.is_public ? <Globe size={11} /> : <Lock size={11} />}
                        {selectedFolder.is_public ? 'Public Showcase' : 'Private • Event Attendees Only'}
                      </span>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        {selectedFolder.images?.length || 0} Photographs
                      </span>
                    </div>

                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                      {selectedFolder.event_title}
                    </h2>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      Album Tag: <span className="font-bold text-slate-700">{selectedFolder.album_name}</span>
                      {selectedFolder.event_date && (
                        <span> • Date: {new Date(selectedFolder.event_date).toLocaleDateString()}</span>
                      )}
                    </p>
                  </div>
                </div>

                {!selectedFolder.is_public && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-900 font-medium max-w-sm">
                    🔒 <strong>Attendee Access:</strong> This album is private and only shared with registered participants of this event and society officers.
                  </div>
                )}
              </div>
            </div>

            {/* Grid of Photos Inside Folder */}
            {(!selectedFolder.images || selectedFolder.images.length === 0) ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center">
                <ImageIcon className="mx-auto text-slate-300 mb-3" size={48} />
                <h3 className="font-bold text-slate-800 text-lg">This event folder is empty</h3>
                <p className="text-sm text-slate-400 mt-1">No photographs uploaded to this album yet.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {selectedFolder.images.map((item, idx) => {
                  const src = item.image_url || item.image;
                  return (
                    <div
                      key={item.id || idx}
                      onClick={() => {
                        setActiveImage({
                          id: item.id,
                          src,
                          title: item.title || selectedFolder.event_title,
                          socName: selectedFolder.society_name,
                          evTitle: selectedFolder.event_title,
                          albumName: selectedFolder.album_name,
                          society_id: selectedFolder.society_id,
                          rawPhoto: item
                        });
                        setActiveImageIdx(idx);
                      }}
                      className="group relative h-64 bg-slate-900 rounded-3xl overflow-hidden cursor-pointer shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-200 flex flex-col justify-end"
                    >
                      <MediaImage
                        src={src}
                        alt={item.title || "Event photo"}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-90 group-hover:opacity-100"
                      />
                      <div className="relative z-10 p-3.5 bg-gradient-to-t from-slate-950/90 via-slate-950/40 to-transparent flex flex-col justify-end space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] text-white/80 font-mono">
                            Photo #{idx + 1}
                          </span>
                          <span className="text-[10px] text-slate-300 flex items-center gap-1 group-hover:text-white transition">
                            <Eye size={12} /> Fullscreen
                          </span>
                        </div>

                        <div className="flex items-center justify-between pt-1 border-t border-white/10 gap-2">
                          <span className="text-white text-xs font-bold truncate max-w-[120px]">
                            {item.title || selectedFolder.event_title}
                          </span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              onClick={(e) => handleDownloadSingle(e, src, `${selectedFolder.event_title.replace(/\s+/g, '_')}_photo_${idx + 1}.jpg`)}
                              className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-900 rounded-xl text-[10px] font-bold flex items-center gap-1 shadow transition cursor-pointer"
                              title="Download high-resolution image"
                            >
                              <Download size={11} className="text-indigo-600" /> Save
                            </button>
                            {canManageFolder(selectedFolder) && (
                              <button
                                onClick={(e) => handleDeletePhoto(e, item)}
                                disabled={isDeleting}
                                className="px-2.5 py-1 bg-rose-600/90 hover:bg-rose-700 text-white rounded-xl text-[10px] font-bold flex items-center gap-1 shadow transition cursor-pointer disabled:opacity-50"
                                title="Delete this photograph"
                              >
                                <Trash2 size={11} /> Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          /* ========================================================
              VIEW 2: ALL EVENT FOLDERS / ALBUMS GRID
          ======================================================== */
          <div className="space-y-8">
            {/* Main Header */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <span className="text-xs font-black uppercase tracking-wider text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                  Campus Media Archive & Showcase
                </span>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight mt-2 flex items-center gap-3">
                  <Folder className="text-indigo-600" /> Event Albums & Photo Folders
                </h1>
                <p className="text-slate-500 text-sm mt-1 font-medium">
                  Organized by event folders. Browse photos, open event folders, and download full-resolution memories shared by societies.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                {/* Filter by Society */}
                <select
                  value={selectedSociety}
                  onChange={(e) => setSelectedSociety(e.target.value)}
                  className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Societies ({albums.length} Folders)</option>
                  {societies.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>

                {/* Upload Button */}
                {(user?.role === 'president' || user?.role === 'faculty' || user?.role === 'admin') && (
                  <button
                    onClick={() => {
                      setUploadEvent('');
                      setAlbumTitle('');
                      setUploadedImages([]);
                      setIsPublicToggle(true);
                      setShowUploadModal(true);
                    }}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-2xl font-bold text-xs flex items-center gap-2 shadow-sm shadow-indigo-600/30 transition cursor-pointer"
                  >
                    <UploadCloud size={16} /> Create Event Folder & Bulk Upload
                  </button>
                )}
              </div>
            </div>

            {/* Privacy Filter Tabs */}
            <div className="flex items-center gap-2 pb-1 border-b border-slate-200">
              <button
                onClick={() => setVisibilityFilter('all')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  visibilityFilter === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                All Folders ({albums.length})
              </button>
              <button
                onClick={() => setVisibilityFilter('public')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  visibilityFilter === 'public'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Globe size={13} /> Public Albums ({albums.filter(a => a.is_public).length})
              </button>
              <button
                onClick={() => setVisibilityFilter('private')}
                className={`px-4 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                  visibilityFilter === 'private'
                    ? 'bg-amber-700 text-white'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                <Lock size={13} /> Private • My Registered Events ({albums.filter(a => !a.is_public).length})
              </button>
            </div>

            {/* Event Folders Grid */}
            {filteredAlbums.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-3xl p-16 text-center">
                <Folder className="mx-auto text-slate-300 mb-3" size={48} />
                <h3 className="font-bold text-slate-800 text-lg">No event album folders found</h3>
                <p className="text-sm text-slate-400 mt-1">
                  {visibilityFilter === 'private' 
                    ? 'You have not registered for any events with private photo albums yet.' 
                    : 'Event photos will appear here once bulk media folders are created.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredAlbums.map((album) => {
                  const coverImg = album.cover_photo || (album.images && album.images[0]?.image_url) || 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=800&auto=format&fit=crop&q=60';
                  const count = album.photo_count || album.images?.length || 0;

                  return (
                    <div
                      key={album.folder_id}
                      onClick={() => setSelectedFolder(album)}
                      className="group bg-white border border-slate-200 rounded-3xl overflow-hidden hover:shadow-xl hover:border-indigo-300 transition-all duration-300 flex flex-col cursor-pointer"
                    >
                      {/* Cover Photo with Glassy Accents */}
                      <div className="relative h-48 overflow-hidden bg-slate-900/40">
                        <MediaImage
                          src={coverImg}
                          alt={album.event_title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-500 opacity-90 group-hover:opacity-100"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/20 to-white/10 backdrop-blur-[1px]" />

                        {/* Top Badges with Glassy Look */}
                        <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
                          <span className="text-[10px] font-black uppercase text-white bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-xl border border-white/20 flex items-center gap-1.5 shadow-sm">
                            <Folder size={12} className="text-indigo-300" /> {count} Photos
                          </span>

                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border backdrop-blur-md ${
                            album.is_public 
                              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40' 
                              : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                          }`}>
                            {album.is_public ? <Globe size={10} /> : <Lock size={10} />}
                            {album.is_public ? 'Public' : 'Private'}
                          </span>
                        </div>

                        {/* Bottom Overlay Info */}
                        <div className="absolute bottom-3 left-3 right-3">
                          <span className="text-[10px] font-black uppercase tracking-wider text-indigo-200 block truncate drop-shadow">
                            {album.society_name}
                          </span>
                        </div>
                      </div>

                      {/* Folder Content Information */}
                      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                        <div>
                          <h3 className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition line-clamp-1">
                            {album.event_title}
                          </h3>
                          <p className="text-xs text-slate-500 font-medium line-clamp-1 mt-0.5">
                            {album.album_name}
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-400">
                            {album.event_date ? new Date(album.event_date).toLocaleDateString() : 'Active Folder'}
                          </span>
                          <div className="flex items-center gap-2">
                            {canManageFolder(album) && (
                              <button
                                onClick={(e) => handleDeleteFolder(e, album)}
                                disabled={isDeleting}
                                className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-bold transition cursor-pointer border border-rose-200 disabled:opacity-50"
                                title="Permanently delete this entire album folder"
                              >
                                <Trash2 size={13} />
                              </button>
                            )}
                            <span className="text-xs font-bold text-indigo-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                              Open Folder <ChevronRight size={14} />
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ========================================================
          FULLSCREEN LIGHTBOX MODAL WITH DOWNLOAD
      ======================================================== */}
      {activeImage && (
        <div
          onClick={() => setActiveImage(null)}
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 cursor-pointer"
        >
          <div 
            onClick={e => e.stopPropagation()} 
            className="relative max-w-5xl max-h-[92vh] rounded-3xl overflow-hidden shadow-2xl bg-slate-950 border border-slate-800 flex flex-col cursor-default w-full"
          >
            {/* Lightbox Header */}
            <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between text-white">
              <div>
                <h3 className="text-sm font-bold truncate max-w-md">{activeImage.title || activeImage.evTitle || 'Event Photograph'}</h3>
                <p className="text-xs text-slate-400 font-medium">
                  {activeImage.socName} • {activeImage.albumName || 'Event Showcase'}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={(e) => handleDownloadSingle(e, activeImage.src, `${(activeImage.evTitle || 'campus_photo').replace(/\s+/g, '_')}.jpg`)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-indigo-600/30 transition cursor-pointer"
                >
                  <Download size={14} /> Download Photo
                </button>
                {canManageFolder(selectedFolder || { society_id: activeImage.society_id }) && activeImage.id && (
                  <button
                    onClick={(e) => handleDeletePhoto(e, activeImage)}
                    disabled={isDeleting}
                    className="bg-rose-600 hover:bg-rose-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-600/30 transition cursor-pointer disabled:opacity-50"
                    title="Delete this photograph"
                  >
                    <Trash2 size={14} /> Delete Photo
                  </button>
                )}
                <button
                  onClick={() => setActiveImage(null)}
                  className="bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-xl transition cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Photo Viewer */}
            <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-black/80">
              <MediaImage src={activeImage.src} alt="Full resolution" className="max-h-[75vh] w-auto object-contain rounded-2xl" />
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          CREATE EVENT ALBUM FOLDER & BULK UPLOAD MODAL
      ======================================================== */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowUploadModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-black text-slate-900 mb-1 flex items-center gap-2">
              <UploadCloud className="text-indigo-600" /> Create Event Folder & Bulk Upload
            </h3>
            <p className="text-xs text-slate-500 font-medium mb-4">
              Select the event first, name the album folder, configure whether it is publicly visible or private to event attendees, then select photos.
            </p>

            <form onSubmit={handleUploadFolder} className="space-y-4">
              {/* STEP 1: SOCIETY & EVENT SELECTION */}
              {user?.role === 'admin' && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Departmental Society
                  </label>
                  <select
                    value={uploadSociety}
                    onChange={(e) => {
                      setUploadSociety(e.target.value);
                      setUploadEvent('');
                    }}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  >
                    {societies.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center justify-between">
                  <span>1. Select Associated Event (or Choose Custom Folder below)</span>
                  <span className="text-[10px] font-semibold text-slate-400">Creates event album folder</span>
                </label>
                <select
                  value={uploadEvent}
                  onChange={(e) => {
                    const chosenId = e.target.value;
                    const ev = events.find(ev => ev.id === parseInt(chosenId));
                    setUploadEvent(chosenId);
                    if (ev && !albumTitle) {
                      setAlbumTitle(`${ev.title} Showcase`);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                >
                  <option value="">-- Choose Event (Optional if Album Title specified) --</option>
                  {events
                    .filter(ev => !uploadSociety || ev.society === parseInt(uploadSociety))
                    .map(ev => (
                      <option key={ev.id} value={ev.id}>{ev.title}</option>
                    ))}
                </select>
              </div>

              {/* STEP 2: ALBUM TITLE / TAG */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1 flex items-center justify-between">
                  <span>2. Album Title / Folder Name</span>
                  <span className="text-[10px] text-indigo-600 font-bold">Creates Server Folder</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cyber Summit 2026 Keynote & CTF Award Ceremony"
                  value={albumTitle}
                  onChange={(e) => setAlbumTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                />
              </div>

              {/* STEP 3: PUBLICLY SHOWN TOGGLE (ON / OFF) */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-black uppercase text-slate-800 block">
                      3. Visibility & Privacy Setting
                    </span>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {isPublicToggle 
                        ? 'Publicly Shown: Folder is visible on campus gallery for all students and visitors.'
                        : 'Private: Shared only with students who registered for this event. Hidden from public.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPublicToggle(!isPublicToggle)}
                    className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      isPublicToggle ? 'bg-indigo-600' : 'bg-slate-300'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        isPublicToggle ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
                <div className="flex items-center gap-2 pt-1">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${
                    isPublicToggle 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-amber-50 text-amber-700 border-amber-200'
                  }`}>
                    {isPublicToggle ? '🌐 Public Campus Gallery (Shown Publicly)' : '🔒 Private (Event Attendees Only)'}
                  </span>
                </div>
              </div>

              {/* STEP 4: BULK IMAGE PICKER */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  4. Select Photos for this Folder
                </label>
                <ImageUploader
                  isBulk={true}
                  folder={albumTitle || (events.find(e => e.id === parseInt(uploadEvent))?.title || 'Event_Showcase')}
                  label="Select Showcase Photos (PC / Mobile Gallery)"
                  hint="Select 1 or multiple photos from phone gallery, PC files, or camera"
                  onBulkUpload={(newUrls) => setUploadedImages(prev => [...prev, ...newUrls])}
                />
              </div>

              <div className="pt-2 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-slate-600 text-xs font-bold rounded-xl hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/30 transition cursor-pointer"
                >
                  {isSubmitting ? 'Creating Folder...' : 'Create Folder & Upload Photos'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Galleries;
