export interface ContactCategory {
  id: string;
  name: string;
  label: string;
  iconName: string;
  colorClass: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ContactCategoryCreate {
  name: string;
  label: string;
  iconName?: string;
  colorClass?: string;
}