public class SendReportDto
{
    public string? AdditionalMessage { get; set; }
    public List<string> CcEmails { get; set; } = new();
    public List<string> BccEmails { get; set; } = new();
}
