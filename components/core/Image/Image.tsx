import Image, { ImageProps } from 'next/image';

export function BasicImage({ className, src, alt, ...props }: ImageProps) {
    return <Image {...props} src={src} alt={alt} className={className} />;
}
