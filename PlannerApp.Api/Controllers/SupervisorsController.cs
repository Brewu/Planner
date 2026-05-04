using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlannerApp.Api.Data;
using PlannerApp.Api.DTOs;
using PlannerApp.Api.Models;

namespace PlannerApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class SupervisorsController : ControllerBase
{
    private readonly AppDbContext _context;

    public SupervisorsController(AppDbContext context)
    {
        _context = context;
    }

    // Get user profile
    [HttpGet("{userId}")]
    public async Task<IActionResult> GetUserProfile(Guid userId)
    {
        var user = await _context
            .Users.Include(u => u.MySupervisors)
                .ThenInclude(us => us.Supervisor)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user == null)
            return NotFound();

        return Ok(
            new
            {
                user.Id,
                user.Name,
                user.Email,
                user.PhoneNumber,
                user.StaffId,
                user.ReportingFrequency,
                // return all supervisors
                Supervisors = user.MySupervisors.Select(us => new
                {
                    us.Supervisor.Id,
                    us.Supervisor.Name,
                    us.Supervisor.Email,
                    Frequency = us.Frequency.ToString(),
                }),
            }
        );
    }

    // Get all supervisors for a user
    [HttpGet("{userId}/supervisors")]
    public async Task<IActionResult> GetMySupervisors(Guid userId)
    {
        var supervisors = await _context
            .UserSupervisors.Where(us => us.UserId == userId)
            .Include(us => us.Supervisor)
            .Select(us => new
            {
                us.Supervisor.Id,
                us.Supervisor.Name,
                us.Supervisor.Email,
                Frequency = us.Frequency.ToString(),
                us.AssignedAt,
            })
            .ToListAsync();

        return Ok(supervisors);
    }

    // Get team (supervisees) for a supervisor
    [HttpGet("my-team/{supervisorId}")]
    public async Task<IActionResult> GetMyTeam(Guid supervisorId)
    {
        var team = await _context
            .UserSupervisors.Where(us => us.SupervisorId == supervisorId)
            .Include(us => us.User)
            .Select(us => new
            {
                us.User.Id,
                us.User.Name,
                us.User.Email,
                Frequency = us.Frequency.ToString(),
            })
            .ToListAsync();

        return Ok(team);
    }

    // Search users
    [HttpGet("search")]
    public async Task<IActionResult> SearchUsers([FromQuery] string name)
    {
        var users = await _context
            .Users.Where(u => u.Name.Contains(name))
            .Select(u => new
            {
                u.Id,
                u.Name,
                u.Email,
                u.StaffId,
            })
            .Take(10)
            .ToListAsync();

        return Ok(users);
    }

    // Send supervisor request
    [HttpPost("request")]
    public async Task<IActionResult> SendRequest([FromBody] SendSupervisorRequestDto dto)
    {
        // Check not already supervisors
        var alreadyLinked = await _context.UserSupervisors.AnyAsync(us =>
            us.UserId == dto.RequesterId && us.SupervisorId == dto.SupervisorId
        );

        if (alreadyLinked)
            return Conflict("This supervisor relationship already exists.");

        // Check no pending request
        var pending = await _context.SupervisorRequests.AnyAsync(r =>
            r.RequesterId == dto.RequesterId
            && r.SupervisorId == dto.SupervisorId
            && r.Status == RequestStatus.Pending
        );

        if (pending)
            return Conflict("A pending request already exists.");

        var request = new SupervisorRequest
        {
            RequesterId = dto.RequesterId,
            SupervisorId = dto.SupervisorId,
            Frequency = Enum.Parse<ReportingFrequency>(dto.Frequency),
            Status = RequestStatus.Pending,
            InitiatedBySupervisor = false,
        };

        _context.SupervisorRequests.Add(request);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Request sent." });
    }

    // Respond to request
    [HttpPost("request/respond")]
    public async Task<IActionResult> RespondToRequest([FromBody] RespondToRequestDto dto)
    {
        var request = await _context.SupervisorRequests.FindAsync(dto.RequestId);
        if (request == null)
            return NotFound();

        if (dto.Accept)
        {
            // Create the UserSupervisor link
            var link = new UserSupervisor
            {
                UserId = request.RequesterId,
                SupervisorId = request.SupervisorId,
                Frequency = request.Frequency,
                AssignedAt = DateTime.UtcNow,
            };
            _context.UserSupervisors.Add(link);
            request.Status = RequestStatus.Accepted;
            request.RespondedAt = DateTime.UtcNow;
        }
        else
        {
            request.Status = RequestStatus.Declined;
            request.RespondedAt = DateTime.UtcNow;
        }

        await _context.SaveChangesAsync();
        return Ok(new { message = dto.Accept ? "Accepted." : "Declined." });
    }

    // Remove a specific supervisor relationship
    [HttpDelete("{userId}/supervisors/{supervisorId}")]
    public async Task<IActionResult> RemoveSupervisor(Guid userId, Guid supervisorId)
    {
        var link = await _context.UserSupervisors.FirstOrDefaultAsync(us =>
            us.UserId == userId && us.SupervisorId == supervisorId
        );

        if (link == null)
            return NotFound();

        _context.UserSupervisors.Remove(link);
        await _context.SaveChangesAsync();
        return Ok(new { message = "Supervisor removed." });
    }

    // Incoming requests for a supervisor
    [HttpGet("requests/supervisor-incoming/{supervisorId}")]
    public async Task<IActionResult> GetIncomingRequests(Guid supervisorId)
    {
        var requests = await _context
            .SupervisorRequests.Where(r =>
                r.SupervisorId == supervisorId
                && r.Status == RequestStatus.Pending
                && !r.InitiatedBySupervisor
            )
            .Include(r => r.Requester)
            .Select(r => new
            {
                r.Id,
                r.Frequency,
                Requester = new
                {
                    r.Requester.Id,
                    r.Requester.Name,
                    r.Requester.Email,
                },
            })
            .ToListAsync();

        return Ok(requests);
    }

    // Incoming invitations for a supervisee
    [HttpGet("requests/supervisee-incoming/{userId}")]
    public async Task<IActionResult> GetSuperviseeIncoming(Guid userId)
    {
        var requests = await _context
            .SupervisorRequests.Where(r =>
                r.RequesterId == userId
                && r.Status == RequestStatus.Pending
                && r.InitiatedBySupervisor
            )
            .Include(r => r.Supervisor)
            .Select(r => new
            {
                r.Id,
                r.Frequency,
                Supervisor = new
                {
                    r.Supervisor.Id,
                    r.Supervisor.Name,
                    r.Supervisor.Email,
                },
            })
            .ToListAsync();

        return Ok(requests);
    }

    // Outgoing requests (requests I sent)
    [HttpGet("requests/outgoing/{userId}")]
    public async Task<IActionResult> GetOutgoingRequests(Guid userId)
    {
        var requests = await _context
            .SupervisorRequests.Where(r => r.RequesterId == userId)
            .Include(r => r.Supervisor)
            .Select(r => new
            {
                r.Id,
                r.Status,
                r.Frequency,
                Supervisor = new
                {
                    r.Supervisor.Id,
                    r.Supervisor.Name,
                    r.Supervisor.Email,
                },
            })
            .ToListAsync();

        return Ok(requests);
    }
}
