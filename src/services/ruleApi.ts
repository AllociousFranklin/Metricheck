import type { RuleReference, RuleSet } from '@/types';
import { delay, USE_MOCKS } from './api';
import { mockRules, mockRuleSet, getRuleById as getMockRule } from '@/mocks/rules';

export async function getRules(): Promise<RuleReference[]> {
  if (USE_MOCKS) {
    await delay();
    return mockRules;
  }
  throw new Error('Real API not configured');
}

export async function getRule(id: string): Promise<RuleReference> {
  if (USE_MOCKS) {
    await delay();
    const rule = getMockRule(id);
    if (!rule) throw new Error(`Rule ${id} not found`);
    return rule;
  }
  throw new Error('Real API not configured');
}

export async function getRuleSet(): Promise<RuleSet> {
  if (USE_MOCKS) {
    await delay();
    return mockRuleSet;
  }
  throw new Error('Real API not configured');
}
