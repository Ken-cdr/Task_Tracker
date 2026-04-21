// Auto-resize textarea
document.addEventListener("input", function (e) {
    if (e.target.tagName.toLowerCase() === "textarea") {
        e.target.style.height = "auto";
        e.target.style.height = e.target.scrollHeight + "px";
    }
});

// Run after page loads
document.addEventListener('DOMContentLoaded', function () {
    const taskId = typeof MODEL_TASK_ID !== "undefined" ? MODEL_TASK_ID : null; // safer fallback if you inject via script
    const tokenInput = document.querySelector('input[name="__RequestVerificationToken"]');
    const token = tokenInput ? tokenInput.value : null;

    // Add checklist item
    const addBtn = document.getElementById('addChecklistBtn');
    if (addBtn) {
        addBtn.addEventListener('click', function () {
            const input = document.getElementById('newChecklistItem');
            const description = input ? input.value.trim() : "";

            if (!description) {
                alert('Please enter a description');
                return;
            }

            const formData = new FormData();
            formData.append('taskId', taskId);
            formData.append('description', description);

            fetch('/Task/AddChecklistItem', {
                method: 'POST',
                body: formData,
                headers: {
                    'RequestVerificationToken': token
                }
            })
            .then(res => {
                if (!res.ok) throw new Error('Failed');
                location.reload();
            })
            .catch(() => alert('Error adding item'));
        });
    }

    // Toggle checklist item
    document.querySelectorAll('.checklist-toggle').forEach(cb => {
        cb.addEventListener('change', function () {
            const itemId = this.dataset.itemId;

            fetch('/Task/ToggleChecklistItem/' + itemId, {
                method: 'POST',
                headers: {
                    'RequestVerificationToken': token
                }
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) location.reload();
            })
            .catch(() => alert('Error updating item'));
        });
    });

    // Delete checklist item
    document.querySelectorAll('.btn-delete-item').forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();

            if (!confirm('Delete this item?')) return;

            const itemId = this.dataset.itemId;

            fetch('/Task/DeleteChecklistItem/' + itemId, {
                method: 'POST',
                headers: {
                    'RequestVerificationToken': token
                }
            })
            .then(res => res.json())
            .then(data => {
                if (data.success) location.reload();
            })
            .catch(() => alert('Error deleting item'));
        });
    });
});