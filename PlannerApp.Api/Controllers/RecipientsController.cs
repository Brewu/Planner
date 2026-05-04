// Controllers/RecipientsController.cs
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
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
public class RecipientsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly ILogger<RecipientsController> _logger;

    public RecipientsController(AppDbContext context, ILogger<RecipientsController> logger)
    {
        _context = context;
        _logger = logger;
    }

    private Guid? GetCurrentUserId()
    {
        var claim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier);
        if (claim == null)
            return null;
        return Guid.TryParse(claim.Value, out var id) ? id : null;
    }

    // GET: api/recipients
    [HttpGet]
    public async Task<IActionResult> GetMyRecipients()
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized();

        var recipients = await _context
            .ReportRecipients.Where(r => r.UserId == userId)
            .OrderBy(r => r.Type)
            .ThenBy(r => r.Name)
            .Select(r => new ReportRecipientDto
            {
                Id = r.Id,
                UserId = r.UserId,
                Name = r.Name,
                Email = r.Email,
                Type = r.Type,
                CreatedAt = r.CreatedAt,
            })
            .ToListAsync();

        return Ok(recipients);
    }

    // GET: api/recipients/{userId}/recipients (for compatibility with frontend)
    [HttpGet("user/{userId}/recipients")]
    public async Task<IActionResult> GetRecipientsForUser(Guid userId)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null)
            return Unauthorized();

        // Only allow users to get their own recipients
        if (currentUserId != userId)
            return Forbid();

        var recipients = await _context
            .ReportRecipients.Where(r => r.UserId == userId)
            .OrderBy(r => r.Type)
            .ThenBy(r => r.Name)
            .Select(r => new ReportRecipientDto
            {
                Id = r.Id,
                UserId = r.UserId,
                Name = r.Name,
                Email = r.Email,
                Type = r.Type,
                CreatedAt = r.CreatedAt,
            })
            .ToListAsync();

        return Ok(recipients);
    }

    // POST: api/recipients
    [HttpPost]
    public async Task<IActionResult> AddRecipient([FromBody] AddRecipientDto dto)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized();

        if (string.IsNullOrWhiteSpace(dto.Name))
            return BadRequest(new { message = "Name is required" });

        if (string.IsNullOrWhiteSpace(dto.Email))
            return BadRequest(new { message = "Email is required" });

        if (!IsValidEmail(dto.Email))
            return BadRequest(new { message = "Invalid email format" });

        if (dto.Type != "TO" && dto.Type != "CC" && dto.Type != "BCC")
            return BadRequest(new { message = "Type must be TO, CC, or BCC" });

        var recipient = new ReportRecipient
        {
            Id = Guid.NewGuid(),
            UserId = userId.Value,
            Name = dto.Name,
            Email = dto.Email,
            Type = dto.Type,
            CreatedAt = DateTime.UtcNow,
        };

        _context.ReportRecipients.Add(recipient);
        await _context.SaveChangesAsync();

        var result = new ReportRecipientDto
        {
            Id = recipient.Id,
            UserId = recipient.UserId,
            Name = recipient.Name,
            Email = recipient.Email,
            Type = recipient.Type,
            CreatedAt = recipient.CreatedAt,
        };

        return Ok(result);
    }

    // PUT: api/recipients/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateRecipient(Guid id, [FromBody] UpdateRecipientDto dto)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized();

        var recipient = await _context.ReportRecipients.FirstOrDefaultAsync(r =>
            r.Id == id && r.UserId == userId
        );

        if (recipient == null)
            return NotFound(new { message = "Recipient not found" });

        if (!string.IsNullOrWhiteSpace(dto.Name))
            recipient.Name = dto.Name;

        if (!string.IsNullOrWhiteSpace(dto.Email))
        {
            if (!IsValidEmail(dto.Email))
                return BadRequest(new { message = "Invalid email format" });
            recipient.Email = dto.Email;
        }

        if (!string.IsNullOrWhiteSpace(dto.Type))
        {
            if (dto.Type != "TO" && dto.Type != "CC" && dto.Type != "BCC")
                return BadRequest(new { message = "Type must be TO, CC, or BCC" });
            recipient.Type = dto.Type;
        }

        recipient.UpdatedAt = DateTime.UtcNow;
        await _context.SaveChangesAsync();

        return Ok(new { message = "Recipient updated successfully" });
    }

    // DELETE: api/recipients/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteRecipient(Guid id)
    {
        var userId = GetCurrentUserId();
        if (userId == null)
            return Unauthorized();

        var recipient = await _context.ReportRecipients.FirstOrDefaultAsync(r =>
            r.Id == id && r.UserId == userId
        );

        if (recipient == null)
            return NotFound(new { message = "Recipient not found" });

        _context.ReportRecipients.Remove(recipient);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Recipient deleted successfully" });
    }

    private bool IsValidEmail(string email)
    {
        try
        {
            var addr = new System.Net.Mail.MailAddress(email);
            return addr.Address == email;
        }
        catch
        {
            return false;
        }
    }
}
