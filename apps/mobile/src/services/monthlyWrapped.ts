import { listCompletionFinishEvents } from "./yearlyGoals";
import { listUserReadingSessions } from "./readingSessions";
import { getUserLibraryBooks } from "./library";
import { finishEventsFromLibraryBooks } from "../../../../packages/utils/yearlyReadingGoal";
import {
  availableWrappedMonths,
  computeMonthlyWrapped,
  type MonthlyWrappedRecap,
} from "../../../../packages/utils/monthlyWrapped";

export async function loadMonthlyWrapped(
  userId: string,
  year: number,
  month: number
): Promise<{ recap: MonthlyWrappedRecap; months: Array<{ year: number; month: number }> }> {
  const [events, sessions, books] = await Promise.all([
    listCompletionFinishEvents(userId),
    listUserReadingSessions(userId, 2000),
    getUserLibraryBooks(userId).catch(() => []),
  ]);
  const merged = finishEventsFromLibraryBooks(
    books.map((book) => ({
      id: book.id,
      shelf_status: book.shelf_status,
      dnf: book.dnf,
      finished_at: book.finished_at,
    })),
    events
  );
  return {
    recap: computeMonthlyWrapped({ year, month, finishEvents: merged, sessions }),
    months: availableWrappedMonths(sessions, merged),
  };
}
