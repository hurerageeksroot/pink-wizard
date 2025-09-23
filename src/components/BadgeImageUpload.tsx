import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BadgeImageUploadProps {
  currentImageUrl?: string;
  onImageUploaded: (imageUrl: string) => void;
  onImageRemoved: () => void;
}

export function BadgeImageUpload({ currentImageUrl, onImageUploaded, onImageRemoved }: BadgeImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file (PNG, JPG, etc.)",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 2MB",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    try {
      // Create unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('badge-images')
        .upload(fileName, file);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('badge-images')
        .getPublicUrl(data.path);

      console.log('Image uploaded successfully, calling onImageUploaded with:', publicUrl);
      onImageUploaded(publicUrl);
      
      toast({
        title: "Image uploaded successfully",
        description: "Badge image has been uploaded and saved"
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Upload failed",
        description: "Failed to upload image. Please try again.",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!currentImageUrl) return;

    try {
      // Extract filename from URL
      const url = new URL(currentImageUrl);
      const pathParts = url.pathname.split('/');
      const fileName = pathParts[pathParts.length - 1];

      // Delete from storage
      const { error } = await supabase.storage
        .from('badge-images')
        .remove([fileName]);

      if (error) throw error;

      onImageRemoved();
      
      toast({
        title: "Image removed",
        description: "Badge image has been removed"
      });
    } catch (error) {
      console.error('Error removing image:', error);
      toast({
        title: "Remove failed",
        description: "Failed to remove image. Please try again.",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-4">
      <Label htmlFor="badge-image">Badge Image (Optional)</Label>
      
      {currentImageUrl ? (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 border rounded-lg">
            <div className="relative w-16 h-16 bg-gradient-card border border-border/50 rounded-lg flex items-center justify-center overflow-hidden">
              <img 
                src={currentImageUrl} 
                alt="Badge preview" 
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Custom badge image uploaded</p>
              <p className="text-xs text-muted-foreground">This will be used instead of the icon</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleRemoveImage}
              className="text-destructive hover:text-destructive"
            >
              <X className="h-4 w-4" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-6 border-2 border-dashed border-border rounded-lg">
            <ImageIcon className="h-8 w-8 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium">Upload custom badge image</p>
              <p className="text-xs text-muted-foreground">
                Recommended: 128x128px, PNG or JPG, max 2MB
              </p>
            </div>
            <div>
              <Input
                id="badge-image"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => document.getElementById('badge-image')?.click()}
                disabled={uploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                {uploading ? 'Uploading...' : 'Upload Image'}
              </Button>
            </div>
          </div>
        </div>
      )}
      
      <p className="text-xs text-muted-foreground">
        <strong>Tip:</strong> For best results, use square images (128x128px) with transparent backgrounds. 
        If no image is uploaded, the selected icon will be used instead.
      </p>
    </div>
  );
}