import { ContactCategory } from "@/types/crm";
import { Badge } from "@/components/ui/badge";
import { useContactCategories } from "@/hooks/useContactCategories";
import * as LucideIcons from "lucide-react";

interface ContactCategoryBadgeProps {
  category: ContactCategory;
}

export function ContactCategoryBadge({ category }: ContactCategoryBadgeProps) {
  const { getCategoryByName } = useContactCategories();
  const categoryData = getCategoryByName(category);

  // Fallback for unknown categories
  if (!categoryData) {
    return (
      <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100">
        <LucideIcons.HelpCircle className="w-3 h-3 mr-1" />
        {category || 'Unknown'}
      </Badge>
    );
  }

  // Get the icon component dynamically
  const IconComponent = (LucideIcons as any)[categoryData.iconName] || LucideIcons.HelpCircle;

  return (
    <Badge variant="outline" className={categoryData.colorClass}>
      <IconComponent className="w-3 h-3 mr-1" />
      {categoryData.label}
    </Badge>
  );
}