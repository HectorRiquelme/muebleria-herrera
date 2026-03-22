declare module 'bwip-js' {
	interface BwipOptions {
		bcid: string;
		text: string;
		scale?: number;
		height?: number;
		includetext?: boolean;
		textxalign?: string;
	}
	export function toCanvas(canvas: HTMLCanvasElement, options: BwipOptions): Promise<void>;
}
