using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PlannerApp.Api.Controllers;
using PlannerApp.Api.Data;
using PlannerApp.Api.DTOs;
using PlannerApp.Api.Models;
using PlannerApp.Api.Services;

namespace PlannerApp.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ReportsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly PdfGenerationService _pdfService;
    private readonly IEmailService _emailService;
    private readonly NotificationService _notificationService;
    private readonly ILogger<ReportsController> _logger;

    public ReportsController(
        AppDbContext context,
        PdfGenerationService pdfService,
        IEmailService emailService,
        NotificationService notificationService,
        ILogger<ReportsController> logger
    )
    {
        _context = context;
        _pdfService = pdfService;
        _emailService = emailService;
        _notificationService = notificationService;
        _logger = logger;
    }

    // Config for report header (customize as needed)
    private static readonly ReportHeaderConfig HeaderConfig = new()
    {
        OrganizationName = "Your Organization Name",
        DivisionName = "Planning & Strategy Division",
        ReportType = "Weekly Report",
    };

    // -----------------------------
    // Generate & Download Board Report (for the requesting user)
    // -----------------------------
    [HttpGet("board/{boardId}")]
    public async Task<IActionResult> GenerateBoardReport(Guid boardId)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == null)
                return Unauthorized();

            var board = await _context
                .Boards.Include(b => b.Tasks)
                    .ThenInclude(t => t.AssignedUser)
                .Include(b => b.AssignedUsers)
                .FirstOrDefaultAsync(b => b.Id == boardId);

            if (board == null)
                return NotFound("Board not found");

            var hasAccess =
                board.SupervisorId == currentUserId
                || board.AssignedUsers.Any(u => u.Id == currentUserId);

            if (!hasAccess)
                return Forbid("You don't have access to this board");

            var currentUser = await _context.Users.FindAsync(currentUserId);
            var report = BuildReportDto(board, currentUser?.Name ?? "Unknown");
            var pdfBytes = _pdfService.GenerateBoardReportPdf(report, HeaderConfig);

            var fileName = $"Board_{board.Name}_{DateTime.Now:yyyyMMdd_HHmmss}.pdf";
            return File(pdfBytes, "application/pdf", fileName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating report for board {BoardId}", boardId);
            return StatusCode(
                500,
                new
                {
                    message = "An error occurred while generating the report",
                    error = ex.Message,
                }
            );
        }
    }

    // -----------------------------
    // Send Board Report to Supervisor
    // Supervisee calls this — report goes to their assigned supervisor automatically.
    // -----------------------------
    [HttpPost("board/{boardId}/send")]
    public async Task<IActionResult> SendBoardReport(Guid boardId, [FromForm] SendReportFormDto dto)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == null)
                return Unauthorized();

            var board = await _context
                .Boards.Include(b => b.Tasks)
                    .ThenInclude(t => t.AssignedUser)
                .Include(b => b.AssignedUsers)
                .FirstOrDefaultAsync(b => b.Id == boardId);

            if (board == null)
                return NotFound("Board not found");

            var hasAccess =
                board.SupervisorId == currentUserId
                || board.AssignedUsers.Any(u => u.Id == currentUserId);

            if (!hasAccess)
                return Forbid();

            var currentUser = await _context.Users.FirstOrDefaultAsync(u => u.Id == currentUserId);

            if (currentUser == null)
                return Unauthorized();

            if (string.IsNullOrWhiteSpace(dto.ToEmail))
                return BadRequest("Recipient email is required.");

            if (dto.PdfFile == null || dto.PdfFile.Length == 0)
                return BadRequest("PDF file is required.");

            // Read the client-generated PDF
            byte[] pdfBytes;
            using (var ms = new MemoryStream())
            {
                await dto.PdfFile.CopyToAsync(ms);
                pdfBytes = ms.ToArray();
            }

            var reportFileName = dto.PdfFile.FileName;
            var subject = dto.Subject ?? reportFileName;

            // Resolve recipient user for DB record (best-effort)
            var toUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == dto.ToEmail);

            // Store PDF in DB
            var reportRecord = new ReportRecord
            {
                BoardId = board.Id,
                GeneratedByUserId = currentUser.Id,
                SentToUserId = toUser?.Id ?? currentUser.Id,
                FileName = reportFileName,
                PdfBytes = pdfBytes,
                GeneratedAt = DateTime.UtcNow,
            };

            _context.ReportRecords.Add(reportRecord);
            await _context.SaveChangesAsync();

            var reportUrl = $"/api/reports/download/{reportRecord.Id}";
            var body = GenerateEmailBody(board.Name, currentUser.Name, dto.AdditionalMessage);

            try
            {
                // Convert CC and BCC lists to semicolon-separated strings
                var ccString =
                    dto.CcEmails != null && dto.CcEmails.Any()
                        ? string.Join(";", dto.CcEmails)
                        : null;

                var bccString =
                    dto.BccEmails != null && dto.BccEmails.Any()
                        ? string.Join(";", dto.BccEmails)
                        : null;

                await _emailService.SendReportEmailAsync(
                    dto.ToEmail,
                    toUser?.Name ?? dto.ToEmail,
                    subject,
                    body,
                    pdfBytes,
                    reportFileName,
                    ccString,
                    bccString
                );

                // In-app notification if recipient is a known user
                if (toUser != null)
                {
                    await _notificationService.SendReportNotification(
                        toUser.Id,
                        $"{currentUser.Name} sent you a report for board '{board.Name}'",
                        reportUrl,
                        reportFileName,
                        board.Id
                    );
                }

                _logger.LogInformation(
                    "Report '{FileName}' sent by {Sender} to {To}",
                    reportFileName,
                    currentUser.Name,
                    dto.ToEmail
                );

                return Ok(
                    new
                    {
                        message = $"Report sent to {dto.ToEmail}",
                        reportUrl,
                        reportName = reportFileName,
                        reportId = reportRecord.Id,
                    }
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to send report email to {To}", dto.ToEmail);
                return StatusCode(
                    500,
                    new
                    {
                        message = "Failed to send email. Please check email settings and try again.",
                        error = ex.Message,
                    }
                );
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in SendBoardReport for board {BoardId}", boardId);
            return StatusCode(
                500,
                new { message = "An unexpected error occurred", error = ex.Message }
            );
        }
    }

    private static string GenerateEmailBody(
        string boardName,
        string? senderName,
        string? additionalMessage
    ) =>
        $@"<html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; color: #1f2937; }}
            .header {{ background-color: #006400; color: white; padding: 24px 32px; }}
            .header h1 {{ margin: 0; font-size: 20px; }}
            .header p  {{ margin: 4px 0 0; font-size: 13px; opacity: 0.85; }}
            .content {{ padding: 24px 32px; }}
            .message-box {{ background: #f3f4f6; border-left: 4px solid #006400;
                            padding: 12px 16px; margin: 16px 0; border-radius: 4px; }}
            .footer {{ margin-top: 32px; padding-top: 16px;
                       border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class='header'>
            <h1>Weekly Progress Report — {boardName}</h1>
            <p>Submitted by {senderName} on {DateTime.Now:dddd, dd MMMM yyyy}</p>
        </div>
        <div class='content'>
            {(!string.IsNullOrEmpty(additionalMessage)
                ? $"<div class='message-box'><strong>Note from {senderName}:</strong><br/>{additionalMessage}</div>"
                : "")}
            <p>Please find the full weekly progress report attached as a PDF.</p>
        </div>
        <div class='footer'>
            <p>This report was submitted via PlannerApp. Please do not reply to this email.</p>
        </div>
    </body>
    </html>";

    // -----------------------------
    // Download a stored report PDF by ID (from DB)
    // -----------------------------
    [HttpGet("download/{reportId}")]
    public async Task<IActionResult> DownloadReport(Guid reportId)
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null)
            return Unauthorized();

        var record = await _context.ReportRecords.FirstOrDefaultAsync(r => r.Id == reportId);

        if (record == null)
            return NotFound("Report not found");

        // Only the sender or the recipient may download
        if (record.GeneratedByUserId != currentUserId && record.SentToUserId != currentUserId)
            return Forbid("You don't have access to this report");

        return File(record.PdfBytes, "application/pdf", record.FileName);
    }

    // -----------------------------
    // List reports sent to the current user (supervisor inbox)
    // -----------------------------
    [HttpGet("inbox")]
    public async Task<IActionResult> GetReportInbox()
    {
        var currentUserId = GetCurrentUserId();
        if (currentUserId == null)
            return Unauthorized();

        var reports = await _context
            .ReportRecords.Where(r => r.SentToUserId == currentUserId)
            .Include(r => r.GeneratedByUser)
            .Include(r => r.Board)
            .OrderByDescending(r => r.GeneratedAt)
            .Select(r => new
            {
                r.Id,
                r.FileName,
                r.GeneratedAt,
                Board = new { r.Board.Id, r.Board.Name },
                SentBy = new
                {
                    r.GeneratedByUser.Id,
                    r.GeneratedByUser.Name,
                    r.GeneratedByUser.Email,
                },
                DownloadUrl = $"/api/reports/download/{r.Id}",
            })
            .ToListAsync();

        return Ok(reports);
    }

    // -----------------------------
    // Get Board Statistics
    // -----------------------------
    [HttpGet("board/{boardId}/statistics")]
    public async Task<IActionResult> GetBoardStatistics(Guid boardId)
    {
        try
        {
            var currentUserId = GetCurrentUserId();
            if (currentUserId == null)
                return Unauthorized();

            var board = await _context
                .Boards.Include(b => b.Tasks)
                .FirstOrDefaultAsync(b => b.Id == boardId);

            if (board == null)
                return NotFound("Board not found");

            var statistics = new
            {
                totalTasks = board.Tasks.Count,
                completed = board.Tasks.Count(t => t.IsCompleted),
                inProgress = board.Tasks.Count(t => t.Status == "in-progress"),
                pending = board.Tasks.Count(t => t.Status == "pending"),
                completionPercentage = board.Tasks.Count > 0
                    ? Math.Round(
                        (double)board.Tasks.Count(t => t.IsCompleted) / board.Tasks.Count * 100,
                        1
                    )
                    : 0,
                overdueTasks = board.Tasks.Count(t =>
                    t.DueDate < DateTime.UtcNow && !t.IsCompleted
                ),
                tasksDueThisWeek = board.Tasks.Count(t =>
                    t.DueDate.HasValue
                    && t.DueDate.Value <= DateTime.UtcNow.AddDays(7)
                    && t.DueDate.Value >= DateTime.UtcNow
                    && !t.IsCompleted
                ),
            };

            return Ok(statistics);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting statistics for board {BoardId}", boardId);
            return StatusCode(
                500,
                new { message = "An error occurred while fetching statistics", error = ex.Message }
            );
        }
    }

    // -----------------------------
    // Helpers
    // -----------------------------
    private Guid? GetCurrentUserId()
    {
        var claim = User.Claims.FirstOrDefault(c => c.Type == ClaimTypes.NameIdentifier);
        return claim != null && Guid.TryParse(claim.Value, out var id) ? id : null;
    }

    private static BoardReportDto BuildReportDto(Board board, string generatedBy) =>
        new BoardReportDto
        {
            BoardId = board.Id,
            BoardName = board.Name,
            BoardFrequency = board.Frequency.ToString(),
            GeneratedAt = DateTime.UtcNow,
            GeneratedBy = generatedBy,
            Statistics = new ReportStatistics
            {
                TotalTasks = board.Tasks.Count,
                CompletedTasks = board.Tasks.Count(t => t.IsCompleted),
                InProgressTasks = board.Tasks.Count(t => t.Status == "in-progress"),
                PendingTasks = board.Tasks.Count(t => t.Status == "pending"),
                CompletionPercentage =
                    board.Tasks.Count > 0
                        ? (double)board.Tasks.Count(t => t.IsCompleted) / board.Tasks.Count * 100
                        : 0,
            },
            Tasks = board
                .Tasks.Select(t => new ReportTaskDto
                {
                    TaskId = t.Id,
                    Title = t.Title,
                    Description = t.Description,
                    Status = t.Status,
                    AssignedTo = t.AssignedUser?.Name ?? "Unassigned",
                    DueDate = t.DueDate,
                    IsCompleted = t.IsCompleted,
                })
                .ToList(),
        };
}

// Config class for report headers
