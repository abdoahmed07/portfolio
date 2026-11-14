/* src/lib/streak.ts (and the date helpers it uses) from the Streak app, bundled for the browser
   with the project's own Vite. Not edited by hand: rebuild it from the source instead. */
var StreakRules = (function(exports) {
	Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
	// src/lib/dates.ts
	var pad = (n) => String(n).padStart(2, "0");
	function toUTC(day) {
		const [y, m, d] = day.split("-").map(Number);
		return Date.UTC(y, m - 1, d);
	}
	function fromUTC(ms) {
		const d = new Date(ms);
		return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
	}
	var DAY_MS = 864e5;
	function addDays(day, n) {
		return fromUTC(toUTC(day) + n * DAY_MS);
	}
	/** 0 = Monday … 6 = Sunday. */
	function weekdayMon0(day) {
		return (new Date(toUTC(day)).getUTCDay() + 6) % 7;
	}
	/** The Monday that starts the week containing `day` (weeks run Monday to Sunday). */
	function weekStart(day) {
		return addDays(day, -weekdayMon0(day));
	}
	/** 'YYYY-MM' of a day, used for per-calendar-month allowances. */
	function monthKey(day) {
		return day.slice(0, 7);
	}
	// src/lib/streak.ts
	/**
	* Streak logic. Pure: no UI, no database, no clock. Everything is derived from
	* the check-in history, the habit's settings and "today", so edits, backfills
	* and settings changes can never leave a stale number.
	*/
	/** Entries that count toward a weekly target. `rescued` is reserved for the coach feature. */
	var WEEKLY_COUNTS = /* @__PURE__ */ new Set([
		"done",
		"excused",
		"rescued"
	]);
	function weeklyTarget(rules) {
		return Math.min(7, Math.max(1, rules.weekly_target ?? 1));
	}
	/** Entries inside [start_date, today], keyed by date. Later duplicates win. */
	function indexEntries(rules, entries, today) {
		const map = /* @__PURE__ */ new Map();
		for (const e of entries) if (e.date >= rules.start_date && e.date <= today) map.set(e.date, e.status);
		return map;
	}
	/**
	* Rest entries that fit within the monthly allowance (earliest first). Rest days
	* beyond the allowance, e.g. after the allowance was lowered, count as misses.
	*/
	function validRestDays(rules, byDate) {
		const used = /* @__PURE__ */ new Map();
		const valid = /* @__PURE__ */ new Set();
		const restDates = [...byDate].filter(([, s]) => s === "rest").map(([d]) => d).sort();
		for (const d of restDates) {
			const m = monthKey(d);
			const n = used.get(m) ?? 0;
			if (n < rules.rest_days_per_month) {
				valid.add(d);
				used.set(m, n + 1);
			}
		}
		return valid;
	}
	function dailyStreaks(rules, byDate, today) {
		const rest = validRestDays(rules, byDate);
		let run = 0;
		let best = 0;
		for (let d = rules.start_date; d <= today; d = addDays(d, 1)) {
			const s = byDate.get(d);
			if (s === void 0 && d === today) break;
			if (s === "done") run += 1;
			else if (s === "excused" || s === "rescued" || s === "rest" && rest.has(d)) {} else run = 0;
			if (run > best) best = run;
		}
		return {
			current: run,
			best
		};
	}
	function weeklyStreaks(rules, byDate, today) {
		const thisMonday = weekStart(today);
		let run = 0;
		let best = 0;
		let thisWeek = {
			count: 0,
			target: weeklyTarget(rules)
		};
		for (let monday = weekStart(rules.start_date); monday <= thisMonday; monday = addDays(monday, 7)) {
			const { count, target } = weekProgress(rules, byDate, monday);
			const met = count >= target;
			if (monday === thisMonday) {
				thisWeek = {
					count,
					target
				};
				if (met) run += 1;
			} else run = met ? run + 1 : 0;
			if (run > best) best = run;
		}
		return {
			current: run,
			best,
			thisWeek
		};
	}
	/**
	* Count and target for the week starting `monday`. In the habit's first week the
	* target is capped at the days actually available, so starting on a Saturday
	* with a target of 4 is not an instant miss.
	*/
	function weekProgress(rules, byDate, monday) {
		const sunday = addDays(monday, 6);
		let count = 0;
		let available = 0;
		for (let d = monday; d <= sunday; d = addDays(d, 1)) {
			if (d < rules.start_date) continue;
			available += 1;
			const s = byDate.get(d);
			if (s && WEEKLY_COUNTS.has(s)) count += 1;
		}
		return {
			count,
			target: Math.min(weeklyTarget(rules), available)
		};
	}
	function computeStats(rules, entries, today) {
		const byDate = indexEntries(rules, entries, today);
		let totalDone = 0;
		for (const s of byDate.values()) if (s === "done") totalDone += 1;
		if (rules.start_date > today) return {
			unit: rules.schedule_type === "weekly" ? "weeks" : "days",
			current: 0,
			best: 0,
			totalDone: 0,
			thisWeek: rules.schedule_type === "weekly" ? {
				count: 0,
				target: weeklyTarget(rules)
			} : null,
			toMilestone: 66
		};
		if (rules.schedule_type === "weekly") {
			const w = weeklyStreaks(rules, byDate, today);
			return {
				unit: "weeks",
				current: w.current,
				best: w.best,
				totalDone,
				thisWeek: w.thisWeek,
				toMilestone: Math.max(0, 66 - totalDone)
			};
		}
		const d = dailyStreaks(rules, byDate, today);
		return {
			unit: "days",
			current: d.current,
			best: d.best,
			totalDone,
			thisWeek: null,
			toMilestone: Math.max(0, 66 - d.current)
		};
	}
	/**
	* How one calendar day looks for a habit: an entry's status, `missed` for a past
	* day with no entry, `open` for today without an entry, `future`, or `before`
	* the habit's start date.
	*/
	function dayState(rules, status, day, today) {
		if (day > today) return "future";
		if (day < rules.start_date) return "before";
		if (status) return status;
		return day === today ? "open" : "missed";
	}
	/** Earliest day that can still be checked in or changed. */
	function earliestEditableDay(rules, today) {
		const back = addDays(today, -7);
		return back > rules.start_date ? back : rules.start_date;
	}
	/** Days before `start_date`, future days and days past the backfill window are locked. */
	function canEditDay(rules, day, today) {
		return day <= today && day >= earliestEditableDay(rules, today);
	}
	/** Rest days still free in the calendar month containing `day`. Always 0 for weekly habits. */
	function restDaysLeft(rules, entries, day) {
		if (rules.schedule_type !== "daily") return 0;
		const m = monthKey(day);
		const used = entries.filter((e) => e.status === "rest" && monthKey(e.date) === m).length;
		return Math.max(0, rules.rest_days_per_month - used);
	}
	/** Whether `day` may be marked as a rest day (a day already marked rest stays allowed). */
	function canMarkRest(rules, entries, day) {
		if (entries.some((e) => e.date === day && e.status === "rest")) return true;
		return restDaysLeft(rules, entries, day) > 0;
	}
	exports.canEditDay = canEditDay;
	exports.canMarkRest = canMarkRest;
	exports.computeStats = computeStats;
	exports.dayState = dayState;
	exports.earliestEditableDay = earliestEditableDay;
	exports.restDaysLeft = restDaysLeft;
	return exports;
})({});
