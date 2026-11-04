export const todayLocal = () => new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Tunis" }).format(new Date());
