// Barcode generation using bwip-js
// Works client-side only

export type BarcodeType = 'CODE128' | 'EAN13' | 'QR';

export async function generateBarcodeDataUrl(
	value: string,
	type: BarcodeType = 'CODE128',
	options: {
		scale?: number;
		height?: number;
		includetext?: boolean;
	} = {}
): Promise<string> {
	const bwipjs = await import('bwip-js');

	const canvas = document.createElement('canvas');

	const bcid = type === 'QR' ? 'qrcode' : type === 'EAN13' ? 'ean13' : 'code128';

	await bwipjs.toCanvas(canvas, {
		bcid,
		text: value,
		scale: options.scale ?? 3,
		height: options.height ?? 10,
		includetext: options.includetext ?? true,
		textxalign: 'center'
	});

	return canvas.toDataURL('image/png');
}

export function generateAutoBarcode(): string {
	// Generates a valid CODE128 barcode value
	const timestamp = Date.now().toString();
	const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
	return `MH${timestamp.slice(-8)}${random}`;
}

export function validateEAN13(code: string): boolean {
	if (!/^\d{13}$/.test(code)) return false;
	let sum = 0;
	for (let i = 0; i < 12; i++) {
		sum += parseInt(code[i]) * (i % 2 === 0 ? 1 : 3);
	}
	const check = (10 - (sum % 10)) % 10;
	return check === parseInt(code[12]);
}

export function downloadBarcode(dataUrl: string, filename: string): void {
	const link = document.createElement('a');
	link.href = dataUrl;
	link.download = `${filename}.png`;
	link.click();
}
