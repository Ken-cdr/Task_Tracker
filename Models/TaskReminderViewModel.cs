namespace TaskTracker.Models
{
    public enum TaskReminderKind
    {
        Overdue,
        AtDeadline,
        DueWithinHour,
        DueWithinDay
    }

    public class TaskReminderViewModel
    {
        public int TaskId { get; set; }

        public string Title { get; set; } = string.Empty;

        public TaskReminderKind Kind { get; set; }

        public string Message { get; set; } = string.Empty;
    }
}
