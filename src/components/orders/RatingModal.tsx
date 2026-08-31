'use client';

import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { api } from '../../lib/api';
import toast from 'react-hot-toast';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  stationeryName?: string;
  riderName?: string;
  onSuccess?: () => void;
}

export const RatingModal: React.FC<RatingModalProps> = ({
  isOpen,
  onClose,
  orderId,
  stationeryName = 'Stationery Shop',
  riderName = 'Delivery Rider',
  onSuccess,
}) => {
  const [stationeryScore, setStationeryScore] = useState(5);
  const [stationeryComment, setStationeryComment] = useState('');
  const [riderScore, setRiderScore] = useState(5);
  const [riderComment, setRiderComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.post('/ratings', {
        orderId,
        stationeryScore,
        stationeryComment: stationeryComment.trim() || undefined,
        riderScore,
        riderComment: riderComment.trim() || undefined,
      });

      toast.success('Ahsante sana kwa maoni yako! ⭐');
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error((err as Error).message || 'Imeshindikana kuwasilisha maoni');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStars = (score: number, setScore: (s: number) => void) => {
    return (
      <div className="flex items-center gap-1.5 my-2">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            type="button"
            key={star}
            onClick={() => setScore(star)}
            className="p-1 text-amber-400 hover:scale-110 transition-transform"
          >
            <Star
              className={`w-6 h-6 ${
                star <= score ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Toa Maoni & Alama (Rating)">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Stationery Section */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Stationery: {stationeryName}
          </label>
          {renderStars(stationeryScore, setStationeryScore)}
          <textarea
            rows={2}
            value={stationeryComment}
            onChange={(e) => setStationeryComment(e.target.value)}
            placeholder="Je, ubora wa printing na huduma ulikuwaje?"
            className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          />
        </div>

        {/* Rider Section */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200/80 dark:border-slate-700">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Rider: {riderName}
          </label>
          {renderStars(riderScore, setRiderScore)}
          <textarea
            rows={2}
            value={riderComment}
            onChange={(e) => setRiderComment(e.target.value)}
            placeholder="Je, rider alifikisha mzigo kwa wakati na adabu?"
            className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button type="button" variant="outline" size="md" onClick={onClose}>
            Baadaye
          </Button>
          <Button type="submit" variant="primary" size="md" isLoading={isSubmitting}>
            Wasilisha Maoni
          </Button>
        </div>
      </form>
    </Modal>
  );
};
