// Auto-expand textarea as user types
document.addEventListener("input", function (e) {
    if (e.target.tagName.toLowerCase() === "textarea") {
        e.target.style.height = "auto";
        e.target.style.height = e.target.scrollHeight + "px";
    }
});

// Checklist item management for task creation
document.addEventListener('DOMContentLoaded', function() {
    let tempItems = [];

    // Add temporary checklist item
    const addTempChecklistBtn = document.getElementById('addTempChecklistBtn');
    const tempChecklistItem = document.getElementById('tempChecklistItem');

    if (addTempChecklistBtn && tempChecklistItem) {
        addTempChecklistBtn.addEventListener('click', addTempItem);
        tempChecklistItem.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                addTempItem();
            }
        });
    }

    const createForm = document.querySelector('form.task-form');
    if (createForm) {
        createForm.addEventListener('submit', function () {
            createForm.querySelectorAll('input[data-temp-checklist-hidden="true"]').forEach(input => input.remove());
            tempItems.forEach(item => {
                const hidden = document.createElement('input');
                hidden.type = 'hidden';
                hidden.name = 'checklistItems';
                hidden.value = item;
                hidden.setAttribute('data-temp-checklist-hidden', 'true');
                createForm.appendChild(hidden);
            });
        });
    }

    function addTempItem() {
        const description = tempChecklistItem.value.trim();
        
        if (!description) {
            alert('Please enter a description');
            return;
        }

        tempItems.push(description);
        tempChecklistItem.value = '';
        tempChecklistItem.focus();
        renderTempItems();
    }

    function renderTempItems() {
        const container = document.getElementById('tempChecklistContainer');
        const itemsDiv = document.getElementById('tempChecklistItems');
        
        if (tempItems.length === 0) {
            container.style.display = 'none';
            return;
        }

        container.style.display = 'block';
        itemsDiv.innerHTML = tempItems.map((item, index) => `
            <div class="checklist-item">
                <span class="item-description">${escapeHtml(item)}</span>
                <button type="button" class="btn-delete-item" onclick="deleteChecklistItem(${index})">×</button>
            </div>
        `).join('');
    }

    window.deleteChecklistItem = function(index) {
        tempItems.splice(index, 1);
        renderTempItems();
    };

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
});