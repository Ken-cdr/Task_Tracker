(function () {
    function formatDateTime(date) {
        var options = {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return date.toLocaleString(undefined, options);
    }

    /** Matches HomeController Index: Completed / Overdue / Due Soon / Pending */
    function resolveTaskStatus(task) {
        if (task.isCompleted) {
            return { cssClass: 'completed', label: 'Completed' };
        }
        if (!task.deadline) {
            return { cssClass: 'pending', label: 'Pending' };
        }
        var deadline = new Date(task.deadline);
        var now = new Date();
        if (deadline < now) {
            return { cssClass: 'overdue', label: 'Overdue' };
        }
        var dueSoonEnd = new Date(now.getTime());
        dueSoonEnd.setDate(dueSoonEnd.getDate() + 1);
        if (deadline < dueSoonEnd) {
            return { cssClass: 'due-soon', label: 'Due Soon' };
        }
        return { cssClass: 'pending', label: 'Pending' };
    }

    function buildCalendar(year, month, tasks) {
        var firstDay = new Date(year, month - 1, 1);
        var daysInMonth = new Date(year, month, 0).getDate();
        var startOfWeek = firstDay.getDay();
        var weeks = Math.ceil((daysInMonth + startOfWeek) / 7);

        var table = document.createElement('table');
        table.className = 'calendar-table';

        var thead = document.createElement('thead');
        var headerRow = document.createElement('tr');
        ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].forEach(function (day) {
            var th = document.createElement('th');
            th.textContent = day;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);
        table.appendChild(thead);

        var tbody = document.createElement('tbody');
        var dayCounter = 1 - startOfWeek;

        for (var week = 0; week < weeks; week++) {
            var tr = document.createElement('tr');

            for (var weekday = 0; weekday < 7; weekday++) {
                var currentDate = new Date(year, month - 1, dayCounter);
                var isCurrentMonth = currentDate.getMonth() === month - 1;

                var td = document.createElement('td');
                td.className = isCurrentMonth ? 'calendar-day current-month' : 'calendar-day other-month';

                var dayNumber = document.createElement('div');
                dayNumber.className = 'calendar-day-number';
                dayNumber.textContent = currentDate.getDate();
                td.appendChild(dayNumber);

                // Only show tasks with deadline
                var tasksOnDay = tasks.filter(task => {
                    return task.deadline && new Date(task.deadline).toDateString() === currentDate.toDateString();
                });

                tasksOnDay.forEach(task => {
                    var taskBox = document.createElement('div');
                    var statusInfo = resolveTaskStatus(task);
                    taskBox.className = 'task-box ' + statusInfo.cssClass;
                    
                    var deadlineStr = formatDateTime(new Date(task.deadline));
                    taskBox.textContent = task.title + "'s deadline";
                    taskBox.title = deadlineStr; 
                    taskBox.style.cursor = 'pointer';
                    
                    (function(t, date) {
                        taskBox.addEventListener('click', function (e) {
                            e.stopPropagation();
                            showTaskModal(t, date);
                        });
                    })(task, currentDate);
                    
                    td.appendChild(taskBox);
                });

                (function(date) {
                    td.addEventListener('click', function () {
                        var dayTasks = tasks.filter(t => {
                            return t.deadline && new Date(t.deadline).toDateString() === date.toDateString();
                        });
                        
                        if (dayTasks.length > 0) {
                            showTasksModal(dayTasks, date);
                        }
                    });
                })(currentDate);

                tr.appendChild(td);
                dayCounter++;
            }
            tbody.appendChild(tr);
        }

        table.appendChild(tbody);
        return table;
    }

    function showTaskModal(task, date) {
        var modalBody = document.getElementById('modalDayBody');
        modalBody.innerHTML = '';
        document.getElementById('modalDayLabel').textContent = date.toDateString();

        var div = document.createElement('div');
        div.className = 'modal-task';
        var st = resolveTaskStatus(task);
        div.innerHTML = `
            <strong>${task.title}</strong><br>
            ${task.description ? '<br>' + task.description : ''}<br>
            <strong>Deadline:</strong> ${formatDateTime(new Date(task.deadline))}<br>
            <strong>Status:</strong> ${st.label}
        `;
        modalBody.appendChild(div);

        var modalEl = document.getElementById('dayModal');
        var modal = new bootstrap.Modal(modalEl);
        modal.show();
    }

    function showTasksModal(dayTasks, date) {
        var modalBody = document.getElementById('modalDayBody');
        modalBody.innerHTML = '';
        document.getElementById('modalDayLabel').textContent = date.toDateString();

        dayTasks.forEach(t => {
            var div = document.createElement('div');
            div.className = 'modal-task';
            var st = resolveTaskStatus(t);
            div.innerHTML = `
                <strong>${t.title}</strong><br>
                ${t.description ? t.description + '<br>' : ''}
                <strong>Deadline:</strong> ${formatDateTime(new Date(t.deadline))}<br>
                <strong>Status:</strong> ${st.label}
            `;
            modalBody.appendChild(div);
        });

        var modalEl = document.getElementById('dayModal');
        var modal = new bootstrap.Modal(modalEl);
        modal.show();
    }

    function initializeCalendar() {
        var root = document.getElementById('calendar-root');
        var label = document.getElementById('calendar-month-label');
        var prevButton = document.getElementById('calendar-prev');
        var nextButton = document.getElementById('calendar-next');

        if (!root || !label || !prevButton || !nextButton || !window.calendarTasks) return;

        var currentYear = window.calendarInitialYear || new Date().getFullYear();
        var currentMonth = window.calendarInitialMonth || new Date().getMonth() + 1;
        var tasks = window.calendarTasks;

        function render() {
            root.innerHTML = '';
            label.textContent = new Date(currentYear, currentMonth - 1, 1).toLocaleString(undefined, { month: 'long', year: 'numeric' });
            root.appendChild(buildCalendar(currentYear, currentMonth, tasks));
        }

        prevButton.addEventListener('click', function () {
            if (currentMonth === 1) { currentMonth = 12; currentYear--; } 
            else { currentMonth--; }
            render();
        });

        nextButton.addEventListener('click', function () {
            if (currentMonth === 12) { currentMonth = 1; currentYear++; } 
            else { currentMonth++; }
            render();
        });

        render();
    }

    document.addEventListener('DOMContentLoaded', initializeCalendar);
})();