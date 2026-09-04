/**
 * @file src/utils/invoiceUtils.ts
 * @description Utility functions for Bangla numeral translation and document
 *   formatting helpers shared by the KISHOLOY Document & Print Engine.
 * @license Apache-2.0
 */

/**
 * Converts English digits to Bengali digits (e.g. 1234 -> ১২৩৪)
 */
export function toBanglaDigits(val: number | string): string {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(val).replace(/[0-9]/g, (w) => bnDigits[+w]);
}
