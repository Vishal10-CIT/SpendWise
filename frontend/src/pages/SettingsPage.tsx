import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import { Select } from '../components/common/Select';
import { Modal } from '../components/common/Modal';
import { categoriesApi } from '../services/api';
import { Category, LivingSituation } from '../types';
import { useToast } from '../components/common/Toast';
import {
  Settings,
  User,
  GraduationCap,
  Tag,
  Plus,
  Trash2,
  Lock,
  Save,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();

  // Profile Form State
  const [name, setName] = useState<string>(user?.name || '');
  const [collegeName, setCollegeName] = useState<string>(user?.college_name || '');
  const [livingSituation, setLivingSituation] = useState<LivingSituation>(
    user?.living_situation || 'Hostel'
  );
  const [monthlyAllowance, setMonthlyAllowance] = useState<string>(
    user?.monthly_allowance?.toString() || '0'
  );
  const [newPassword, setNewPassword] = useState<string>('');
  const [isUpdatingProfile, setIsUpdatingProfile] = useState<boolean>(false);

  // Custom Categories State
  const [categories, setCategories] = useState<Category[]>([]);
  const [isCatModalOpen, setIsCatModalOpen] = useState<boolean>(false);
  const [newCatName, setNewCatName] = useState<string>('');
  const [newCatGroup, setNewCatGroup] = useState<string>('Custom');
  const [newCatColor, setNewCatColor] = useState<string>('#6366F1');
  const [isCreatingCat, setIsCreatingCat] = useState<boolean>(false);

  const fetchCategories = () => {
    categoriesApi.getCategories().then(setCategories).catch(console.error);
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    try {
      await updateProfile({
        name: name.trim(),
        college_name: collegeName.trim() || undefined,
        living_situation: livingSituation,
        monthly_allowance: parseFloat(monthlyAllowance) || 0,
        password: newPassword.trim() || undefined,
      });
      showToast('Profile updated successfully!', 'success');
      setNewPassword('');
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to update profile.', 'error');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    setIsCreatingCat(true);
    try {
      await categoriesApi.createCategory({
        name: newCatName.trim(),
        group: newCatGroup,
        color: newCatColor,
        icon: 'tag',
      });
      showToast(`Category '${newCatName}' created!`, 'success');
      setIsCatModalOpen(false);
      setNewCatName('');
      fetchCategories();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Failed to create category.', 'error');
    } finally {
      setIsCreatingCat(false);
    }
  };

  const handleDeleteCategory = async (catId: number, catName: string) => {
    try {
      await categoriesApi.deleteCategory(catId);
      showToast(`Category '${catName}' deleted.`, 'info');
      fetchCategories();
    } catch (err: any) {
      showToast(err.response?.data?.detail || 'Cannot delete category in use.', 'error');
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
            <Settings className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight">Account & Budget Settings</h1>
        </div>
        <p className="text-xs text-slate-500">
          Personalize your student profile, living arrangement, monthly allowance, and budget categories
        </p>
      </div>

      {/* Student Profile Settings */}
      <Card className="p-6">
        <h3 className="text-sm font-bold text-slate-900 pb-3 border-b border-slate-100 mb-4 flex items-center gap-2">
          <User className="w-4 h-4 text-brand-600" />
          <span>Student Profile & Living Setup</span>
        </h3>

        <form onSubmit={handleProfileSave} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />

            <Input
              label="College / Campus Name"
              placeholder="e.g. Apex University"
              value={collegeName}
              onChange={(e) => setCollegeName(e.target.value)}
              leftIcon={<GraduationCap className="w-4 h-4 text-slate-400" />}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Living Situation"
              value={livingSituation}
              onChange={(e) => setLivingSituation(e.target.value as LivingSituation)}
            >
              <option value="Hostel">Hostel (Campus & Mess life)</option>
              <option value="PG">PG / Rented Apartment</option>
              <option value="Home">Home (Day scholar commuter)</option>
            </Select>

            <Input
              label="Default Monthly Allowance / Income (₹)"
              type="number"
              min="0"
              value={monthlyAllowance}
              onChange={(e) => setMonthlyAllowance(e.target.value)}
              placeholder="e.g. 10000"
            />
          </div>

          <Input
            label="Change Password (Leave blank to keep unchanged)"
            type="password"
            placeholder="New password (optional)"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
          />

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="primary"
              isLoading={isUpdatingProfile}
              leftIcon={<Save className="w-4 h-4" />}
            >
              Save Profile Changes
            </Button>
          </div>
        </form>
      </Card>

      {/* Category Management */}
      <Card className="p-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-brand-600" />
            <h3 className="text-sm font-bold text-slate-900">Custom Categories</h3>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsCatModalOpen(true)}
            leftIcon={<Plus className="w-3.5 h-3.5" />}
          >
            Add Category
          </Button>
        </div>

        <p className="text-xs text-slate-500 mb-4">
          Your SpendWise categories tailored for college life. Custom categories can be removed if not assigned to expenses.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5 max-h-80 overflow-y-auto p-1">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/70 flex items-center justify-between gap-2 text-xs"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="truncate font-semibold text-slate-800">{cat.name}</span>
              </div>
              {!cat.is_default && (
                <button
                  onClick={() => handleDeleteCategory(cat.id, cat.name)}
                  className="text-slate-400 hover:text-rose-600 transition-colors p-0.5"
                  title="Delete custom category"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Create Category Modal */}
      <Modal
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        title="Add Custom Category"
        maxWidth="sm"
      >
        <form onSubmit={handleCreateCategory} className="space-y-4">
          <Input
            label="Category Name"
            placeholder="e.g. Photography, Gym Supplements"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            required
            autoFocus
          />

          <Select
            label="Taxonomy Group"
            value={newCatGroup}
            onChange={(e) => setNewCatGroup(e.target.value)}
          >
            <option value="College">College</option>
            <option value="Food">Food</option>
            <option value="Transport">Transport</option>
            <option value="Lifestyle">Lifestyle</option>
            <option value="Digital">Digital</option>
            <option value="Accommodation">Accommodation</option>
            <option value="Other">Other</option>
            <option value="Custom">Custom</option>
          </Select>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Color Tag
            </label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={newCatColor}
                onChange={(e) => setNewCatColor(e.target.value)}
                className="w-10 h-10 rounded-xl cursor-pointer border border-slate-200"
              />
              <span className="text-xs font-mono text-slate-600">{newCatColor}</span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setIsCatModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isCreatingCat}>
              Create Category
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
