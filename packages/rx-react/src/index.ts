/**
 * @since 1.0.0
 */
import * as Registry from "@effect-rx/rx/Registry"
import type * as Rx from "@effect-rx/rx/Rx"
import * as React from "react"

export * as Registry from "@effect-rx/rx/Registry"
export * as Result from "@effect-rx/rx/Result"
export * as Rx from "@effect-rx/rx/Rx"

/**
 * @since 1.0.0
 * @category context
 */
export const RegistryContext = React.createContext<Registry.Registry>(Registry.make())

interface RxStore<A> {
  readonly rx: Rx.Rx<A>
  readonly registry: Registry.Registry
  readonly subscribe: (f: () => void) => () => void
  readonly snapshot: () => A
}

function makeStore<A>(registry: Registry.Registry, rx: Rx.Rx<A>): RxStore<A> {
  let getter = function() {
    return registry.get(rx)
  }
  function subscribe(f: () => void): () => void {
    const [get, unmount] = registry.subscribeGetter(rx, f)
    getter = get
    return unmount
  }
  function snapshot() {
    return getter()
  }
  return { rx, registry, subscribe, snapshot }
}

/**
 * @since 1.0.0
 * @category hooks
 */
export const useRxValue = <A>(rx: Rx.Rx<A>): A => {
  const registry = React.useContext(RegistryContext)
  const store = React.useRef<RxStore<A>>(undefined as any)
  if (store.current?.rx !== rx || store.current?.registry !== registry) {
    store.current = makeStore(registry, rx)
  }
  return React.useSyncExternalStore(store.current.subscribe, store.current.snapshot)
}

/**
 * @since 1.0.0
 * @category hooks
 */
export const useSetRx = <R, W>(rx: Rx.Writeable<R, W>): (_: W | ((_: R) => W)) => void => {
  const registry = React.useContext(RegistryContext)
  return React.useCallback((value) => {
    if (typeof value === "function") {
      registry.set(rx, (value as any)(registry.get(rx)))
      return
    } else {
      registry.set(rx, value)
    }
  }, [registry, rx])
}

/**
 * @since 1.0.0
 * @category hooks
 */
export const useRefreshRx = <A>(rx: Rx.Rx<A> & Rx.Refreshable): () => void => {
  const registry = React.useContext(RegistryContext)
  return React.useCallback(() => {
    registry.refresh(rx)
  }, [registry, rx])
}

/**
 * @since 1.0.0
 * @category hooks
 */
export const useRx = <R, W>(rx: Rx.Writeable<R, W>): readonly [value: R, setOrUpdate: (_: W | ((_: R) => W)) => void] =>
  [
    useRxValue(rx),
    useSetRx(rx)
  ] as const
