interface ParsedDate {
    year: string;
    month: string;
    day: string;
}
export const parseRawBirthdayDate = (rawDate: string | null | undefined): ParsedDate | null => {
    if (!rawDate)
        return null;
    const clean = rawDate.trim().replace('TH', 'T');
    if (!clean)
        return null;
    const dateObj = new Date(clean);
    if (!isNaN(dateObj.getTime())) {
        const year = String(dateObj.getFullYear());
        const month = String(dateObj.getMonth() + 1).padStart(2, '0');
        const day = String(dateObj.getDate()).padStart(2, '0');
        return { year, month, day };
    }
    const ymdMatch = clean.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
    if (ymdMatch) {
        return {
            year: ymdMatch[1],
            month: ymdMatch[2].padStart(2, '0'),
            day: ymdMatch[3].padStart(2, '0'),
        };
    }
    const mdMatch = clean.match(/^(\d{1,2})[-/](\d{1,2})/);
    if (mdMatch) {
        const val1 = parseInt(mdMatch[1], 10);
        const val2 = parseInt(mdMatch[2], 10);
        const currentYear = String(new Date().getFullYear());
        if (val1 > 12) {
            return {
                year: currentYear,
                month: String(val2).padStart(2, '0'),
                day: String(val1).padStart(2, '0'),
            };
        }
        else {
            return {
                year: currentYear,
                month: String(val1).padStart(2, '0'),
                day: String(val2).padStart(2, '0'),
            };
        }
    }
    return null;
};
export const generatePasswordFromDate = (rawDate: string | null | undefined, format: string = 'MMDD'): string => {
    const parsed = parseRawBirthdayDate(rawDate);
    if (!parsed)
        return '';
    const { year, month, day } = parsed;
    const fmt = format.toUpperCase().trim();
    switch (fmt) {
        case 'DDMM':
            return `${day}${month}`;
        case 'YYYYMMDD':
            return `${year}${month}${day}`;
        case 'YYYY-MM-DD':
            return `${year}-${month}-${day}`;
        case 'MM-DD':
            return `${month}-${day}`;
        case 'DD-MM':
            return `${day}-${month}`;
        case 'YYYY':
            return year;
        case 'MMDD':
        default:
            return `${month}${day}`;
    }
};
export const getEffectivePassword = (config: {
    password?: string;
    birthdayDate?: Date | string | null;
    passwordFormat?: string;
}): string => {
    if (config.password && config.password.trim().length > 0) {
        return config.password.trim();
    }
    if (config.birthdayDate) {
        if (config.birthdayDate instanceof Date) {
            const year = String(config.birthdayDate.getFullYear());
            const month = String(config.birthdayDate.getMonth() + 1).padStart(2, '0');
            const day = String(config.birthdayDate.getDate()).padStart(2, '0');
            const fmt = (config.passwordFormat || 'MMDD').toUpperCase().trim();
            switch (fmt) {
                case 'DDMM': return `${day}${month}`;
                case 'YYYYMMDD': return `${year}${month}${day}`;
                case 'YYYY-MM-DD': return `${year}-${month}-${day}`;
                case 'MM-DD': return `${month}-${day}`;
                case 'DD-MM': return `${day}-${month}`;
                case 'YYYY': return year;
                case 'MMDD':
                default: return `${month}${day}`;
            }
        }
        else {
            return generatePasswordFromDate(config.birthdayDate, config.passwordFormat);
        }
    }
    const rawEnvDate = import.meta.env.VITE_BIRTHDAY_DATE;
    if (rawEnvDate) {
        return generatePasswordFromDate(rawEnvDate, config.passwordFormat);
    }
    return '';
};
export const isPasswordRequired = (config: {
    password?: string;
    passwordRequired?: boolean;
}): boolean => {
    if (config.passwordRequired !== undefined) {
        return config.passwordRequired;
    }
    return !!config.password && config.password.trim().length > 0;
};
