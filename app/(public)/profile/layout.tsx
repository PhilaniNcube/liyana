import React from "react";
import {
  ProfileSidebar,
  ProfileMobileMenu,
} from "@/components/profile-sidebar";


const ProfileLayout = async ({ children }: { children: React.ReactNode }) => {


  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Sidebar */}
        <ProfileSidebar />

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="container mx-auto px-4 py-8 max-w-6xl">
            {/* Mobile Header with Menu Button */}
            <div className="lg:hidden mb-6">
              <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold">Profile</h1>
                <ProfileMobileMenu />
              </div>
            </div>

            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileLayout;
