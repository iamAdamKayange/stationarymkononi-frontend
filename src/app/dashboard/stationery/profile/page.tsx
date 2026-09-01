'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  Camera,
  Save,
  X,
  Phone,
  Mail,
  MapPin,
  Clock,
  Globe,
  Image as ImageIcon,
  UploadCloud,
  Award,
  CheckCircle2,
  ShieldCheck,
  Store,
  Star,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner';
import { LocationPickerMap } from '../../../../components/maps/LocationPickerMap';
import { useAuthStore } from '../../../../store/useAuthStore';
import { api } from '../../../../lib/api';
import toast from 'react-hot-toast';

export default function StationeryProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, refreshUser } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [region, setRegion] = useState('');
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [openingHours, setOpeningHours] = useState('');
  const [isOpen, setIsOpen] = useState(true);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState('PENDING_VERIFICATION');

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
        const stationeryData = userData.stationery;
        
        if (stationeryData) {
          setName(stationeryData.name || '');
          setDescription(stationeryData.description || '');
          setPhoneNumber(stationeryData.phoneNumber || '');
          setEmail(stationeryData.email || '');
          setAddress(stationeryData.address || '');
          setCity(stationeryData.city || '');
          setRegion(stationeryData.region || '');
          setLatitude(stationeryData.latitude || null);
          setLongitude(stationeryData.longitude || null);
          setOpeningHours(stationeryData.openingHours || '');
          setIsOpen(stationeryData.isOpen !== false);
          setLogoPreview(stationeryData.logoUrl || null);
          setCoverPreview(stationeryData.coverImageUrl || null);
          setVerificationStatus(stationeryData.verificationStatus || 'PENDING_VERIFICATION');
        }
      }
    } catch (err) {
      toast.error('Imeshindikana kupakia profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tafadhali weka picha ya JPEG, PNG, au WebP tu');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Logo isipitishe ukubwa wa 5MB');
      return;
    }

    setUploadingLogo(true);
    const formData = new FormData();
    formData.append('logo', file);

    try {
      console.log('Uploading logo...', file.name, file.size);
      const res = (await api.post('/profile/stationery/logo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      })) as any;
      
      console.log('Logo upload response:', res);
      
      if (res?.data?.logoUrl) {
        toast.success('Logo imewekwa vizuri! 🎉');
        await loadProfile(); // Reload profile to get updated data
      } else {
        toast.error('Imeshindikana kuweka logo - no URL returned');
      }
    } catch (err: any) {
      console.error('Logo upload error:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Imeshindikana kuweka logo';
      toast.error(errorMessage);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tafadhali weka picha ya JPEG, PNG, au WebP tu');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Cover image isipitishe ukubwa wa 10MB');
      return;
    }

    setUploadingCover(true);
    const formData = new FormData();
    formData.append('cover', file);

    try {
      console.log('Uploading cover image...', file.name, file.size);
      const res = (await api.post('/profile/stationery/cover', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      })) as any;
      
      console.log('Cover upload response:', res);
      
      if (res?.data?.coverImageUrl) {
        toast.success('Cover image imewekwa vizuri! 🎉');
        await loadProfile(); // Reload profile to get updated data
      } else {
        toast.error('Imeshindikana kuweka cover image - no URL returned');
      }
    } catch (err: any) {
      console.error('Cover upload error:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Imeshindikana kuweka cover image';
      toast.error(errorMessage);
    } finally {
      setUploadingCover(false);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tafadhali weka picha ya JPEG, PNG, au WebP tu');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      toast.error('Banner image isipitishe ukubwa wa 15MB');
      return;
    }

    setUploadingBanner(true);
    const formData = new FormData();
    formData.append('banner', file);

    try {
      console.log('Uploading banner image...', file.name, file.size);
      const res = (await api.post('/profile/stationery/banner', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 30000,
      })) as any;
      
      console.log('Banner upload response:', res);
      
      if (res?.data?.bannerUrl) {
        toast.success('Banner image imewekwa vizuri! 🎉');
        await loadProfile(); // Reload profile to get updated data
      } else {
        toast.error('Imeshindikana kuweka banner image - no URL returned');
      }
    } catch (err: any) {
      console.error('Banner upload error:', err);
      const errorMessage = err?.response?.data?.message || err?.message || 'Imeshindikana kuweka banner image';
      toast.error(errorMessage);
    } finally {
      setUploadingBanner(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/profile/stationery', {
        name,
        description,
        phoneNumber,
        email,
        address,
        city,
        region,
        latitude,
        longitude,
        openingHours,
        isOpen,
      });

      toast.success('Stationery profile imehifadhiwa vizuri! ✅');
      await loadProfile();
      await refreshUser(); // Refresh global auth state to get updated stationery data
    } catch (err) {
      toast.error('Imeshindikana kuhifadhi profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLocationSelect = (lat: number, lng: number, addressText?: string) => {
    setLatitude(lat);
    setLongitude(lng);
    if (addressText) {
      setAddress(addressText);
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
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn px-4 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">Edit Stationery Profile</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Badilisha maelezo ya duka lako la printing
          </p>
        </div>
        <div className="flex items-center gap-2">
          {getVerificationBadge()}
          <Button variant="outline" size="sm" onClick={() => router.back()}>
            <X className="w-4 h-4 mr-1.5" /> Rudi
          </Button>
        </div>
      </div>

      {/* Cover Image Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="relative h-48 bg-gradient-to-r from-brand-900 to-slate-900">
          {coverPreview ? (
            <img src={coverPreview} alt="Cover" className="w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <Store className="w-16 h-16 text-white/20" />
            </div>
          )}
          <div className="absolute bottom-4 right-4 flex items-center gap-2">
            <label className="bg-white/90 dark:bg-slate-800/90 hover:bg-white dark:hover:bg-slate-800 px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors flex items-center gap-2 shadow-md">
              <Camera className="w-4 h-4" />
              Cover Image
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleCoverUpload}
                className="hidden"
                disabled={uploadingCover}
              />
            </label>
            <label className="bg-brand-600 hover:bg-brand-700 text-white px-4 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-colors flex items-center gap-2 shadow-md">
              <Sparkles className="w-4 h-4" />
              Banner
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleBannerUpload}
                className="hidden"
                disabled={uploadingBanner}
              />
            </label>
          </div>
          {(uploadingCover || uploadingBanner) && (
            <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 flex items-center justify-center">
              <LoadingSpinner message={uploadingCover ? "Inapakia cover..." : "Inapakia banner..."} />
            </div>
          )}
        </div>
        
        {/* Logo Section */}
        <div className="relative -mt-12 px-6 pb-6">
          <div className="flex items-end gap-4">
            <div className="relative">
              <div className="w-24 h-24 rounded-2xl bg-white dark:bg-slate-800 flex items-center justify-center overflow-hidden border-4 border-white dark:border-slate-800 shadow-lg">
                {logoPreview ? (
                  <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                ) : (
                  <Building2 className="w-12 h-12 text-brand-600 dark:text-brand-400" />
                )}
              </div>
              <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-brand-600 hover:bg-brand-700 text-white rounded-full flex items-center justify-center cursor-pointer transition-colors shadow-md">
                <Camera className="w-4 h-4" />
                <input
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp"
                  onChange={handleLogoUpload}
                  className="hidden"
                  disabled={uploadingLogo}
                />
              </label>
              {uploadingLogo && (
                <div className="absolute inset-0 bg-white/80 dark:bg-slate-900/80 rounded-2xl flex items-center justify-center">
                  <LoadingSpinner message="" />
                </div>
              )}
            </div>
            <div className="flex-1 pb-2">
              <h3 className="font-bold text-slate-900 dark:text-slate-100">Logo & Cover Image</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Logo: Max 5MB • Cover: Max 10MB
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Building2 className="w-4 h-4 text-brand-600" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Maelezo ya Duka</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Jina la Duka</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Maelezo ya Duka</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Maelezo mafupi kuhusu huduma zako za printing..."
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-slate-100 resize-none"
            />
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

          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Anuani</label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Mfano: Sam Nujoma Rd, Mwenge Bus Stand"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Location Map Section */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-brand-600" />
              Eeo la Duka (Map Location)
            </label>
            <LocationPickerMap
              initialLat={latitude || undefined}
              initialLng={longitude || undefined}
              onLocationSelect={handleLocationSelect}
            />
            <div className="mt-2 grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={latitude || ''}
                  onChange={(e) => setLatitude(parseFloat(e.target.value) || null)}
                  placeholder="-6.8"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100"
                />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={longitude || ''}
                  onChange={(e) => setLongitude(parseFloat(e.target.value) || null)}
                  placeholder="39.2"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-900 dark:text-slate-100"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Jiji</label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Mkoa/Region</label>
            <input
              type="text"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-slate-100"
            />
          </div>
        </div>
      </div>

      {/* Operating Hours */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <Clock className="w-4 h-4 text-brand-600" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Masaa ya Kazi</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Masaa ya Kazi</label>
            <input
              type="text"
              value={openingHours}
              onChange={(e) => setOpeningHours(e.target.value)}
              placeholder="Mfano: 08:00 AM - 08:00 PM"
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div className="flex items-center gap-3 pt-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isOpen}
                onChange={(e) => setIsOpen(e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Duka Wazi Sasa</span>
            </label>
          </div>
        </div>
      </div>

      {/* Unique Stationery Features */}
      <div className="bg-gradient-to-r from-brand-50 to-amber-50 dark:from-brand-950/20 dark:to-amber-950/20 rounded-3xl p-6 border border-brand-200/50 dark:border-brand-800/50 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <Award className="w-5 h-5 text-brand-600 dark:text-brand-400" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Features za Kipekee za APEX</h3>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span>HD Printing & Scanning</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span>Spiral & Hard Cover Binding</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span>Large Format (A3/A2)</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span>Express Service Available</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span>Laminating Services</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
            <CheckCircle2 className="w-4 h-4 text-brand-600 dark:text-brand-400" />
            <span>Business Card Printing</span>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3">
        <Button variant="outline" onClick={() => router.back()} className="w-full sm:w-auto">
          <X className="w-4 h-4 mr-1.5" /> Ghairi
        </Button>
        <Button variant="primary" onClick={handleSave} isLoading={saving} leftIcon={<Save className="w-4 h-4" />} className="w-full sm:w-auto">
          Hifadhi Mabadiliko
        </Button>
      </div>
    </div>
  );
}