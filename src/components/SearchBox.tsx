import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from "react";
import type { NewStop } from "../hooks/useItinerary";
import { searchPlaces } from "../lib/mapbox";
import type { MapCenter, PlaceSuggestion } from "../types";

type SearchBoxProps = {
  token: string | undefined;
  proximityRef: RefObject<MapCenter | undefined>;
  onSelect: (stop: NewStop) => void;
};

export function SearchBox({ token, proximityRef, onSelect }: SearchBoxProps) {
  const listId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [results, setResults] = useState<PlaceSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [status, setStatus] = useState<"idle" | "loading" | "empty" | "error">(
    "idle",
  );

  const canSearch = Boolean(token) && debouncedQuery.length >= 2;
  const suggestions = canSearch ? results : [];
  const visibleStatus = canSearch ? status : "idle";
  const listOpen =
    isOpen && canSearch && (suggestions.length > 0 || visibleStatus !== "idle");

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 300);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [query]);

  useEffect(() => {
    if (!token || debouncedQuery.length < 2) {
      return;
    }

    const controller = new AbortController();

    void searchPlaces(
      debouncedQuery,
      proximityRef.current,
      token,
      controller.signal,
    )
      .then((nextResults) => {
        setResults(nextResults);
        setActiveIndex(nextResults.length > 0 ? 0 : -1);
        setIsOpen(true);
        setStatus(nextResults.length === 0 ? "empty" : "idle");
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        setResults([]);
        setActiveIndex(-1);
        setIsOpen(true);
        setStatus("error");
      });

    return () => {
      controller.abort();
    };
  }, [debouncedQuery, proximityRef, token]);

  function chooseSuggestion(suggestion: PlaceSuggestion) {
    onSelect({
      name: suggestion.name,
      lng: suggestion.lng,
      lat: suggestion.lat,
    });
    setQuery("");
    setDebouncedQuery("");
    setResults([]);
    setIsOpen(false);
    setActiveIndex(-1);
    setStatus("idle");
    inputRef.current?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (!listOpen || suggestions.length === 0) {
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => (current + 1) % suggestions.length);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) =>
        current <= 0 ? suggestions.length - 1 : current - 1,
      );
      return;
    }

    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      const suggestion = suggestions[activeIndex];
      if (suggestion) {
        chooseSuggestion(suggestion);
      }
    }
  }

  const activeId = activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined;

  return (
    <div className="search-box">
      <label className="search-label" htmlFor={`${listId}-input`}>
        Add a stop
      </label>
      <input
        ref={inputRef}
        id={`${listId}-input`}
        className="search-input"
        type="search"
        role="combobox"
        autoComplete="off"
        spellCheck={false}
        placeholder={
          token ? "Search for the next stop" : "Paste a Mapbox token to search"
        }
        value={query}
        disabled={!token}
        aria-expanded={listOpen}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={activeId}
        onChange={(event) => {
          const nextQuery = event.target.value;
          setQuery(nextQuery);
          setIsOpen(true);
          setResults([]);
          setActiveIndex(-1);
          setStatus(nextQuery.trim().length >= 2 ? "loading" : "idle");
        }}
        onKeyDown={onKeyDown}
        onBlur={() => {
          window.setTimeout(() => setIsOpen(false), 120);
        }}
      />
      {listOpen ? (
        <ul className="search-results" id={listId} role="listbox">
          {visibleStatus === "loading" ? (
            <li className="search-status">Searching…</li>
          ) : null}
          {visibleStatus === "empty" ? (
            <li className="search-status">No places found</li>
          ) : null}
          {visibleStatus === "error" ? (
            <li className="search-status">Search failed. Try again.</li>
          ) : null}
          {suggestions.map((suggestion, index) => (
            <li key={suggestion.id} role="presentation">
              <button
                id={`${listId}-${index}`}
                type="button"
                role="option"
                className={
                  index === activeIndex
                    ? "search-option is-active"
                    : "search-option"
                }
                aria-selected={index === activeIndex}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => chooseSuggestion(suggestion)}
              >
                {suggestion.name}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
