export interface IImageResponse {
    data: Uint8Array;
    contentType: string;
}
export interface IResizeImageData {
    image: IImageResponse;
}
export interface IResizedImage {
    type: string;
    image: Uint8Array|Buffer;
}