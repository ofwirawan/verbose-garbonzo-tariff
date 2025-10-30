"use client";

import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useState, useEffect } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  fetchCurrentUserProfile,
  updateUserProfile,
  updateUserProfileType,
} from "./actions/profileActions";
import { toast } from "sonner";
import {
  ProfileType,
  PROFILE_TYPES,
  PROFILE_TYPE_LABELS,
} from "./components/profileTypes";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserProfile {
  uid: string;
  name: string | null;
  email: string;
  avatar: string;
  profileType: ProfileType | null;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isEditingProfileType, setIsEditingProfileType] = useState(false);
  const [selectedProfileType, setSelectedProfileType] = useState<ProfileType | null>(null);

  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        const userProfile = await fetchCurrentUserProfile();
        setUser(userProfile);
        setEditName(userProfile?.name || "");
        if (!userProfile) {
          setError("Failed to load user profile");
        }
      } catch (err) {
        console.error("Failed to fetch user profile:", err);
        setError("An error occurred while loading your profile");
      } finally {
        setIsLoading(false);
      }
    };

    loadUserProfile();
  }, []);

  const handleEditToggle = () => {
    if (isEditMode) {
      setEditName(user?.name || "");
    }
    setIsEditMode(!isEditMode);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      toast.error("Name cannot be empty");
      return;
    }

    setIsSaving(true);
    try {
      const updatedUser = await updateUserProfile(editName);
      if (updatedUser) {
        setUser(updatedUser);
        setIsEditMode(false);
        toast.success("Profile updated successfully");
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to update profile"
      );
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || error) {
    return (
      <SidebarProvider
        style={
          {
            "--sidebar-width": "calc(var(--spacing) * 72)",
            "--header-height": "calc(var(--spacing) * 12)",
          } as React.CSSProperties
        }
      >
        <AppSidebar variant="inset" />
        <SidebarInset>
          <SiteHeader />
          <div className="flex flex-1 flex-col overflow-hidden">
            <div className="@container/main flex-1 overflow-auto">
              <div className="flex flex-col gap-6 p-4 md:p-8 mx-auto">
                <p className="text-center text-gray-500">
                  {error || "Loading..."}
                </p>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="@container/main flex-1 overflow-auto">
            <div className="flex flex-col gap-6 p-4 md:p-8 mx-auto max-w-3xl w-full">
              {/* Page Header */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Account Settings
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Manage your profile, security, and preferences
                </p>
              </div>

              {/* Profile Section */}
              <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                  {/* Left side: Avatar and info */}
                  <div className="flex gap-4 items-start md:items-start">
                    {/* Avatar */}
                    <Avatar className="h-16 w-16 rounded-lg flex-shrink-0">
                      <AvatarImage
                        src={user?.avatar}
                        alt={editName || user?.name || ""}
                      />
                      <AvatarFallback className="rounded-lg bg-gray-200 text-base font-semibold text-gray-900">
                        {(isEditMode ? editName : user?.name || user?.email)
                          ?.split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    {/* User Information / Form Fields */}
                    {isEditMode ? (
                      <div className="flex-1 space-y-4">
                        {/* Name Input */}
                        <div className="space-y-1">
                          <Label
                            htmlFor="name"
                            className="text-xs font-medium text-gray-600"
                          >
                            Full Name
                          </Label>
                          <Input
                            id="name"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            placeholder="Enter your full name"
                            className="w-full text-lg font-semibold"
                          />
                        </div>

                        {/* Email Display */}
                        <div className="space-y-1">
                          <Label
                            htmlFor="email"
                            className="text-xs font-medium text-gray-600"
                          >
                            Email Address
                          </Label>
                          <Input
                            id="email"
                            value={user?.email || ""}
                            disabled
                            className="w-full bg-gray-50 text-gray-600 text-sm"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {user?.name}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {user?.email}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right side: Buttons */}
                  <div className="flex gap-2 md:flex-col flex-row">
                    {isEditMode ? (
                      <>
                        <Button
                          variant="outline"
                          onClick={handleEditToggle}
                          disabled={isSaving}
                          size="sm"
                          className="border-gray-300 text-gray-900 hover:bg-gray-50 flex-1 md:flex-none"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSaveProfile}
                          disabled={isSaving}
                          size="sm"
                          className="bg-gray-900 text-white hover:bg-gray-800 flex-1 md:flex-none"
                        >
                          {isSaving ? "Saving..." : "Save"}
                        </Button>
                      </>
                    ) : (
                      <button
                        onClick={handleEditToggle}
                        className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors text-sm font-medium whitespace-nowrap"
                      >
                        Edit Profile
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile Type Section */}
              <div className="bg-white rounded-lg border border-gray-200 p-8 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">
                      Profile Type
                    </h2>
                    <p className="text-sm text-gray-600 mb-4">
                      Select your profile type to personalize your experience
                    </p>

                    {isEditingProfileType ? (
                      <Select
                        value={selectedProfileType || user?.profileType || ""}
                        onValueChange={(value) =>
                          setSelectedProfileType(value as ProfileType)
                        }
                      >
                        <SelectTrigger className="w-full md:w-64">
                          <SelectValue placeholder="Select profile type" />
                        </SelectTrigger>
                        <SelectContent>
                          {PROFILE_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    ) : (
                      <div className="inline-block">
                        <p className="text-sm font-medium text-gray-900">
                          {user?.profileType
                            ? PROFILE_TYPE_LABELS[user.profileType]
                            : "Not selected"}
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    {isEditingProfileType ? (
                      <>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsEditingProfileType(false);
                            setSelectedProfileType(null);
                          }}
                          className="border-gray-300 text-gray-900 hover:bg-gray-50"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={() => {
                            if (selectedProfileType) {
                              updateUserProfileType(selectedProfileType)
                                .then((updated) => {
                                  if (updated) {
                                    setUser(updated);
                                    setIsEditingProfileType(false);
                                    setSelectedProfileType(null);
                                    toast.success(
                                      `Profile type changed to ${PROFILE_TYPE_LABELS[selectedProfileType]}`
                                    );
                                  }
                                })
                                .catch(() => {
                                  toast.error("Failed to update profile type");
                                });
                            }
                          }}
                          className="bg-gray-900 text-white hover:bg-gray-800"
                        >
                          Save
                        </Button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          setIsEditingProfileType(true);
                          setSelectedProfileType(user?.profileType || null);
                        }}
                        className="px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 transition-colors text-sm font-medium whitespace-nowrap"
                      >
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Security Section */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">
                  Security
                </h2>

                <div className="space-y-4">
                  {/* Password */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Password
                      </p>
                      <p className="text-sm text-gray-600 mt-0.5">
                        Change your account password
                      </p>
                    </div>
                    <button className="px-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium">
                      Change Password
                    </button>
                  </div>

                  <Separator />

                  {/* Two-Factor Authentication */}
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        Two-Factor Authentication
                      </p>
                      <p className="text-sm text-gray-600 mt-0.5">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <button className="px-4 py-2 text-gray-900 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium">
                      Enable
                    </button>
                  </div>
                </div>
              </div>

              {/* Danger Zone Section */}
              <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Danger Zone
                </h2>
                <p className="text-sm text-gray-600 mb-4">
                  Irreversible and destructive actions
                </p>
                <button className="px-4 py-2 bg-white text-gray-900 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors text-sm font-medium">
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
