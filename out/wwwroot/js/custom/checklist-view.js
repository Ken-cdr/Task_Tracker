// Dashboard checklist viewing functionality
document.addEventListener('DOMContentLoaded', function() {
    // Make task titles clickable to view checklist
    document.querySelectorAll('.task-title-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const taskId = this.dataset.taskId;
            const taskTitle = this.dataset.taskTitle;
            loadChecklistModal(taskId, taskTitle);
        });
    });
});

function loadChecklistModal(taskId, taskTitle) {
    const modal = document.getElementById('checklistModal');
    const modalTitle = document.getElementById('checklistModalTitle');
    const modalContent = document.getElementById('checklistModalContent');

    if (!modal) {
        console.error('Checklist modal not found');
        return;
    }

    // Set modal title
    modalTitle.textContent = taskTitle;

    // Load checklist data via AJAX
    fetch(`/Task/GetChecklistItems/${taskId}`)
        .then(response => {
            console.log('Fetch response status:', response.status);
            console.log('Fetch response URL:', response.url);
            if (!response.ok) {
                console.error('Response not ok:', response.status, response.statusText);
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            console.log('Loaded checklist data:', data);
            renderChecklistModal(data, taskId);
            modal.style.display = 'block';
        })
        .catch(error => {
            console.error('Error loading checklist:', error);
            console.error('Error details:', error.message);
            modalContent.innerHTML = '<p class="error-message">Error loading checklist items.</p>';
            modal.style.display = 'block';
        });
}

function renderChecklistModal(data, taskId) {
    const modalContent = document.getElementById('checklistModalContent');

    if (!data.items || data.items.length === 0) {
        modalContent.innerHTML = '<p class="no-items-message">No checklist items for this task</p>';
        return;
    }

    const completedCount = data.items.filter(item => item.isCompleted).length;
    const totalCount = data.items.length;
    const progressPercentage = (completedCount / totalCount) * 100;

    let html = `
        <div class="progress-container">
            <div class="progress-stats">
                <span class="progress-text">${completedCount} of ${totalCount} items completed</span>
                <span class="progress-percent">${Math.round(progressPercentage)}%</span>
            </div>
            <div class="progress-bar-wrapper">
                <div class="progress-bar" style="width: ${progressPercentage}%"></div>
            </div>
        </div>

        <div class="checklist-items">
    `;

    data.items.forEach(item => {
        html += `
            <div class="checklist-item" data-item-id="${item.id}">
                <input type="checkbox" class="checklist-toggle" data-item-id="${item.id}" data-task-id="${taskId}" ${item.isCompleted ? 'checked' : ''} />
                <span class="item-description ${item.isCompleted ? 'completed' : ''}">${escapeHtml(item.description)}</span>
            </div>
        `;
    });

    html += `
        </div>
    `;

    modalContent.innerHTML = html;

    // Attach event listeners for viewing only (toggle completion, no add/delete)
    attachModalViewListeners(taskId);
}

function attachModalViewListeners(taskId) {
    const modal = document.getElementById('checklistModal');

    // Toggle checklist items (view-only mode: can toggle but no add/delete)
    modal.querySelectorAll('.checklist-toggle').forEach(checkbox => {
        checkbox.addEventListener('change', function() {
            const itemId = this.dataset.itemId;
            const currentTaskId = this.dataset.taskId;
            toggleChecklistItem(itemId, currentTaskId);
        });
    });
}

function toggleChecklistItem(itemId, taskId) {
    const formData = new FormData();
    formData.append('itemId', itemId);

    fetch(`/Task/ToggleChecklistItem/${itemId}`, {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRF-TOKEN': getCsrfToken()
        }
    })
    .then(response => {
        if (!response.ok) {
            throw new Error('Failed to toggle item');
        }
        return response.json();
    })
    .then(data => {
        // Update checkbox state
        const checkbox = document.querySelector(`input[data-item-id="${itemId}"]`);
        if (checkbox) {
            const description = checkbox.nextElementSibling;
            checkbox.checked = data.isCompleted;
            description.classList.toggle('completed', data.isCompleted);
        }

        // Keep modal progress updated 
        if (typeof data.progressPercentage === 'number') {
            updateModalProgress(data.progressPercentage);
            updateDashboardProgress(taskId, data.progressPercentage);
        }

        if (typeof data.taskIsCompleted === 'boolean') {
            updateDashboardTaskState(taskId, data.taskIsCompleted);
        }
    })
    .catch(error => console.error('Error toggling item:', error));
}

function updateModalProgress(progressPercentage) {
    const modal = document.getElementById('checklistModal');
    if (!modal) {
        return;
    }

    const progressBar = modal.querySelector('.progress-bar-wrapper .progress-bar');
    const progressPercent = modal.querySelector('.progress-percent');
    const checklistItems = modal.querySelectorAll('.checklist-toggle');
    const completedCount = modal.querySelectorAll('.checklist-toggle:checked').length;
    const totalCount = checklistItems.length;
    const progressText = modal.querySelector('.progress-text');

    if (progressBar) {
        progressBar.style.width = `${progressPercentage}%`;
    }

    if (progressPercent) {
        progressPercent.textContent = `${Math.round(progressPercentage)}%`;
    }

    if (progressText) {
        progressText.textContent = `${completedCount} of ${totalCount} items completed`;
    }
}

function updateDashboardProgress(taskId, progressPercentage) {
    if (!taskId) {
        return;
    }

    const progressBar = document.querySelector(`[data-task-progress-bar="${taskId}"]`);
    const progressText = document.querySelector(`[data-task-progress-text="${taskId}"]`);
    const emptyProgress = document.querySelector(`[data-task-progress-empty="${taskId}"]`);

    if (progressBar) {
        progressBar.style.width = `${progressPercentage}%`;
        progressBar.setAttribute('aria-valuenow', `${Math.round(progressPercentage)}`);
        progressBar.textContent = `${Math.round(progressPercentage)}%`;
    }

    if (progressText) {
        const modal = document.getElementById('checklistModal');
        const completedCount = modal ? modal.querySelectorAll('.checklist-toggle:checked').length : 0;
        const totalCount = modal ? modal.querySelectorAll('.checklist-toggle').length : 0;
        progressText.textContent = `${completedCount}/${totalCount}`;
    }

    if (emptyProgress && progressPercentage > 0) {
        emptyProgress.textContent = `${Math.round(progressPercentage)}%`;
    }
}

function updateDashboardTaskState(taskId, taskIsCompleted) {
    if (!taskId) {
        return;
    }

    const statusCell = document.querySelector(`[data-task-status="${taskId}"]`);
    const row = document.querySelector(`[data-task-row="${taskId}"]`);
    const completeLink = document.querySelector(`[data-task-complete-link="${taskId}"]`);

    if (statusCell) {
        statusCell.textContent = taskIsCompleted ? 'Completed' : 'Pending';
        statusCell.classList.remove('completed', 'pending', 'overdue', 'due-soon');
        statusCell.classList.add(taskIsCompleted ? 'completed' : 'pending');
    }

    if (row) {
        row.classList.remove('completed', 'pending', 'overdue', 'due-soon');
        row.classList.add(taskIsCompleted ? 'completed' : 'pending');
    }

    if (taskIsCompleted && completeLink) {
        completeLink.remove();
    }
}

function closeChecklistModal() {
    const modal = document.getElementById('checklistModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

function getCsrfToken() {
    return document.querySelector('input[name="__RequestVerificationToken"]')?.value || '';
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

document.addEventListener('click', function(event) {
    const clickedInsideActionsMenu = event.target.closest('.actions-menu');
    if (clickedInsideActionsMenu) {
        return;
    }

    document.querySelectorAll('.actions-menu[open]').forEach(menu => {
        menu.removeAttribute('open');
    });
});

// Close modal when clicking outside of it
window.addEventListener('click', function(event) {
    const modal = document.getElementById('checklistModal');
    if (modal && event.target === modal) {
        closeChecklistModal();
    }
});
