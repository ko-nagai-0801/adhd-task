/* app/(routes)/history/page.tsx */
import HistoryList from "@/components/HistoryList";
import DataManager from "@/components/DataManager";
import ArchivedList from "@/components/ArchivedList";

export default function HistoryPage() {
  return (
    <div className="flex flex-col gap-6">
      <HistoryList />
      <DataManager />
      <ArchivedList />
    </div>
  );
}
