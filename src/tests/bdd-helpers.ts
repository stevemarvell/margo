/**
 * BDD-style test helpers for Jest
 */

export interface BDDScenario {
  given: string;
  when: string;
  then: string;
}

export class BDDTestRunner {
  static scenario(description: string, scenario: BDDScenario, testFn: () => void | Promise<void>) {
    const fullDescription = `${description}\n  Given ${scenario.given}\n  When ${scenario.when}\n  Then ${scenario.then}`;
    
    test(fullDescription, testFn);
  }

  static feature(featureName: string, testSuite: () => void) {
    describe(`Feature: ${featureName}`, testSuite);
  }
}