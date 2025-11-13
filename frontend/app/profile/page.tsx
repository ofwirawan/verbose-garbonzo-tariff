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
                <p className="text-center text-muted-foreground">
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
                <h1 className="text-3xl font-bold text-foreground">
                  Account Settings
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Manage your profile, security, and preferences
                </p>
              </div>

              {/* Profile Section */}
              <div className="bg-card rounded-lg border border-border p-8 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
                  {/* Left side: Avatar and info */}
                  <div className="flex gap-4 items-start md:items-start">
                    {/* Avatar */}
                    <Avatar className="h-16 w-16 rounded-lg flex-shrink-0">
                      <AvatarImage
                        src={user?.avatar}
                        alt={editName || user?.name || ""}
                      />
                      <AvatarFallback className="rounded-lg bg-muted text-base font-semibold text-foreground">
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
                            className="text-xs font-medium text-muted-foreground"
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
                            className="text-xs font-medium text-muted-foreground"
                          >
                            Email Address
                          </Label>
                          <Input
                            id="email"
                            value={user?.email || ""}
                            disabled
                            className="w-full bg-muted text-muted-foreground text-sm"
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-foreground">
                          {user?.name}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
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
                          className="flex-1 md:flex-none"
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleSaveProfile}
                          disabled={isSaving}
                          size="sm"
                          className="flex-1 md:flex-none"
                        >
                          {isSaving ? "Saving..." : "Save"}
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={handleEditToggle}
                        className="whitespace-nowrap"
                      >
                        Edit Profile
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Profile Type Section */}
              <div className="bg-card rounded-lg border border-border p-8 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-foreground mb-2">
                      Profile Type
                    </h2>
                    <p className="text-sm text-muted-foreground mb-4">
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
                        <p className="text-sm font-medium text-foreground">
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
                        >
                          Save
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() => {
                          setIsEditingProfileType(true);
                          setSelectedProfileType(user?.profileType || null);
                        }}
                        className="whitespace-nowrap"
                      >
                        Edit
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Security Section */}
              <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-foreground mb-6">
                  Security
                </h2>

                <div className="space-y-4">
                  {/* Password */}
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Password
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Change your account password
                      </p>
                    </div>
                    <Button variant="outline">
                      Change Password
                    </Button>
                  </div>

                  <Separator />

                  {/* Two-Factor Authentication */}
                  <div className="flex items-center justify-between pt-2">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Two-Factor Authentication
                      </p>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                    <Button variant="outline">
                      Enable
                    </Button>
                  </div>
                </div>
              </div>

              {/* Danger Zone Section */}
              <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground mb-2">
                      Danger Zone
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Irreversible and destructive actions
                    </p>
                  </div>
                  <Button variant="outline">
                    Delete Account
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
