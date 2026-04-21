using System.ComponentModel.DataAnnotations;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace TaskTracker.Models
{
    public enum TaskPriority
    {
        Low = 2,
        Medium = 1,
        High = 0
    }

    public class TaskItem : IValidatableObject
    {
        public int Id { get; set; }

        [Display(Name = "Title:")]
        [Remote(
            "VerifyTitleUnique",
            "Task",
            HttpMethod = "get",
            AdditionalFields = nameof(Id),
            ErrorMessage = "A task with this title already exists.")]
        public string Title { get; set; } = string.Empty;

        [Display(Name = "Description:")]
        public string Description { get; set; } = string.Empty;

        [Display(Name = "Done?")]
        public bool IsCompleted { get; set; }

        [Display(Name = "Starting Date:")]
        public DateTime? StartDate { get; set; }

        [Display(Name = "Due Date:")]
        public DateTime? Deadline { get; set; }

        [Display(Name = "Priority:")]
        public TaskPriority Priority { get; set; } = TaskPriority.Medium;
       
        public int UserId { get; set; }

        [BindNever]
        public User? User { get; set; }

        [BindNever]
        public List<ChecklistItem> ChecklistItems { get; set; } = new List<ChecklistItem>();

        public int GetProgressPercentage()
        {
            if (ChecklistItems.Count == 0)
                return 0;

            int completedCount = ChecklistItems.Count(c => c.IsCompleted);
            return (int)((completedCount * 100) / ChecklistItems.Count);
        }

        public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
        {
            if (StartDate.HasValue && Deadline.HasValue && StartDate.Value > Deadline.Value)
            {
                yield return new ValidationResult(
                    "Start date must be on or before the due date.");
            }
        }
    }
}