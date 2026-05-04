namespace PlannerApp.Api.Models;

public class ReportRecord
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid BoardId { get; set; }
    public Board Board { get; set; } = null!;

    public Guid GeneratedByUserId { get; set; }
    public User GeneratedByUser { get; set; } = null!;

    public Guid SentToUserId { get; set; }
    public User SentToUser { get; set; } = null!;

    public string FileName { get; set; } = string.Empty;

    // PDF stored as bytes — no disk files needed
    public byte[] PdfBytes { get; set; } = Array.Empty<byte>();

    public DateTime GeneratedAt { get; set; } = DateTime.UtcNow;
}
