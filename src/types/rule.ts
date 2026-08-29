export interface RuleReference {
  id: string;
  title: string;
  category: string;
  version: string;
  description: string;
  section?: string;
}

export interface RuleSet {
  version: string;
  status: 'ACTIVE' | 'DRAFT' | 'DEPRECATED';
  effectiveDate: string;
  rules: RuleReference[];
}
