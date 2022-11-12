import {ExclamationTriangleIcon} from "@heroicons/react/24/outline";

export function ErrorList(props: {errors: {message: string}[]}) : React.ReactElement {
    return <>{props.errors.map(x => {
        return <div key={x.message} className={"bg-red-500/[0.1] p-2 font-normal text-sm flex items-center"}>
            <ExclamationTriangleIcon className={"w-4 h-4 text-red-500 mr-2"}/>
            {x.message}
        </div>
    })}</>
}

export function fromNow(date: string | Date, nowDate = Date.now(), rft = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" })) {
    const SECOND = 1000;
    const MINUTE = 60 * SECOND;
    const HOUR = 60 * MINUTE;
    const DAY = 24 * HOUR;
    const WEEK = 7 * DAY;
    const MONTH = 30 * DAY;
    const YEAR = 365 * DAY;
    const intervals = [
        { ge: YEAR, divisor: YEAR, unit: 'year' },
        { ge: MONTH, divisor: MONTH, unit: 'month' },
        { ge: WEEK, divisor: WEEK, unit: 'week' },
        { ge: DAY, divisor: DAY, unit: 'day' },
        { ge: HOUR, divisor: HOUR, unit: 'hour' },
        { ge: MINUTE, divisor: MINUTE, unit: 'minute' },
        { ge: 30 * SECOND, divisor: SECOND, unit: 'seconds' },
        { ge: 0, divisor: 1, text: 'just now' },
    ];
    const now = new Date().getTime();
    const diff = now - (typeof date === 'string' ? new Date(date) : date).getTime();
    const diffAbs = Math.abs(diff);
    for (const interval of intervals) {
        if (diffAbs >= interval.ge) {
            const x = Math.round(Math.abs(diff) / interval.divisor);
            const isFuture = diff < 0;
            // @ts-ignore
            return interval.unit ? rft.format(isFuture ? x : -x, interval.unit) : interval.text;
        }
    }
}