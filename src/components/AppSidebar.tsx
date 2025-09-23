import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
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
  Send
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useAuth } from '@/contexts/AuthContext';
import { useAccess } from "@/hooks/useAccess";
import { useChallenge } from "@/hooks/useChallenge";
import { useAdminData } from "@/hooks/useAdminData";

const mainNavItems = [
  { title: "Dashboard", url: "/?tab=dashboard", icon: Target, tab: "dashboard" },
  { title: "Contacts", url: "/?tab=contacts", icon: Users, tab: "contacts" },
  { title: "Activities", url: "/?tab=activities", icon: Activity, tab: "activities" },
  { title: "Tasks", url: "/?tab=tasks", icon: CheckSquare, tab: "tasks" },
  { title: "Networking", url: "/?tab=networking", icon: Network, tab: "networking" },
  { title: "Community", url: "/?tab=community", icon: MessageSquare, tab: "community" },
];

const secondaryNavItems = [
  { title: "AI Outreach", url: "/ai-outreach", icon: Sparkles },
  { title: "Leaderboard", url: "/leaderboard", icon: Trophy },
  { title: "Resources", url: "/resources", icon: BookOpen },
];

const accountItems = [
  { title: "Settings", url: "/settings", icon: Settings },
  { title: "Help", url: "/help", icon: HelpCircle },
];

const upgradeItems = [
  { title: "Upgrade to Pro", url: "/pricing", icon: CreditCard },
];

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

export function AppSidebar() {
  const [isHovered, setIsHovered] = useState(false);
  const { open, setOpen, isMobile } = useSidebar();
  const { user, signOut } = useAuth();
  const { canWrite, subscribed, hasTrial } = useAccess();
  const { isChallengeParticipant } = useChallenge();
  const { isAdmin } = useAdminData();
  
  const location = useLocation();
  const navigate = useNavigate();
  
  const currentPath = location.pathname;
  const urlParams = new URLSearchParams(location.search);
  const currentTab = urlParams.get('tab');

  const isActive = (path: string, tab?: string) => {
    if (tab && currentPath === "/") {
      return currentTab === tab;
    }
    return currentPath === path;
  };

  const getNavCls = (isActive: boolean) =>
    isActive 
      ? "bg-primary/10 text-primary font-medium border-r-2 border-primary" 
      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground";

  const handleSignOut = async () => {
    console.log('[AppSidebar] Attempting to sign out...');
    const { error } = await signOut();
    if (error) {
      console.error('[AppSidebar] Sign out error:', error);
      // Force sign out by clearing local state and redirecting anyway
      navigate("/auth");
    } else {
      console.log('[AppSidebar] Sign out successful');
      navigate("/");
    }
  };

  if (!user) {
    return null;
  }

  const isCollapsed = !open && !isHovered;

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (!open) setOpen(true);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    // Close sidebar after hover ends unless it was manually opened
    setTimeout(() => {
      setOpen(false);
    }, 200);
  };

  return (
    <Sidebar 
      collapsible="icon"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <SidebarContent className="flex flex-col h-full">
        {/* User Profile Section */}
        <div className={`p-4 border-b ${isCollapsed ? "px-2" : ""}`}>
          <div className="flex items-center space-x-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary/10 text-primary">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            {!isCollapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">
                  {user?.email || 'Not logged in'}
                </p>
                {canWrite && (
                  <p className="text-xs text-muted-foreground">
                    Growth Access
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Main Navigation */}
        <SidebarGroup className="flex-1">
          <SidebarGroupLabel className={isCollapsed ? "sr-only" : ""}>
            Dashboard
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems
                .filter(item => item.title !== "Challenge Tasks" || isChallengeParticipant)
                .map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={getNavCls(isActive(item.url, item.tab))}
                    >
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator />

        {/* Secondary Navigation */}
        <SidebarGroup>
          <SidebarGroupLabel className={isCollapsed ? "sr-only" : ""}>
            Tools
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryNavItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={getNavCls(isActive(item.url))}
                    >
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <Separator />

        {/* Admin Section - Only show for admin users */}
        {isAdmin && (
          <>
            <SidebarGroup>
              <SidebarGroupLabel className={isCollapsed ? "sr-only" : ""}>
                Admin
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {adminNavItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink 
                          to={item.url} 
                          className={getNavCls(isActive(item.url))}
                        >
                          <item.icon className="h-4 w-4" />
                          {!isCollapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            
            <Separator />
          </>
        )}

        {/* Upgrade Section - Only show for trial users who are not admins */}
        {hasTrial && !isAdmin && (
          <>
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {upgradeItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild>
                        <NavLink 
                          to={item.url} 
                          className="bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
                        >
                          <item.icon className="h-4 w-4" />
                          {!isCollapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
            
            <Separator />
          </>
        )}

        {/* Account Section */}
        <SidebarGroup>
          <SidebarGroupLabel className={isCollapsed ? "sr-only" : ""}>
            Account
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={getNavCls(isActive(item.url))}
                    >
                      <item.icon className="h-4 w-4" />
                      {!isCollapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
               {user && (
                <SidebarMenuItem>
                  <SidebarMenuButton onClick={handleSignOut}>
                    <LogOut className="h-4 w-4" />
                    {!isCollapsed && <span>Sign Out</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>
    </Sidebar>
  );
}