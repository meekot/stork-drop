"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Baby, Lock } from 'lucide-react';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';

const ParentLogin: React.FC = () => {
  const [passcode, setPasscode] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passcode }),
      });
      if (!response.ok) {
        setError('Invalid passcode.');
        return;
      }
      window.location.href = '/parents';
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-gray-100">
        <div className="flex items-center justify-center mb-6">
          <div className="bg-baby-200 p-3 rounded-full">
            <Baby size={28} className="text-baby-600" />
          </div>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 text-center mb-2">Parent Access</h1>
        <p className="text-gray-500 text-center mb-6">Enter the passcode to manage the registry.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Passcode"
            type="password"
            value={passcode}
            onChange={(e) => setPasscode(e.target.value)}
            error={error || undefined}
            placeholder="••••••••"
            required
          />
          <Button type="submit" fullWidth isLoading={isSubmitting}>
            <Lock size={16} className="mr-2" />
            Enter Parents View
          </Button>
        </form>
        <div className="mt-6 text-center">
          <Link href="/" className="text-sm text-baby-600 hover:text-baby-900">
            Back to guest view
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ParentLogin;
