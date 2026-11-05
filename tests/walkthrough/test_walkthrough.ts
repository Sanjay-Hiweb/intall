/**
 * TypeScript Acceptance Tests Specification (W1 - W10)
 */

import { RoomGraph } from '../../src/walkthrough/graph';
import { CollisionSystem } from '../../src/walkthrough/collision';
import { StairsController } from '../../src/walkthrough/stairs';
import { AutoWalkController } from '../../src/walkthrough/autowalk';
import { GuidedTourController } from '../../src/walkthrough/tour';
import { SettingsManager } from '../../src/walkthrough/settings';

export interface TestReport {
  suite: string;
  passed: number;
  failed: number;
  results: Array<{ testId: string; description: string; status: 'PASS' | 'FAIL' }>;
}
