import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAdminData } from '@/hooks/useAdminData';
import { 
  Plus,
  Search, 
  Edit, 
  Trash2,
  BookOpen,
  HelpCircle,
  FileQuestion,
  Globe,
  Lock
} from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

// Help article categories
const HELP_CATEGORIES = [
  { value: 'getting-started', label: 'Getting Started' },
  { value: 'features', label: 'Features' },
  { value: 'troubleshooting', label: 'Troubleshooting' },
  { value: 'account', label: 'Account Management' },
  { value: 'billing', label: 'Billing & Payments' },
  { value: 'integrations', label: 'Integrations' },
  { value: 'api', label: 'API Documentation' },
  { value: 'other', label: 'Other' }
];

export function HelpManagement() {
  const { 
    contentPages, 
    loading, 
    createContentPage, 
    updateContentPage, 
    deleteContentPage 
  } = useAdminData();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    meta_description: '',
    category: 'getting-started',
    is_published: true
  });
  
  // Filter help articles (content pages with help-related slugs or categories)
  const helpArticles = contentPages.filter(page => 
    page.slug.includes('help') || 
    page.slug.includes('faq') || 
    page.slug.includes('guide') ||
    page.title.toLowerCase().includes('help') ||
    page.title.toLowerCase().includes('guide') ||
    page.title.toLowerCase().includes('how to')
  );

  const filteredArticles = helpArticles.filter(article => {
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.content.toLowerCase().includes(searchTerm.toLowerCase());
    
    // For now, we'll show all articles since we don't have category metadata yet
    const matchesCategory = categoryFilter === 'all';
    
    return matchesSearch && matchesCategory;
  });

  const resetForm = () => {
    setFormData({
      title: '',
      slug: '',
      content: '',
      meta_description: '',
      category: 'getting-started',
      is_published: true
    });
  };

  const handleCreate = () => {
    setSelectedArticle(null);
    resetForm();
    setIsCreateDialogOpen(true);
  };

  const handleEdit = (article: any) => {
    setSelectedArticle(article);
    setFormData({
      title: article.title,
      slug: article.slug,
      content: article.content,
      meta_description: article.meta_description || '',
      category: 'getting-started', // Default since we don't have category data yet
      is_published: article.is_published
    });
    setIsEditDialogOpen(true);
  };

  const handleSubmit = async (isEdit: boolean) => {
    try {
      // Add help- prefix to slug if it doesn't already have it
      const helpSlug = formData.slug.startsWith('help-') ? formData.slug : `help-${formData.slug}`;
      const submitData = { ...formData, slug: helpSlug };
      
      if (isEdit && selectedArticle) {
        await updateContentPage(selectedArticle.id, submitData);
        setIsEditDialogOpen(false);
      } else {
        await createContentPage(submitData);
        setIsCreateDialogOpen(false);
      }
      resetForm();
      setSelectedArticle(null);
    } catch (error) {
      console.error('Error saving help article:', error);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteContentPage(id);
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  };

  const handleTitleChange = (title: string) => {
    setFormData(prev => ({
      ...prev,
      title,
      slug: generateSlug(title)
    }));
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Help Articles Management</h1>
          <p className="text-muted-foreground">
            Manage help articles and documentation for your users.
          </p>
        </div>
        
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Help Articles Management</h1>
          <p className="text-muted-foreground">
            Create and manage help articles to assist your users.
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New Help Article
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Help Articles ({helpArticles.length})
          </CardTitle>
          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {HELP_CATEGORIES.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {helpArticles.length === 0 ? (
            <div className="text-center py-12">
              <HelpCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No help articles yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first help article to assist your users.
              </p>
              <Button onClick={handleCreate}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Help Article
              </Button>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Updated</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredArticles.map((article) => (
                    <TableRow key={article.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <FileQuestion className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{article.title}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted px-2 py-1 rounded">
                          /{article.slug}
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant={article.is_published ? "default" : "secondary"}>
                          {article.is_published ? (
                            <>
                              <Globe className="mr-1 h-3 w-3" />
                              Published
                            </>
                          ) : (
                            <>
                              <Lock className="mr-1 h-3 w-3" />
                              Draft
                            </>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(article.updated_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(article)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Help Article</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete "{article.title}"? 
                                  This action cannot be undone and may affect user support.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDelete(article.id)}>
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              {filteredArticles.length === 0 && helpArticles.length > 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  No articles found matching your search criteria.
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Create Help Article Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Help Article</DialogTitle>
            <DialogDescription>
              Add a new help article to assist your users.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleTitleChange(e.target.value)}
                placeholder="How to get started"
              />
            </div>
            
            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {HELP_CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="slug">Slug</Label>
              <Input
                id="slug"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="how-to-get-started"
              />
              <p className="text-xs text-muted-foreground mt-1">
                URL: /help-{formData.slug}
              </p>
            </div>
            
            <div>
              <Label htmlFor="meta_description">Meta Description</Label>
              <Input
                id="meta_description"
                value={formData.meta_description}
                onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                placeholder="Brief description for SEO"
              />
            </div>
            
            <div>
              <Label htmlFor="content">Content</Label>
              <Textarea
                id="content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Write your help article content here (supports Markdown)..."
                rows={8}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="is_published"
                checked={formData.is_published}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_published: checked }))}
              />
              <Label htmlFor="is_published">Publish immediately</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleSubmit(false)}>
              Create Help Article
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Help Article Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Help Article</DialogTitle>
            <DialogDescription>
              Update the help article content.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Help article title"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-category">Category</Label>
              <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {HELP_CATEGORIES.map((category) => (
                    <SelectItem key={category.value} value={category.value}>
                      {category.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="edit-slug">Slug</Label>
              <Input
                id="edit-slug"
                value={formData.slug}
                onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="help-article-slug"
              />
              <p className="text-xs text-muted-foreground mt-1">
                URL: /{formData.slug}
              </p>
            </div>
            
            <div>
              <Label htmlFor="edit-meta_description">Meta Description</Label>
              <Input
                id="edit-meta_description"
                value={formData.meta_description}
                onChange={(e) => setFormData(prev => ({ ...prev, meta_description: e.target.value }))}
                placeholder="Brief description for SEO"
              />
            </div>
            
            <div>
              <Label htmlFor="edit-content">Content</Label>
              <Textarea
                id="edit-content"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Help article content (supports Markdown)"
                rows={8}
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-is_published"
                checked={formData.is_published}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_published: checked }))}
              />
              <Label htmlFor="edit-is_published">Published</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => handleSubmit(true)}>
              Update Help Article
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}