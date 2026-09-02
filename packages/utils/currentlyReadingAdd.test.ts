import { describe, expect, it } from "vitest";
import {
  CURRENTLY_READING_ADD_EVENTS,
  CURRENTLY_READING_ADD_SHELF,
  HOME_OVERVIEW_CURRENTLY_READING_ORIGIN,
  currentlyReadingAddReturnHref,
  currentlyReadingAddSearchHref,
  currentlyReadingAddSearchPath,
  currentlyReadingAddSearchQuery,
  filterTbrBooksByQuery,
  isCurrentlyReadingAddFromOverview,
  selectWantToReadBooks,
} from "./currentlyReadingAdd";

describe("currentlyReadingAdd navigation", () => {
  it("detects Overview Add Book origin and preserves the destination shelf", () => {
    expect(
      isCurrentlyReadingAddFromOverview({
        origin: HOME_OVERVIEW_CURRENTLY_READING_ORIGIN,
        shelf: CURRENTLY_READING_ADD_SHELF,
      })
    ).toBe(true);
    expect(isCurrentlyReadingAddFromOverview({ origin: "library" })).toBe(false);
    expect(isCurrentlyReadingAddFromOverview({ origin: null })).toBe(false);
  });

  it("builds search URLs that keep origin context", () => {
    const query = currentlyReadingAddSearchQuery();
    expect(query).toContain(`origin=${HOME_OVERVIEW_CURRENTLY_READING_ORIGIN}`);
    expect(query).toContain(`shelf=${CURRENTLY_READING_ADD_SHELF}`);
    expect(currentlyReadingAddSearchHref()).toBe(`/search/?${query}`);
    expect(currentlyReadingAddSearchPath()).toBe(`/search?${query}`);
    expect(currentlyReadingAddReturnHref()).toBe("/reading-room/");
  });

  it("exposes product analytics event names", () => {
    expect(CURRENTLY_READING_ADD_EVENTS.opened).toBe("currently_reading_add_opened");
    expect(CURRENTLY_READING_ADD_EVENTS.fromTbr).toBe("currently_reading_add_from_tbr");
    expect(CURRENTLY_READING_ADD_EVENTS.fromSearch).toBe("currently_reading_add_from_search");
    expect(CURRENTLY_READING_ADD_EVENTS.canceled).toBe("currently_reading_add_canceled");
  });
});

describe("TBR selection helpers", () => {
  const books = [
    {
      id: "1",
      shelf_status: "want_to_read",
      books: { title: "Circe", author: "Madeline Miller" },
    },
    {
      id: "2",
      shelf_status: "currently_reading",
      books: { title: "Dune", author: "Frank Herbert" },
    },
    {
      id: "3",
      shelf_status: "want_to_read",
      books: { title: "Piranesi", author: "Susanna Clarke" },
    },
  ];

  it("selects only TBR rows", () => {
    expect(selectWantToReadBooks(books).map((book) => book.id)).toEqual(["1", "3"]);
  });

  it("filters TBR rows by title or author without mutating the source", () => {
    const tbr = selectWantToReadBooks(books);
    expect(filterTbrBooksByQuery(tbr, "pir")).toEqual([tbr[1]]);
    expect(filterTbrBooksByQuery(tbr, "miller")).toEqual([tbr[0]]);
    expect(filterTbrBooksByQuery(tbr, "")).toEqual(tbr);
    expect(tbr).toHaveLength(2);
  });
});
