using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskTracker.Data;
using TaskTracker.Models;
using System.Diagnostics;
using System.Linq;
using System.Security.Claims;

namespace TaskTracker.Controllers
{
    [Authorize]
    public class HomeController : Controller
    {
        private readonly AppDbContext _context;

        public HomeController(AppDbContext context)
        {
            _context = context; // inject the database context
        }

        public IActionResult Index()
        {
            var userIdClaim = HttpContext.User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
                return Unauthorized();

            // Get tasks for the current user and include checklist items
            var tasks = _context.Tasks
                .Where(t => t.UserId == userId)
                .Include(t => t.ChecklistItems)
                .ToList();

            // Calculate statistics and create task view models with status
            var now = DateTime.Now;
            var tasksWithStatus = tasks.Select(t =>
            {
                string status;
                int statusPriority;
                var localDeadline = ToLocalTime(t.Deadline);

                if (t.IsCompleted)
                {
                    status = "Completed";
                    statusPriority = 3;
                }
                else if (localDeadline.HasValue && localDeadline.Value < now)
                {
                    status = "Overdue";
                    statusPriority = 0;
                }
                else if (localDeadline.HasValue && localDeadline.Value < now.AddDays(1))
                {
                    status = "Due Soon";
                    statusPriority = 1;
                }
                else
                {
                    status = "Pending";
                    statusPriority = 2;
                }

                return new TaskWithStatusViewModel
                {
                    Task = t,
                    Status = status,
                    StatusPriority = statusPriority
                };
            })
            .OrderBy(t => t.StatusPriority)
            .ThenBy(t => t.Task.Priority)
            .ToList();

            var pendingCount = 0;
            var overdueCount = 0;
            var nearingCount = 0;

            foreach (var task in tasks.Where(t => !t.IsCompleted))
            {
                var localDeadline = ToLocalTime(task.Deadline);
                if (!localDeadline.HasValue)
                {
                    pendingCount++;
                    continue;
                }

                if (localDeadline.Value < now)
                {
                    overdueCount++;
                }
                else if (localDeadline.Value < now.AddDays(1))
                {
                    nearingCount++;
                }
                else
                {
                    pendingCount++;
                }
            }

            var viewModel = new TaskDashboardViewModel
            {
                Tasks = tasksWithStatus,
                CompletedCount = tasks.Count(t => t.IsCompleted),
                PendingCount = pendingCount,
                OverdueCount = overdueCount,
                NearingDueDateCount = nearingCount,
                TaskReminders = BuildTaskReminders(tasks, now)
            };

            // Pass view model to the view
            return View(viewModel);
        }

      //build task reminders
        private static List<TaskReminderViewModel> BuildTaskReminders(IEnumerable<TaskItem> tasks, DateTime now)
        {
            static string FormatDuration(TimeSpan span)
            {
                span = span.Duration();
                if (span.TotalMinutes < 1)
                    return "less than a minute";
                if (span.TotalHours < 1)
                {
                    var m = Math.Max(1, (int)Math.Ceiling(span.TotalMinutes));
                    return m == 1 ? "1 minute" : $"{m} minutes";
                }
                if (span.TotalDays < 1)
                {
                    var h = Math.Max(1, (int)Math.Ceiling(span.TotalHours));
                    return h == 1 ? "1 hour" : $"{h} hours";
                }
                var d = Math.Max(1, (int)Math.Ceiling(span.TotalDays));
                return d == 1 ? "1 day" : $"{d} days";
            }

            const int atDeadlineMinutes = 15;
            var oneHour = TimeSpan.FromHours(1);
            var oneDay = TimeSpan.FromDays(1);

            var list = new List<TaskReminderViewModel>();

            foreach (var task in tasks.Where(t => !t.IsCompleted && t.Deadline.HasValue))
            {
                var deadline = ToLocalTime(task.Deadline)!.Value;
                var until = deadline - now;

                TaskReminderKind kind;
                string message;

                if (until < TimeSpan.Zero)
                {
                    kind = TaskReminderKind.Overdue;
                    message = $"{task.Title} is overdue by {FormatDuration(-until)}.";
                }
                else if (until <= TimeSpan.FromMinutes(atDeadlineMinutes))
                {
                    kind = TaskReminderKind.AtDeadline;
                    message = $"{task.Title} is due now.";
                }
                else if (until <= oneHour)
                {
                    kind = TaskReminderKind.DueWithinHour;
                    message = $"{task.Title} is due in {FormatDuration(until)}.";
                }
                else if (until <= oneDay)
                {
                    kind = TaskReminderKind.DueWithinDay;
                    message = $"{task.Title} is due in {FormatDuration(until)}.";
                }
                else
                    continue;

                list.Add(new TaskReminderViewModel
                {
                    TaskId = task.Id,
                    Title = task.Title,
                    Kind = kind,
                    Message = message
                });
            }

            static int KindOrder(TaskReminderKind k) => k switch
            {
                TaskReminderKind.Overdue => 0,
                TaskReminderKind.AtDeadline => 1,
                TaskReminderKind.DueWithinHour => 2,
                TaskReminderKind.DueWithinDay => 3,
                _ => 4
            };

            return list
                .OrderBy(r => KindOrder(r.Kind))
                .ThenBy(r => tasks.First(t => t.Id == r.TaskId).Deadline)
                .ToList();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel
            {
                RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier
            });
        }

        public IActionResult Calendar(int? year, int? month)
        {
            var userIdClaim = HttpContext.User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
                return Unauthorized();

            
            year ??= DateTime.Now.Year;
            month ??= DateTime.Now.Month;

            var tasks = _context.Tasks
                .Where(t => t.UserId == userId)
                .ToList();

            ViewBag.Year = year;
            ViewBag.Month = month;

            return View(tasks);
        }

        private static DateTime? ToLocalTime(DateTime? value)
        {
            if (!value.HasValue)
                return null;

            var dt = value.Value;
            return dt.Kind switch
            {
                DateTimeKind.Utc => dt.ToLocalTime(),
                DateTimeKind.Local => dt,
                _ => DateTime.SpecifyKind(dt, DateTimeKind.Local)
            };
        }
    }
}