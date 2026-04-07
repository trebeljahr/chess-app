import { useEffect, useRef, useState } from "react";

export type ConnectionStatus = "connected" | "reconnecting" | "disconnected";

export function useConnectionStatus(
  lastEventTimestamp: number | undefined
): ConnectionStatus {
  const [status, setStatus] = useState<ConnectionStatus>("connected");
  const lastSeen = useRef(Date.now());

  useEffect(() => {
    if (lastEventTimestamp) {
      lastSeen.current = Date.now();
      setStatus("connected");
    }
  }, [lastEventTimestamp]);

  useEffect(() => {
    const check = () => {
      const elapsed = Date.now() - lastSeen.current;
      if (elapsed > 30_000) {
        setStatus("disconnected");
      } else if (elapsed > 15_000) {
        setStatus("reconnecting");
      }
    };

    const id = window.setInterval(check, 5_000);
    return () => window.clearInterval(id);
  }, []);

  return status;
}
