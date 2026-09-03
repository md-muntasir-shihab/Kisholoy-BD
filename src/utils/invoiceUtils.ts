/**
 * @file src/utils/invoiceUtils.ts
 * @description Utility functions for currency words conversion, Bangla numeral translation, and PDF invoice compilation
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Converts English digits to Bengali digits (e.g. 1234 -> ১২৩৪)
 */
export function toBanglaDigits(val: number | string): string {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(val).replace(/[0-9]/g, (w) => bnDigits[+w]);
}

/**
 * Convert number to English Words (e.g. 1250 -> One Thousand Two Hundred Fifty Taka Only)
 */
export function numberToEnglishWords(num: number): string {
  if (num === 0) return 'Zero Taka Only';

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
  ];

  function convertSection(n: number): string {
    if (n === 0) return '';
    if (n < 20) return ones[n] + ' ';
    if (n < 100) return tens[Math.floor(n / 10)] + ' ' + ones[n % 10] + ' ';
    return ones[Math.floor(n / 100)] + ' Hundred ' + convertSection(n % 100);
  }

  let words = '';
  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const remainder = Math.floor(num % 1000);

  if (crore > 0) words += convertSection(crore).trim() + ' Crore ';
  if (lakh > 0) words += convertSection(lakh).trim() + ' Lakh ';
  if (thousand > 0) words += convertSection(thousand).trim() + ' Thousand ';
  if (remainder > 0) words += convertSection(remainder).trim() + ' ';

  const paisa = Math.round((num - Math.floor(num)) * 100);
  let result = words.trim() + ' Taka';
  if (paisa > 0) {
    result += ' and ' + convertSection(paisa).trim() + ' Paisa';
  }
  return result + ' Only';
}

/**
 * Convert number to Bangla Words (e.g. 1250 -> এক হাজার দুই শত পঞ্চাশ টাকা মাত্র)
 */
export function numberToBanglaWords(num: number): string {
  if (num === 0) return 'শূন্য টাকা মাত্র';

  const bnUnits: { [key: number]: string } = {
    1: 'এক', 2: 'দুই', 3: 'তিন', 4: 'চার', 5: 'পাঁচ', 6: 'ছয়', 7: 'সাত', 8: 'আট', 9: 'নয়', 10: 'দশ',
    11: 'এগারো', 12: 'বারো', 13: 'তেরো', 14: 'চৌদ্দ', 15: 'পনেরো', 16: 'ষোলো', 17: 'সতেরো', 18: 'আঠারো', 19: 'উনিশ', 20: 'বিশ',
    21: 'একুশ', 22: 'বাইশ', 23: 'তেইশ', 24: 'চব্বিশ', 25: 'পঁচিশ', 26: 'ছাব্বিশ', 27: 'সাতাশ', 28: 'আঠাশ', 29: 'উনত্রিশ', 30: 'ত্রিশ',
    31: 'একত্রিশ', 32: 'বত্রিশ', 33: 'তেত্রিশ', 34: 'চৌত্রিশ', 35: 'পঁয়ত্রিশ', 36: 'ছত্রিশ', 37: 'সাঁইত্রিশ', 38: 'আটত্রিশ', 39: 'ঊনচল্লিশ', 40: 'চল্লিশ',
    41: 'একচল্লিশ', 42: 'বিয়াল্লিশ', 43: 'তেতাল্লিশ', 44: 'চুয়াল্লিশ', 45: 'পঁয়তাল্লিশ', 46: 'ছেচল্লিশ', 47: 'সাতচল্লিশ', 48: 'আটচল্লিশ', 49: 'ঊনপঞ্চাশ', 50: 'পঞ্চাশ',
    51: 'একান্ন', 52: 'বায়ান্ন', 53: 'তিপ্পান্ন', 54: 'চুয়ান্ন', 55: 'পঞ্চান্ন', 56: 'ছাপ্পান্ন', 57: 'সাতান্ন', 58: 'আটান্ন', 59: 'ঊনষাট', 60: 'ষাট',
    61: 'একষট্টি', 62: 'বাষট্টি', 63: 'তেষট্টি', 64: 'চৌষট্টি', 65: 'পঁয়ষট্টি', 66: 'ছেষট্টি', 67: 'সাতষট্টি', 68: 'আটষট্টি', 69: 'ঊনসত্তর', 70: 'সত্তর',
    71: 'একাত্তর', 72: 'বাহাত্তর', 73: 'তিয়াত্তর', 74: 'চৌহাত্তর', 75: 'পঁচাত্তর', 76: 'ছিয়াত্তর', 77: 'সাতাত্তর', 78: 'আটাত্তর', 79: 'ঊনআশি', 80: 'আশি',
    81: 'একাশি', 82: 'বিরাশি', 83: 'তিরাশি', 84: 'চুরাশি', 85: 'পঁচাশি', 86: 'ছিয়াশি', 87: 'সাতাশি', 88: 'অষ্টআশি', 89: 'ঊননব্বই', 90: 'নব্বই',
    91: 'একানব্বই', 92: 'বিরানব্বই', 93: 'তিরানব্বই', 94: 'চুরানব্বই', 95: 'পঁচানব্বই', 96: 'ছিয়ানব্বই', 97: 'সাতানব্বই', 98: 'আটানব্বই', 99: 'নিরানব্বই'
  };

  function convertSmall(n: number): string {
    if (n === 0) return '';
    if (n < 100) return bnUnits[n] || '';
    const h = Math.floor(n / 100);
    const rest = n % 100;
    return (bnUnits[h] ? bnUnits[h] + ' শত ' : '') + (rest > 0 ? bnUnits[rest] || '' : '');
  }

  const crore = Math.floor(num / 10000000);
  const lakh = Math.floor((num % 10000000) / 100000);
  const thousand = Math.floor((num % 100000) / 1000);
  const remainder = Math.floor(num % 1000);

  let parts: string[] = [];
  if (crore > 0) parts.push(convertSmall(crore).trim() + ' কোটি');
  if (lakh > 0) parts.push(convertSmall(lakh).trim() + ' লাখ');
  if (thousand > 0) parts.push(convertSmall(thousand).trim() + ' হাজার');
  if (remainder > 0) parts.push(convertSmall(remainder).trim());

  return parts.join(' ') + ' টাকা মাত্র';
}

/**
 * High-definition PDF generation using html2canvas and jsPDF with A4 sizing
 */
export async function generatePdfFromElement(
  element: HTMLElement,
  fileName: string,
  onProgress?: (status: string) => void
): Promise<boolean> {
  try {
    if (onProgress) onProgress('Capturing high-resolution document...');

    // Save previous scroll and positioning
    const canvas = await html2canvas(element, {
      scale: 2, // 2x scale for sharp text rendering
      useCORS: true,
      logging: false,
      backgroundColor: '#ffffff',
      windowWidth: 1024,
    });

    if (onProgress) onProgress('Compiling PDF...');

    const imgData = canvas.toDataURL('image/png', 1.0);
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imgWidth = pageWidth;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = 0;

    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
    heightLeft -= pageHeight;

    // Handle multi-page documents if height exceeds A4
    while (heightLeft > 0) {
      position = heightLeft - imgHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight, undefined, 'FAST');
      heightLeft -= pageHeight;
    }

    if (onProgress) onProgress('Saving document...');
    pdf.save(fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`);
    return true;
  } catch (err) {
    console.error('Failed to generate PDF:', err);
    return false;
  }
}
