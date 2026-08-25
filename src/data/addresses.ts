// Shared company locations — Office (primary) then Branch (secondary)

export const ADDRESSES = {
  office: {
    label: 'Office',
    city: 'Surat',
    lines: [
      '714-716, Homeland City',
      'Nr. J. H. Ambani School',
      'Udhna Magdalla Road, Vesu',
      'Surat 395007, Gujarat, India',
    ],
    singleLine:
      '714-716, Homeland City, Nr. J. H. Ambani School, Udhna Magdalla Road, Vesu, Surat 395007, Gujarat, India',
  },
  branch: {
    label: 'Branch',
    city: 'Vadodara',
    lines: [
      'Block A-806, Navrachna Innovation Foundation',
      'Navrachna University',
      'Vadodara, Gujarat, India',
    ],
    singleLine:
      'Block A-806, Navrachna Innovation Foundation, Navrachna University, Vadodara, Gujarat, India',
  },
} as const;

export const ADDRESS_LIST = [ADDRESSES.office, ADDRESSES.branch] as const;
