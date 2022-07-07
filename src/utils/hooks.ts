import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react"

export function useDebounce<T>(value: T, delay?: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value)

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(value), delay || 500)

        return () => {
            clearTimeout(timer)
        }
    }, [value, delay])

    return debouncedValue
}

export function useDebounceState<T>(defaultValue: T, delay?: number): [value: T, setValue: Dispatch<SetStateAction<T>>, setValueImmediate: (value: T) => void] {

    const [state, setState] = useState<T>(defaultValue)

    const [debouncedValue, setDebouncedValue] = useState<T>(state)

    useEffect(() => {
        const timer = setTimeout(() => setDebouncedValue(state), delay || 500)

        return () => {
            clearTimeout(timer)
        }
    }, [state, delay])

    return [debouncedValue, setState, (value: T) => { setState(value); setDebouncedValue(value) }]
}

export function useDebouncedCallback<A extends any[]>(
    callback: (...args: A) => void,
    wait: number
) {
    // track args & timeout handle between calls
    const argsRef = useRef<A>();
    const timeout = useRef<ReturnType<typeof setTimeout>>();

    function cleanup() {
        if (timeout.current) {
            clearTimeout(timeout.current);
        }
    }

    // make sure our timeout gets cleared if
    // our consuming component gets unmounted
    useEffect(() => cleanup, []);

    return function debouncedCallback(
        ...args: A
    ) {
        // capture latest args
        argsRef.current = args;

        // clear debounce timer
        cleanup();

        // start waiting again
        timeout.current = setTimeout(() => {
            if (argsRef.current) {
                callback(...argsRef.current);
            }
        }, wait);
    };
}