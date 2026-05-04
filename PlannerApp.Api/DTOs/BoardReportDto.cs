namespace PlannerApp.Api.DTOs;

public class BoardReportDto
{
    public Guid BoardId { get; set; }
    public string BoardName { get; set; }
    public string BoardFrequency { get; set; }
    public DateTime GeneratedAt { get; set; }
    public string GeneratedBy { get; set; }
    public ReportStatistics Statistics { get; set; }
    public List<ReportTaskDto> Tasks { get; set; }
}

public class ReportStatistics
{
    public int TotalTasks { get; set; }
    public int CompletedTasks { get; set; }
    public int InProgressTasks { get; set; }
    public int PendingTasks { get; set; }
    public double CompletionPercentage { get; set; }
}

public class ReportTaskDto
{
    public Guid TaskId { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public string Status { get; set; }
    public string AssignedTo { get; set; }
    public DateTime? DueDate { get; set; }
    public bool IsCompleted { get; set; }
}

public class SendReportDto
{
    public Guid BoardId { get; set; }
    public Guid RecipientUserId { get; set; }
    public string? AdditionalMessage { get; set; }
}
