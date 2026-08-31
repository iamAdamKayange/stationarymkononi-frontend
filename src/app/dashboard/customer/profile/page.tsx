'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User,
  Camera,
  Save,
  X,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  CheckCircle2,
  UploadCloud,
} from 'lucide-react';
import { Button } from '../../../../components/ui/Button';
import { Badge } from '../../../../components/ui/Badge';
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner';
import { useAuthStore } from '../../../../store/useAuthStore';
import { api } from '../../../../lib/api';
import toast from 'react-hot-toast';

export default function CustomerProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, setUser } = useAuthStore();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  
  // Form state
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [defaultPhone, setDefaultPhone] = useState('');
  const [preferredPaymentMethod, setPreferredPaymentMethod] = useState('M_PESA');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

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
        setFullName(userData.fullName || '');
        setPhoneNumber(userData.phoneNumber || '');
        setEmail(userData.email || '');
        setAvatarPreview(userData.avatarUrl || null);
        
        if (userData.customerProfile) {
          setDefaultPhone(userData.customerProfile.defaultPhone || '');
          setPreferredPaymentMethod(userData.customerProfile.preferredPaymentMethod || 'M_PESA');
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

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tafadhali weka picha ya JPEG, PNG, au WebP tu');
      return;
    }

    // Validate file size (5MB max)
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
        
        // Update user in store
        if (user) {
          setUser({ ...user, avatarUrl: res.data.avatarUrl });
        }
      }
    } catch (err) {
      toast.error('Imeshindikana kuweka profile picture');
    } finally {
      setUploadingAvatar(false);
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

      // Update customer-specific profile
      await api.put('/profile/customer', {
        defaultPhone,
        preferredPaymentMethod,
      });

      toast.success('Profile imehifadhiwa vizuri! ✅');
      
      // Reload profile data
      await loadProfile();
    } catch (err) {
      toast.error('Imeshindikana kuhifadhi profile');
    } finally {
      setSaving(false);
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
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">Edit Profile</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Badilisha maelezo yako ya akaunti
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => router.back()}>
          <X className="w-4 h-4 mr-1.5" /> Rudi
        </Button>
      </div>

      {/* Profile Picture Section */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-2xl bg-brand-50 dark:bg-brand-950/40 flex items-center justify-center overflow-hidden border-2 border-brand-200 dark:border-brand-800">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User className="w-12 h-12 text-brand-600 dark:text-brand-400" />
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
          <div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100">Profile Picture</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              JPEG, PNG, au WebP • Max 5MB
            </p>
          </div>
        </div>
      </div>

      {/* Basic Information */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <User className="w-4 h-4 text-brand-600" />
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
            <p className="text-[10px] text-slate-400 mt-1">Username haiwezi kubadilishwa</p>
          </div>
        </div>
      </div>

      {/* Customer Preferences */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <CreditCard className="w-4 h-4 text-brand-600" />
          <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">Mipangilio ya Malipo</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Namba ya Simu ya Default</label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3.5 top-3" />
              <input
                type="tel"
                value={defaultPhone}
                onChange={(e) => setDefaultPhone(e.target.value)}
                placeholder="Namba ya simu kwa malipo"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">Njia ya Malipo Inayopendelewa</label>
            <select
              value={preferredPaymentMethod}
              onChange={(e) => setPreferredPaymentMethod(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 text-slate-900 dark:text-slate-100"
            >
              <option value="M_PESA">M-Pesa</option>
              <option value="TIGO_PESA">Tigo Pesa</option>
              <option value="AIRTEL_MONEY">Airtel Money</option>
              <option value="HALOPESA">Halopesa</option>
              <option value="CASH_ON_DELIVERY">Cash on Delivery</option>
            </select>
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