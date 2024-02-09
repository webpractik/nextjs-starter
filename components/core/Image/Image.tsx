import Image, { ImageProps } from 'next/image';
import { CSSProperties } from 'react';

type BasicImageProps = ImageProps & {
    aspectRatio?: CSSProperties['aspectRatio'];
};

export function BasicImage({ className, src, alt, aspectRatio, ...props }: BasicImageProps) {
    return <Image {...props} src={src} alt={alt} className={className} style={{ aspectRatio }} />;
}
