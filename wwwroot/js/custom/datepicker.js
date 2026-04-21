// Custom date picker initialization using Flatpickr
document.addEventListener('DOMContentLoaded', function() {
    // Initialize date pickers for StartDate and Deadline fields
    const datePickerConfig = {
        enableTime: true,
        // Must match datetime-local expected value format.
        dateFormat: "Y-m-d\\TH:i",
        // Show user-friendly 12-hour value with AM/PM while submitting ISO-like datetime-local.
        altInput: true,
        altFormat: "F j, Y h:i K",
        time_24hr: false,
        clickOpens: true,
        allowInput: false,
        plugins: [new confirmDatePlugin({})]
    };

    // Apply to StartDate field if it exists
    const startDateField = document.getElementById('StartDate');
    if (startDateField) {
        flatpickr("#StartDate", datePickerConfig);
    }

    // Apply to Deadline field if it exists
    const deadlineField = document.getElementById('Deadline');
    if (deadlineField) {
        flatpickr("#Deadline", datePickerConfig);
    }
});