import type { ComponentProps } from 'react'

export default function Image({
    alt,
    blurDataURL: _blurDataURL,
    fill: _fill,
    onError: _onError,
    onLoad: _onLoad,
    placeholder: _placeholder,
    priority: _priority,
    quality: _quality,
    sizes: _sizes,
    src,
    ...props
}: ComponentProps<'img'> & {
    blurDataURL?: string
    fill?: boolean
    placeholder?: string
    priority?: boolean
    quality?: number
    sizes?: string
}) {
    // eslint-disable-next-line next/no-img-element
    return <img src={src} alt={alt} {...props} />
}
