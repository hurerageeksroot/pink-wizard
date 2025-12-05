import { useState } from 'react';
import { ICPCard } from '@/components/Prospecting/ICPCard';
import { LocationSelector } from '@/components/Prospecting/LocationSelector';
import { ProspectSearchButton } from '@/components/Prospecting/ProspectSearchButton';
import { ProspectCard } from '@/components/Prospecting/ProspectCard';
import { useProspecting } from '@/hooks/useProspecting';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Target } from 'lucide-react';

export default function Prospecting() {
  const {
    icp,
    icpLoading,
    prospects,
    prospectsLoading,
    canSearchToday,
    runSearch,
    isSearching,
    updateICP,
    saveProspect,
    dismissProspect,
    addToContacts,
  } = useProspecting();

  const [searchLocation, setSearchLocation] = useState('');
  const [searchRadius, setSearchRadius] = useState<'city' | 'metro' | 'state'>('metro');
  const [useNational, setUseNational] = useState(false);

  const handleRunSearch = () => {
    const params = useNational 
      ? undefined 
      : searchLocation 
        ? { searchLocation, searchRadius } 
        : undefined;
    
    runSearch(params);
  };

  const newProspects = prospects.filter(p => p.status === 'new');
  const savedProspects = prospects.filter(p => p.status === 'saved');
  const addedProspects = prospects.filter(p => p.status === 'added_to_contacts');
  const dismissedProspects = prospects.filter(p => p.status === 'dismissed');

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-3 bg-primary/10 rounded-lg">
          <Target className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-3xl font-bold">Prospect Finder</h1>
          <p className="text-muted-foreground">
            AI-powered prospecting to find your next best clients
          </p>
        </div>
      </div>

      {/* ICP Card */}
      <ICPCard icp={icp} loading={icpLoading} />

      {/* Search Section */}
      <Card>
        <CardHeader>
          <CardTitle>Find Today's Prospects</CardTitle>
          <CardDescription>
            Choose your geographic focus and we'll find prospects that match your ideal customer profile
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <LocationSelector
            location={searchLocation}
            onLocationChange={setSearchLocation}
            radius={searchRadius}
            onRadiusChange={setSearchRadius}
            useNational={useNational}
            onUseNationalChange={setUseNational}
            disabled={!canSearchToday || isSearching}
          />
          <ProspectSearchButton
            canSearch={canSearchToday}
            isSearching={isSearching}
            onSearch={handleRunSearch}
          />
        </CardContent>
      </Card>

      {/* Results */}
      {prospects.length > 0 && (
        <Tabs defaultValue="new" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="new">
              New {newProspects.length > 0 && `(${newProspects.length})`}
            </TabsTrigger>
            <TabsTrigger value="saved">
              Saved {savedProspects.length > 0 && `(${savedProspects.length})`}
            </TabsTrigger>
            <TabsTrigger value="added">
              Added {addedProspects.length > 0 && `(${addedProspects.length})`}
            </TabsTrigger>
            <TabsTrigger value="dismissed">
              Dismissed {dismissedProspects.length > 0 && `(${dismissedProspects.length})`}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="new" className="space-y-4 mt-6">
            {newProspects.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No new prospects. Run a search to find potential clients!
              </p>
            ) : (
              newProspects.map((prospect) => (
                <ProspectCard
                  key={prospect.id}
                  prospect={prospect}
                  onSave={() => saveProspect(prospect.id)}
                  onAddToContacts={() => addToContacts(prospect)}
                  onDismiss={() => dismissProspect(prospect.id)}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="saved" className="space-y-4 mt-6">
            {savedProspects.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No saved prospects yet
              </p>
            ) : (
              savedProspects.map((prospect) => (
                <ProspectCard
                  key={prospect.id}
                  prospect={prospect}
                  onSave={() => {}}
                  onAddToContacts={() => addToContacts(prospect)}
                  onDismiss={() => dismissProspect(prospect.id)}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="added" className="space-y-4 mt-6">
            {addedProspects.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No prospects added to contacts yet
              </p>
            ) : (
              addedProspects.map((prospect) => (
                <ProspectCard
                  key={prospect.id}
                  prospect={prospect}
                  onSave={() => {}}
                  onAddToContacts={() => {}}
                  onDismiss={() => {}}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="dismissed" className="space-y-4 mt-6">
            {dismissedProspects.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No dismissed prospects
              </p>
            ) : (
              dismissedProspects.map((prospect) => (
                <ProspectCard
                  key={prospect.id}
                  prospect={prospect}
                  onSave={() => {}}
                  onAddToContacts={() => {}}
                  onDismiss={() => {}}
                />
              ))
            )}
          </TabsContent>
        </Tabs>
      )}

      {prospectsLoading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="space-y-3 animate-pulse">
                  <div className="h-4 bg-muted rounded w-1/4"></div>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}