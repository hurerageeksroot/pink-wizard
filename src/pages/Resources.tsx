import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, BookOpen, ArrowLeft, Star, Clock, Users, Target, MessageSquare, Zap, CheckCircle, Edit, Plus, Save, X, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Resource {
  id: string;
  title: string;
  description: string;
  category: string;
  content: string;
  sort_order: number;
  is_published: boolean;
  created_at: string;
}

const categoryIcons = {
  'Networking': Users,
  'Cold Outreach': Target,
  'Warm Outreach': MessageSquare,
  'Follow-ups': Clock,
  'Templates': BookOpen,
  'General': Star,
};

const categoryColors = {
  'Networking': 'bg-primary/10 text-primary border-primary/20',
  'Cold Outreach': 'bg-accent/10 text-accent border-accent/20',
  'Warm Outreach': 'bg-secondary/10 text-secondary border-secondary/20',
  'Follow-ups': 'bg-hot/10 text-hot border-hot/20',
  'Templates': 'bg-warm/10 text-warm border-warm/20',
  'General': 'bg-muted/10 text-muted-foreground border-muted/20',
};

const Resources: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [isAdmin, setIsAdmin] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // Get read status from localStorage
  const getReadStatus = (resourceId: string): boolean => {
    const readResources = JSON.parse(localStorage.getItem('readResources') || '[]');
    return readResources.includes(resourceId);
  };

  useEffect(() => {
    // Wait for auth to finish loading before checking user status
    if (authLoading) return;
    
    // Remove auth redirect - handled by ProtectedRoute
    checkAdminStatus();
    loadResources();
  }, [user, authLoading]);

  const checkAdminStatus = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();
      
      if (!error && data) {
        setIsAdmin(true);
      }
    } catch (error) {
      // User is not admin, which is fine
      setIsAdmin(false);
    }
  };

  const loadResources = async () => {
    try {
      const { data, error } = await supabase
        .from('educational_resources')
        .select('*')
        .eq('is_published', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setResources(data || []);
    } catch (error) {
      console.error('Error loading resources:', error);
      toast({
        title: "Error",
        description: "Failed to load resources. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveResource = async (resourceData: Partial<Resource>) => {
    if (!user || !isAdmin) return;

    try {
      if (editingResource) {
        // Update existing resource
        const { error } = await supabase
          .from('educational_resources')
          .update({
            title: resourceData.title,
            description: resourceData.description,
            category: resourceData.category,
            content: resourceData.content,
            sort_order: resourceData.sort_order || 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', editingResource.id);

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Resource updated successfully!"
        });
      } else {
        // Create new resource
        const { error } = await supabase
          .from('educational_resources')
          .insert({
            title: resourceData.title,
            description: resourceData.description,
            category: resourceData.category,
            content: resourceData.content || '',
            sort_order: resourceData.sort_order || 0,
            is_published: true
          });

        if (error) throw error;
        
        toast({
          title: "Success",
          description: "Resource created successfully!"
        });
      }

      // Reload resources and close dialogs
      await loadResources();
      setEditingResource(null);
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Error saving resource:', error);
      toast({
        title: "Error",
        description: "Failed to save resource. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteResource = async (resourceId: string) => {
    if (!user || !isAdmin) return;
    
    if (!confirm('Are you sure you want to delete this resource?')) return;

    try {
      const { error } = await supabase
        .from('educational_resources')
        .delete()
        .eq('id', resourceId);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Resource deleted successfully!"
      });
      
      await loadResources();
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast({
        title: "Error",
        description: "Failed to delete resource. Please try again.",
        variant: "destructive"
      });
    }
  };

  // Component for editing/creating resources
  const ResourceEditor = ({ resource, isOpen, onClose, onSave }: {
    resource: Resource | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<Resource>) => void;
  }) => {
    const [formData, setFormData] = useState({
      title: resource?.title || '',
      description: resource?.description || '',
      category: resource?.category || 'General',
      content: resource?.content || '',
      sort_order: resource?.sort_order || 0
    });

    useEffect(() => {
      if (resource) {
        setFormData({
          title: resource.title,
          description: resource.description,
          category: resource.category,
          content: resource.content,
          sort_order: resource.sort_order
        });
      } else {
        setFormData({
          title: '',
          description: '',
          category: 'General',
          content: '',
          sort_order: 0
        });
      }
    }, [resource, isOpen]);

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      onSave(formData);
    };

    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {resource ? 'Edit Resource' : 'Create New Resource'}
            </DialogTitle>
            <DialogDescription>
              {resource ? 'Update the resource details below.' : 'Create a new educational resource for your team.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Resource title"
                  required
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="Cold Outreach">Cold Outreach</SelectItem>
                    <SelectItem value="Warm Outreach">Warm Outreach</SelectItem>
                    <SelectItem value="Follow-ups">Follow-ups</SelectItem>
                    <SelectItem value="Networking">Networking</SelectItem>
                    <SelectItem value="Templates">Templates</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the resource"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="sort_order">Sort Order</Label>
              <Input
                id="sort_order"
                type="number"
                value={formData.sort_order}
                onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                placeholder="0"
                min="0"
              />
            </div>

            <div>
              <Label htmlFor="content">Content (Markdown)</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                placeholder="Write your content in Markdown format..."
                rows={15}
                className="font-mono"
              />
            </div>

            <div className="flex gap-4 justify-end">
              <Button type="button" variant="outline" onClick={onClose}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
              <Button type="submit">
                <Save className="h-4 w-4 mr-2" />
                {resource ? 'Update' : 'Create'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  const filteredResources = resources.filter(resource => {
    const matchesSearch = resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         resource.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || resource.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['All', ...Array.from(new Set(resources.map(r => r.category)))];
  const featuredResources = resources.filter(r => r.sort_order <= 3).slice(0, 3);

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-8 w-64" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground">
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="text-white hover:bg-white/20"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Resource Center</h1>
              <p className="text-white/80 mt-1">Master the art of outreach with our comprehensive guides</p>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-white/60" />
              <Input
                placeholder="Search guides and templates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/10 border-white/20 text-white placeholder:text-white/60"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {categories.map(category => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={selectedCategory === category 
                    ? "bg-white/20 text-white" 
                    : "text-white/80 hover:bg-white/10 hover:text-white"
                  }
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 space-y-8">
        {/* Featured Section */}
        {selectedCategory === 'All' && searchQuery === '' && featuredResources.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-6">
              <Star className="h-5 w-5 text-primary" />
              <h2 className="text-2xl font-bold">Featured Guides</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredResources.map(resource => {
                const IconComponent = categoryIcons[resource.category as keyof typeof categoryIcons] || BookOpen;
                const isRead = getReadStatus(resource.id);
                return (
                  <Card 
                    key={resource.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20"
                    onClick={() => navigate(`/resources/${resource.id}`)}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <IconComponent className="h-6 w-6 text-primary" />
                        </div>
                        <div className="flex gap-2">
                          <Badge className={categoryColors[resource.category as keyof typeof categoryColors] || categoryColors.General}>
                            {resource.category}
                          </Badge>
                          {isRead && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Read
                            </Badge>
                          )}
                        </div>
                      </div>
                      <CardTitle className="text-lg">{resource.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground text-sm line-clamp-3">
                        {resource.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* All Resources */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">
              {selectedCategory === 'All' ? 'All Guides' : `${selectedCategory} Guides`}
            </h2>
            <div className="flex items-center gap-4">
              {isAdmin && (
                <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Resource
                </Button>
              )}
              <Badge variant="secondary">
                {filteredResources.length} {filteredResources.length === 1 ? 'guide' : 'guides'}
              </Badge>
            </div>
          </div>

          {filteredResources.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <h3 className="text-lg font-semibold mb-2">No guides found</h3>
                <p className="text-muted-foreground">
                  {searchQuery ? 'Try adjusting your search terms' : 'No guides available in this category'}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResources.map(resource => {
                const IconComponent = categoryIcons[resource.category as keyof typeof categoryIcons] || BookOpen;
                const isRead = getReadStatus(resource.id);
                return (
                  <Card 
                    key={resource.id}
                    className="cursor-pointer hover:shadow-lg transition-shadow"
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="p-2 bg-muted/50 rounded-lg">
                          <IconComponent className="h-5 w-5 text-primary" />
                        </div>
                         <div className="flex gap-2">
                           {isAdmin && (
                             <>
                               <Button
                                 size="sm"
                                 variant="outline"
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   setEditingResource(resource);
                                 }}
                                 className="h-8 w-8 p-0"
                               >
                                 <Edit className="h-4 w-4" />
                               </Button>
                               <Button
                                 size="sm"
                                 variant="destructive"
                                 onClick={(e) => {
                                   e.stopPropagation();
                                   handleDeleteResource(resource.id);
                                 }}
                                 className="h-8 w-8 p-0"
                               >
                                 <Trash2 className="h-4 w-4" />
                               </Button>
                             </>
                           )}
                          <Badge className={categoryColors[resource.category as keyof typeof categoryColors] || categoryColors.General}>
                            {resource.category}
                          </Badge>
                          {isRead && (
                            <Badge variant="secondary" className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Read
                            </Badge>
                          )}
                        </div>
                      </div>
                      <CardTitle 
                        className="text-lg cursor-pointer" 
                        onClick={() => navigate(`/resources/${resource.id}`)}
                      >
                        {resource.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent onClick={() => navigate(`/resources/${resource.id}`)}>
                      <p className="text-muted-foreground text-sm line-clamp-3">
                        {resource.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Edit/Create Resource Dialog */}
      <ResourceEditor
        resource={editingResource}
        isOpen={!!editingResource || isCreateDialogOpen}
        onClose={() => {
          setEditingResource(null);
          setIsCreateDialogOpen(false);
        }}
        onSave={handleSaveResource}
      />
    </div>
  );
};

export default Resources;