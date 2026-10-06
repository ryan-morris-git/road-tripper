import { useEffect, useId, useRef, useState } from "react";

type TokenFieldProps = {
  value: string;
  onChange: (value: string) => void;
};

export function TokenField({ value, onChange }: TokenFieldProps) {
  const tooltipId = useId();
  const inputId = useId();
  const helpRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointerDown(event: PointerEvent) {
      if (helpRef.current?.contains(event.target as Node)) {
        return;
      }
      setOpen(false);
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  return (
    <div className="token-field">
      <label className="token-label" htmlFor={inputId}>
        Mapbox token
      </label>
      <input
        id={inputId}
        className="token-input"
        type="password"
        autoComplete="off"
        spellCheck={false}
        placeholder="Paste your public Mapbox token"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <div className={open ? "token-help is-open" : "token-help"} ref={helpRef}>
        <button
          type="button"
          className="token-help-button"
          aria-label="How to get a Mapbox token"
          aria-expanded={open}
          aria-controls={tooltipId}
          onClick={() => setOpen((current) => !current)}
        >
          ?
        </button>
        <div className="token-tooltip" id={tooltipId} role="tooltip">
          <p>
            Create a free account at{" "}
            <a
              href="https://account.mapbox.com/"
              target="_blank"
              rel="noreferrer"
            >
              mapbox.com
            </a>
            , open{" "}
            <a
              href="https://account.mapbox.com/access-tokens/"
              target="_blank"
              rel="noreferrer"
            >
              Access tokens
            </a>
            , and copy a <strong>public</strong> token. It starts with{" "}
            <code>pk.</code>
          </p>
          <p>
            Paste it here. Do not use a secret token (<code>sk.</code>).
          </p>
          <p>
            In the Mapbox dashboard you can restrict that public token to your
            site URL.
          </p>
        </div>
      </div>
    </div>
  );
}
