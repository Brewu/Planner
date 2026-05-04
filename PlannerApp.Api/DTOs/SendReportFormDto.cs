public class SendReportFormDto
{
    public string ToEmail { get; set; } = string.Empty;
    public string? Subject { get; set; }
    public string? AdditionalMessage { get; set; }
    public IFormFile PdfFile { get; set; }
    public List<string>? CcEmails { get; set; } // Keep as List<string> for form binding
    public List<string>? BccEmails { get; set; } // Keep as List<string> for form binding
}
