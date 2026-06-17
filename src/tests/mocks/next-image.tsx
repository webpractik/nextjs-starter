import type { ComponentProps } from 'react'

export default function Image({
    src,
    alt,
    fill: _fill,
    sizes: _sizes,
    priority: _priority,
    quality: _quality,
    placeholder: _placeholder,
    blurDataURL: _blurDataURL,
    onLoad: _onLoad,
    onError: _onError,
    ...props
}: ComponentProps<'img'> & {
    fill?: boolean
    sizes?: string
    priority?: boolean
    quality?: number
    placeholder?: string
    blurDataURL?: string
}) {
    // eslint-disable-next-line next/no-img-element
    return <img src={src} alt={alt} {...props} />
}
