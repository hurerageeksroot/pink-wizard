import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Edit2, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface RevenueEntry {
  id: string;
  amount: number;
  type: 'direct' | 'referral';
  notes?: string;
  date: Date;
  referredClient?: string;
}

interface ContactRevenueProps {
  contactId: string;
  contactName: string;
  revenue: RevenueEntry[];
  onEditRevenue: (revenueId: string) => void;
  onDeleteRevenue: (revenueId: string) => void;
  onLogRevenue: () => void;
}

export function ContactRevenue({ 
  contactId, 
  contactName, 
  revenue, 
  onEditRevenue, 
  onDeleteRevenue, 
  onLogRevenue 
}: ContactRevenueProps) {
  const totalRevenue = revenue.reduce((sum, entry) => sum + entry.amount, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="w-5 h-5 text-primary" />
          <h3 className="text-lg font-semibold">Revenue History</h3>
          {totalRevenue > 0 && (
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              Total: ${totalRevenue.toLocaleString()}
            </Badge>
          )}
        </div>
        <Button
          onClick={onLogRevenue}
          size="sm"
          className="bg-primary text-primary-foreground hover:bg-primary/90"
        >
          <DollarSign className="w-4 h-4 mr-2" />
          Log Revenue
        </Button>
      </div>

      {revenue.length === 0 ? (
        <div className="text-center py-8">
          <DollarSign className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No revenue logged yet</p>
          <p className="text-xs text-muted-foreground mt-1">
            Click "Log Revenue" to track earnings from this contact
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {revenue.map((entry) => (
            <Card key={entry.id} className="bg-gradient-card border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <DollarSign className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-lg">${entry.amount.toLocaleString()}</span>
                          <Badge 
                            variant="outline" 
                            className={entry.type === 'direct' 
                              ? "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800"
                              : "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800"
                            }
                          >
                            {entry.type === 'direct' ? 'Direct Revenue' : 'Referral Revenue'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {format(entry.date, "PPp")}
                        </p>
                      </div>
                    </div>
                    
                    {entry.notes && (
                      <p className="text-sm text-muted-foreground mb-2">{entry.notes}</p>
                    )}
                    
                    {entry.type === 'referral' && entry.referredClient && (
                      <p className="text-xs text-muted-foreground">
                        Referred client: {entry.referredClient}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditRevenue(entry.id)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteRevenue(entry.id)}
                      className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}