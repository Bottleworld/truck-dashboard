import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function getNYToday() {
  const now = new Date();
  const nyString = now.toLocaleString("en-US", {
    timeZone: "America/New_York",
  });

  const nyDate = new Date(nyString);
  nyDate.setHours(0, 0, 0, 0);
  return nyDate;
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMonday(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function getWeekInfo() {
  const today = getNYToday();
  const monday = getMonday(today);

  const days = [
    { name: "Monday", short: "Mon", offset: 0 },
    { name: "Tuesday", short: "Tue", offset: 1 },
    { name: "Wednesday", short: "Wed", offset: 2 },
    { name: "Thursday", short: "Thu", offset: 3 },
    { name: "Friday", short: "Fri", offset: 4 },
    { name: "Saturday", short: "Sat", offset: 5 },
  ];

  const dayDates = days.map((day) => {
    const date = new Date(monday);
    date.setDate(monday.getDate() + day.offset);

    return {
      ...day,
      date: formatDate(date),
    };
  });

  return {
    weekStart: dayDates[0].date,
    weekEnd: dayDates[5].date,
    dayDates,
  };
}

function getStaffPasscode() {
  return process.env.STAFF_EDIT_PASSCODE || "0909";
}

export async function GET() {
  try {
    const { weekStart, weekEnd, dayDates } = getWeekInfo();

    const { data: workers, error: workersError } = await supabaseAdmin
      .from("workers")
      .select("*")
      .order("created_at", { ascending: true });

    if (workersError) {
      return NextResponse.json({ error: workersError.message }, { status: 500 });
    }

    const { data: entries, error: entriesError } = await supabaseAdmin
      .from("worker_bag_entries")
      .select("*")
      .gte("work_date", weekStart)
      .lte("work_date", weekEnd);

    if (entriesError) {
      return NextResponse.json({ error: entriesError.message }, { status: 500 });
    }

    const rows = (workers || []).map((worker) => {
      const totals: Record<string, number> = {};

      dayDates.forEach((day) => {
        const dayTotal = (entries || [])
          .filter(
            (entry) =>
              entry.worker_id === worker.id && entry.work_date === day.date
          )
          .reduce((sum, entry) => sum + Number(entry.bag_count || 0), 0);

        totals[day.name] = dayTotal;
      });

      const total = dayDates.reduce(
        (sum, day) => sum + Number(totals[day.name] || 0),
        0
      );

      return {
        worker_id: worker.id,
        name: worker.name,
        active: worker.active,
        totals,
        total,
      };
    });

    return NextResponse.json({
      weekStart,
      weekEnd,
      dayDates,
      rows,
    });
  } catch (error: any) {
    console.error("WORKERS WEEKLY GET ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { password, workerId, workDate, dayName, bagCount, managerName } =
      await req.json();

    if (password !== getStaffPasscode()) {
      return NextResponse.json({ error: "Wrong password" }, { status: 401 });
    }

    if (!workerId || !workDate || !dayName) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    const count = Number(bagCount || 0);

    const { error: deleteError } = await supabaseAdmin
      .from("worker_bag_entries")
      .delete()
      .eq("worker_id", workerId)
      .eq("work_date", workDate);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    if (count > 0) {
      const { error: insertError } = await supabaseAdmin
        .from("worker_bag_entries")
        .insert([
          {
            worker_id: workerId,
            work_date: workDate,
            day_name: dayName,
            bag_count: count,
            edited_by: managerName || "Admin",
          },
        ]);

      if (insertError) {
        return NextResponse.json(
          { error: insertError.message },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("WORKERS WEEKLY POST ERROR:", error);
    return NextResponse.json(
      { error: error.message || "Server error" },
      { status: 500 }
    );
  }
}