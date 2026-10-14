import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Search, Phone, Check, Globe } from 'lucide-react';

export interface CountryCode {
  name: string;
  code: string;
  dialCode: string;
  flag: string;
  placeholder: string;
}

export const COUNTRIES: CountryCode[] = [
  // Frequently selected / Popular countries first
  { name: 'United States', code: 'US', dialCode: '+1', flag: '🇺🇸', placeholder: '(555) 019-2834' },
  { name: 'India', code: 'IN', dialCode: '+91', flag: '🇮🇳', placeholder: '98765 43210' },
  { name: 'United Kingdom', code: 'GB', dialCode: '+44', flag: '🇬🇧', placeholder: '7911 123456' },
  { name: 'Canada', code: 'CA', dialCode: '+1', flag: '🇨🇦', placeholder: '(555) 019-2834' },
  { name: 'Australia', code: 'AU', dialCode: '+61', flag: '🇦🇺', placeholder: '412 345 678' },
  { name: 'Germany', code: 'DE', dialCode: '+49', flag: '🇩🇪', placeholder: '1512 3456789' },
  { name: 'United Arab Emirates', code: 'AE', dialCode: '+971', flag: '🇦🇪', placeholder: '50 123 4567' },
  { name: 'Singapore', code: 'SG', dialCode: '+65', flag: '🇸🇬', placeholder: '8123 4567' },

  // Alphabetical worldwide coverage
  { name: 'Afghanistan', code: 'AF', dialCode: '+93', flag: '🇦🇫', placeholder: '70 123 4567' },
  { name: 'Albania', code: 'AL', dialCode: '+355', flag: '🇦🇱', placeholder: '67 123 4567' },
  { name: 'Algeria', code: 'DZ', dialCode: '+213', flag: '🇩🇿', placeholder: '551 23 45 67' },
  { name: 'Andorra', code: 'AD', dialCode: '+376', flag: '🇦🇩', placeholder: '312 345' },
  { name: 'Angola', code: 'AO', dialCode: '+244', flag: '🇦🇴', placeholder: '923 456 789' },
  { name: 'Argentina', code: 'AR', dialCode: '+54', flag: '🇦🇷', placeholder: '9 11 1234-5678' },
  { name: 'Armenia', code: 'AM', dialCode: '+374', flag: '🇦🇲', placeholder: '77 123456' },
  { name: 'Austria', code: 'AT', dialCode: '+43', flag: '🇦🇹', placeholder: '664 1234567' },
  { name: 'Azerbaijan', code: 'AZ', dialCode: '+994', flag: '🇦🇿', placeholder: '50 123 45 67' },
  { name: 'Bahamas', code: 'BS', dialCode: '+1', flag: '🇧🇸', placeholder: '(242) 345-6789' },
  { name: 'Bahrain', code: 'BH', dialCode: '+973', flag: '🇧🇭', placeholder: '3600 1234' },
  { name: 'Bangladesh', code: 'BD', dialCode: '+880', flag: '🇧🇩', placeholder: '1712-345678' },
  { name: 'Barbados', code: 'BB', dialCode: '+1', flag: '🇧🇧', placeholder: '(246) 234-5678' },
  { name: 'Belarus', code: 'BY', dialCode: '+375', flag: '🇧🇾', placeholder: '29 123-45-67' },
  { name: 'Belgium', code: 'BE', dialCode: '+32', flag: '🇧🇪', placeholder: '470 12 34 56' },
  { name: 'Belize', code: 'BZ', dialCode: '+501', flag: '🇧🇿', placeholder: '622-1234' },
  { name: 'Benin', code: 'BJ', dialCode: '+229', flag: '🇧🇯', placeholder: '97 12 34 56' },
  { name: 'Bhutan', code: 'BT', dialCode: '+975', flag: '🇧🇹', placeholder: '17 123 456' },
  { name: 'Bolivia', code: 'BO', dialCode: '+591', flag: '🇧🇴', placeholder: '71234567' },
  { name: 'Bosnia and Herzegovina', code: 'BA', dialCode: '+387', flag: '🇧🇦', placeholder: '61 123 456' },
  { name: 'Botswana', code: 'BW', dialCode: '+267', flag: '🇧🇼', placeholder: '71 234 567' },
  { name: 'Brazil', code: 'BR', dialCode: '+55', flag: '🇧🇷', placeholder: '(11) 91234-5678' },
  { name: 'Brunei', code: 'BN', dialCode: '+673', flag: '🇧🇳', placeholder: '712 3456' },
  { name: 'Bulgaria', code: 'BG', dialCode: '+359', flag: '🇧🇬', placeholder: '87 123 4567' },
  { name: 'Burkina Faso', code: 'BF', dialCode: '+226', flag: '🇧🇫', placeholder: '70 12 34 56' },
  { name: 'Burundi', code: 'BI', dialCode: '+257', flag: '🇧🇮', placeholder: '79 12 34 56' },
  { name: 'Cambodia', code: 'KH', dialCode: '+855', flag: '🇰🇭', placeholder: '12 345 678' },
  { name: 'Cameroon', code: 'CM', dialCode: '+237', flag: '🇨🇲', placeholder: '6 71 23 45 67' },
  { name: 'Cape Verde', code: 'CV', dialCode: '+238', flag: '🇨🇻', placeholder: '991 23 45' },
  { name: 'Chile', code: 'CL', dialCode: '+56', flag: '🇨🇱', placeholder: '9 1234 5678' },
  { name: 'China', code: 'CN', dialCode: '+86', flag: '🇨🇳', placeholder: '138 0013 8000' },
  { name: 'Colombia', code: 'CO', dialCode: '+57', flag: '🇨🇴', placeholder: '300 123 4567' },
  { name: 'Congo', code: 'CG', dialCode: '+242', flag: '🇨🇬', placeholder: '06 123 4567' },
  { name: 'Costa Rica', code: 'CR', dialCode: '+506', flag: '🇨🇷', placeholder: '8312 3456' },
  { name: 'Croatia', code: 'HR', dialCode: '+385', flag: '🇭🇷', placeholder: '91 123 4567' },
  { name: 'Cuba', code: 'CU', dialCode: '+53', flag: '🇨🇺', placeholder: '5 234 5678' },
  { name: 'Cyprus', code: 'CY', dialCode: '+357', flag: '🇨🇾', placeholder: '96 123456' },
  { name: 'Czech Republic', code: 'CZ', dialCode: '+420', flag: '🇨🇿', placeholder: '601 123 456' },
  { name: 'Denmark', code: 'DK', dialCode: '+45', flag: '🇩🇰', placeholder: '20 12 34 56' },
  { name: 'Dominican Republic', code: 'DO', dialCode: '+1', flag: '🇩🇴', placeholder: '(809) 234-5678' },
  { name: 'Ecuador', code: 'EC', dialCode: '+593', flag: '🇪🇨', placeholder: '99 123 4567' },
  { name: 'Egypt', code: 'EG', dialCode: '+20', flag: '🇪🇬', placeholder: '100 123 4567' },
  { name: 'El Salvador', code: 'SV', dialCode: '+503', flag: '🇸🇻', placeholder: '7012 3456' },
  { name: 'Estonia', code: 'EE', dialCode: '+372', flag: '🇪🇪', placeholder: '5123 4567' },
  { name: 'Ethiopia', code: 'ET', dialCode: '+251', flag: '🇪🇹', placeholder: '91 123 4567' },
  { name: 'Fiji', code: 'FJ', dialCode: '+679', flag: '🇫🇯', placeholder: '701 2345' },
  { name: 'Finland', code: 'FI', dialCode: '+358', flag: '🇫🇮', placeholder: '40 123 4567' },
  { name: 'France', code: 'FR', dialCode: '+33', flag: '🇫🇷', placeholder: '6 12 34 56 78' },
  { name: 'Georgia', code: 'GE', dialCode: '+995', flag: '🇬🇪', placeholder: '555 12 34 56' },
  { name: 'Ghana', code: 'GH', dialCode: '+233', flag: '🇬🇭', placeholder: '24 123 4567' },
  { name: 'Greece', code: 'GR', dialCode: '+30', flag: '🇬🇷', placeholder: '691 234 5678' },
  { name: 'Guatemala', code: 'GT', dialCode: '+502', flag: '🇬🇹', placeholder: '5123 4567' },
  { name: 'Guyana', code: 'GY', dialCode: '+592', flag: '🇬🇾', placeholder: '624 1234' },
  { name: 'Haiti', code: 'HT', dialCode: '+509', flag: '🇭🇹', placeholder: '3412 3456' },
  { name: 'Honduras', code: 'HN', dialCode: '+504', flag: '🇭🇳', placeholder: '9123-4567' },
  { name: 'Hong Kong', code: 'HK', dialCode: '+852', flag: '🇭🇰', placeholder: '9123 4567' },
  { name: 'Hungary', code: 'HU', dialCode: '+36', flag: '🇭🇺', placeholder: '20 123 4567' },
  { name: 'Iceland', code: 'IS', dialCode: '+354', flag: '🇮🇸', placeholder: '611 1234' },
  { name: 'Indonesia', code: 'ID', dialCode: '+62', flag: '🇮🇩', placeholder: '812-3456-7890' },
  { name: 'Iran', code: 'IR', dialCode: '+98', flag: '🇮🇷', placeholder: '912 345 6789' },
  { name: 'Iraq', code: 'IQ', dialCode: '+964', flag: '🇮🇶', placeholder: '790 123 4567' },
  { name: 'Ireland', code: 'IE', dialCode: '+353', flag: '🇮🇪', placeholder: '85 123 4567' },
  { name: 'Israel', code: 'IL', dialCode: '+972', flag: '🇮🇱', placeholder: '50-123-4567' },
  { name: 'Italy', code: 'IT', dialCode: '+39', flag: '🇮🇹', placeholder: '312 345 6789' },
  { name: 'Jamaica', code: 'JM', dialCode: '+1', flag: '🇯🇲', placeholder: '(876) 123-4567' },
  { name: 'Japan', code: 'JP', dialCode: '+81', flag: '🇯🇵', placeholder: '90-1234-5678' },
  { name: 'Jordan', code: 'JO', dialCode: '+962', flag: '🇯🇴', placeholder: '7 9012 3456' },
  { name: 'Kazakhstan', code: 'KZ', dialCode: '+7', flag: '🇰🇿', placeholder: '701 123 4567' },
  { name: 'Kenya', code: 'KE', dialCode: '+254', flag: '🇰🇪', placeholder: '712 345678' },
  { name: 'Kuwait', code: 'KW', dialCode: '+965', flag: '🇰🇼', placeholder: '5001 2345' },
  { name: 'Kyrgyzstan', code: 'KG', dialCode: '+996', flag: '🇰🇬', placeholder: '555 123 456' },
  { name: 'Laos', code: 'LA', dialCode: '+856', flag: '🇱🇦', placeholder: '20 23 123 456' },
  { name: 'Latvia', code: 'LV', dialCode: '+371', flag: '🇱🇻', placeholder: '2123 4567' },
  { name: 'Lebanon', code: 'LB', dialCode: '+961', flag: '🇱🇧', placeholder: '70 123 456' },
  { name: 'Liberia', code: 'LR', dialCode: '+231', flag: '🇱🇷', placeholder: '77 123 456' },
  { name: 'Libya', code: 'LY', dialCode: '+218', flag: '🇱🇾', placeholder: '91 234 5678' },
  { name: 'Lithuania', code: 'LT', dialCode: '+370', flag: '🇱🇹', placeholder: '612 34567' },
  { name: 'Luxembourg', code: 'LU', dialCode: '+352', flag: '🇱🇺', placeholder: '621 123 456' },
  { name: 'Madagascar', code: 'MG', dialCode: '+261', flag: '🇲🇬', placeholder: '32 12 345 67' },
  { name: 'Malawi', code: 'MW', dialCode: '+265', flag: '🇲🇼', placeholder: '991 23 45 67' },
  { name: 'Malaysia', code: 'MY', dialCode: '+60', flag: '🇲🇾', placeholder: '12-345 6789' },
  { name: 'Maldives', code: 'MV', dialCode: '+960', flag: '🇲🇻', placeholder: '712 3456' },
  { name: 'Mali', code: 'ML', dialCode: '+223', flag: '🇲🇱', placeholder: '65 12 34 56' },
  { name: 'Malta', code: 'MT', dialCode: '+356', flag: '🇲🇹', placeholder: '9912 3456' },
  { name: 'Mauritania', code: 'MR', dialCode: '+222', flag: '🇲🇷', placeholder: '22 12 34 56' },
  { name: 'Mauritius', code: 'MU', dialCode: '+230', flag: '🇲🇺', placeholder: '5123 4567' },
  { name: 'Mexico', code: 'MX', dialCode: '+52', flag: '🇲🇽', placeholder: '55 1234 5678' },
  { name: 'Moldova', code: 'MD', dialCode: '+373', flag: '🇲🇩', placeholder: '621 12 345' },
  { name: 'Monaco', code: 'MC', dialCode: '+377', flag: '🇲🇨', placeholder: '6 12 34 56 78' },
  { name: 'Mongolia', code: 'MN', dialCode: '+976', flag: '🇲🇳', placeholder: '8812 3456' },
  { name: 'Montenegro', code: 'ME', dialCode: '+382', flag: '🇲🇪', placeholder: '67 123 456' },
  { name: 'Morocco', code: 'MA', dialCode: '+212', flag: '🇲🇦', placeholder: '612-345678' },
  { name: 'Mozambique', code: 'MZ', dialCode: '+258', flag: '🇲🇿', placeholder: '84 123 4567' },
  { name: 'Myanmar', code: 'MM', dialCode: '+95', flag: '🇲🇲', placeholder: '9 123 456 789' },
  { name: 'Namibia', code: 'NA', dialCode: '+264', flag: '🇳🇦', placeholder: '81 123 4567' },
  { name: 'Nepal', code: 'NP', dialCode: '+977', flag: '🇳🇵', placeholder: '984-1234567' },
  { name: 'Netherlands', code: 'NL', dialCode: '+31', flag: '🇳🇱', placeholder: '6 12345678' },
  { name: 'New Zealand', code: 'NZ', dialCode: '+64', flag: '🇳🇿', placeholder: '21 123 4567' },
  { name: 'Nicaragua', code: 'NI', dialCode: '+505', flag: '🇳🇮', placeholder: '8123 4567' },
  { name: 'Nigeria', code: 'NG', dialCode: '+234', flag: '🇳🇬', placeholder: '802 123 4567' },
  { name: 'North Macedonia', code: 'MK', dialCode: '+389', flag: '🇲🇰', placeholder: '70 123 456' },
  { name: 'Norway', code: 'NO', dialCode: '+47', flag: '🇳🇴', placeholder: '412 34 567' },
  { name: 'Oman', code: 'OM', dialCode: '+968', flag: '🇴🇲', placeholder: '9123 4567' },
  { name: 'Pakistan', code: 'PK', dialCode: '+92', flag: '🇵🇰', placeholder: '300 1234567' },
  { name: 'Palestine', code: 'PS', dialCode: '+970', flag: '🇵🇸', placeholder: '599 123 456' },
  { name: 'Panama', code: 'PA', dialCode: '+507', flag: '🇵🇦', placeholder: '6123-4567' },
  { name: 'Papua New Guinea', code: 'PG', dialCode: '+675', flag: '🇵🇬', placeholder: '7123 4567' },
  { name: 'Paraguay', code: 'PY', dialCode: '+595', flag: '🇵🇾', placeholder: '981 123456' },
  { name: 'Peru', code: 'PE', dialCode: '+51', flag: '🇵🇪', placeholder: '912 345 678' },
  { name: 'Philippines', code: 'PH', dialCode: '+63', flag: '🇵🇭', placeholder: '917 123 4567' },
  { name: 'Poland', code: 'PL', dialCode: '+48', flag: '🇵🇱', placeholder: '512 345 678' },
  { name: 'Portugal', code: 'PT', dialCode: '+351', flag: '🇵🇹', placeholder: '912 345 678' },
  { name: 'Qatar', code: 'QA', dialCode: '+974', flag: '🇶🇦', placeholder: '3312 3456' },
  { name: 'Romania', code: 'RO', dialCode: '+40', flag: '🇷🇴', placeholder: '712 345 678' },
  { name: 'Russia', code: 'RU', dialCode: '+7', flag: '🇷🇺', placeholder: '912 345-67-89' },
  { name: 'Rwanda', code: 'RW', dialCode: '+250', flag: '🇷🇼', placeholder: '788 123 456' },
  { name: 'Saudi Arabia', code: 'SA', dialCode: '+966', flag: '🇸🇦', placeholder: '50 123 4567' },
  { name: 'Senegal', code: 'SN', dialCode: '+221', flag: '🇸🇳', placeholder: '70 123 45 67' },
  { name: 'Serbia', code: 'RS', dialCode: '+381', flag: '🇷🇸', placeholder: '60 1234567' },
  { name: 'Sierra Leone', code: 'SL', dialCode: '+232', flag: '🇸🇱', placeholder: '76 123 456' },
  { name: 'Slovakia', code: 'SK', dialCode: '+421', flag: '🇸🇰', placeholder: '912 345 678' },
  { name: 'Slovenia', code: 'SI', dialCode: '+386', flag: '🇸🇮', placeholder: '31 123 456' },
  { name: 'Somalia', code: 'SO', dialCode: '+252', flag: '🇸🇴', placeholder: '61 123 4567' },
  { name: 'South Africa', code: 'ZA', dialCode: '+27', flag: '🇿🇦', placeholder: '82 123 4567' },
  { name: 'South Korea', code: 'KR', dialCode: '+82', flag: '🇰🇷', placeholder: '10-1234-5678' },
  { name: 'Spain', code: 'ES', dialCode: '+34', flag: '🇪🇸', placeholder: '612 34 56 78' },
  { name: 'Sri Lanka', code: 'LK', dialCode: '+94', flag: '🇱🇰', placeholder: '71 234 5678' },
  { name: 'Sudan', code: 'SD', dialCode: '+249', flag: '🇸🇩', placeholder: '91 234 5678' },
  { name: 'Sweden', code: 'SE', dialCode: '+46', flag: '🇸🇪', placeholder: '70 123 45 67' },
  { name: 'Switzerland', code: 'CH', dialCode: '+41', flag: '🇨🇭', placeholder: '78 123 45 67' },
  { name: 'Syria', code: 'SY', dialCode: '+963', flag: '🇸🇾', placeholder: '94 123 4567' },
  { name: 'Taiwan', code: 'TW', dialCode: '+886', flag: '🇹🇼', placeholder: '912 345 678' },
  { name: 'Tajikistan', code: 'TJ', dialCode: '+992', flag: '🇹🇯', placeholder: '91 123 4567' },
  { name: 'Tanzania', code: 'TZ', dialCode: '+255', flag: '🇹🇿', placeholder: '652 123 456' },
  { name: 'Thailand', code: 'TH', dialCode: '+66', flag: '🇹🇭', placeholder: '81 234 5678' },
  { name: 'Togo', code: 'TG', dialCode: '+228', flag: '🇹🇬', placeholder: '90 12 34 56' },
  { name: 'Trinidad and Tobago', code: 'TT', dialCode: '+1', flag: '🇹🇹', placeholder: '(868) 234-5678' },
  { name: 'Tunisia', code: 'TN', dialCode: '+216', flag: '🇹🇳', placeholder: '20 123 456' },
  { name: 'Turkey', code: 'TR', dialCode: '+90', flag: '🇹🇷', placeholder: '532 123 45 67' },
  { name: 'Uganda', code: 'UG', dialCode: '+256', flag: '🇺🇬', placeholder: '701 123456' },
  { name: 'Ukraine', code: 'UA', dialCode: '+380', flag: '🇺🇦', placeholder: '50 123 4567' },
  { name: 'Uruguay', code: 'UY', dialCode: '+598', flag: '🇺🇾', placeholder: '94 123 456' },
  { name: 'Uzbekistan', code: 'UZ', dialCode: '+998', flag: '🇺🇿', placeholder: '90 123 45 67' },
  { name: 'Venezuela', code: 'VE', dialCode: '+58', flag: '🇻🇪', placeholder: '412-1234567' },
  { name: 'Vietnam', code: 'VN', dialCode: '+84', flag: '🇻🇳', placeholder: '91 234 56 78' },
  { name: 'Yemen', code: 'YE', dialCode: '+967', flag: '🇾🇪', placeholder: '71 234 567' },
  { name: 'Zambia', code: 'ZM', dialCode: '+260', flag: '🇿🇲', placeholder: '97 1234567' },
  { name: 'Zimbabwe', code: 'ZW', dialCode: '+263', flag: '🇿🇼', placeholder: '71 234 5678' },
];

/** Parse combined phone string into country and national number */
export const parsePhoneNumber = (fullPhone?: string): { country: CountryCode; nationalNumber: string } => {
  if (!fullPhone || !fullPhone.trim()) {
    return { country: COUNTRIES[0], nationalNumber: '' };
  }

  const clean = fullPhone.trim();
  if (clean.startsWith('+')) {
    // Sort by dialCode length desc to match +971 before +9
    const sorted = [...COUNTRIES].sort((a, b) => b.dialCode.length - a.dialCode.length);
    for (const c of sorted) {
      if (clean.startsWith(c.dialCode)) {
        const remainder = clean.slice(c.dialCode.length).trim();
        return { country: c, nationalNumber: remainder };
      }
    }

    // Match any international dial code like +999 or +1234
    const match = clean.match(/^(\+\d{1,4})\s*(.*)$/);
    if (match) {
      return {
        country: {
          name: 'Custom International',
          code: 'INTL',
          dialCode: match[1],
          flag: '🌐',
          placeholder: 'Phone Number',
        },
        nationalNumber: match[2],
      };
    }
  }

  // Default fallback to US
  return { country: COUNTRIES[0], nationalNumber: clean };
};

export interface PhoneInputFieldProps {
  value?: string;
  onChange: (fullPhoneNumber: string) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  id?: string;
  compact?: boolean;
}

export const PhoneInputField: React.FC<PhoneInputFieldProps> = ({
  value = '',
  onChange,
  label = 'Phone Number',
  placeholder,
  disabled = false,
  required = false,
  className = '',
  id = 'phone-input',
  compact = false,
}) => {
  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(() => parsePhoneNumber(value).country);
  const [nationalNumber, setNationalNumber] = useState<string>(() => parsePhoneNumber(value).nationalNumber);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Sync state if value prop changes externally
  useEffect(() => {
    const parsed = parsePhoneNumber(value);
    const combinedCurrent = nationalNumber.trim() ? `${selectedCountry.dialCode} ${nationalNumber.trim()}` : '';
    if (value !== combinedCurrent) {
      setSelectedCountry(parsed.country);
      setNationalNumber(parsed.nationalNumber);
    }
  }, [value]);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isDropdownOpen]);

  const handleCountrySelect = (c: CountryCode) => {
    setSelectedCountry(c);
    setIsDropdownOpen(false);
    setSearchTerm('');

    const combined = nationalNumber.trim() ? `${c.dialCode} ${nationalNumber.trim()}` : '';
    onChange(combined);
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputVal = e.target.value;

    // If user pasted a full international phone number e.g. +91 98765 43210
    if (inputVal.trim().startsWith('+')) {
      const parsed = parsePhoneNumber(inputVal);
      setSelectedCountry(parsed.country);
      setNationalNumber(parsed.nationalNumber);
      const combined = parsed.nationalNumber ? `${parsed.country.dialCode} ${parsed.nationalNumber}` : '';
      onChange(combined);
      return;
    }

    // Allow digits, spaces, hyphens, and parentheses
    const sanitized = inputVal.replace(/[^\d\s\-()]/g, '');
    setNationalNumber(sanitized);

    const combined = sanitized.trim() ? `${selectedCountry.dialCode} ${sanitized.trim()}` : '';
    onChange(combined);
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text');
    if (pasted && pasted.trim().startsWith('+')) {
      e.preventDefault();
      const parsed = parsePhoneNumber(pasted);
      setSelectedCountry(parsed.country);
      setNationalNumber(parsed.nationalNumber);
      const combined = parsed.nationalNumber ? `${parsed.country.dialCode} ${parsed.nationalNumber}` : '';
      onChange(combined);
    }
  };

  // Filter countries by search term
  const q = searchTerm.toLowerCase().trim();
  const filteredCountries = COUNTRIES.filter((c) => {
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.dialCode.toLowerCase().includes(q) ||
      c.dialCode.replace('+', '').includes(q) ||
      c.code.toLowerCase().includes(q)
    );
  });

  // Check if search term could be a custom dial code
  const isCustomDialCodeSearch = q.length > 0 && /^\+?\d{1,4}$/.test(q);
  const formattedCustomDialCode = q.startsWith('+') ? q : `+${q}`;
  const alreadyInFiltered = filteredCountries.some((c) => c.dialCode === formattedCustomDialCode);

  const heightClass = compact ? 'h-9 text-xs' : 'h-11 text-xs sm:text-sm';
  const labelMargin = compact ? 'mb-1' : 'mb-1.5';

  return (
    <div className={`space-y-1 ${className}`}>
      {label && (
        <label htmlFor={id} className={`block text-xs font-semibold text-slate-700 dark:text-[#FFF5F7] ${labelMargin}`}>
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div className="relative flex items-center">
        {/* Country Code Picker Button & Trigger */}
        <div className="relative shrink-0" ref={dropdownRef}>
          <button
            type="button"
            disabled={disabled}
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className={`${heightClass} px-3 flex items-center gap-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-[#251823] dark:hover:bg-[#2c1c29] border border-r-0 border-slate-300 dark:border-[#3b2536] rounded-l-xl font-medium text-slate-800 dark:text-[#FFF5F7] transition cursor-pointer shrink-0 focus:outline-none focus:ring-1 focus:ring-pink-500`}
            title={`Selected country: ${selectedCountry.name} (${selectedCountry.dialCode})`}
            aria-haspopup="listbox"
            aria-expanded={isDropdownOpen}
          >
            <span className="text-base select-none leading-none">{selectedCountry.flag}</span>
            <span className="font-semibold text-slate-700 dark:text-[#FFF5F7] text-xs">
              {selectedCountry.dialCode}
            </span>
            <ChevronDown
              className={`w-3.5 h-3.5 text-slate-400 dark:text-pink-300/60 transition-transform duration-200 ${
                isDropdownOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Searchable Dropdown Overlay */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 mt-1.5 w-72 sm:w-80 max-h-80 bg-white dark:bg-[#251823] border border-slate-200 dark:border-[#3b2536] rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
              {/* Search header */}
              <div className="p-2.5 border-b border-slate-200 dark:border-[#3b2536] bg-slate-50/80 dark:bg-[#1e131b] flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-slate-400 dark:text-pink-300/50 shrink-0" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search country or code (+91, UK, US)..."
                  className="w-full bg-transparent text-xs text-slate-800 dark:text-[#FFF5F7] placeholder-slate-400 dark:placeholder-pink-300/40 focus:outline-none"
                />
              </div>

              {/* Country list */}
              <div className="flex-1 overflow-y-auto max-h-60 p-1 divide-y divide-slate-100 dark:divide-[#3b2536]/40">
                {/* Custom code prompt if user typed arbitrary code */}
                {isCustomDialCodeSearch && !alreadyInFiltered && (
                  <button
                    type="button"
                    onClick={() =>
                      handleCountrySelect({
                        name: `Custom Code (${formattedCustomDialCode})`,
                        code: 'CUSTOM',
                        dialCode: formattedCustomDialCode,
                        flag: '🌐',
                        placeholder: 'Phone Number',
                      })
                    }
                    className="w-full px-3 py-2 text-left flex items-center justify-between text-xs rounded-xl bg-pink-500/10 hover:bg-pink-500/20 text-pink-600 dark:text-[#F472B6] font-medium transition cursor-pointer mb-1"
                  >
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4" />
                      <span>Use country code {formattedCustomDialCode}</span>
                    </div>
                    <span className="font-semibold">{formattedCustomDialCode}</span>
                  </button>
                )}

                {filteredCountries.length > 0 ? (
                  filteredCountries.map((c) => {
                    const isSelected =
                      c.code === selectedCountry.code && c.dialCode === selectedCountry.dialCode;
                    return (
                      <button
                        key={`${c.code}-${c.dialCode}`}
                        type="button"
                        onClick={() => handleCountrySelect(c)}
                        className={`w-full px-3 py-2 text-left flex items-center justify-between text-xs rounded-xl transition cursor-pointer ${
                          isSelected
                            ? 'bg-pink-50 dark:bg-pink-950/60 text-pink-700 dark:text-[#F472B6] font-semibold'
                            : 'hover:bg-slate-100 dark:hover:bg-[#1e131b] text-slate-700 dark:text-[#FFF5F7]'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-base select-none leading-none">{c.flag}</span>
                          <span className="truncate">{c.name}</span>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider">
                            ({c.code})
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-semibold text-slate-500 dark:text-pink-300/80 text-xs">
                            {c.dialCode}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-pink-600 dark:text-[#F472B6]" />}
                        </div>
                      </button>
                    );
                  })
                ) : !isCustomDialCodeSearch ? (
                  <div className="py-6 text-center text-xs text-slate-400 dark:text-slate-500">
                    No matching country found
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </div>

        {/* National Number Input Field */}
        <div className="relative flex-1">
          <input
            id={id}
            type="tel"
            disabled={disabled}
            value={nationalNumber}
            onChange={handleNumberChange}
            onPaste={handlePaste}
            placeholder={placeholder || selectedCountry.placeholder}
            className={`w-full ${heightClass} bg-white dark:bg-[#1e131b] border border-slate-300 dark:border-[#3b2536] rounded-r-xl px-3.5 text-slate-900 dark:text-[#FFF5F7] placeholder-slate-400 dark:placeholder-pink-300/40 focus:outline-none focus:border-pink-500 focus:ring-1 focus:ring-pink-500 transition`}
          />
        </div>
      </div>
    </div>
  );
};
