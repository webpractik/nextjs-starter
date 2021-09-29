import { RefObject, useEffect } from 'react';

type Event = MouseEvent | TouchEvent;

const useOnClickOutside = <T extends HTMLElement = HTMLElement>(
    ref: RefObject<T>,
    handler: (event: Event) => void,
    exceptionsId: string[] = []
) => {
    useEffect(() => {
        const listener = (event: Event) => {
            const el = ref?.current;

            const containsExceptions = exceptionsId?.some(id => {
                const exceptionElement = document.querySelector(`#${id}`);
                return exceptionElement?.contains(event?.target as Node);
            });

            if (!el || el.contains((event?.target as Node) || null) || containsExceptions) {
                return;
            }

            handler(event);
        };

        document.addEventListener(`mousedown`, listener);
        document.addEventListener(`touchstart`, listener);
        return () => {
            document.removeEventListener(`mousedown`, listener);
            document.removeEventListener(`touchstart`, listener);
        };
    }, [ref, handler]);
};
export default useOnClickOutside;
