interface BrandColor {
  name: string;
  hex: string;
  cssVar: string;
  description: string;
}

export const BRAND_COLORS: BrandColor[] = [
  { name: 'Primary Pink', hex: '#f5518d', cssVar: 'var(--email-primary)', description: 'Main brand color - use for headers, primary buttons' },
  { name: 'Secondary Teal', hex: '#078e92', cssVar: 'var(--email-secondary)', description: 'Secondary brand color - use for accents, secondary buttons' },
  { name: 'Accent Orange', hex: '#f09300', cssVar: 'var(--email-accent)', description: 'Accent color - use for highlights, call-to-action elements' },
  { name: 'Coral', hex: '#fd6484', cssVar: 'hsl(var(--brand-coral))', description: 'Light accent - use for subtle highlights' },
  { name: 'Dark Teal', hex: '#187187', cssVar: 'hsl(var(--brand-teal-dark))', description: 'Darker teal - use for text, borders' },
  { name: 'Magenta', hex: '#cc116c', cssVar: 'hsl(var(--brand-magenta))', description: 'Deep pink - use for emphasis, warnings' },
  { name: 'Darker Teal', hex: '#065867', cssVar: 'hsl(var(--brand-teal-darker))', description: 'Dark teal - use for backgrounds, text' },
  { name: 'Darkest Teal', hex: '#00343a', cssVar: 'hsl(var(--brand-teal-darkest))', description: 'Very dark teal - use for text, dark backgrounds' },
  { name: 'Lime Green', hex: '#c7d368', cssVar: 'hsl(var(--brand-lime))', description: 'Success color - use for positive states, success messages' },
];

export const EMAIL_BRAND_GRADIENTS = {
  header: 'var(--gradient-email-header)', // Pink to Magenta
  button: 'var(--gradient-email-button)', // Teal gradient  
  accent: 'var(--gradient-email-accent)', // Orange to Coral
};

/**
 * Generate email-safe CSS with brand colors
 * Use this function to ensure all email styling uses brand colors
 */
export const generateEmailCSS = () => `
  /* Email Brand Colors */
  :root {
    --email-primary: #f5518d;
    --email-secondary: #078e92; 
    --email-accent: #f09300;
    --email-background: #fafafa;
    --email-text: #00343a;
    --brand-coral: #fd6484;
    --brand-teal-dark: #187187;
    --brand-magenta: #cc116c;
    --brand-lime: #c7d368;
  }
  
  .email-primary { color: var(--email-primary) !important; }
  .email-secondary { color: var(--email-secondary) !important; }
  .email-accent { color: var(--email-accent) !important; }
  .email-text { color: var(--email-text) !important; }
  
  .bg-email-primary { background-color: var(--email-primary) !important; }
  .bg-email-secondary { background-color: var(--email-secondary) !important; }
  .bg-email-accent { background-color: var(--email-accent) !important; }
  .bg-email-background { background-color: var(--email-background) !important; }
  
  .gradient-email-header { 
    background: linear-gradient(135deg, var(--email-primary), var(--brand-magenta)) !important; 
  }
  .gradient-email-button { 
    background: linear-gradient(135deg, var(--email-secondary), var(--brand-teal-dark)) !important; 
  }
  .gradient-email-accent { 
    background: linear-gradient(135deg, var(--email-accent), var(--brand-coral)) !important; 
  }
`;

export const BrandColorReference = () => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-4">Brand Color Palette</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {BRAND_COLORS.map((color) => (
            <div key={color.name} className="border rounded-lg p-4 bg-card">
              <div 
                className="w-full h-12 rounded-md mb-3 border"
                style={{ backgroundColor: color.hex }}
              />
              <h4 className="font-medium text-sm">{color.name}</h4>
              <p className="text-xs text-muted-foreground font-mono">{color.hex}</p>
              <p className="text-xs text-muted-foreground mt-1">{color.description}</p>
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-semibold mb-4">Email Gradients</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border rounded-lg p-4 bg-card">
            <div className="w-full h-12 rounded-md mb-3 bg-gradient-email-header" />
            <h4 className="font-medium text-sm">Header Gradient</h4>
            <p className="text-xs text-muted-foreground">Pink to Magenta</p>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <div className="w-full h-12 rounded-md mb-3 bg-gradient-email-button" />
            <h4 className="font-medium text-sm">Button Gradient</h4>
            <p className="text-xs text-muted-foreground">Teal Gradient</p>
          </div>
          <div className="border rounded-lg p-4 bg-card">
            <div className="w-full h-12 rounded-md mb-3 bg-gradient-email-accent" />
            <h4 className="font-medium text-sm">Accent Gradient</h4>
            <p className="text-xs text-muted-foreground">Orange to Coral</p>
          </div>
        </div>
      </div>
      
      <div className="bg-card border rounded-lg p-4">
        <h4 className="font-medium mb-2">Email CSS Template</h4>
        <p className="text-sm text-muted-foreground mb-3">
          Use this CSS in email templates to ensure brand consistency:
        </p>
        <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">
          <code>{generateEmailCSS()}</code>
        </pre>
      </div>
    </div>
  );
};