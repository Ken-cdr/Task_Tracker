using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using TaskTracker.Models;
using System.Security.Claims;

namespace TaskTracker.Data
{
    [Authorize]
    public class TaskController : Controller
    {
        private readonly AppDbContext _context;

        public TaskController(AppDbContext context)
        {
            _context = context;
        }

        public IActionResult Index()
        {
            return RedirectToAction("Index", "Home");
        }

        public IActionResult Create()
        {
            return View(new TaskItem());
        }

        [HttpPost]
        public IActionResult Create(TaskItem task)
        {
            var userIdClaim = HttpContext.User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
                return Unauthorized();

            if (TitleExistsForUser(userId, task.Title, excludeTaskId: 0))
                ModelState.AddModelError(nameof(TaskItem.Title), "A task with this title already exists.");

            if (!ModelState.IsValid)
                return View(task);

            task.UserId = userId;
            task.IsCompleted = false;

            _context.Tasks.Add(task);
            _context.SaveChanges();

            return RedirectToAction("Index", "Home");
        }

        public IActionResult Edit(int id)
        {
            var userIdClaim = HttpContext.User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
                return Unauthorized();

            var task = _context.Tasks.Include(t => t.ChecklistItems).FirstOrDefault(t => t.Id == id);
            if (task == null)
                return NotFound();

            if (task.UserId != userId)
                return Forbid();

            return View(task);
        }

        [HttpPost]
        public IActionResult Edit(TaskItem task)
        {
            var userIdClaim = HttpContext.User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
                return Unauthorized();

            if (TitleExistsForUser(userId, task.Title, excludeTaskId: task.Id))
                ModelState.AddModelError(nameof(TaskItem.Title), "A task with this title already exists.");

            if (!ModelState.IsValid)
                return View(task);

            var existingTask = _context.Tasks.Find(task.Id);
            if (existingTask == null)
                return NotFound();

            if (existingTask.UserId != userId)
                return Forbid();

            existingTask.Title = task.Title;
            existingTask.Description = task.Description;
            existingTask.StartDate = task.StartDate;
            existingTask.Deadline = task.Deadline;
            existingTask.IsCompleted = task.IsCompleted;
            existingTask.Priority = task.Priority;
            existingTask.UserId = userId;

            _context.SaveChanges();

            return RedirectToAction("Index", "Home");
        }

        public IActionResult Delete(int id)
        {
            var userIdClaim = HttpContext.User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
                return Unauthorized();

            var task = _context.Tasks.Find(id);
            if (task == null)
                return NotFound();

            if (task.UserId != userId)
                return Forbid();

            _context.Tasks.Remove(task);
            _context.SaveChanges();

            return RedirectToAction("Index", "Home");
        }

        public IActionResult Complete(int id)
        {
            var userIdClaim = HttpContext.User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
                return Unauthorized();

            var task = _context.Tasks.Find(id);
            if (task == null)
                return NotFound();

            if (task.UserId != userId)
                return Forbid();

            task.IsCompleted = true;
            _context.SaveChanges();

            return RedirectToAction("Index", "Home");
        }

        [HttpPost]
        public IActionResult AddChecklistItem(int taskId, string description)
        {
            var userIdClaim = HttpContext.User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
                return Unauthorized();

            var task = _context.Tasks.Find(taskId);
            if (task == null)
                return NotFound();

            if (task.UserId != userId)
                return Forbid();

            var checklistItem = new ChecklistItem
            {
                Description = description,
                IsCompleted = false,
                TaskId = taskId
            };

            _context.ChecklistItems.Add(checklistItem);
            _context.SaveChanges();

            return RedirectToAction("Edit", new { id = taskId });
        }

        [HttpPost]
        [Route("Task/ToggleChecklistItem/{id}")]
        public IActionResult ToggleChecklistItem(int id)
        {
            var userIdClaim = HttpContext.User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
                return Unauthorized();

            var checklistItem = _context.ChecklistItems.Include(c => c.Task).FirstOrDefault(c => c.Id == id);
            if (checklistItem == null)
                return NotFound();

            if (checklistItem.Task!.UserId != userId)
                return Forbid();

            checklistItem.IsCompleted = !checklistItem.IsCompleted;
            _context.SaveChanges();

            var totalCount = _context.ChecklistItems.Count(item => item.TaskId == checklistItem.TaskId);
            var completedCount = _context.ChecklistItems.Count(item => item.TaskId == checklistItem.TaskId && item.IsCompleted);
            checklistItem.Task.IsCompleted = totalCount > 0 && completedCount == totalCount;
            _context.SaveChanges();
            var progressPercentage = totalCount == 0 ? 0 : (completedCount * 100) / totalCount;

            return Json(new
            {
                success = true,
                isCompleted = checklistItem.IsCompleted,
                taskIsCompleted = checklistItem.Task.IsCompleted,
                progressPercentage
            });
        }

        [HttpPost]
        [Route("Task/DeleteChecklistItem/{id}")]
        public IActionResult DeleteChecklistItem(int id)
        {
            var userIdClaim = HttpContext.User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
                return Unauthorized();

            var checklistItem = _context.ChecklistItems.Include(c => c.Task).FirstOrDefault(c => c.Id == id);
            if (checklistItem == null)
                return NotFound();

            if (checklistItem.Task!.UserId != userId)
                return Forbid();

            var taskId = checklistItem.TaskId;
            _context.ChecklistItems.Remove(checklistItem);
            _context.SaveChanges();

            return Json(new { success = true });
        }

        [HttpGet]
        [Route("Task/GetChecklistItems/{taskId}")]
        public IActionResult GetChecklistItems(int taskId)
        {
            var userIdClaim = HttpContext.User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
                return Unauthorized();

            var task = _context.Tasks.Include(t => t.ChecklistItems).FirstOrDefault(t => t.Id == taskId);
            if (task == null)
                return NotFound();

            if (task.UserId != userId)
                return Forbid();

            var items = (task.ChecklistItems ?? new List<ChecklistItem>()).Select(c => new
            {
                id = c.Id,
                description = c.Description,
                isCompleted = c.IsCompleted
            }).ToList();

            return Json(new { items = items });
        }

        /// <summary>
        /// Used by jQuery unobtrusive [Remote] on <see cref="TaskItem.Title"/> (create + edit).
        /// </summary>
        [HttpGet]
        public IActionResult VerifyTitleUnique(string title, int id)
        {
            var userIdClaim = HttpContext.User.FindFirst(ClaimTypes.NameIdentifier);
            if (userIdClaim == null || !int.TryParse(userIdClaim.Value, out var userId))
                return Json(true);

            if (string.IsNullOrWhiteSpace(title))
                return Json(true);

            var taken = TitleExistsForUser(userId, title, excludeTaskId: id);
            return Json(!taken);
        }

        private bool TitleExistsForUser(int userId, string title, int excludeTaskId)
        {
            var normalized = title.Trim().ToLower();
            if (normalized.Length == 0)
                return false;

            return _context.Tasks.AsNoTracking().Any(t =>
                t.UserId == userId &&
                t.Id != excludeTaskId &&
                t.Title.Trim().ToLower() == normalized);
        }
    }

}