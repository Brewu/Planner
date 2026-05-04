using System.Threading.Tasks;

namespace PlannerApp.Api.Services
{
    public interface IEmailService
    {
        Task SendRegistrationEmailAsync(string email, string name, string staffId, string password);
        Task SendPasswordResetCodeAsync(string email, string name, string resetCode);
        Task SendPasswordResetConfirmationAsync(string email, string name);
        Task SendReportEmailAsync(
            string email,
            string recipientName,
            string subject,
            string body,
            byte[] pdfBytes,
            string fileName,
            string? ccEmails = null,
            string? bccEmails = null
        );
    }
}
