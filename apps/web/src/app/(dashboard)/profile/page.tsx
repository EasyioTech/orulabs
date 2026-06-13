"use client";

import React from "react";
import { useAuth } from "@/hooks/useAuth";
import { User, Mail, Calendar, LogOut } from "lucide-react";
import { format } from "date-fns";

export default function ProfilePage() {
  const { user, signOut } = useAuth();

  if (!user) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>
      
      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden shadow-sm">
        {/* Header Cover */}
        <div className="h-32 bg-brand-600"></div>
        
        <div className="px-8 pb-8">
          {/* Avatar Area */}
          <div className="relative flex justify-between items-end -mt-12 mb-6">
            <div className="w-24 h-24 rounded-full border-4 border-white bg-brand-100 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm">
              {user.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt={user.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-3xl font-bold text-brand-600">
                  {user.name?.[0]?.toUpperCase()}
                </span>
              )}
            </div>
            
            <button
              onClick={signOut}
              className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg text-sm font-medium transition-colors"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>

          {/* User Details */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
              <p className="text-gray-500 flex items-center gap-1.5 mt-1">
                <Mail size={14} />
                {user.email}
              </p>
            </div>

            <div className="pt-6 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <User size={16} />
                  Account ID
                </p>
                <p className="text-sm text-gray-900 font-mono bg-gray-50 px-2 py-1 rounded inline-block">
                  {user.id}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-sm font-medium text-gray-500 flex items-center gap-2">
                  <Calendar size={16} />
                  Joined
                </p>
                <p className="text-sm text-gray-900">
                  {user.createdAt ? format(new Date(user.createdAt), "MMMM d, yyyy") : "Unknown"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
