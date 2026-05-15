"use client";

import { useState, useRef } from "react";
import { updateProfile, updatePassword, updateUserImage } from "./actions";
import { toast } from "sonner";
import { Save, User, Lock, Eye, EyeOff, ShieldCheck, Mail, Camera, ChevronDown, ChevronRight, Clock, Calendar, Loader2 } from "lucide-react";

interface ProfileClientProps {
  user: any;
}

export default function ProfileClient({ user }: ProfileClientProps) {
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [expanded, setExpanded] = useState({
    personal: true,
    security: true,
    account: true
  });

  const toggleSection = (section: keyof typeof expanded) => {
    setExpanded(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (2MB limit for base64 storage)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Image too large. Please select an image under 2MB.");
      return;
    }

    setImageLoading(true);
    const reader = new FileReader();
    
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      try {
        const res = await updateUserImage(base64String);
        if (res.success) {
          toast.success("Profile image updated");
        } else {
          toast.error(res.error || "Failed to upload image");
        }
      } catch (error) {
        toast.error("An unexpected error occurred during upload");
      } finally {
        setImageLoading(false);
      }
    };

    reader.readAsDataURL(file);
  };

  const handleUpdateProfile = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setProfileLoading(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      const res = await updateProfile(formData);
      if (res.success) {
        toast.success("Profile updated successfully");
      } else {
        toast.error(res.error || "Failed to update profile");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPasswordLoading(true);
    const formData = new FormData(e.currentTarget);
    
    try {
      const res = await updatePassword(formData);
      if (res.success) {
        toast.success("Password updated successfully");
        (e.target as HTMLFormElement).reset();
      } else {
        toast.error(res.error || "Failed to update password");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-10 px-6 space-y-8">
      {/* Header with Image Upload */}
      <div className="flex justify-between items-end mb-4">
        <div className="flex items-center gap-6">
          <div className="relative group">
            <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center border-4 border-white shadow-sm overflow-hidden">
              {imageLoading ? (
                <Loader2 className="w-6 h-6 text-zinc-400 animate-spin" />
              ) : user.image ? (
                <img src={user.image} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                <User className="w-8 h-8 text-zinc-400" />
              )}
            </div>
            <button 
              onClick={handleImageClick}
              disabled={imageLoading}
              className="absolute bottom-0 right-0 p-1.5 bg-white rounded-full border border-zinc-200 shadow-sm text-zinc-500 hover:text-black transition-all hover:scale-110 active:scale-95 disabled:opacity-50"
              title="Change Profile Picture"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*" 
              onChange={handleImageChange}
            />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">User Profile</h1>
            <p className="text-zinc-500 mt-1">Manage your account identity, security settings, and personal preferences.</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        
        {/* 1. Personal Information */}
        <section className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden transition-all">
          <div 
            onClick={() => toggleSection('personal')}
            className="p-6 cursor-pointer border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg text-blue-600">
                <User className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">Personal Information</h2>
                <p className="text-xs text-zinc-500">Update your public name and primary contact email</p>
              </div>
            </div>
            {expanded.personal ? <ChevronDown className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600" /> : <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600" />}
          </div>
          
          {expanded.personal && (
            <form onSubmit={handleUpdateProfile} className="p-6 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">Full Name</label>
                  <input 
                    type="text" 
                    name="name" 
                    defaultValue={user.name || ""}
                    className="w-full bg-white border border-zinc-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all outline-none"
                    placeholder="e.g. Sandeep"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">Email Address</label>
                  <div className="flex items-center bg-white border border-zinc-200 rounded-xl px-4 focus-within:ring-2 focus-within:ring-blue-500/10 focus-within:border-blue-500 transition-all">
                    <Mail className="w-4 h-4 text-zinc-400 mr-2" />
                    <input 
                      type="email" 
                      name="email" 
                      defaultValue={user.email || ""}
                      className="w-full py-2.5 text-sm outline-none bg-transparent"
                      placeholder="sandeep@example.com"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end pt-2">
                <button 
                  type="submit" 
                  disabled={profileLoading}
                  className="flex items-center gap-2 px-6 py-2 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {profileLoading ? "Saving..." : "Save Profile Details"}
                  <Save className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}
        </section>

        {/* 2. Security & Password */}
        <section className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden transition-all">
          <div 
            onClick={() => toggleSection('security')}
            className="p-6 cursor-pointer border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">Security & Credentials</h2>
                <p className="text-xs text-zinc-500">Secure your account with a strong password</p>
              </div>
            </div>
            {expanded.security ? <ChevronDown className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600" /> : <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600" />}
          </div>
          
          {expanded.security && (
            <form onSubmit={handleUpdatePassword} className="p-6 space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">Current Password</label>
                  <div className="flex items-center bg-white border border-zinc-200 rounded-xl px-4 focus-within:ring-2 focus-within:ring-purple-500/10 focus-within:border-purple-500 transition-all">
                    <input 
                      type={showCurrentPass ? "text" : "password"} 
                      name="currentPassword" 
                      autoComplete="current-password"
                      className="w-full py-2.5 text-sm outline-none bg-transparent"
                      placeholder="••••••••"
                    />
                    <button 
                      type="button"
                      onClick={() => setShowCurrentPass(!showCurrentPass)}
                      className="p-1.5 text-zinc-400 hover:text-zinc-600 transition-colors ml-2"
                    >
                      {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-zinc-400 italic">Required to verify your identity before changing passwords.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700">New Password</label>
                    <div className="flex items-center bg-white border border-zinc-200 rounded-xl px-4 focus-within:ring-2 focus-within:ring-purple-500/10 focus-within:border-purple-500 transition-all">
                      <input 
                        type={showNewPass ? "text" : "password"} 
                        name="newPassword" 
                        autoComplete="new-password"
                        className="w-full py-2.5 text-sm outline-none bg-transparent"
                        placeholder="••••••••"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="p-1.5 text-zinc-400 hover:text-zinc-600 transition-colors ml-2"
                      >
                        {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700">Confirm New Password</label>
                    <div className="flex items-center bg-white border border-zinc-200 rounded-xl px-4 focus-within:ring-2 focus-within:ring-purple-500/10 focus-within:border-purple-500 transition-all">
                      <input 
                        type={showConfirmPass ? "text" : "password"} 
                        name="confirmPassword" 
                        autoComplete="new-password"
                        className="w-full py-2.5 text-sm outline-none bg-transparent"
                        placeholder="••••••••"
                      />
                      <button 
                        type="button"
                        onClick={() => setShowConfirmPass(!showConfirmPass)}
                        className="p-1.5 text-zinc-400 hover:text-zinc-600 transition-colors ml-2"
                      >
                        {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end pt-2">
                <button 
                  type="submit" 
                  disabled={passwordLoading}
                  className="flex items-center gap-2 px-6 py-2 bg-zinc-900 text-white rounded-xl text-sm font-semibold hover:bg-zinc-800 transition-all active:scale-[0.98] disabled:opacity-50"
                >
                  {passwordLoading ? "Updating..." : "Change Password"}
                  <Lock className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          )}
        </section>

        {/* 3. Account Health */}
        <section className="bg-white rounded-2xl border border-zinc-200 shadow-sm overflow-hidden transition-all">
          <div 
            onClick={() => toggleSection('account')}
            className="p-6 cursor-pointer border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between group"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-zinc-100 rounded-lg text-zinc-600">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-zinc-900">Account Health & Privacy</h2>
                <p className="text-xs text-zinc-500">Overview of your account status and data</p>
              </div>
            </div>
            {expanded.account ? <ChevronDown className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600" /> : <ChevronRight className="w-5 h-5 text-zinc-400 group-hover:text-zinc-600" />}
          </div>
          
          {expanded.account && (
            <div className="p-6 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 flex items-center gap-4">
                  <div className="p-2.5 bg-white rounded-lg border border-zinc-200 text-zinc-400">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">Member Since</p>
                    <p className="text-sm font-semibold text-zinc-900">
                      {new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 flex items-center gap-4">
                  <div className="p-2.5 bg-white rounded-lg border border-zinc-200 text-zinc-400">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-tight">Last Account Update</p>
                    <p className="text-sm font-semibold text-zinc-900">
                      {new Date(user.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mt-8 pt-6 border-t border-zinc-100 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-zinc-400">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-medium">Your account is in good standing</span>
                </div>
                <button className="px-5 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-bold text-zinc-600 hover:bg-zinc-50 hover:text-black transition-all">
                  Request Data Export
                </button>
              </div>
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
