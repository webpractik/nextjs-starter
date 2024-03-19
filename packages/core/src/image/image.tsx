import NextImage, { ImageProps } from 'next/image';
import { CSSProperties } from 'react';

type BasicImageProps = ImageProps & {
    aspectRatio?: CSSProperties['aspectRatio'];
};

export function Image({ className, src, alt, aspectRatio, ...props }: BasicImageProps) {
    return (
        <NextImage {...props} src={src} alt={alt} className={className} style={{ aspectRatio }} />
    );
}
