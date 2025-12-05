import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Users,
  FileText,
  Settings,
  BarChart3,
  CreditCard,
  Shield,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Mail,
  Target,
  UserCircle,
  ListChecks,
  Download,
  Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const navigationItems = [
  {
    name: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard
  },
  {
    name: 'Gamification',
    href: '/admin/gamification',
    icon: BarChart3
  },
  {
    name: 'Users',
    href: '/admin/users',
    icon: Users
  },
  {
    name: 'Waitlist',
    href: '/admin/waitlist',
    icon: ListChecks
  },
  {
    name: 'Challenges',
    href: '/admin/challenges',
    icon: BarChart3
  },
  {
    name: 'Email Management',
    href: '/admin/email',
    icon: Mail
  },
  {
    name: 'Analytics',
    href: '/admin/analytics',
    icon: BarChart3
  },
  {
    name: 'Settings',
    href: '/admin/settings',
    icon: Settings
  },
  {
    name: 'Relationships',
    href: '/admin/relationships',
    icon: UserCircle
  },
  {
    name: 'Challenge Audit',
    href: '/admin/challenge-audit',
    icon: Target
  },
  {
    name: 'Data Export',
    href: '/admin/data-export',
    icon: Download
  },
  {
    name: 'Data Import',
    href: '/admin/data-import',
    icon: Upload
  }
];

interface AdminSidebarProps {
  className?: string;
  onNavigate?: () => void;
}

export function AdminSidebar({ className, onNavigate }: AdminSidebarProps) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  return (
    <div className={cn(
      "bg-muted/30 border-r transition-all duration-300",
      collapsed ? "w-16" : "w-64",
      className
    )}>
      <div className="flex h-full flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          {!collapsed && (
            <h2 className="text-lg font-semibold">Admin Panel</h2>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="ml-auto hidden lg:flex"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={onNavigate}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-colors",
                  isActive 
                    ? "bg-primary text-primary-foreground" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  collapsed && "justify-center lg:justify-center"
                )}
                title={collapsed ? item.name : undefined}
              >
                <Icon className="h-5 w-5 flex-shrink-0" />
                {!collapsed && (
                  <span className="font-medium">{item.name}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t">
          <Link
            to="/"
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
              collapsed && "justify-center lg:justify-center"
            )}
            title={collapsed ? "Back to App" : undefined}
          >
            <ChevronLeft className="h-5 w-5 flex-shrink-0" />
            {!collapsed && <span>Back to App</span>}
          </Link>
        </div>
      </div>
    </div>
  );
}