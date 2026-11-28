import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/General/LoadingSpinner';
import WalkPhotos from '../components/Walk/WalkPhotos';
import WalkExperiences from '../components/Walk/WalkExperiences';
import AddWalkPhotoModal from '../components/Walk/AddWalkPhotoModal';
import EditWalkModal from '../components/Walk/EditWalkModal';
import RegisterWalkModal from '../components/Walk/RegisterWalkModal';
import type { WalkDetail as WalkDetailType, WalkExperience } from '../interfaces/Walk';
import {
  Calendar, MapPin, Users, Edit, Trash2, Camera, ExternalLink, ArrowLeft,
  Plus, X, CheckCircle, Download, Clock, Pen
} from 'lucide-react';
import toast from 'react-hot-toast';
import { parseApiResponse } from '../utils/imageCompressor';
import { reload } from 'firebase/auth';

const WalkDetail = () => {
  const { walkCode } = useParams<{ walkCode: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [walk, setWalk] = useState<WalkDetailType | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'photos' | 'experiences'>('photos');
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddPhotoModalOpen, setIsAddPhotoModalOpen] = useState(false);
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCancellingRegistration, setIsCancellingRegistration] = useState(false);
  const [isLoadingRegistration, setIsLoadingRegistration] = useState(false);
  const [userRegistration, setUserRegistration] = useState<{ slots: number } | null>(null);
  const [registeredParticipants, setRegisteredParticipants] = useState<{ username: string; whatsapp: string; slots: number }[]>([]);

  const fetchWalkDetail = useCallback(async () => {
    if (!walkCode) return;
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/Walk/getWalk?walkCode=${walkCode}`);
      if (!response.ok) {
        if (response.status === 404) {
          setError('Walk not found');
        } else {
          setError('Failed to fetch walk details');
        }
        return;
      }
      const data = await response.json();
      setWalk(data);
    } catch (err) {
      console.error('Error fetching walk:', err);
      setError('Network error loading walk details');
    } finally {
      setLoading(false);
    }
  }, [walkCode]);

  useEffect(() => {
    fetchWalkDetail();
  }, [fetchWalkDetail]);

  const fetchWalkRegistration = useCallback(async () => {
    if (!walk || !user) {
      setUserRegistration(null);
      setRegisteredParticipants([]);
      return;
    }

    setIsLoadingRegistration(true)
    try {
      const query = new URLSearchParams({ walkId: walk._id, userId: user.uid });
      const token = await user.getIdToken();
      const response = await fetch(`/api/Walk/getWalkRegistrations?${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Parse the raw HTTP response directly.
      const data = await response.json() as {
        success?: boolean
        error?: string
        registration?: { slots: number } | null
        registrations?: { username: string; whatsapp: string; slots: number }[]
      };

      if (!response.ok)
        throw new Error(data.error || 'Failed to fetch walk registrations');

      // Verify that the backend actually returned the expected property.
      if (!Object.prototype.hasOwnProperty.call(data, 'registration'))
        throw new Error('Invalid registration API response');

      setUserRegistration(data.registration ?? null);
      setRegisteredParticipants(isAdmin ? data.registrations ?? [] : []);

    } catch (err: unknown) {
      console.error('Error fetching walk registration:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to fetch walk registration');
    } finally {
      setIsLoadingRegistration(false);
    }
  }, [walk, user, isAdmin]);

  useEffect(() => {
    fetchWalkRegistration();
  }, [fetchWalkRegistration]);

  const handleAddWalkExperience = async (info: string) => {
    if (!walk || !user)
      throw new Error('Please login to share your experience.');
    const token = await user.getIdToken();
    const response = await fetch('/api/Walk/addWalkExperience', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ walkId: walk._id, userId: user.uid, info })
    });
    const result = await parseApiResponse<{ success?: boolean; experience?: WalkExperience }>(response);
    if (!result.success)
      throw new Error('The server did not confirm the saved experience.');

    const newExperience = result.experience;
    if (newExperience?.id && newExperience.addedAt) {
      setWalk((current) => current
        ? {
          ...current,
          walkExperiences: [
            newExperience,
            ...(current.walkExperiences ?? []).filter((item) => item.id !== newExperience.id)
          ]
        }
        : current);
      toast.success('Experience shared successfully');
      return;
    }

    try {
      const query = new URLSearchParams({ walkCode: walk.walkCode });
      const refreshResponse = await fetch(`/api/Walk/getWalk?${query}`);
      if (!refreshResponse.ok)
        throw new Error(`Failed to refresh walk experiences (${refreshResponse.status})`);

      const refreshedWalk = await refreshResponse.json() as { walkExperiences?: WalkExperience[] };
      const refreshedExperiences = refreshedWalk.walkExperiences;
      if (!Array.isArray(refreshedExperiences))
        throw new Error('The refreshed walk response did not contain experiences.');
      setWalk((current) => current
        ? { ...current, walkExperiences: refreshedExperiences }
        : current);
      toast.success('Experience shared successfully');
    } catch (refreshError: unknown) {
      console.error('Experience was saved, but the list could not be refreshed:', refreshError);
      toast.error('Experience was shared, but the list could not be refreshed. Reload the page to view it.');
    }
  }

  const handleEditWalkExperience = async (experienceId: string, info: string) => {
    if (!user)
      throw new Error('Please login to edit this experience.');
    const token = await user.getIdToken();
    const response = await fetch('/api/Walk/editWalkExperience', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ experienceId, userId: user.uid, info })
    });
    await parseApiResponse(response);
    setWalk((current) => current
      ? {
        ...current,
        walkExperiences: current.walkExperiences.map((item) =>
          item.id === experienceId ? { ...item, info } : item)
      }
      : current);
    toast.success('Experience updated successfully');
  }

  const handleEditWalkPhoto = async (photoId: string, info: string) => {
    if (!user)
      throw new Error('Please login to edit this photo.');
    const token = await user.getIdToken();
    const response = await fetch('/api/Walk/editWalkPhoto', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ photoId, userId: user.uid, info })
    });
    await parseApiResponse(response);
    setWalk((current) => current
      ? {
        ...current,
        walkPhotos: current.walkPhotos.map((photo) =>
          photo._id === photoId ? { ...photo, info } : photo)
      }
      : current);
    toast.success('Photo info updated successfully');
  }

  const handleDeleteWalkPhoto = async (photoId: string) => {
    if (!walk || !user) return;
    if (!window.confirm('Are you sure you want to delete this photo?')) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/Walk/deleteWalkPhoto', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ walkId: walk._id, photoId, userId: user.uid })
      });

      await parseApiResponse(response);

      setWalk(current => current
        ? {
          ...current,
          walkPhotos: current.walkPhotos.filter(
            photo => photo._id !== photoId
          )
        }
        : current
      );

      toast.success('Photo deleted successfully');
    } catch (error) {
      console.error('Error deleting walk photo:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete photo');
    }
  }

  const handleDeleteWalkExperience = async (experienceId: string) => {
    if (!walk || !user) return;
    if (!window.confirm('Are you sure you want to delete this experience?')) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/Walk/deleteWalkExperience', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ walkId: walk._id, experienceId, userId: user.uid })
      });

      await parseApiResponse(response);

      setWalk(current => current
        ? {
          ...current,
          walkExperiences: current.walkExperiences.filter(
            item => item.id !== experienceId
          )
        }
        : current
      );

      toast.success('Experience deleted successfully');
    } catch (error) {
      console.error('Error deleting walk experience:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to delete experience');
    }
  }

  const handleCancelRegistration = async () => {
    if (!walk || !user || !window.confirm('Are you sure you want to cancel your registration?')) return;

    setIsCancellingRegistration(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/Walk/cancelWalkRegistration', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ walkId: walk._id, userId: user.uid })
      });
      await parseApiResponse(response);
      await fetchWalkDetail();
      await fetchWalkRegistration();
      toast.success('Registration cancelled successfully');
    } catch (err: unknown) {
      console.error('Error cancelling walk registration:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to cancel registration');
    } finally {
      setIsCancellingRegistration(false);
    }
  }

  const handleDownloadParticipants = () => {
    const escapeCsvValue = (value: string) => {
      const safeValue = /^[=+\-@]/.test(value) ? `'${value}` : value
      return `"${safeValue.replace(/"/g, '""')}"`
    }
    const rows = [
      ['Sr. No.', 'Username', 'WhatsApp Contact', 'Slots Booked'],
      ...registeredParticipants.map((participant, index) => [
        String(index + 1),
        participant.username,
        String(participant.slots)
      ])
    ];
    const csv = `\uFEFF${rows.map((row) => row.map(escapeCsvValue).join(',')).join('\r\n')}`;
    const blobUrl = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const anchor = document.createElement('a');
    anchor.href = blobUrl;
    anchor.download = `${walk?.walkCode || 'walk'}-registered-participants.csv`;
    anchor.click();
    window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  }

  const handleDeleteWalk = async () => {
    if (!walk || !user || !isAdmin) return;
    const confirmed = window.confirm(
      `Are you sure you want to delete the walk "${walk.title || walk.walkCode}"? This will also remove associated photos.`
    );
    if (!confirmed) return;

    setIsDeleting(true);
    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/Walk/deleteWalk', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ walkId: walk._id, userId: user.uid })
      });

      await parseApiResponse(response);
      toast.success('Walk deleted successfully');
      navigate('/walks');
    } catch (err: unknown) {
      console.error('Error deleting walk:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to delete walk');
    } finally {
      setIsDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="py-20 flex justify-center items-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !walk) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="p-8 glass-card space-y-4">
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            {error || 'Walk Not Found'}
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            The requested walk might have been removed or the link is invalid.
          </p>
          <Link to="/walks" className="btn-primary inline-flex items-center space-x-2">
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Walks</span>
          </Link>
        </div>
      </div>
    );
  }

  const dateObj = new Date(walk.datetime);
  const isValidDate = !isNaN(dateObj.getTime());
  const isPast = isValidDate && dateObj < new Date()
  const maxCapacity = walk.limit && walk.limit > 0 ? walk.limit : 25;
  const isFull = walk.bookedSlots >= maxCapacity;
  const availableSlots = Math.max(0, maxCapacity - walk.bookedSlots);

  const posterUrl = walk.featuredPhoto
    ? (walk.featuredPhoto.startsWith('http')
      ? walk.featuredPhoto
      : `${import.meta.env.VITE_IMAGEKIT_URL_ENDPOINT}${walk.featuredPhoto}`)
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-10 animate-fade-in relative z-10">
      {/* Back button and breadcrumb */}
      <div className="flex items-center justify-between">
        <Link
          to="/walks"
          className="inline-flex items-center space-x-2 text-sm font-medium text-slate-600 dark:text-slate-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>All Walks</span>
        </Link>

        {/* Admin Controls */}
        {user && isAdmin && (
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="btn-secondary text-sm py-2 px-3.5 flex items-center space-x-1.5"
            >
              <Edit className="w-4 h-4" />
              <span>Edit Walk</span>
            </button>
            <button
              onClick={handleDeleteWalk}
              disabled={isDeleting}
              className="px-3.5 py-2 text-sm rounded-xl font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border border-red-200 dark:border-red-900/30 transition-colors flex items-center space-x-1.5"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isDeleting ? 'Deleting...' : 'Delete'}</span>
            </button>
          </div>
        )}
      </div>

      {/* Main Walk Details Card */}
      <div className="glass rounded-3xl overflow-hidden shadow-2xl border border-white/20 dark:border-slate-800">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
          {/* Poster Image */}
          <div className="lg:col-span-5 relative bg-slate-900 min-h-[300px] lg:min-h-[460px]">
            {posterUrl ? (
              <img
                src={posterUrl}
                alt={walk.title || 'Walk Poster'}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center p-8 text-primary-300">
                <Calendar className="w-20 h-20 opacity-40 mb-3" />
                <span className="text-sm font-medium">feathers of roorkee</span>
              </div>
            )}
            <div className="absolute top-4 left-4">
              {isPast ? (
                <span className="bg-slate-900/80 backdrop-blur-md text-white px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
                  Completed
                </span>
              ) : isFull ? (
                <span className="bg-red-500/90 backdrop-blur-md text-white px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
                  Fully Booked
                </span>
              ) : (
                <span className="bg-green-600/90 backdrop-blur-md text-white px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider shadow-lg">
                  Open for Registration
                </span>
              )}
            </div>
          </div>

          {/* Details Content */}
          <div className="lg:col-span-7 p-6 md:p-10 flex flex-col justify-between space-y-6">
            <div className="space-y-6">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
                  BirdWalk Name
                </span>
                <h1 className="text-3xl md:text-4xl font-display font-bold text-slate-900 dark:text-white mt-1">
                  {walk.title || walk.info || 'BirdWalk'}
                </h1>
              </div>

              {/* Date & Location Pill Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start space-x-3.5">
                  <div className="p-2.5 rounded-xl bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 shrink-0">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Date & Time</p>
                    {isValidDate ? (
                      <>
                        <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">
                          {dateObj.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                        <p className="text-sm text-slate-800 dark:text-slate-200 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3.5 h-3.5" />
                          {dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </>
                    ) : (
                      <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm">To be announced</p>
                    )}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-start space-x-3.5">
                  <div className="p-2.5 rounded-xl bg-bird-100 dark:bg-bird-900/30 text-bird-600 dark:text-bird-400 shrink-0">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Meeting Point</p>
                    <p className="font-semibold text-slate-800 dark:text-slate-200 text-sm truncate">
                      {walk.location}
                    </p>
                    {walk.mapPin && (
                      <a
                        href={walk.mapPin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary-600 dark:text-primary-400 hover:underline inline-flex items-center gap-1 mt-0.5 font-medium"
                      >
                        <span>View on Google Maps</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {/* Participant Progress */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2">
                    <Users className="w-4 h-4 text-primary-500" />
                    Participants
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {walk.bookedSlots} / {maxCapacity} slots filled
                  </span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${isFull ? 'bg-red-500' : 'bg-primary-500'
                      }`}
                    style={{ width: `${Math.min(100, (walk.bookedSlots / maxCapacity) * 100)}%` }}
                  />
                </div>
                {!isPast && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {isFull
                      ? 'This walk is fully booked.'
                      : `${availableSlots} slot${availableSlots === 1 ? '' : 's'} remaining. Reserve yours below.`}
                  </p>
                )}
              </div>

              {/* Description */}
              {walk.info && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    About this BirdWalk
                  </h3>
                  <p className="text-slate-600 dark:text-slate-300 whitespace-pre-line leading-relaxed text-sm">
                    {walk.info}
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-3">
              {userRegistration ? (
                <button
                  onClick={handleCancelRegistration}
                  disabled={isCancellingRegistration}
                  className="flex-1 min-w-[200px] flex items-center justify-center space-x-2 py-3 rounded-xl font-semibold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/40 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-60"
                >
                  <X className="w-5 h-5" />
                  <span>{isCancellingRegistration ? 'Cancelling...' : 'Cancel registration'}</span>
                </button>
              ) : isLoadingRegistration && user ? (
                <button
                  disabled
                  className="btn-secondary flex-1 min-w-[200px] flex items-center justify-center space-x-2 py-3"
                >
                  <span>Checking registration...</span>
                </button>
              ) : (!isPast && !isFull) ? (
                <button
                  onClick={async () => {
                    if (!user) {
                      toast('Please login to register for walks', { icon: 'ℹ️' });
                      navigate('/login');
                      return;
                    }
                    try {
                      await reload(user);
                      if (!user.emailVerified) {
                        toast.error('Your email is not verified. Please verify it from your Profile page to register for BirdWalks.');
                        return;
                      }
                      // Refresh the ID token so its email_verified claim is up to date.
                      await user.getIdToken(true);
                      setIsRegisterModalOpen(true);
                    } catch (error) {
                      console.error('Error checking email verification:', error);
                      toast.error('Unable to check your email verification status. Please try again.');
                    }
                  }}
                  className="btn-primary flex-1 min-w-[200px] flex items-center justify-center space-x-2 py-3"
                >
                  <Plus className="w-5 h-5" />
                  <span>Register for BirdWalk</span>
                </button>
              ) : (
                <button
                  className="btn-secondary flex-1 min-w-[200px] flex items-center justify-center space-x-2 py-3"
                  disabled
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>Registration Closed</span>
                </button>
              )}

            </div>
          </div>
        </div>
      </div>

      {/* Registered Participants */}
      {user && isAdmin && (
        <section className="glass-card p-6 md:p-8 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white">
              Registered Participants
            </h2>
            <button
              onClick={handleDownloadParticipants}
              disabled={registeredParticipants.length === 0}
              className="btn-secondary inline-flex items-center justify-center gap-2 py-2.5 px-4 text-sm disabled:opacity-50"
            >
              <Download className="w-4 h-4" />
              <span>Download table</span>
            </button>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
                <tr>
                  <th scope="col" className="px-4 py-3 font-semibold">Sr. No.</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Username</th>
                  <th scope="col" className="px-4 py-3 font-semibold">WhatsApp Contact</th>
                  <th scope="col" className="px-4 py-3 font-semibold">Slots Booked</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {registeredParticipants.map((participant, index) => (
                  <tr key={`${participant.username}-${index}`} className="text-slate-700 dark:text-slate-300">
                    <td className="px-4 py-3">{index + 1}</td>
                    <td className="px-4 py-3">{participant.username}</td>
                    <td className="px-4 py-3">{participant.whatsapp}</td>
                    <td className="px-4 py-3">{participant.slots}</td>
                  </tr>
                ))}
                {registeredParticipants.length === 0 && (
                  <tr>
                    <td colSpan={3} className="px-4 py-6 text-center text-slate-500 dark:text-slate-400">
                      No participants registered yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="max-w-6xl mx-auto">
        <div className="flex max-w-sm h-12 rounded-xl overflow-hidden shadow-lg mb-8 mx-auto">
          <button
            onClick={() => setActiveTab('photos')}
            className={`flex-1 flex items-center justify-center space-x-2 px-5 py-3 text-sm font-medium transition-all
              ${activeTab === 'photos' ?
                'text-white bg-gradient-to-r from-primary-600 to-primary-500' :
                'text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-blue-100 dark:hover:bg-slate-800'
              }
            `}
          >
            <Camera className="h-5 w-5" /> <span>Photos</span>
          </button>
          <button
            onClick={() => setActiveTab('experiences')}
            className={`flex-1 flex items-center justify-center space-x-2 px-5 py-3 text-sm font-medium transition-all
              ${activeTab === 'experiences' ?
                'text-white bg-gradient-to-r from-primary-600 to-primary-500' :
                'text-slate-600 dark:text-slate-300 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-blue-100 dark:hover:bg-slate-800'
              }
            `}
          >
            <Pen className="h-5 w-5" /> <span>Experiences</span>
          </button>
        </div>

        {activeTab === 'photos' ? (
          <WalkPhotos
            photos={walk.walkPhotos || []}
            user={user}
            onEditPhoto={handleEditWalkPhoto}
            onDeletePhoto={handleDeleteWalkPhoto}
            onAddPhoto={() => { setIsAddPhotoModalOpen(true) }}
          />
        ) : (
          <WalkExperiences
            experiences={walk.walkExperiences || []}
            onAddExperience={handleAddWalkExperience}
            onEditExperience={handleEditWalkExperience}
            onDeleteExperience={handleDeleteWalkExperience}
          />
        )}
      </section>

      {/* Modals */}
      {isEditModalOpen && (
        <EditWalkModal
          walk={walk}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => {
            setIsEditModalOpen(false)
            fetchWalkDetail()
            toast.success('Walk updated successfully!')
          }}
        />
      )}

      {isAddPhotoModalOpen && (
        <AddWalkPhotoModal
          walkId={walk._id}
          onClose={() => setIsAddPhotoModalOpen(false)}
          onSuccess={() => {
            setIsAddPhotoModalOpen(false)
            fetchWalkDetail()
            toast.success('Photo and experience shared successfully!')
          }}
        />
      )}

      {isRegisterModalOpen && (
        <RegisterWalkModal
          walkId={walk._id}
          walkTitle={walk.title || walk.walkCode}
          availableSlots={availableSlots}
          onClose={() => setIsRegisterModalOpen(false)}
          onSuccess={() => {
            setIsRegisterModalOpen(false)
            void fetchWalkDetail()
            void fetchWalkRegistration()
            toast.success('Registration submitted successfully!')
          }}
        />
      )}
    </div>
  );
}

export default WalkDetail;
