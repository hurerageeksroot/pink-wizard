import React, { useState } from "react";
import "./DeskSidebar.scss";
import { ChevronRight, LogIn } from "lucide-react";
import { useChallenge } from "@/hooks/useChallenge";
import { useUserProfile } from "@/hooks/useUserProfile";
import { useAdminData } from "@/hooks/useAdminData";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

import {
  Users,
  Activity,
  CheckSquare,
  Network,
  BookOpen,
  Settings,
  HelpCircle,
  LogOut,
  User,
  Target,
  Sparkles,
  BarChart3,
  Trophy,
  Shield,
  Mail,
  FileText,
  CreditCard,
  UserCog,
  MessageSquare,
  Send,
} from "lucide-react";

const adminNavItems = [
  { title: "Dashboard", url: "/admin", icon: BarChart3 },
  { title: "Gamification", url: "/admin/gamification", icon: Trophy },
  { title: "Users", url: "/admin/users", icon: UserCog },
  { title: "Challenges", url: "/admin/challenges", icon: CheckSquare },
  { title: "Email Management", url: "/admin/email", icon: Mail },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
  { title: "Content", url: "/admin/content", icon: FileText },
  { title: "Settings", url: "/admin/settings", icon: Settings },
];

const secondaryNavItems = [
  { title: "AI Outreach", url: "/ai-outreach", icon: Sparkles },
  { title: "Campaigns", url: "/campaigns", icon: Target },
  { title: "Prospecting", url: "/prospecting", icon: Target },
  { title: "Leaderboard", url: "/leaderboard", icon: Trophy },
  { title: "Resources", url: "/resources", icon: BookOpen },
];

const mainNavItems = [
  {
    title: "Dashboard",
    url: "/?tab=dashboard",
    icon: Target,
    tab: "dashboard",
  },
  { title: "Contacts", url: "/?tab=contacts", icon: Users, tab: "contacts" },
  {
    title: "Activities",
    url: "/?tab=activities",
    icon: Activity,
    tab: "activities",
  },
  { title: "Tasks", url: "/?tab=tasks", icon: CheckSquare, tab: "tasks" },
  {
    title: "Networking",
    url: "/?tab=networking",
    icon: Network,
    tab: "networking",
  },
  {
    title: "Community",
    url: "/?tab=community",
    icon: MessageSquare,
    tab: "community",
  },
];

const accountItems = [
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Help", url: "/help", icon: HelpCircle },
];

const DeskSidebar = () => {
  // states
  const [toggle, setToggle] = useState(false);

  // hooks
  const { isChallengeParticipant } = useChallenge();
  const { profile } = useUserProfile();
  const { user, signOut } = useAuth();
  const { isAdmin } = useAdminData();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    console.log("[AppSidebar] Attempting to sign out...");
    const { error } = await signOut();
    if (error) {
      console.error("[AppSidebar] Sign out error:", error);
      // Force sign out by clearing local state and redirecting anyway
      navigate("/auth");
    } else {
      console.log("[AppSidebar] Sign out successful");
      navigate("/");
    }
  };

  return (
    <div className={`desk-sidebar ${toggle ? "toggle" : ""}`}>
      <div
        className={`ds-toggle ${toggle ? "toggle" : ""}`}
        onClick={() => setToggle(!toggle)}
      >
        <ChevronRight className="dst-icon" size={16} />
      </div>
      <div className="ds-header">
        <img
          src="/lovable-uploads/app-logo.png"
          alt="Logo"
          className="ds-logo"
        />
        <div className="ds-content">
          <img
            src="/lovable-uploads/1a800238-fd78-463f-9718-1bca6df098ea.png"
            alt="Logo"
            className="ds-content-logo"
          />
        </div>
      </div>
      <div className="ds-body">
        <div className="ds-navs">
          <NavGroup
            label="Dashboard"
            items={mainNavItems.filter(
              (item) =>
                item.title !== "Challenge Tasks" || isChallengeParticipant
            )}
          />
          <NavGroup label="Tools" items={secondaryNavItems} />
          <NavGroup label="Admin" items={adminNavItems} />
          <NavGroup label="Account" items={accountItems} />
        </div>
      </div>
      <div className="ds-footer">
        <div className="ds-footer-item">
          <div className="ds-footer-item-image-container">
            <img
              src="/lovable-uploads/user-profile.png"
              alt="Profile"
              className="ds-footer-item-image"
            />
          </div>

          <div className="ds-footer-item-info">
            <div className="ds-footer-item-info-inner">
              <div className="dsfiii-row">
                <h3 className="ds-footer-item-info-name">{`${user?.user_metadata?.first_name} ${user?.user_metadata?.last_name}`}</h3>
                <p className="ds-footer-item-info-email">{user?.email}</p>
              </div>
              <LogOut
                className="dsfiii-icon"
                size={20}
                onClick={handleSignOut}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const NavGroup = ({ label, items }: { label: string; items: any[] }) => {
  // hooks
  const navigate = useNavigate();

  const isActive = (url: string) => {
    return window.location.pathname.includes(url);
  };

  const checkIfThereQueryParams = (tab: string) => {
    const queryParams = new URLSearchParams(window.location.search);
    return queryParams.get("tab") === tab;
  };
  return (
    <div className="ds-nav-group">
      <div className="dsng-title">{label}</div>
      <div className="dsng-items">
        {items.map((Item) => (
          <div
            className={`dsng-item ${
              Item.tab
                ? checkIfThereQueryParams(Item.tab)
                  ? "active"
                  : ""
                : isActive(Item.url)
                ? "active"
                : ""
            }`}
            key={Item.title}
            onClick={() => navigate(Item.url)}
          >
            <div className="dsng-item-icon">
              {/* <div className="dsng-item-iconn"></div> */}
              {Item.icon && typeof Item.icon !== "string" && (
                <Item.icon className="dsng-item-iconn" size={16} />
              )}
            </div>
            <div className="dsng-item-title">
              <div className="dsng-item-title-inner">{Item.title}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DeskSidebar;
