// Service Worker for Prayer Notifications

const PRAYER_NAMES = {
    Fajr: 'الفجر',
    Dhuhr: 'الظهر',
    Asr: 'العصر',
    Maghrib: 'المغرب',
    Isha: 'العشاء'
};

let notificationTimers = [];

self.addEventListener('message', event => {
    if (event.data.type === 'SCHEDULE_NOTIFICATIONS') {
        console.log('Service Worker received prayer times:', event.data.payload);
        scheduleNextPrayerNotification(event.data.payload);
    } else if (event.data.type === 'CANCEL_NOTIFICATIONS') {
        console.log('Service Worker canceling all notifications.');
        clearAllNotifications();
    }
});

function clearAllNotifications() {
    notificationTimers.forEach(timerId => clearTimeout(timerId));
    notificationTimers = [];
}

function scheduleNextPrayerNotification(prayerTimes) {
    clearAllNotifications();

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    let nextPrayerInfo = null;

    // Find the next prayer for today
    for (const prayer in PRAYER_NAMES) {
        const prayerTimeStr = prayerTimes[prayer];
        if (!prayerTimeStr) continue;

        const prayerDateTime = new Date(`${todayStr}T${prayerTimeStr}:00`);
        
        if (prayerDateTime > now) {
            nextPrayerInfo = {
                name: PRAYER_NAMES[prayer],
                time: prayerDateTime
            };
            break;
        }
    }

    // If all prayers for today have passed, schedule tomorrow's Fajr
    if (!nextPrayerInfo) {
        const fajrTimeStr = prayerTimes['Fajr'];
        if (fajrTimeStr) {
            const tomorrow = new Date(now);
            tomorrow.setDate(now.getDate() + 1);
            const tomorrowStr = tomorrow.toISOString().split('T')[0];
            
            nextPrayerInfo = {
                name: PRAYER_NAMES['Fajr'],
                time: new Date(`${tomorrowStr}T${fajrTimeStr}:00`)
            };
        }
    }

    if (nextPrayerInfo) {
        const delay = nextPrayerInfo.time.getTime() - now.getTime();
        
        if (delay > 0) {
            console.log(`Scheduling notification for ${nextPrayerInfo.name} in ${delay / 1000 / 60} minutes.`);
            
            const timerId = setTimeout(() => {
                self.registration.showNotification('حان الآن وقت صلاة', {
                    body: `صلاة ${nextPrayerInfo.name}`,
                    icon: 'logoa.png', // Make sure this icon exists
                    dir: 'rtl',
                    vibrate: [100, 50, 100]
                });
                
                // After showing notification, reschedule for the next one
                scheduleNextPrayerNotification(prayerTimes);

            }, delay);
            notificationTimers.push(timerId);
        }
    }
}
