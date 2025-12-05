import * as LucideIcons from "lucide-react";

// Safe icon mapping with fallbacks for common icon name variations
export const getIconComponent = (iconName: string): React.ComponentType<any> => {
  // First try exact match
  let IconComponent = (LucideIcons as any)[iconName];
  
  if (IconComponent) {
    return IconComponent;
  }
  
  // Common icon name mappings for variations
  const iconMappings: Record<string, string> = {
    'CheckCircle': 'CheckCircle2',
    'AlertCircle': 'AlertCircle',
    'XCircle': 'XCircle',
    'InfoCircle': 'Info',
    'QuestionCircle': 'HelpCircle',
    'ExclamationCircle': 'AlertTriangle',
    'PlusCircle': 'PlusCircle',
    'MinusCircle': 'MinusCircle',
    'ArrowCircleUp': 'ArrowUp',
    'ArrowCircleDown': 'ArrowDown',
    'ArrowCircleLeft': 'ArrowLeft',
    'ArrowCircleRight': 'ArrowRight',
    'UserCircle': 'UserRound',
    'UsersCircle': 'Users',
    'BuildingCircle': 'Building',
    'HomeCircle': 'Home',
    'PhoneCircle': 'Phone',
    'MailCircle': 'Mail',
    'MessageCircle': 'MessageSquare',
    'CalendarCircle': 'Calendar',
    'ClockCircle': 'Clock',
    'StarCircle': 'Star',
    'HeartCircle': 'Heart',
    'ShieldCircle': 'Shield',
    'CrownCircle': 'Crown',
    'AwardCircle': 'Award',
  };
  
  // Try mapped name
  const mappedName = iconMappings[iconName];
  if (mappedName) {
    IconComponent = (LucideIcons as any)[mappedName];
    if (IconComponent) {
      return IconComponent;
    }
  }
  
  // Fallback to Users icon if nothing else works
  return LucideIcons.Users;
};

// Validate if an icon name exists in Lucide
export const isValidIconName = (iconName: string): boolean => {
  return !!(LucideIcons as any)[iconName] || !!getIconComponent(iconName);
};

// Get all available icon names from Lucide
export const getAvailableIconNames = (): string[] => {
  return Object.keys(LucideIcons).filter(key => 
    typeof (LucideIcons as any)[key] === 'function' ||
    typeof (LucideIcons as any)[key] === 'object'
  );
};