namespace TaskTracker.Models
{
    public class TaskDashboardViewModel
    {
        public List<TaskWithStatusViewModel> Tasks { get; set; } = new List<TaskWithStatusViewModel>();
        
        public int CompletedCount { get; set; }
        
        public int PendingCount { get; set; }
        
        public int OverdueCount { get; set; }
        
        public int NearingDueDateCount { get; set; }

        /// <summary>
        /// Task-specific deadline reminders (not aggregate counts — those are on stat cards).
        /// </summary>
        public List<TaskReminderViewModel> TaskReminders { get; set; } = new List<TaskReminderViewModel>();
    }
}
