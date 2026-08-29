import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { LivingSituation } from '../types';
import { Sparkles, ArrowRight, Lock, Mail, User as UserIcon, GraduationCap, Home, School, Building } from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [collegeName, setCollegeName] = useState<string>('');
  const [livingSituation, setLivingSituation] = useState<LivingSituation>('Hostel');
  const [monthlyAllowance, setMonthlyAllowance] = useState<string>('10000');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const livingOptions: { type: LivingSituation; title: string; desc: string; icon: any }[] = [
    {
      type: 'Hostel',
      title: 'Hostel',
      desc: 'Mess fees, canteen snacks, study materials & campus life',
      icon: School,
    },
    {
      type: 'PG',
      title: 'PG / Room',
      desc: 'Room rent, electricity, Wi-Fi bills & groceries',
      icon: Building,
    },
    {
      type: 'Home',
      title: 'Home',
      desc: 'Fuel, bus/metro commute, tuition & day-to-day',
      icon: Home,
    },
  ];

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    const allowanceNum = parseFloat(monthlyAllowance) || 0;

    setIsLoading(true);
    setError('');
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        college_name: collegeName.trim() || undefined,
        living_situation: livingSituation,
        monthly_allowance: allowanceNum,
      });
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl text-center">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-brand-500/25 mx-auto mb-3">
          <Sparkles className="w-6 h-6" />
        </div>
        <h2 className="text-2xl font-black tracking-tight text-slate-900">
          Join Spend<span className="text-brand-600">Wise</span>
        </h2>
        <p className="mt-1 text-xs text-slate-500 font-medium">
          Personalized budget & decision management built for college life
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl px-4">
        <div className="bg-white py-8 px-6 sm:px-10 rounded-3xl shadow-sm border border-slate-200/80">
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name *"
                placeholder="Alex Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                leftIcon={<UserIcon className="w-4 h-4" />}
              />

              <Input
                label="College Email *"
                type="email"
                placeholder="alex@college.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                leftIcon={<Mail className="w-4 h-4" />}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Password *"
                type="password"
                placeholder="At least 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                leftIcon={<Lock className="w-4 h-4" />}
              />

              <Input
                label="College / University Name"
                placeholder="e.g. Apex Institute of Tech"
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                leftIcon={<GraduationCap className="w-4 h-4" />}
              />
            </div>

            {/* Living Situation Selector */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-2">
                Living Situation * (Personalizes your budget categories)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {livingOptions.map((opt) => (
                  <button
                    type="button"
                    key={opt.type}
                    onClick={() => setLivingSituation(opt.type)}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      livingSituation === opt.type
                        ? 'border-brand-500 bg-brand-50/70 text-brand-900 shadow-xs'
                        : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      <opt.icon
                        className={`w-4 h-4 ${
                          livingSituation === opt.type ? 'text-brand-600' : 'text-slate-400'
                        }`}
                      />
                      <span className="text-xs font-bold">{opt.title}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Monthly Allowance */}
            <Input
              label="Expected Monthly Allowance or Income (₹)"
              type="number"
              min="0"
              step="100"
              placeholder="e.g. 10000"
              value={monthlyAllowance}
              onChange={(e) => setMonthlyAllowance(e.target.value)}
              helperText="You can adjust or add multiple income sources anytime."
            />

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full mt-2"
              size="md"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Create My Account
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="font-bold text-brand-600 hover:text-brand-700 underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
