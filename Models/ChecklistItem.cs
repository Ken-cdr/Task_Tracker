using System.ComponentModel.DataAnnotations;

namespace TaskTracker.Models
{
    public class ChecklistItem
    {
        public int Id { get; set; }

        [Display(Name = "Item:")]
        public string Description { get; set; } = string.Empty;

        [Display(Name = "Completed?")]
        public bool IsCompleted { get; set; }

        public int TaskId { get; set; }

        public TaskItem? Task { get; set; }
    }
}
