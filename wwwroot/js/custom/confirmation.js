function showConfirm(message, actionUrl, buttonClass = "btn-danger") {
    const messageEl = document.getElementById("confirmMessage");
    const confirmBtn = document.getElementById("confirmAction");
    const modalEl = document.getElementById("confirmModal");

    if (!messageEl || !confirmBtn || !modalEl) return;

    // Set message
    messageEl.textContent = message;

    // Reset button classes
    confirmBtn.className = "btn " + buttonClass;

    // Set action URL
    confirmBtn.setAttribute("href", actionUrl);

    // Show modal
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
}