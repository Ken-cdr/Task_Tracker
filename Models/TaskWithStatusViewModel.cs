namespace TaskTracker.Models
{
    public class TaskWithStatusViewModel
    {
        public required TaskItem Task { get; set; }
        
        public string Status { get; set; } = string.Empty;
        
        public int StatusPriority { get; set; } // 0=overdue, 1=due soon, 2=pending, 3=completed
    }
}
