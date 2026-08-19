'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { User, Mail, Phone, Lock, Building, Bike, ArrowRight } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { api } from '../../../lib/api';
import { useAuthStore } from '../../../store/useAuthStore';
import toast from 'react-hot-toast';

export default function RegisterPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);

  const [selectedRole, setSelectedRole] = useState<'CUSTOMER' | 'STATIONERY' | 'DELIVERY_RIDER'>('CUSTOMER');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');

  // Stationery shop fields
  const [shopName, setShopName] = useState('');
  const [shopAddress, setShopAddress] = useState('');
  const [shopCity, setShopCity] = useState('Dar es Salaam');

  // Rider fields
  const [vehicleType, setVehicleType] = useState('Motorcycle');
  const [vehiclePlate, setVehiclePlate] = useState('');

  const [isLoading, setIsLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const payload: Record<string, unknown> = {
        fullName,
        email,
        username,
        phoneNumber,
        password,
        role: selectedRole,
      };

      if (selectedRole === 'STATIONERY') {
        payload.stationeryDetails = {
          name: shopName || `${fullName}'s Stationery`,
          address: shopAddress || 'Dar es Salaam',
          city: shopCity,
          latitude: -6.7785,
          longitude: 39.2235,
          openingHours: '08:00 AM - 08:00 PM',
        };
      } else if (selectedRole === 'DELIVERY_RIDER') {
        payload.riderDetails = {
          vehicleType,
          vehiclePlate: vehiclePlate || 'MC 123 TZ',
        };
      }

      const response = (await api.post('/auth/register', payload)) as {
        data: {
          user: {
            id: string;
            email: string;
            username: string;
            fullName: string;
            role: 'CUSTOMER' | 'STATIONERY' | 'DELIVERY_RIDER' | 'ADMIN';
            status: 'PENDING_VERIFICATION' | 'VERIFIED' | 'SUSPENDED' | 'REJECTED';
          };
          accessToken: string;
          refreshToken: string;
        };
      };

      const { user, accessToken, refreshToken } = response.data;
      setAuth(user, accessToken, refreshToken);
      toast.success('Usajili umekamilika vizuri! 🎉');

      if (selectedRole === 'STATIONERY') {
        router.push('/dashboard/stationery');
      } else if (selectedRole === 'DELIVERY_RIDER') {
        router.push('/dashboard/rider');
      } else {
        router.push('/dashboard/customer');
      }
    } catch (err) {
      toast.error((err as Error).message || 'Usajili umeshindikana');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto my-6 sm:my-10 animate-fadeIn">
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xl">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-extrabold text-slate-900">Fungua Akaunti Mpya</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Chagua aina ya akaunti unayotaka kufungua
          </p>
        </div>

        {/* Role Selection Tabs */}
        <div className="grid grid-cols-3 gap-2 p-1.5 bg-slate-100 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() => setSelectedRole('CUSTOMER')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
              selectedRole === 'CUSTOMER'
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4 text-brand-600" />
            <span>Mteja (Customer)</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole('STATIONERY')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
              selectedRole === 'STATIONERY'
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building className="w-4 h-4 text-amber-600" />
            <span>Stationery Shop</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedRole('DELIVERY_RIDER')}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex flex-col sm:flex-row items-center justify-center gap-1.5 ${
              selectedRole === 'DELIVERY_RIDER'
                ? 'bg-white text-brand-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Bike className="w-4 h-4 text-blue-600" />
            <span>Delivery Rider</span>
          </button>
        </div>

        <form onSubmit={handleRegister} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Jina Kamili</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Juma Hamisi"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Jina la Mtumiaji (Username)</label>
              <div className="relative">
                <span className="text-slate-400 absolute left-3.5 top-2.5 text-sm">@</span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s+/g, ''))}
                  placeholder="jumahamisi"
                  className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 bg-white"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Barua Pepe (Email)</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="juma@example.com"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 bg-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Namba ya Simu (Phone)</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="0755 123 456"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 bg-white"
                  required
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nenosiri (Password)</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Angalau herufi 6"
                className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 bg-white"
                minLength={6}
                required
              />
            </div>
          </div>

          {/* Role specific inputs */}
          {selectedRole === 'STATIONERY' && (
            <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-200/80 space-y-3">
              <h4 className="text-xs font-bold uppercase text-amber-800 tracking-wider">Taarifa za Duka la Stationery</h4>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Jina la Duka</label>
                <input
                  type="text"
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder="mfano: Apex Digital Printing"
                  className="w-full px-3 py-2 text-sm bg-white border border-amber-200 rounded-xl focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Anuani ya Duka</label>
                <input
                  type="text"
                  value={shopAddress}
                  onChange={(e) => setShopAddress(e.target.value)}
                  placeholder="mfano: Sam Nujoma Rd, Mwenge"
                  className="w-full px-3 py-2 text-sm bg-white border border-amber-200 rounded-xl focus:ring-2 focus:ring-brand-500"
                  required
                />
              </div>
            </div>
          )}

          {selectedRole === 'DELIVERY_RIDER' && (
            <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-200/80 space-y-3">
              <h4 className="text-xs font-bold uppercase text-blue-800 tracking-wider">Taarifa za Chombo cha Usafiri</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Aina ya Chombo</label>
                  <select
                    value={vehicleType}
                    onChange={(e) => setVehicleType(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-blue-200 rounded-xl"
                  >
                    <option value="Motorcycle">Bodaboda (Pikipiki)</option>
                    <option value="Bicycle">Baiskeli</option>
                    <option value="Car">Gari / Bajaj</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Namba ya Bamba (Plate No)</label>
                  <input
                    type="text"
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value)}
                    placeholder="MC 482 DHZ"
                    className="w-full px-3 py-2 text-sm bg-white border border-blue-200 rounded-xl"
                    required
                  />
                </div>
              </div>
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full mt-3"
            isLoading={isLoading}
            rightIcon={<ArrowRight className="w-4 h-4" />}
          >
            Kamilisha Usajili
          </Button>
        </form>

        <div className="text-center mt-6 pt-6 border-t border-slate-100">
          <p className="text-xs text-slate-600">
            Tayari una akaunti?{' '}
            <Link href="/auth/login" className="font-bold text-brand-600 hover:text-brand-700">
              Ingia hapa
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
