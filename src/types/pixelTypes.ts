import { ColorSystem, MappedPixel } from "@/utils/pixelation";

export interface PixelData{
    mappedData: MappedPixel[][] | null;
    // 像素数据的宽度
    width: number | null;
    // 像素数据的高度
    height: number | null;
    // 色号系统
    colorSystem: ColorSystem;
}