import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';

interface LocationSelectorProps {
  location: string;
  onLocationChange: (location: string) => void;
  radius: 'city' | 'metro' | 'state';
  onRadiusChange: (radius: 'city' | 'metro' | 'state') => void;
  useNational: boolean;
  onUseNationalChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function LocationSelector({
  location,
  onLocationChange,
  radius,
  onRadiusChange,
  useNational,
  onUseNationalChange,
  disabled
}: LocationSelectorProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Search Location</Label>
        <Input
          type="text"
          value={location}
          onChange={(e) => onLocationChange(e.target.value)}
          placeholder="e.g., Los Angeles, CA"
          disabled={disabled || useNational}
          className="w-full"
        />
      </div>

      {!useNational && location && (
        <div className="space-y-2">
          <Label>Search Radius</Label>
          <RadioGroup
            value={radius}
            onValueChange={(v) => onRadiusChange(v as any)}
            disabled={disabled}
            className="flex flex-col space-y-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="city" id="city" />
              <Label htmlFor="city" className="font-normal cursor-pointer">
                City only
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="metro" id="metro" />
              <Label htmlFor="metro" className="font-normal cursor-pointer">
                Metro area (50 mile radius)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="state" id="state" />
              <Label htmlFor="state" className="font-normal cursor-pointer">
                State-wide
              </Label>
            </div>
          </RadioGroup>
        </div>
      )}

      <div className="flex items-center space-x-2 pt-2 border-t">
        <Checkbox
          id="national"
          checked={useNational}
          onCheckedChange={onUseNationalChange}
          disabled={disabled}
        />
        <Label htmlFor="national" className="font-normal cursor-pointer">
          Search nationally (no location filter)
        </Label>
      </div>
    </div>
  );
}
