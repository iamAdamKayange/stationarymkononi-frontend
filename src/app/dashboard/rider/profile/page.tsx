'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bike,
  Camera,
  Save,
  X,
  Phone,
  CreditCard,
  MapPin,
  Navigation,
  CheckCircle2,
  ShieldCheck,
  Clock,
  Award,
  Activity,
  ToggleLeft,
  ToggleRight,
  UploadCloud,
  Mail,
  Star,
} from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner';
import { useAuthStore } from '../../../../store/useAuthStore';
import { api } from '../../../../lib/api';
import toast from 'react-hot-toast';

export default function RiderProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [togglingOnline, setTogglingOnline] = useState(false);
  
  // Form state
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [vehicleType, setVehicleType] = useState('Motorcycle');
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [nationalId, setNationalId] = useState('');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [isOnline, setIsOnline] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState('PENDING_VERIFICATION');
  const [avgRating, setAvgRating] = useState(5.0);
  const [totalDeliveries, setTotalDeliveries] = useState(0);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
      return;
    }

    loadProfile();
  }, [isAuthenticated, router]);

  const loadProfile = async () => {
    try {
      const res = (await api.get('/profile')) as any;
      if (res?.data) {
        const userData = res.data;
        const riderData = userData.riderProfile;
        
        setFullName(userData.fullName || '');
        setPhoneNumber(userData.phoneNumber || '');
        setEmail(userData.email || '');
        setAvatarPreview(userData.avatarUrl || null);
        
        if (riderData) {
          setVehicleType(riderData.vehicleType || 'Motorcycle');
          setVehiclePlate(riderData.vehiclePlate || '');
          setNationalId(riderData.nationalId || '');
          setLicenseNumber(riderData.licenseNumber || '');
          setIsOnline(riderData.isOnline || false);
          setVerificationStatus(riderData.verificationStatus || 'PENDING_VERIFICATION');
          setAvgRating(riderData.avgRating || 5.0);
          setTotalDeliveries(riderData.totalDeliveries || 0);
        }
      }
    } catch (err) {
      toast.error('Imeshindikana kupakia profile');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tafadhali weka picha ya JPEG, PNG, au WebP tu');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Picha isipitishe ukubwa wa 5MB');
      return;
    }

    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append('avatar', file);

    try {
      const res = (await api.post('/profile/avatar', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })) as any;
      
      if (res?.data?.avatarUrl) {
        setAvatarPreview(res.data.avatarUrl);
        toast.success('Profile picture imewekwa vizuri! 🎉');
      }
    } catch (err) {
      toast.error('Imeshindikana kuweka profile picture');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleToggleOnline = async () => {
    setTogglingOnline(true);
    try {
      await api.put('/profile/rider', { isOnline: !isOnline });
      setIsOnline(!isOnline);
      toast.success(isOnline ? 'Umekua offline' : 'Umekua online! 🚴');
    } catch (err) {
      toast.error('Imeshindikana kubadilisha status');
    } finally {
      setTogglingOnline(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update basic profile
      await api.put('/profile/basic', {
        fullName,
        phoneNumber,
        email,
      });

      // Update rider-specific profile
      await api.put('/profile/rider', {
        vehicleType,
        vehiclePlate,
        nationalId,
        licenseNumber,
      });

      toast.success('Rider profile imehifadhiwa vizuri! ✅');
      await loadProfile();
    } catch (err) {
      toast.error('Imeshindikana kuhifadhi profile');
    } finally {
      setSaving(false);
    }
  };

  const getVerificationBadge = () => {
    switch (verificationStatus) {
      case 'VERIFIED':
        return <Badge variant="success" size="sm">Verified</Badge>;
      case 'PENDING_VERIFICATION':
        return <Badge variant="warning" size="sm">Pending</Badge>;
      case 'SUSPENDED':
        return <Badge variant="neutral" size="sm">Suspended</Badge>;
      case 'REJECTED':
        return <Badge variant="danger" size="sm">Rejected</Badge>;
      default:
        return <Badge variant="neutral" size="sm">Unknown</Badge>;
    }
  };

  if (loading) {
    return <LoadingSpinner message="Inapakia profile..." />;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">Edit Rider Profile</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Badilisha maelezo yako ya rider
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getVerificationBadge()}
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <X className="w-4 h-4 mr-1.5" /> Rudi
          </Button>
        </div>
      </div>

      {/* Profile Picture & Online Status */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-brand-50 dark:bg-brand-950/40 flex items-center justify-center overflow-hidden border-2 border-brand-200 dark:border-brand-800">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <Bike className="w-12 h-12 text-brand-600 dark:text-brand-400" />
              )}
            </div>
            <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-brand-600 hover:bg-brand-700 text-white rounded-full flex items-center justify-center cursor-pointer transition-colors shadow-md">
              <Camera className="w-4 h-4" />
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={uploadingAvatar}
              />
            </label>
            {uploadingAvatar && (
              <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 rounded-2xl flex items-center justify-center">
                <LoadingSpinner message="" />
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Online Status</h3>
              <button
                onClick={handleToggleOnline}
                disabled={togglingOnline}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                  isOnline
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {isOnline ? (
                  <>
                    <ToggleRight className="w-4 h-4" />
                    Online
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-4 h-4" />
                    Offline
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isOnline ? 'Unaonekana kwa oda mpya' : 'Haupokei oda mpya kwa sasa'}
            </p>
          </div>
        </div>
      </div>

      {/* Rider Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-bold uppercase text-slate-400">Rating</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{avgRating.toFixed(1)}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="w-4 h-4 text-brand-600" />
            <span className="text-xs font-bold uppercase text-slate-400">Usafiri</span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">{totalDeliveries}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-green-600" />
            <span className="text-xs font-bold uppercase text-slate-400">Status</span>
          </div>
          <div className="text-sm font-bold text-slate-900 dark:text-slate-100">{isOnline ? 'Active' : 'Inactive'}</div>
        </div>
      </div>

      {/* Basic Information */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Bike className="w-4 h-4 text-brand-600" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Maelezo Msingi</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Jina Kamili</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Barua Pepe</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Namba ya Simu</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3" />
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Username</label>
            <input
              type="text"
              value={user?.username || ''}
              disabled
              className="w-full px-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm text-slate-500 dark:text-slate-400 cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Vehicle Information */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Bike className="w-4 h-4 text-brand-600" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Taarifa za Chombo</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Aina ya Chombo</label>
            <select
              value={vehicleType}
              onChange={(e) => setVehicleType(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-slate-100"
            >
              <option value="Motorcycle">Pikipiki (Motorcycle)</option>
              <option value="Bicycle">Baiskeli (Bicycle)</option>
              <option value="Car">Gari / Bajaj</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Namba ya Bamba (Plate)</label>
            <input
              type="text"
              value={vehiclePlate}
              onChange={(e) => setVehiclePlate(e.target.value)}
              placeholder="MF: 482 DHZ"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>
      </div>

      {/* Verification Documents */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <ShieldCheck className="w-4 h-4 text-brand-600" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Vyeti vya Usajili</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Namba ya Kitambulisho (NIN)</label>
            <input
              type="text"
              value={nationalId}
              onChange={(e) => setNationalId(e.target.value)}
              placeholder="2001xxxxxxxxxx"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Namba ya Leseni</label>
            <input
              type="text"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.target.value)}
              placeholder="Class A / B"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>
      </div>

      {/* Unique Rider Features */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950/20 dark:to-cyan-950/20 rounded-3xl p-6 border border-blue-200/50 dark:border-blue-800/50 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Features za Kipekee za Rider</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Live GPS Tracking</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Smart Order Assignment</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>In-App Navigation</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Instant Payment Alerts</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Customer Chat Support</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Delivery History Tracking</span>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex items-center justify-end gap-3">
        <Button variant="outline" onClick={() => router.back()}>
          <X className="w-4 h-4 mr-1.5" /> Ghairi
        </Button>
        <Button variant="primary" onClick={handleSave} isLoading={saving} leftIcon={<Save className="w-4 h-4" />}>
          Hifadhi Mabadiliko
        </Button>
      </div>
    </div>
  );
}