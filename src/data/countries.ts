export interface Country {
  name: string;
  code: string;       // ISO 2-letter country code
  dialCode: string;   // International dialing code, e.g. +92
  flag: string;       // Country flag emoji
  placeholder: string;// Local phone format placeholder
  formatPattern?: RegExp;
  minLength: number;  // Minimum expected digits in national number
  maxLength: number;  // Maximum expected digits in national number
  example: string;    // National number example
}

/**
 * Complete, up-to-date international country calling list
 * Prioritizes requested countries and covers all world regions.
 */
export const COUNTRIES: Country[] = [
  // --- South & Central Asia ---
  {
    name: 'Pakistan',
    code: 'PK',
    dialCode: '+92',
    flag: '🇵🇰',
    placeholder: '300 1234567',
    minLength: 10,
    maxLength: 10,
    example: '300 1234567',
  },
  {
    name: 'India',
    code: 'IN',
    dialCode: '+91',
    flag: '🇮🇳',
    placeholder: '98765 43210',
    minLength: 10,
    maxLength: 10,
    example: '98765 43210',
  },
  {
    name: 'Afghanistan',
    code: 'AF',
    dialCode: '+93',
    flag: '🇦🇫',
    placeholder: '70 123 4567',
    minLength: 9,
    maxLength: 9,
    example: '70 123 4567',
  },
  {
    name: 'Bangladesh',
    code: 'BD',
    dialCode: '+880',
    flag: '🇧🇩',
    placeholder: '1712 345678',
    minLength: 10,
    maxLength: 10,
    example: '1712 345678',
  },
  {
    name: 'Sri Lanka',
    code: 'LK',
    dialCode: '+94',
    flag: '🇱🇰',
    placeholder: '77 123 4567',
    minLength: 9,
    maxLength: 9,
    example: '77 123 4567',
  },
  {
    name: 'Nepal',
    code: 'NP',
    dialCode: '+977',
    flag: '🇳🇵',
    placeholder: '984 1234567',
    minLength: 10,
    maxLength: 10,
    example: '984 1234567',
  },
  {
    name: 'Uzbekistan',
    code: 'UZ',
    dialCode: '+998',
    flag: '🇺🇿',
    placeholder: '90 123 45 67',
    minLength: 9,
    maxLength: 9,
    example: '90 123 45 67',
  },
  {
    name: 'Kazakhstan',
    code: 'KZ',
    dialCode: '+7',
    flag: '🇰🇿',
    placeholder: '701 123 4567',
    minLength: 10,
    maxLength: 10,
    example: '701 123 4567',
  },

  // --- Middle East & Gulf ---
  {
    name: 'Saudi Arabia',
    code: 'SA',
    dialCode: '+966',
    flag: '🇸🇦',
    placeholder: '50 123 4567',
    minLength: 9,
    maxLength: 9,
    example: '50 123 4567',
  },
  {
    name: 'United Arab Emirates',
    code: 'AE',
    dialCode: '+971',
    flag: '🇦🇪',
    placeholder: '50 123 4567',
    minLength: 9,
    maxLength: 9,
    example: '50 123 4567',
  },
  {
    name: 'Qatar',
    code: 'QA',
    dialCode: '+974',
    flag: '🇶🇦',
    placeholder: '3312 3456',
    minLength: 8,
    maxLength: 8,
    example: '3312 3456',
  },
  {
    name: 'Kuwait',
    code: 'KW',
    dialCode: '+965',
    flag: '🇰🇼',
    placeholder: '9123 4567',
    minLength: 8,
    maxLength: 8,
    example: '9123 4567',
  },
  {
    name: 'Bahrain',
    code: 'BH',
    dialCode: '+973',
    flag: '🇧🇭',
    placeholder: '3912 3456',
    minLength: 8,
    maxLength: 8,
    example: '3912 3456',
  },
  {
    name: 'Oman',
    code: 'OM',
    dialCode: '+968',
    flag: '🇴🇲',
    placeholder: '9123 4567',
    minLength: 8,
    maxLength: 8,
    example: '9123 4567',
  },
  {
    name: 'Jordan',
    code: 'JO',
    dialCode: '+962',
    flag: '🇯🇴',
    placeholder: '7 9123 4567',
    minLength: 9,
    maxLength: 9,
    example: '7 9123 4567',
  },
  {
    name: 'Lebanon',
    code: 'LB',
    dialCode: '+961',
    flag: '🇱🇧',
    placeholder: '70 123 456',
    minLength: 8,
    maxLength: 8,
    example: '70 123 456',
  },
  {
    name: 'Iraq',
    code: 'IQ',
    dialCode: '+964',
    flag: '🇮🇶',
    placeholder: '790 123 4567',
    minLength: 10,
    maxLength: 10,
    example: '790 123 4567',
  },
  {
    name: 'Yemen',
    code: 'YE',
    dialCode: '+967',
    flag: '🇾🇪',
    placeholder: '71 123 4567',
    minLength: 9,
    maxLength: 9,
    example: '71 123 4567',
  },
  {
    name: 'Palestine',
    code: 'PS',
    dialCode: '+970',
    flag: '🇵🇸',
    placeholder: '59 123 4567',
    minLength: 9,
    maxLength: 9,
    example: '59 123 4567',
  },
  {
    name: 'Turkey',
    code: 'TR',
    dialCode: '+90',
    flag: '🇹🇷',
    placeholder: '532 123 4567',
    minLength: 10,
    maxLength: 10,
    example: '532 123 4567',
  },
  {
    name: 'Egypt',
    code: 'EG',
    dialCode: '+20',
    flag: '🇪🇬',
    placeholder: '10 1234 5678',
    minLength: 10,
    maxLength: 10,
    example: '10 1234 5678',
  },

  // --- Western Europe & Americas ---
  {
    name: 'United States',
    code: 'US',
    dialCode: '+1',
    flag: '🇺🇸',
    placeholder: '555 123 4567',
    minLength: 10,
    maxLength: 10,
    example: '555 123 4567',
  },
  {
    name: 'United Kingdom',
    code: 'GB',
    dialCode: '+44',
    flag: '🇬🇧',
    placeholder: '7911 123456',
    minLength: 10,
    maxLength: 10,
    example: '7911 123456',
  },
  {
    name: 'Canada',
    code: 'CA',
    dialCode: '+1',
    flag: '🇨🇦',
    placeholder: '416 123 4567',
    minLength: 10,
    maxLength: 10,
    example: '416 123 4567',
  },
  {
    name: 'Germany',
    code: 'DE',
    dialCode: '+49',
    flag: '🇩🇪',
    placeholder: '151 12345678',
    minLength: 10,
    maxLength: 11,
    example: '151 12345678',
  },
  {
    name: 'France',
    code: 'FR',
    dialCode: '+33',
    flag: '🇫🇷',
    placeholder: '6 12 34 56 78',
    minLength: 9,
    maxLength: 9,
    example: '6 12 34 56 78',
  },
  {
    name: 'Italy',
    code: 'IT',
    dialCode: '+39',
    flag: '🇮🇹',
    placeholder: '320 123 4567',
    minLength: 9,
    maxLength: 10,
    example: '320 123 4567',
  },
  {
    name: 'Spain',
    code: 'ES',
    dialCode: '+34',
    flag: '🇪🇸',
    placeholder: '612 34 56 78',
    minLength: 9,
    maxLength: 9,
    example: '612 34 56 78',
  },
  {
    name: 'Netherlands',
    code: 'NL',
    dialCode: '+31',
    flag: '🇳🇱',
    placeholder: '6 12345678',
    minLength: 9,
    maxLength: 9,
    example: '6 12345678',
  },
  {
    name: 'Switzerland',
    code: 'CH',
    dialCode: '+41',
    flag: '🇨🇭',
    placeholder: '78 123 45 67',
    minLength: 9,
    maxLength: 9,
    example: '78 123 45 67',
  },
  {
    name: 'Sweden',
    code: 'SE',
    dialCode: '+46',
    flag: '🇸🇪',
    placeholder: '70 123 45 67',
    minLength: 9,
    maxLength: 9,
    example: '70 123 45 67',
  },
  {
    name: 'Norway',
    code: 'NO',
    dialCode: '+47',
    flag: '🇳🇴',
    placeholder: '412 34 567',
    minLength: 8,
    maxLength: 8,
    example: '412 34 567',
  },
  {
    name: 'Denmark',
    code: 'DK',
    dialCode: '+45',
    flag: '🇩🇰',
    placeholder: '20 12 34 56',
    minLength: 8,
    maxLength: 8,
    example: '20 12 34 56',
  },
  {
    name: 'Finland',
    code: 'FI',
    dialCode: '+358',
    flag: '🇫🇮',
    placeholder: '40 1234567',
    minLength: 9,
    maxLength: 10,
    example: '40 1234567',
  },
  {
    name: 'Belgium',
    code: 'BE',
    dialCode: '+32',
    flag: '🇧🇪',
    placeholder: '470 12 34 56',
    minLength: 9,
    maxLength: 9,
    example: '470 12 34 56',
  },
  {
    name: 'Austria',
    code: 'AT',
    dialCode: '+43',
    flag: '🇦🇹',
    placeholder: '664 1234567',
    minLength: 10,
    maxLength: 11,
    example: '664 1234567',
  },
  {
    name: 'Ireland',
    code: 'IE',
    dialCode: '+353',
    flag: '🇮🇪',
    placeholder: '85 123 4567',
    minLength: 9,
    maxLength: 9,
    example: '85 123 4567',
  },
  {
    name: 'Portugal',
    code: 'PT',
    dialCode: '+351',
    flag: '🇵🇹',
    placeholder: '912 345 678',
    minLength: 9,
    maxLength: 9,
    example: '912 345 678',
  },
  {
    name: 'Greece',
    code: 'GR',
    dialCode: '+30',
    flag: '🇬🇷',
    placeholder: '69 1234 5678',
    minLength: 10,
    maxLength: 10,
    example: '69 1234 5678',
  },
  {
    name: 'Poland',
    code: 'PL',
    dialCode: '+48',
    flag: '🇵🇱',
    placeholder: '512 345 678',
    minLength: 9,
    maxLength: 9,
    example: '512 345 678',
  },
  {
    name: 'Ukraine',
    code: 'UA',
    dialCode: '+380',
    flag: '🇺🇦',
    placeholder: '50 123 4567',
    minLength: 9,
    maxLength: 9,
    example: '50 123 4567',
  },
  {
    name: 'Russia',
    code: 'RU',
    dialCode: '+7',
    flag: '🇷🇺',
    placeholder: '912 345-67-89',
    minLength: 10,
    maxLength: 10,
    example: '912 345-67-89',
  },

  // --- Latin America ---
  {
    name: 'Brazil',
    code: 'BR',
    dialCode: '+55',
    flag: '🇧🇷',
    placeholder: '11 91234-5678',
    minLength: 10,
    maxLength: 11,
    example: '11 91234-5678',
  },
  {
    name: 'Mexico',
    code: 'MX',
    dialCode: '+52',
    flag: '🇲🇽',
    placeholder: '55 1234 5678',
    minLength: 10,
    maxLength: 10,
    example: '55 1234 5678',
  },
  {
    name: 'Argentina',
    code: 'AR',
    dialCode: '+54',
    flag: '🇦🇷',
    placeholder: '9 11 1234-5678',
    minLength: 10,
    maxLength: 11,
    example: '9 11 1234-5678',
  },
  {
    name: 'Colombia',
    code: 'CO',
    dialCode: '+57',
    flag: '🇨🇴',
    placeholder: '300 123 4567',
    minLength: 10,
    maxLength: 10,
    example: '300 123 4567',
  },
  {
    name: 'Chile',
    code: 'CL',
    dialCode: '+56',
    flag: '🇨🇱',
    placeholder: '9 1234 5678',
    minLength: 9,
    maxLength: 9,
    example: '9 1234 5678',
  },

  // --- East & Southeast Asia & Oceania ---
  {
    name: 'China',
    code: 'CN',
    dialCode: '+86',
    flag: '🇨🇳',
    placeholder: '138 1234 5678',
    minLength: 11,
    maxLength: 11,
    example: '138 1234 5678',
  },
  {
    name: 'Japan',
    code: 'JP',
    dialCode: '+81',
    flag: '🇯🇵',
    placeholder: '90 1234 5678',
    minLength: 10,
    maxLength: 10,
    example: '90 1234 5678',
  },
  {
    name: 'South Korea',
    code: 'KR',
    dialCode: '+82',
    flag: '🇰🇷',
    placeholder: '10-1234-5678',
    minLength: 9,
    maxLength: 10,
    example: '10-1234-5678',
  },
  {
    name: 'Singapore',
    code: 'SG',
    dialCode: '+65',
    flag: '🇸🇬',
    placeholder: '8123 4567',
    minLength: 8,
    maxLength: 8,
    example: '8123 4567',
  },
  {
    name: 'Malaysia',
    code: 'MY',
    dialCode: '+60',
    flag: '🇲🇾',
    placeholder: '12-345 6789',
    minLength: 9,
    maxLength: 10,
    example: '12-345 6789',
  },
  {
    name: 'Indonesia',
    code: 'ID',
    dialCode: '+62',
    flag: '🇮🇩',
    placeholder: '812-3456-7890',
    minLength: 9,
    maxLength: 12,
    example: '812-3456-7890',
  },
  {
    name: 'Philippines',
    code: 'PH',
    dialCode: '+63',
    flag: '🇵🇭',
    placeholder: '917 123 4567',
    minLength: 10,
    maxLength: 10,
    example: '917 123 4567',
  },
  {
    name: 'Thailand',
    code: 'TH',
    dialCode: '+66',
    flag: '🇹🇭',
    placeholder: '81 234 5678',
    minLength: 9,
    maxLength: 9,
    example: '81 234 5678',
  },
  {
    name: 'Vietnam',
    code: 'VN',
    dialCode: '+84',
    flag: '🇻🇳',
    placeholder: '91 234 5678',
    minLength: 9,
    maxLength: 9,
    example: '91 234 5678',
  },
  {
    name: 'Australia',
    code: 'AU',
    dialCode: '+61',
    flag: '🇦🇺',
    placeholder: '412 345 678',
    minLength: 9,
    maxLength: 9,
    example: '412 345 678',
  },
  {
    name: 'New Zealand',
    code: 'NZ',
    dialCode: '+64',
    flag: '🇳🇿',
    placeholder: '21 123 4567',
    minLength: 8,
    maxLength: 9,
    example: '21 123 4567',
  },

  // --- Africa ---
  {
    name: 'Nigeria',
    code: 'NG',
    dialCode: '+234',
    flag: '🇳🇬',
    placeholder: '803 123 4567',
    minLength: 10,
    maxLength: 10,
    example: '803 123 4567',
  },
  {
    name: 'South Africa',
    code: 'ZA',
    dialCode: '+27',
    flag: '🇿🇦',
    placeholder: '82 123 4567',
    minLength: 9,
    maxLength: 9,
    example: '82 123 4567',
  },
  {
    name: 'Kenya',
    code: 'KE',
    dialCode: '+254',
    flag: '🇰🇪',
    placeholder: '712 345678',
    minLength: 9,
    maxLength: 9,
    example: '712 345678',
  },
  {
    name: 'Ghana',
    code: 'GH',
    dialCode: '+233',
    flag: '🇬🇭',
    placeholder: '24 123 4567',
    minLength: 9,
    maxLength: 9,
    example: '24 123 4567',
  },
  {
    name: 'Morocco',
    code: 'MA',
    dialCode: '+212',
    flag: '🇲🇦',
    placeholder: '612-345678',
    minLength: 9,
    maxLength: 9,
    example: '612-345678',
  },
];

/**
 * Explicit default country: Pakistan (+92)
 */
export const DEFAULT_COUNTRY: Country = COUNTRIES[0]; // Pakistan 🇵🇰

/**
 * Priority countries featured at the top of the search dropdown
 */
export const PRIORITY_COUNTRY_CODES = [
  'PK', // Pakistan
  'SA', // Saudi Arabia
  'AE', // United Arab Emirates
  'QA', // Qatar
  'KW', // Kuwait
  'BH', // Bahrain
  'OM', // Oman
  'AF', // Afghanistan
  'BD', // Bangladesh
  'IN', // India
  'US', // United States
  'GB', // United Kingdom
];

/**
 * Cleans phone input by stripping symbols, and removes trunk prefix '0' if user typed it.
 * E.g. in Pakistan '03001234567' -> '3001234567'
 */
export function cleanPhoneNumberDigits(rawInput: string, country: Country): string {
  let digits = rawInput.replace(/\D/g, '');
  // If the user pasted a number that starts with the dial code (without plus), strip it
  const dialDigits = country.dialCode.replace(/\D/g, '');
  if (digits.startsWith(dialDigits) && digits.length > dialDigits.length + 5) {
    digits = digits.slice(dialDigits.length);
  }
  // Strip single leading 0 for countries where national numbers omit trunk prefix when dialling internationally
  if (digits.startsWith('0') && digits.length > country.minLength) {
    digits = digits.replace(/^0+/, '');
  }
  return digits;
}

/**
 * Formats digits with spaced chunks for readability based on length
 */
export function formatPhoneNumberDisplay(digits: string, country: Country): string {
  if (!digits) return '';
  if (country.code === 'PK') {
    // 300 1234567
    if (digits.length <= 3) return digits;
    return `${digits.slice(0, 3)} ${digits.slice(3, 10)}`;
  }
  if (country.code === 'SA' || country.code === 'AE' || country.code === 'AF') {
    // 50 123 4567
    if (digits.length <= 2) return digits;
    if (digits.length <= 5) return `${digits.slice(0, 2)} ${digits.slice(2)}`;
    return `${digits.slice(0, 2)} ${digits.slice(2, 5)} ${digits.slice(5, 9)}`;
  }
  if (country.code === 'IN') {
    // 98765 43210
    if (digits.length <= 5) return digits;
    return `${digits.slice(0, 5)} ${digits.slice(5, 10)}`;
  }
  if (country.code === 'US' || country.code === 'CA') {
    // 555 123 4567
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`;
  }
  if (country.code === 'GB') {
    // 7911 123456
    if (digits.length <= 4) return digits;
    return `${digits.slice(0, 4)} ${digits.slice(4, 10)}`;
  }
  // Generic grouping in chunks of 3 or 4
  if (digits.length > 7) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  } else if (digits.length > 4) {
    return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  }
  return digits;
}

export interface PhoneValidationResult {
  isValid: boolean;
  error?: string;
  cleanDigits: string;
  formattedDisplay: string;
  fullE164: string;
}

/**
 * Validates phone numbers according to the selected country's dialing format
 */
export function validatePhoneNumber(rawInput: string, country: Country): PhoneValidationResult {
  const cleanDigits = cleanPhoneNumberDigits(rawInput, country);
  const formattedDisplay = formatPhoneNumberDisplay(cleanDigits, country);
  const fullE164 = `${country.dialCode} ${cleanDigits}`;

  if (!cleanDigits) {
    return {
      isValid: false,
      error: 'Phone number is required',
      cleanDigits,
      formattedDisplay,
      fullE164,
    };
  }

  if (cleanDigits.length < country.minLength) {
    const diff = country.minLength - cleanDigits.length;
    return {
      isValid: false,
      error: `${country.name} numbers require ${country.minLength} digits (${diff} more needed, e.g. ${country.example})`,
      cleanDigits,
      formattedDisplay,
      fullE164,
    };
  }

  if (cleanDigits.length > country.maxLength) {
    const excess = cleanDigits.length - country.maxLength;
    return {
      isValid: false,
      error: `Too many digits for ${country.name} (${excess} extra, expected ${country.maxLength})`,
      cleanDigits,
      formattedDisplay,
      fullE164,
    };
  }

  return {
    isValid: true,
    cleanDigits,
    formattedDisplay,
    fullE164,
  };
}
