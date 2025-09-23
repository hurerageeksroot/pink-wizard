import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, ArrowUp, BookOpen, CheckCircle, Copy, Clock, Users, Target, MessageSquare, Edit, Save, X, Trash2 } from "lucide-react";
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

interface NavigationResource {
  id: string;
  title: string;
  sort_order: number;
}

const categoryIcons = {
  'Networking': Users,
  'Cold Outreach': Target,
  'Warm Outreach': MessageSquare,
  'Follow-ups': Clock,
  'Templates': BookOpen,
  'General': BookOpen,
};

const categoryColors = {
  'Networking': 'bg-primary/10 text-primary border-primary/20',
  'Cold Outreach': 'bg-accent/10 text-accent border-accent/20',
  'Warm Outreach': 'bg-secondary/10 text-secondary border-secondary/20',
  'Follow-ups': 'bg-hot/10 text-hot border-hot/20',
  'Templates': 'bg-warm/10 text-warm border-warm/20',
  'General': 'bg-muted/10 text-muted-foreground border-muted/20',
};

// Component for editing resources
const ResourceEditor = ({ resource, isOpen, onClose, onSave }: {
  resource: Resource;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Partial<Resource>) => void;
}) => {
  const [formData, setFormData] = useState({
    title: resource.title,
    description: resource.description,
    category: resource.category,
    content: resource.content,
    sort_order: resource.sort_order
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    setFormData({
      title: resource.title,
      description: resource.description,
      category: resource.category,
      content: resource.content,
      sort_order: resource.sort_order
    });
    setHasUnsavedChanges(false);
  }, [resource, isOpen]);

  // Auto-save to localStorage
  useEffect(() => {
    if (isOpen && hasUnsavedChanges) {
      const autoSaveKey = `resource-edit-${resource.id}`;
      localStorage.setItem(autoSaveKey, JSON.stringify(formData));
    }
  }, [formData, hasUnsavedChanges, isOpen, resource.id]);

  // Load auto-saved data on open
  useEffect(() => {
    if (isOpen) {
      const autoSaveKey = `resource-edit-${resource.id}`;
      const saved = localStorage.getItem(autoSaveKey);
      if (saved) {
        try {
          const savedData = JSON.parse(saved);
          setFormData(savedData);
          setHasUnsavedChanges(true);
        } catch (e) {
          console.error('Failed to load auto-saved data:', e);
        }
      }
    }
  }, [isOpen, resource.id]);

  const handleFormChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const clearAutoSave = () => {
    const autoSaveKey = `resource-edit-${resource.id}`;
    localStorage.removeItem(autoSaveKey);
    setHasUnsavedChanges(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clearAutoSave();
    onSave(formData);
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      if (confirm('You have unsaved changes. Are you sure you want to close without saving?')) {
        clearAutoSave();
        onClose();
      }
    } else {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Edit Resource {hasUnsavedChanges && <span className="text-orange-500">(Unsaved changes)</span>}
          </DialogTitle>
          <DialogDescription>
            Update the resource details below. Changes are auto-saved to prevent data loss.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleFormChange('title', e.target.value)}
                placeholder="Resource title"
                required
              />
            </div>
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => handleFormChange('category', value)}>
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
              onChange={(e) => handleFormChange('description', e.target.value)}
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
              onChange={(e) => handleFormChange('sort_order', parseInt(e.target.value) || 0)}
              placeholder="0"
              min="0"
            />
          </div>

          <div>
            <Label htmlFor="content">Content (Markdown)</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleFormChange('content', e.target.value)}
              placeholder="Write your content in Markdown format..."
              rows={15}
              className="font-mono"
            />
          </div>

          <div className="flex gap-4 justify-end">
            <Button type="button" variant="outline" onClick={handleClose}>
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button type="submit">
              <Save className="h-4 w-4 mr-2" />
              Update Resource
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const ResourceArticle: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [resource, setResource] = useState<Resource | null>(null);
  const [allResources, setAllResources] = useState<NavigationResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [tableOfContents, setTableOfContents] = useState<{ id: string; title: string; level: number }[]>([]);
  const [activeSection, setActiveSection] = useState<string>('');
  const [isRead, setIsRead] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [unsavedChanges, setUnsavedChanges] = useState(false);

  useEffect(() => {
    // Wait for auth to finish loading before checking user status
    if (authLoading) return;
    
    // Remove auth redirect - handled by ProtectedRoute
    if (id) {
      checkAdminStatus();
      loadResource();
      loadAllResources();
    }
  }, [id, user, authLoading]);

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
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    // Check read status
    const readResources = JSON.parse(localStorage.getItem('readResources') || '[]');
    setIsRead(readResources.includes(id));
  }, [id]);

  useEffect(() => {
    // Generate table of contents from markdown headings
    if (resource?.content) {
      const headings = resource.content.match(/^#{2,3}\s+(.+)$/gm) || [];
      const toc = headings.map((heading, index) => {
        const level = heading.match(/^#{2,3}/)?.[0].length || 2;
        const title = heading.replace(/^#{2,3}\s+/, '');
        const id = `heading-${index}`;
        return { id, title, level };
      });
      setTableOfContents(toc);
    }
  }, [resource]);

  const loadResource = async () => {
    try {
      const { data, error } = await supabase
        .from('educational_resources')
        .select('*')
        .eq('id', id)
        .eq('is_published', true)
        .single();

      if (error) throw error;
      setResource(data);
    } catch (error) {
      console.error('Error loading resource:', error);
      toast({
        title: "Error",
        description: "Failed to load resource. Please try again.",
        variant: "destructive"
      });
      navigate('/resources');
    } finally {
      setLoading(false);
    }
  };

  const loadAllResources = async () => {
    try {
      const { data, error } = await supabase
        .from('educational_resources')
        .select('id, title, sort_order')
        .eq('is_published', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      setAllResources(data || []);
    } catch (error) {
      console.error('Error loading all resources:', error);
    }
  };

  const toggleReadStatus = () => {
    const readResources = JSON.parse(localStorage.getItem('readResources') || '[]');
    let updatedReadResources;
    
    if (isRead) {
      updatedReadResources = readResources.filter((resourceId: string) => resourceId !== id);
    } else {
      updatedReadResources = [...readResources, id];
    }
    
    localStorage.setItem('readResources', JSON.stringify(updatedReadResources));
    setIsRead(!isRead);
    
    toast({
      title: isRead ? "Marked as unread" : "Marked as read",
      description: `"${resource?.title}" has been ${isRead ? 'removed from' : 'added to'} your read list.`,
    });
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied!",
        description: "Text copied to clipboard.",
      });
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast({
        title: "Copy failed",
        description: "Please try selecting and copying the text manually.",
        variant: "destructive"
      });
    }
  };

  const handleSaveResource = async (resourceData: Partial<Resource>) => {
    if (!user || !isAdmin || !resource) return;

    try {
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
        .eq('id', resource.id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Resource updated successfully!"
      });
      
      // Reload the resource
      await loadResource();
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Error saving resource:', error);
      toast({
        title: "Error",
        description: "Failed to save resource. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteResource = async () => {
    if (!user || !isAdmin || !resource) return;
    
    if (!confirm('Are you sure you want to delete this resource? This action cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('educational_resources')
        .delete()
        .eq('id', resource.id);

      if (error) throw error;
      
      toast({
        title: "Success",
        description: "Resource deleted successfully!"
      });
      
      navigate('/resources');
    } catch (error) {
      console.error('Error deleting resource:', error);
      toast({
        title: "Error",
        description: "Failed to delete resource. Please try again.",
        variant: "destructive"
      });
    }
  };

  const getCurrentResourceIndex = () => {
    return allResources.findIndex(r => r.id === id);
  };

  const getPrevResource = () => {
    const currentIndex = getCurrentResourceIndex();
    return currentIndex > 0 ? allResources[currentIndex - 1] : null;
  };

  const getNextResource = () => {
    const currentIndex = getCurrentResourceIndex();
    return currentIndex < allResources.length - 1 ? allResources[currentIndex + 1] : null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10" />
            <Skeleton className="h-8 w-64" />
          </div>
          <Skeleton className="h-64" />
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!resource) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="p-6 text-center">
          <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <h3 className="text-lg font-semibold mb-2">Resource not found</h3>
          <p className="text-muted-foreground mb-4">The requested resource could not be found.</p>
          <Button onClick={() => navigate('/resources')}>
            Back to Resources
          </Button>
        </Card>
      </div>
    );
  }

  const IconComponent = categoryIcons[resource.category as keyof typeof categoryIcons] || BookOpen;
  const prevResource = getPrevResource();
  const nextResource = getNextResource();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground">
        <div className="max-w-6xl mx-auto p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/resources')}
                className="text-white hover:bg-white/20"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-white/10 rounded-lg">
                    <IconComponent className="h-5 w-5" />
                  </div>
                  <Badge className="bg-white/20 text-white border-white/20">
                    {resource.category}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleReadStatus}
                    className={`text-white hover:bg-white/20 ${isRead ? 'bg-white/10' : ''}`}
                  >
                    <CheckCircle className={`h-4 w-4 mr-2 ${isRead ? 'fill-current' : ''}`} />
                    {isRead ? 'Mark as unread' : 'Mark as read'}
                  </Button>
                </div>
                <h1 className="text-3xl font-bold">{resource.title}</h1>
                <p className="text-white/80 mt-1">{resource.description}</p>
              </div>
            </div>
            
            {isAdmin && (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(true)}
                  className="flex items-center gap-2 bg-white/10 text-white border-white/20 hover:bg-white/20"
                >
                  <Edit className="h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteResource}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-3">
            <Card>
              <CardContent className="p-8">
                <div className="prose prose-lg max-w-none">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h2: ({ children }) => (
                        <h2 className="text-2xl font-bold mt-8 mb-4 text-foreground border-b border-border pb-2">
                          {children}
                        </h2>
                      ),
                      h3: ({ children }) => (
                        <h3 className="text-xl font-semibold mt-6 mb-3 text-foreground">
                          {children}
                        </h3>
                      ),
                      p: ({ children }) => (
                        <p className="mb-4 text-foreground leading-relaxed">
                          {children}
                        </p>
                      ),
                      ul: ({ children }) => (
                        <ul className="mb-4 space-y-2 text-foreground">
                          {children}
                        </ul>
                      ),
                      ol: ({ children }) => (
                        <ol className="mb-4 space-y-2 text-foreground">
                          {children}
                        </ol>
                      ),
                      li: ({ children }) => (
                        <li className="ml-4">
                          {children}
                        </li>
                      ),
                      blockquote: ({ children }) => (
                        <blockquote className="border-l-4 border-primary pl-4 py-2 bg-primary/5 my-4 italic text-foreground">
                          {children}
                        </blockquote>
                      ),
                      pre: ({ children }) => (
                        <div className="relative">
                          <pre className="bg-muted p-4 rounded-lg overflow-x-auto my-4 text-sm">
                            {children}
                          </pre>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="absolute top-2 right-2 h-8 w-8 p-0"
                            onClick={() => {
                              const code = (children as any)?.props?.children || '';
                              copyToClipboard(code);
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      ),
                      table: ({ children }) => (
                        <div className="overflow-x-auto my-6">
                          <table className="w-full border-collapse border border-border">
                            {children}
                          </table>
                        </div>
                      ),
                      thead: ({ children }) => (
                        <thead className="bg-muted">
                          {children}
                        </thead>
                      ),
                      tbody: ({ children }) => (
                        <tbody>
                          {children}
                        </tbody>
                      ),
                      tr: ({ children }) => (
                        <tr className="border-b border-border hover:bg-muted/50">
                          {children}
                        </tr>
                      ),
                      th: ({ children }) => (
                        <th className="border border-border px-4 py-3 text-left font-semibold text-foreground">
                          {children}
                        </th>
                      ),
                      td: ({ children }) => (
                        <td className="border border-border px-4 py-3 text-foreground">
                          {children}
                        </td>
                      ),
                    }}
                  >
                    {resource.content}
                  </ReactMarkdown>
                </div>
              </CardContent>
            </Card>

            {/* Navigation */}
            <div className="flex justify-between items-center mt-8">
              <div>
                {prevResource && (
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/resources/${prevResource.id}`)}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Previous: {prevResource.title}
                  </Button>
                )}
              </div>
              <div>
                {nextResource && (
                  <Button
                    variant="outline"
                    onClick={() => navigate(`/resources/${nextResource.id}`)}
                    className="flex items-center gap-2"
                  >
                    Next: {nextResource.title}
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6 space-y-4">
              {/* Table of Contents */}
              {tableOfContents.length > 0 && (
                <Card>
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-3 text-foreground">Table of Contents</h3>
                    <ScrollArea className="h-64">
                      <div className="space-y-2">
                        {tableOfContents.map((item) => (
                          <Button
                            key={item.id}
                            variant="ghost"
                            size="sm"
                            className={`w-full justify-start text-left h-auto py-2 px-2 text-sm ${
                              item.level === 3 ? 'pl-6' : ''
                            }`}
                            onClick={() => {
                              document.getElementById(item.id)?.scrollIntoView({ behavior: 'smooth' });
                            }}
                          >
                            {item.title}
                          </Button>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              )}

              {/* Quick Actions */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-3 text-foreground">Quick Actions</h3>
                  <div className="space-y-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    >
                      <ArrowUp className="h-4 w-4 mr-2" />
                      Back to top
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => copyToClipboard(window.location.href)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy link
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Resource Dialog */}
      {isAdmin && resource && (
        <ResourceEditor
          resource={resource}
          isOpen={isEditDialogOpen}
          onClose={() => setIsEditDialogOpen(false)}
          onSave={handleSaveResource}
        />
      )}
    </div>
  );
};

export default ResourceArticle;