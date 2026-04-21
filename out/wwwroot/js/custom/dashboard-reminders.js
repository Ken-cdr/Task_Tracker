document.addEventListener("DOMContentLoaded", function () {
    const panel = document.getElementById("dashboardReminderPanel");
    if (!panel) {
        return;
    }

    const snoozeStorageKey = "dashboardRemindersSnoozeUntil";
    const snoozeMinutes = 20;
    const reminders = Array.from(panel.querySelectorAll(".reminder-alert")).map((item) => ({
        kindClass: Array.from(item.classList).find((c) => c.startsWith("reminder-") && c !== "reminder-alert") || "reminder-due-soon",
        icon: item.dataset.reminderIcon || "📅",
        message: item.dataset.reminderMessage || "",
        taskId: item.dataset.reminderTaskId || ""
    }));

    addNavbarNotifications(reminders);
    setupPanelDismiss(panel, snoozeStorageKey, snoozeMinutes);
    applyPanelVisibility(panel, snoozeStorageKey);
    startPanelReopenTimer(panel, snoozeStorageKey);
});

function addNavbarNotifications(reminders) {
    const rightNav = document.querySelector(".navbar-collapse .navbar-nav:last-of-type");
    if (!rightNav || document.getElementById("navbarReminderItem")) {
        return;
    }

    const navItem = document.createElement("li");
    navItem.className = "nav-item navbar-reminder-item";
    navItem.id = "navbarReminderItem";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "navbar-reminder-button";
    button.setAttribute("aria-label", "View notifications");
    button.innerHTML = '<i class="fa-solid fa-bell" aria-hidden="true"></i>';

    const count = document.createElement("span");
    count.className = "navbar-reminder-count";
    count.textContent = String(reminders.length);
    button.appendChild(count);

    const dropdown = document.createElement("div");
    dropdown.className = "navbar-reminder-dropdown";

    if (reminders.length > 0) {
        const title = document.createElement("p");
        title.className = "navbar-reminder-dropdown-title";
        title.textContent = "Task Notifications";
        dropdown.appendChild(title);

        reminders.forEach((reminder) => {
            const entry = document.createElement("div");
            entry.className = `navbar-reminder-entry ${reminder.kindClass}`;
            entry.innerHTML = `<span>${reminder.icon}</span><span>${escapeHtml(reminder.message)}</span>`;
            dropdown.appendChild(entry);
        });
    } else {
        const empty = document.createElement("p");
        empty.className = "navbar-reminder-empty";
        empty.textContent = "No notifications right now.";
        dropdown.appendChild(empty);
    }

    navItem.appendChild(button);
    navItem.appendChild(dropdown);
    rightNav.insertBefore(navItem, rightNav.firstChild);

    button.addEventListener("click", function (event) {
        event.stopPropagation();
        navItem.classList.toggle("open");
    });

    document.addEventListener("click", function (event) {
        if (!navItem.contains(event.target)) {
            navItem.classList.remove("open");
        }
    });
}

function setupPanelDismiss(panel, storageKey, snoozeMinutes) {
    const closeButton = document.getElementById("closeReminderPanel");
    if (!closeButton) {
        return;
    }

    closeButton.addEventListener("click", function () {
        const snoozeUntil = Date.now() + snoozeMinutes * 60 * 1000;
        localStorage.setItem(storageKey, String(snoozeUntil));
        panel.classList.add("dashboard-reminder-hidden");
    });
}

function applyPanelVisibility(panel, storageKey) {
    const snoozeUntilRaw = localStorage.getItem(storageKey);
    const snoozeUntil = snoozeUntilRaw ? Number(snoozeUntilRaw) : 0;
    if (Number.isFinite(snoozeUntil) && snoozeUntil > Date.now()) {
        panel.classList.add("dashboard-reminder-hidden");
    } else {
        panel.classList.remove("dashboard-reminder-hidden");
        localStorage.removeItem(storageKey);
    }
}

function startPanelReopenTimer(panel, storageKey) {
    window.setInterval(function () {
        const snoozeUntilRaw = localStorage.getItem(storageKey);
        const snoozeUntil = snoozeUntilRaw ? Number(snoozeUntilRaw) : 0;
        if (Number.isFinite(snoozeUntil) && snoozeUntil <= Date.now()) {
            localStorage.removeItem(storageKey);
            panel.classList.remove("dashboard-reminder-hidden");
        }
    }, 30000);
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}
