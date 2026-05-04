using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlannerApp.Api.Data;
using PlannerApp.Api.DTOs;
using PlannerApp.Api.Models;
using PlannerApp.Api.Services;

[ApiController]
[Route("api/[controller]")]
public class BoardsController : ControllerBase
{
    private readonly AppDbContext _context;

    public BoardsController(AppDbContext context)
    {
        _context = context;
    }

    // -----------------------------
    // Create Board
    // -----------------------------
    [HttpPost]
    public async Task<IActionResult> CreateBoard(
        [FromBody] CreateBoardDto dto,
        [FromServices] NotificationService notificationService
    )
    {
        var board = new Board { Name = dto.Name, Frequency = dto.Frequency };

        if (dto.SupervisorId.HasValue)
        {
            var supervisor = await _context.Users.FindAsync(dto.SupervisorId.Value);
            if (supervisor == null)
                return NotFound("Supervisor not found");

            board.SupervisorId = supervisor.Id;
        }

        List<User> assignedUsers = new List<User>();

        if (dto.AssignedUserIds != null && dto.AssignedUserIds.Any())
        {
            assignedUsers = await _context
                .Users.Where(u => dto.AssignedUserIds.Contains(u.Id))
                .ToListAsync();
            board.AssignedUsers = assignedUsers;
        }

        _context.Boards.Add(board);
        await _context.SaveChangesAsync();

        // Send immediate notifications (board-aware)
        foreach (var user in assignedUsers)
        {
            await notificationService.SendImmediateNotification(
                user.Id,
                $"You have been assigned to the board '{board.Name}'",
                board.Id
            );
        }

        return Ok(board);
    }

    // -----------------------------
    // Reassign Board Users
    // -----------------------------
    [HttpPut("{boardId}/reassign")]
    public async Task<IActionResult> ReassignBoard(
        Guid boardId,
        [FromBody] List<Guid> newAssignedUserIds,
        [FromServices] NotificationService notificationService
    )
    {
        var board = await _context
            .Boards.Include(b => b.AssignedUsers)
            .FirstOrDefaultAsync(b => b.Id == boardId);

        if (board == null)
            return NotFound("Board not found");

        var previousUsers = board.AssignedUsers.ToList();
        var newUsers = await _context
            .Users.Where(u => newAssignedUserIds.Contains(u.Id))
            .ToListAsync();

        board.AssignedUsers = newUsers;
        await _context.SaveChangesAsync();

        // Notify removed users
        foreach (var removedUser in previousUsers.Except(newUsers))
        {
            await notificationService.SendImmediateNotification(
                removedUser.Id,
                $"You have been removed from board '{board.Name}'",
                board.Id
            );
        }

        // Notify added users
        foreach (var addedUser in newUsers.Except(previousUsers))
        {
            await notificationService.SendImmediateNotification(
                addedUser.Id,
                $"You have been added to board '{board.Name}'",
                board.Id
            );
        }

        return Ok(board);
    }

    [HttpDelete("{boardId}")]
    public async Task<IActionResult> DeleteBoard(
        Guid boardId,
        [FromServices] NotificationService notificationService
    )
    {
        var board = await _context
            .Boards.Include(b => b.AssignedUsers)
            .FirstOrDefaultAsync(b => b.Id == boardId);

        if (board == null)
            return NotFound("Board not found");

        // FIX: Use the correct claim type
        var currentUserIdClaim = User.Claims.FirstOrDefault(c =>
            c.Type == ClaimTypes.NameIdentifier
        );
        if (currentUserIdClaim == null)
            return Unauthorized("User ID not found in token");

        var currentUserId = Guid.Parse(currentUserIdClaim.Value);

        if (board.SupervisorId != currentUserId)
            return Forbid("Only the supervisor can delete this board");

        _context.Boards.Remove(board);
        await _context.SaveChangesAsync();

        // Notify all assigned users
        foreach (var user in board.AssignedUsers)
        {
            await notificationService.SendImmediateNotification(
                user.Id,
                $"The board '{board.Name}' has been deleted",
                board.Id,
                null
            );
        }

        return Ok(new { message = "Board and all its tasks have been deleted" });
    }

    // -----------------------------
    // Get All Boards
    // -----------------------------
    [HttpGet]
    public async Task<IActionResult> GetBoards()
    {
        var currentUserIdClaim = User.Claims.FirstOrDefault(c =>
            c.Type == ClaimTypes.NameIdentifier
        );
        if (currentUserIdClaim == null)
            return Unauthorized();

        var currentUserId = Guid.Parse(currentUserIdClaim.Value);

        var boards = await _context
            .Boards.Include(b => b.Supervisor)
            .Include(b => b.AssignedUsers)
            .Where(b =>
                b.SupervisorId == currentUserId
                || // user is the supervisor
                b.AssignedUsers.Any(u => u.Id == currentUserId)
            ) // user is assigned
            .Select(b => new
            {
                b.Id,
                b.Name,
                b.Frequency,
                b.SupervisorId,
                Supervisor = b.Supervisor != null
                    ? new
                    {
                        b.Supervisor.Id,
                        b.Supervisor.Name,
                        b.Supervisor.Email,
                        b.Supervisor.PhoneNumber,
                        b.Supervisor.SupervisorId,
                    }
                    : null,
                AssignedUsers = b
                    .AssignedUsers.Select(u => new
                    {
                        u.Id,
                        u.Name,
                        u.Email,
                        u.PhoneNumber,
                        u.SupervisorId,
                    })
                    .ToList(),
            })
            .ToListAsync();

        return Ok(boards);
    }
}
