using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlannerApp.Api.Data;
using PlannerApp.Api.DTOs;
using PlannerApp.Api.Models;
using PlannerApp.Api.Services;

[ApiController]
[Route("api/[controller]")]
public class TasksController : ControllerBase
{
    private readonly AppDbContext _context;

    public TasksController(AppDbContext context)
    {
        _context = context;
    }

    // -----------------------------
    // Helper: Get current user ID
    // -----------------------------
    private Guid? GetCurrentUserId()
    {
        var claim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier);
        if (claim == null)
            return null;
        return Guid.TryParse(claim.Value, out var id) ? id : null;
    }

    // -----------------------------
    // Create Task
    // -----------------------------
    [HttpPost]
    public async Task<IActionResult> CreateTask(
        [FromBody] CreateTaskDto dto,
        [FromServices] NotificationService notificationService
    )
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null)
            return Unauthorized("User ID not found in token");

        var board = await _context
            .Boards.Include(b => b.AssignedUsers)
            .FirstOrDefaultAsync(b => b.Id == dto.BoardId);

        if (board == null)
            return NotFound("Board not found");

        // Check if user is a board member (assigned user) OR supervisor
        bool isSupervisor = board.SupervisorId == currentUserId;
        bool isBoardMember = board.AssignedUsers.Any(u => u.Id == currentUserId);

        // Allow board members (assigned users) to create tasks, not just supervisors
        if (!isSupervisor && !isBoardMember)
            return Forbid("You must be a board member or supervisor to create tasks");

        // For supervisees (non-supervisors), they can only assign tasks to themselves
        if (!isSupervisor && dto.AssignedUserId != currentUserId)
            return Forbid("As a board member, you can only assign tasks to yourself");

        // Add assignee to board if not already a member
        if (!board.AssignedUsers.Any(u => u.Id == dto.AssignedUserId))
        {
            var assignee = await _context.Users.FindAsync(dto.AssignedUserId);
            if (assignee == null)
                return NotFound("Assigned user not found");
            board.AssignedUsers.Add(assignee);
            await _context.SaveChangesAsync();
        }

        var task = new TaskItem
        {
            Title = dto.Title,
            Description = dto.Description,
            BoardId = board.Id,
            AssignedUserId = dto.AssignedUserId,
            DueDate = dto.DueDate,
            ReminderFrequency = dto.ReminderFrequency,
            Status = "pending",
        };

        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();

        // Notify the assignee (if different from creator)
        if (dto.AssignedUserId != currentUserId)
        {
            await notificationService.SendImmediateNotification(
                dto.AssignedUserId,
                $"You have been assigned to task '{task.Title}' in board '{board.Name}'",
                board.Id,
                task.Id
            );
        }

        // Notify the supervisor about the new task
        if (board.SupervisorId.HasValue)
        {
            var creator = await _context.Users.FindAsync(currentUserId);
            var assignee = await _context.Users.FindAsync(dto.AssignedUserId);

            string message = $"New task '{task.Title}' created in board '{board.Name}'";
            if (creator != null && assignee != null)
            {
                if (creator.Id == assignee.Id)
                    message = $"{creator.Name} created a new task for themselves: '{task.Title}'";
                else
                    message =
                        $"{creator.Name} created task '{task.Title}' and assigned it to {assignee.Name}";
            }

            await notificationService.SendImmediateNotification(
                board.SupervisorId.Value,
                message,
                board.Id,
                task.Id
            );
        }

        return Ok(task);
    }

    // -----------------------------
    // Update Task (status / completion / edit)
    // -----------------------------
    [HttpPut("{taskId}")]
    public async Task<IActionResult> UpdateTask(
        Guid taskId,
        [FromBody] UpdateTaskDto dto,
        [FromServices] NotificationService notificationService
    )
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null)
            return Unauthorized("User ID not found in token");

        var task = await _context
            .Tasks.Include(t => t.Board)
                .ThenInclude(b => b.Tasks)
            .FirstOrDefaultAsync(t => t.Id == taskId);

        if (task == null)
            return NotFound("Task not found");

        // Only the assignee or supervisor can update the task
        bool isSupervisor = task.Board.SupervisorId == currentUserId;
        bool isAssignee = task.AssignedUserId == currentUserId;
        if (!isSupervisor && !isAssignee)
            return Forbid();

        var wasCompleted = task.IsCompleted;

        // Apply status fields
        task.IsCompleted = dto.IsCompleted;
        task.Status = dto.Status ?? (dto.IsCompleted ? "completed" : "pending");

        // Apply edit fields (only when provided)
        if (!string.IsNullOrWhiteSpace(dto.Title))
            task.Title = dto.Title;
        if (dto.Description != null)
            task.Description = dto.Description;
        if (dto.AssignedUserId.HasValue)
            task.AssignedUserId = dto.AssignedUserId.Value;
        if (dto.DueDate.HasValue)
            task.DueDate = dto.DueDate;
        if (dto.ReminderFrequency.HasValue)
            task.ReminderFrequency = dto.ReminderFrequency;

        await _context.SaveChangesAsync();

        // Notify supervisor when a task is marked complete
        if (dto.IsCompleted && !wasCompleted)
        {
            var board = task.Board;

            if (board.SupervisorId.HasValue)
            {
                var assignee = await _context.Users.FindAsync(task.AssignedUserId);
                await notificationService.SendImmediateNotification(
                    board.SupervisorId.Value,
                    $"{assignee?.Name ?? "A user"} completed task '{task.Title}' in board '{board.Name}'",
                    board.Id,
                    task.Id
                );
            }

            // Check if all tasks in the board are now complete
            if (board.Tasks.Any() && board.Tasks.All(t => t.IsCompleted))
            {
                board.IsCompleted = true;
                await _context.SaveChangesAsync();

                // Notify supervisor that the entire board is done
                if (board.SupervisorId.HasValue)
                {
                    await notificationService.SendImmediateNotification(
                        board.SupervisorId.Value,
                        $"🎉 All tasks in board '{board.Name}' have been completed!",
                        board.Id
                    );
                }

                // Notify each assigned user
                var assignedUserIds = await _context
                    .Boards.Where(b => b.Id == board.Id)
                    .SelectMany(b => b.AssignedUsers.Select(u => u.Id))
                    .ToListAsync();

                foreach (var userId in assignedUserIds)
                {
                    if (board.SupervisorId.HasValue && userId == board.SupervisorId.Value)
                        continue;

                    await notificationService.SendImmediateNotification(
                        userId,
                        $"🎉 All tasks in board '{board.Name}' are complete!",
                        board.Id
                    );
                }
            }
        }

        return Ok(task);
    }

    // -----------------------------
    // Reassign Task
    // -----------------------------
    [HttpPut("{taskId}/reassign")]
    public async Task<IActionResult> ReassignTask(
        Guid taskId,
        [FromBody] Guid newAssignedUserId,
        [FromServices] NotificationService notificationService
    )
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null)
            return Unauthorized("User ID not found in token");

        var task = await _context
            .Tasks.Include(t => t.AssignedUser)
            .Include(t => t.Board)
            .FirstOrDefaultAsync(t => t.Id == taskId);

        if (task == null)
            return NotFound("Task not found");

        // Only the supervisor can reassign tasks
        if (task.Board.SupervisorId != currentUserId)
            return Forbid();

        var previousUserId = task.AssignedUserId;
        task.AssignedUserId = newAssignedUserId;

        await _context.SaveChangesAsync();

        if (previousUserId != newAssignedUserId)
        {
            await notificationService.SendImmediateNotification(
                previousUserId,
                $"You have been unassigned from task '{task.Title}' in board '{task.Board.Name}'",
                task.BoardId,
                task.Id
            );

            await notificationService.SendImmediateNotification(
                newAssignedUserId,
                $"You have been assigned to task '{task.Title}' in board '{task.Board.Name}'",
                task.BoardId,
                task.Id
            );
        }

        return Ok(task);
    }

    // -----------------------------
    // Delete Task
    // -----------------------------
    [HttpDelete("{taskId}")]
    public async Task<IActionResult> DeleteTask(
        Guid taskId,
        [FromServices] NotificationService notificationService
    )
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null)
            return Unauthorized("User ID not found in token");

        var task = await _context
            .Tasks.Include(t => t.AssignedUser)
            .Include(t => t.Board)
            .FirstOrDefaultAsync(t => t.Id == taskId);

        if (task == null)
            return NotFound("Task not found");

        // Only the supervisor or the assignee can delete a task
        bool isSupervisor = task.Board.SupervisorId == currentUserId;
        bool isAssignee = task.AssignedUserId == currentUserId;
        if (!isSupervisor && !isAssignee)
            return Forbid();

        _context.Tasks.Remove(task);
        await _context.SaveChangesAsync();

        await notificationService.SendImmediateNotification(
            task.AssignedUserId,
            $"Task '{task.Title}' in board '{task.Board.Name}' has been deleted",
            task.BoardId,
            task.Id
        );

        return Ok(new { message = "Task deleted successfully" });
    }

    // -----------------------------
    // Get Tasks for Board
    // -----------------------------
    [HttpGet("board/{boardId}")]
    public async Task<IActionResult> GetTasksForBoard(Guid boardId)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null)
            return Unauthorized("User ID not found in token");

        var board = await _context
            .Boards.Include(b => b.AssignedUsers)
            .FirstOrDefaultAsync(b => b.Id == boardId);

        if (board == null)
            return NotFound("Board not found");

        // Only board members or the supervisor can view tasks
        bool isMember = board.AssignedUsers.Any(u => u.Id == currentUserId);
        bool isSupervisor = board.SupervisorId == currentUserId;
        if (!isMember && !isSupervisor)
            return Forbid();

        var tasks = await _context
            .Tasks.Where(t => t.BoardId == boardId)
            .Include(t => t.AssignedUser)
            .ToListAsync();

        return Ok(tasks);
    }
}
