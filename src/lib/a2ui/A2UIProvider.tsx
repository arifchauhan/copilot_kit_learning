"use client";

import { basicCatalog, ThemeProvider } from "@copilotkit/a2ui-renderer";
import { MessageProcessor } from "@a2ui/web_core/v0_9";
import {
  createContext,
  useContext,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type MutableRefObject,
  type ReactNode,
  type SetStateAction,
} from "react";
import { buildProcessorCatalogs } from "./catalog-aliases";

const A2UIActionsContext = createContext<ReturnType<
  typeof createActions
> | null>(null);

const A2UIStateContext = createContext<{ version: number; error: string | null } | null>(
  null,
);

type A2UIProviderProps = {
  onAction?: (message: unknown) => void;
  theme?: unknown;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  catalog?: any;
  children: ReactNode;
};

function createActions(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  processor: MessageProcessor<any>,
  onActionRef: MutableRefObject<((message: unknown) => void) | null>,
  setError: (error: string | null) => void,
  setVersion: Dispatch<SetStateAction<number>>,
) {
  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    processMessages: (messages: any[]) => {
      try {
        processor.processMessages(messages);
      } catch (err) {
        console.warn("[A2UI] processMessages error:", err);
        setError(err instanceof Error ? err.message : String(err));
        return;
      }
      setError(null);
      setVersion((v) => v + 1);
    },
    dispatch: (message: unknown) => {
      if (onActionRef.current) onActionRef.current(message);
    },
    getSurface: (surfaceId: string) => processor.model.getSurface(surfaceId),
    clearSurfaces: () => {
      const surfaces = processor.model.surfacesMap;
      for (const [id] of surfaces) {
        processor.processMessages([
          {
            version: "v0.9",
            deleteSurface: { surfaceId: id },
          },
        ]);
      }
      setVersion((v) => v + 1);
    },
  };
}

/**
 * Drop-in replacement for @copilotkit/a2ui-renderer A2UIProvider that registers
 * alias catalog ids (e.g. model-invented `a2ui-v0.9`) alongside the app catalog.
 */
export function A2UIProvider({
  onAction,
  theme,
  catalog,
  children,
}: A2UIProviderProps) {
  const onActionRef = useRef(onAction ?? null);
  onActionRef.current = onAction ?? null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const processorRef = useRef<MessageProcessor<any> | null>(null);
  if (!processorRef.current) {
    const resolved = catalog ?? basicCatalog;
    processorRef.current = new MessageProcessor(
      buildProcessorCatalogs(resolved),
      (action) => {
        if (onActionRef.current) {
          onActionRef.current({
            userAction: {
              name: action?.name ?? "unknown",
              surfaceId: action?.surfaceId ?? "default",
              sourceComponentId: action?.sourceComponentId,
              context: action?.context,
              timestamp:
                action?.timestamp ?? new Date().toISOString(),
            },
          });
        }
      },
    );
  }

  const processor = processorRef.current!;
  const [version, setVersion] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const actionsRef = useRef<ReturnType<typeof createActions> | null>(null);
  if (!actionsRef.current) {
    actionsRef.current = createActions(
      processor,
      onActionRef,
      setError,
      setVersion,
    );
  }

  const stateValue = useMemo(() => ({ version, error }), [version, error]);

  return (
    <A2UIActionsContext.Provider value={actionsRef.current}>
      <A2UIStateContext.Provider value={stateValue}>
        <ThemeProvider theme={theme as never}>{children}</ThemeProvider>
      </A2UIStateContext.Provider>
    </A2UIActionsContext.Provider>
  );
}

export function useA2UIActions() {
  const actions = useContext(A2UIActionsContext);
  if (!actions) {
    throw new Error("useA2UIActions must be used within an A2UIProvider");
  }
  return actions;
}

export function useA2UIState() {
  const state = useContext(A2UIStateContext);
  if (!state) {
    throw new Error("useA2UIState must be used within an A2UIProvider");
  }
  return state;
}

export function useA2UIContext() {
  const actions = useA2UIActions();
  const state = useA2UIState();
  return useMemo(
    () => ({
      ...actions,
      version: state.version,
      onAction: null,
    }),
    [actions, state.version],
  );
}

export const useA2UIStore = useA2UIContext;

export function useA2UIError() {
  return useContext(A2UIStateContext)?.error ?? null;
}

export function useA2UIStoreSelector<T>(
  selector: (ctx: ReturnType<typeof useA2UIContext>) => T,
): T {
  return selector(useA2UIContext());
}
