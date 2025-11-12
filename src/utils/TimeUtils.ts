import { BaseInteraction } from "discord.js";
import { LOG_LEVEL, log } from './LogUtils';

export class TimeUtils {

    public static readonly TEN_MINUTES = 10 * 60 * 1000;
    public static readonly ONE_HOUR = 60 * 60 * 1000;
    public static readonly EIGHT_HOURS = 8 * TimeUtils.ONE_HOUR;
    public static readonly FIVE_MINUTES = 5 * 60 * 1000;
    public static readonly TWELVE_HOURS = 12 * TimeUtils.ONE_HOUR;
    public static readonly TWENTY_FOUR_HOURS = 2 * TimeUtils.TWELVE_HOURS;
    public static readonly TWO_DAYS = 2 * TimeUtils.TWENTY_FOUR_HOURS;
    public static readonly FOUR_DAYS = 2 * TimeUtils.TWO_DAYS;
    public static readonly ONE_WEEK = 7 * TimeUtils.TWENTY_FOUR_HOURS;
    public static readonly ONE_MONTH = 30 * 24 * 60 * 60 * 1000;

    /**
     * Schedules a task to run hourly, starting at a specific time.
     *
     * @param task - The asynchronous task to be executed every hour.
     * @param repeatTime - The interval in milliseconds between executions after the first run
     * @param hour - The hour of day to start (0-23)
     * @param minute - The minute of hour to start (0-59)
     */
    public static scheduleHourlyTask(
        task: () => Promise<void>,
        repeatTime: number,
        hour: number = 0,
        minute: number = 0
    ) {
        const wrappedTask = async () => {
            log(`Executing scheduled task "${task.name}"`, LOG_LEVEL.SCHEDULED);
            await task();
            log(`Scheduled task "${task.name}" executed and will repeat in ${this.returnHoursMinutesSecondsFromMilliseconds(repeatTime)}`, LOG_LEVEL.SCHEDULED);
        };

        // Run immediately if no specific time is set
        if (hour === 0 && minute === 0) {
            log(`Scheduling task "${task.name}" to run immediately and repeat each ${this.returnHoursMinutesSecondsFromMilliseconds(repeatTime)}`, LOG_LEVEL.SCHEDULED);
            wrappedTask();
            setInterval(wrappedTask, repeatTime);
            return;
        }

        const now = new Date();
        const nextRun = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            hour,
            minute,
            0,
            0
        );

        // If the time has passed for today, schedule for tomorrow
        if (nextRun.getTime() < now.getTime()) {
            nextRun.setDate(nextRun.getDate() + 1);
        }

        const initialDelay = nextRun.getTime() - now.getTime();

        log(`Scheduling task "${task.name}" will be called at ${nextRun.toLocaleTimeString()} and will repeat each ${this.returnHoursMinutesSecondsFromMilliseconds(repeatTime)}`, LOG_LEVEL.SCHEDULED);

        setTimeout(() => {
            wrappedTask();
            setInterval(wrappedTask, repeatTime);
        }, initialDelay);
    }

    static scheduleDailyTask(HOUR: number, MINUTE: number, task: () => void) {
        const now = new Date();
        const nextRun = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate(),
            HOUR,
            MINUTE,
            0,
            0
        );

        // If the time has passed for today, schedule for tomorrow
        if (nextRun.getTime() < now.getTime()) {
            nextRun.setDate(nextRun.getDate() + 1);
        }

        const initialDelay = nextRun.getTime() - now.getTime();

        log(`Scheduling daily task to run at ${nextRun.toLocaleTimeString()}`, LOG_LEVEL.SCHEDULED);

        setTimeout(() => {
            task();
            setInterval(task, TimeUtils.TWENTY_FOUR_HOURS); // Repeat every day
        }, initialDelay);
    }

    static scheduleWeeklyTask(ADMIN_REMINDER_DAY: number, ADMIN_REMINDER_HOUR: number, ADMIN_REMINDER_MINUTE: number, task: () => Promise<void>) {
        const now = new Date();
        const nextRun = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() + ((ADMIN_REMINDER_DAY - now.getDay() + 7) % 7),
            ADMIN_REMINDER_HOUR,
            ADMIN_REMINDER_MINUTE,
            0,
            0
        );

        // If the time has passed for today, schedule for next week
        if (nextRun.getTime() < now.getTime()) {
            nextRun.setDate(nextRun.getDate() + 7);
        }

        const initialDelay = nextRun.getTime() - now.getTime();

        log(`Scheduling weekly task to run at ${nextRun.toLocaleTimeString()} on day ${DAYS_OF_WEEK[ADMIN_REMINDER_DAY - 1]} (In ${TimeUtils.returnHoursMinutesSecondsFromMilliseconds(initialDelay)})`, LOG_LEVEL.SCHEDULED);

        setTimeout(async () => {
            await task();
            setInterval(task, TimeUtils.ONE_WEEK); // Repeat every week
        }, initialDelay);
    }

    public static scheduleTask(task: (arg?: any) => void, delay: number, arg?: any) {
        setTimeout(() => {
            try {
                log(`Executing scheduled task that was called ${TimeUtils.returnHoursMinutesSecondsFromMilliseconds(delay)} ago`, LOG_LEVEL.SCHEDULED);
                task(arg);
            } catch (error) {
                log('Error executing scheduled task:' + error, LOG_LEVEL.ERROR);
            }
        }, delay);
    }

    public static getNextWeekStartDate(): Date {
        const now = new Date();
        const nextWeekStart = new Date(now);
        nextWeekStart.setDate(now.getDate() + (7 - now.getDay())); // Set to next Sunday
        return nextWeekStart;
    }

    /**
     * Gets the date for next Monday at midnight
     * @returns Date object set to next Monday at midnight
     */
    private static getNextMonday(date: Date = new Date()): Date {
        const day = date.getDay();
        const daysUntilMonday = (8 - day) % 7 || 7;
        const nextMonday = new Date(date);
        nextMonday.setDate(date.getDate() + daysUntilMonday);
        nextMonday.setHours(0, 0, 0, 0); // Set to midnight
        return nextMonday;
    }

    // Gets the start and end dates of the next week (Monday to Sunday)
    public static getNextWeekInterval(): { nextMonday: Date, nextSunday: Date } {
        const nextMonday = this.getNextMonday();
        const nextSunday = new Date(nextMonday);
        nextSunday.setDate(nextMonday.getDate() + 6);
        nextSunday.setHours(23, 59, 59, 999); // Set to end of Sunday
        return {
            nextMonday: nextMonday,
            nextSunday: nextSunday
        };
    }

    public static returnHoursMinutesSecondsFromMilliseconds(milliseconds: number): string {
        const hours = Math.floor(milliseconds / (1000 * 60 * 60));
        const minutes = Math.floor((milliseconds % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((milliseconds % (1000 * 60)) / 1000);

        const parts = [];
        if (hours > 0) parts.push(`${hours}h`);
        if (minutes > 0) parts.push(`${minutes}m`);
        if (seconds > 0) parts.push(`${seconds}s`);

        return !parts.length ? "now" : parts.join(' ');
    }

    public static async sleep(ms: number) {
        log(`Sleeping for ${this.returnHoursMinutesSecondsFromMilliseconds(ms)}`, LOG_LEVEL.SCHEDULED);
        return new Promise(resolve => setTimeout(resolve, ms));
    }


    public static getFormattedDate(date: Date): string {
        return date.toLocaleString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    public static async toDate(value: string | undefined | null, format: string = 'dd-MM-yyyy', interaction?: BaseInteraction): Promise<Date> {
        if (!value) {
            throw new Error('Date value cannot be empty');
        }

        // Define all supported formats
        const formats = [
            'dd-MM HH:mm',
            'yyyy-MM-dd',
            'dd/MM/yyyy',
            'MM/dd/yyyy',
            'yyyy-MM-dd HH:mm',
            'dd-MM-yyyy'
        ];

        // Try the specified format first (if it's in our supported formats)
        if (formats.includes(format)) {
            try {
                const date = this.tryParseDate(value, format);
                if (date) return date;
            } catch (error) {
                // Continue to try other formats
            }
        }

        // Try all other formats
        for (const fmt of formats) {
            if (fmt === format) continue; // Skip the format we already tried
            try {
                const date = this.tryParseDate(value, fmt);
                if (date) return date;
            } catch (error) {
                // Continue to next format
            }
        }

        // Try JavaScript's native date parsing as last resort
        const jsDate = new Date(value);
        if (!isNaN(jsDate.getTime())) {
            return jsDate;
        }

        if (interaction && interaction.isRepliable())
            await interaction.reply({ content: `Impossible de convertir la date "${value}" en format valide.`, ephemeral: true });

        throw new Error(`Failed to parse date "${value}" with format "${format}"`);
    }

    private static tryParseDate(value: string, format: string): Date | null {
        let date: Date | null = null;

        switch (format) {
            case 'dd-MM HH:mm': {
                const match = value.match(/^(\d{2})-(\d{2}) (\d{2}):(\d{2})$/);
                if (match) {
                    const [, day, month, hour, minute] = match;
                    date = new Date(new Date().getFullYear(), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
                    if (date < new Date()) {
                        date.setFullYear(date.getFullYear() + 1);
                    }
                }
                break;
            }
            case 'dd-MM-yyyy': {
                const match = value.match(/^(\d{2})-(\d{2})-(\d{4})$/);
                if (match) {
                    const [, day, month, year] = match;
                    date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                }
                break;
            }
            case 'yyyy-MM-dd': {
                const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
                if (match) {
                    const [, year, month, day] = match;
                    date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                }
                break;
            }
            case 'dd/MM/yyyy': {
                const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
                if (match) {
                    const [, day, month, year] = match;
                    date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                }
                break;
            }
            case 'MM/dd/yyyy': {
                const match = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
                if (match) {
                    const [, month, day, year] = match;
                    date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
                }
                break;
            }
            case 'yyyy-MM-dd HH:mm': {
                const match = value.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})$/);
                if (match) {
                    const [, year, month, day, hour, minute] = match;
                    date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute));
                }
                break;
            }
        }

        if (date && !isNaN(date.getTime())) {
            return date;
        }

        return null;
    }
}

const DAYS_OF_WEEK = [
    'Lundi',
    'Mardi',
    'Mercredi',
    'Jeudi',
    'Vendredi',
    'Samedi',
    'Dimanche'
];