import type { RuleReference, RuleSet } from '@/types';

export const mockRules: RuleReference[] = [
  {
    id: 'rule-001',
    title: 'Mandatory Declaration of MRP',
    category: 'Price Declaration',
    version: '2026.1',
    description: 'Every package shall bear the retail sale price (MRP) inclusive of all taxes.',
    section: 'Rule 6(1)(d)',
  },
  {
    id: 'rule-002',
    title: 'Net Quantity Declaration',
    category: 'Quantity',
    version: '2026.1',
    description: 'The net quantity by weight, measure or number shall be declared on the package.',
    section: 'Rule 6(1)(c)',
  },
  {
    id: 'rule-003',
    title: 'Manufacturer Name & Address',
    category: 'Origin Info',
    version: '2026.1',
    description: 'The name and address of the manufacturer, or where the manufacturer is not the packer, the name and address of the manufacturer and packer.',
    section: 'Rule 6(1)(a)',
  },
  {
    id: 'rule-004',
    title: 'Consumer Care Details',
    category: 'Contact Info',
    version: '2026.1',
    description: 'The name, address, telephone number, and email address of the person who can be or the office which can be contacted, in case of consumer complaints.',
    section: 'Rule 6(1)(e)',
  },
  {
    id: 'rule-005',
    title: 'Country of Origin',
    category: 'Origin Info',
    version: '2026.1',
    description: 'Name of the country of origin or manufacture or assembly in case of imported products.',
    section: 'Rule 6(1)(f)',
  },
  {
    id: 'rule-006',
    title: 'Date of Manufacture/Expiry',
    category: 'Date Info',
    version: '2026.1',
    description: 'The month and year in which the commodity is manufactured or pre-packed or imported.',
    section: 'Rule 6(1)(d)',
  },
  {
    id: 'rule-007',
    title: 'Product Identity',
    category: 'Identity',
    version: '2026.1',
    description: 'The common or generic names of the commodity contained in the package.',
    section: 'Rule 6(1)(b)',
  },
  {
    id: 'rule-008',
    title: 'Font Size Requirements',
    category: 'Display',
    version: '2026.1',
    description: 'The height of any numeral in the declaration shall not be less than specified based on net quantity.',
    section: 'Rule 7(1)',
  },
  {
    id: 'rule-009',
    title: 'Readability Requirements',
    category: 'Display',
    version: '2026.1',
    description: 'Every declaration shall be legible and prominent.',
    section: 'Rule 9(1)',
  },
  {
    id: 'rule-010',
    title: 'Placement Requirements',
    category: 'Display',
    version: '2026.1',
    description: 'Declarations shall appear on the principal display panel.',
    section: 'Rule 8(1)',
  },
  {
    id: 'rule-011',
    title: 'Language Requirements',
    category: 'General',
    version: '2026.1',
    description: 'The declarations shall be in Hindi in Devanagari script or in English.',
    section: 'Rule 9(3)',
  }
];

export const mockRuleSet: RuleSet = {
  version: '2026.1',
  status: 'ACTIVE',
  effectiveDate: '2026-01-01',
  rules: mockRules,
};

export function getRuleById(id: string): RuleReference | undefined {
  return mockRules.find(r => r.id === id);
}
