using System;
using System.Net;
using System.Net.Mail;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace PlannerApp.Api.Services
{
    public class EmailService : IEmailService
    {
        private readonly IConfiguration _config;
        private readonly ILogger<EmailService> _logger;

        public EmailService(IConfiguration config, ILogger<EmailService> logger)
        {
            _config = config;
            _logger = logger;
        }

        public async Task SendRegistrationEmailAsync(
            string email,
            string name,
            string staffId,
            string password
        )
        {
            try
            {
                var smtpClient = CreateSmtpClient();
                var mailMessage = CreateRegistrationMessage(email, name, staffId, password);

                await smtpClient.SendMailAsync(mailMessage);
                _logger.LogInformation($"Registration email sent to {email}");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Failed to send registration email to {email}: {ex.Message}");
                throw;
            }
        }

        public async Task SendPasswordResetCodeAsync(string email, string name, string resetCode)
        {
            try
            {
                var smtpClient = CreateSmtpClient();
                var mailMessage = CreatePasswordResetCodeMessage(email, name, resetCode);

                await smtpClient.SendMailAsync(mailMessage);
                _logger.LogInformation($"Password reset code sent to {email}");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Failed to send password reset code to {email}: {ex.Message}");
                throw;
            }
        }

        public async Task SendPasswordResetConfirmationAsync(string email, string name)
        {
            try
            {
                var smtpClient = CreateSmtpClient();
                var mailMessage = CreatePasswordResetConfirmationMessage(email, name);

                await smtpClient.SendMailAsync(mailMessage);
                _logger.LogInformation($"Password reset confirmation sent to {email}");
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    $"Failed to send password reset confirmation to {email}: {ex.Message}"
                );
                throw;
            }
        }

        public async Task SendReportEmailAsync(
            string email,
            string recipientName,
            string subject,
            string body,
            byte[] pdfBytes,
            string fileName,
            string? ccEmails = null,
            string? bccEmails = null
        )
        {
            try
            {
                var smtpClient = CreateSmtpClient();
                var mailMessage = CreateReportMessage(
                    email,
                    recipientName,
                    subject,
                    body,
                    pdfBytes,
                    fileName,
                    ccEmails,
                    bccEmails
                );

                await smtpClient.SendMailAsync(mailMessage);
                _logger.LogInformation($"Report email sent to {email}");
            }
            catch (Exception ex)
            {
                _logger.LogError($"Failed to send report email to {email}: {ex.Message}");
                throw;
            }
        }

        private SmtpClient CreateSmtpClient()
        {
            var smtpServer = _config["Email:SmtpServer"] ?? _config["EmailSettings:SmtpServer"];
            var smtpPort = _config["Email:SmtpPort"] ?? _config["EmailSettings:SmtpPort"];
            var senderEmail = _config["Email:SenderEmail"] ?? _config["EmailSettings:SenderEmail"];
            var senderPassword =
                _config["Email:SenderPassword"] ?? _config["EmailSettings:Password"];

            return new SmtpClient(smtpServer)
            {
                Port = int.Parse(smtpPort ?? "587"),
                Credentials = new NetworkCredential(senderEmail, senderPassword),
                EnableSsl = true,
                DeliveryMethod = SmtpDeliveryMethod.Network,
                UseDefaultCredentials = false,
            };
        }

        private MailMessage CreateRegistrationMessage(
            string email,
            string name,
            string staffId,
            string password
        )
        {
            var fromEmail = _config["Email:SenderEmail"] ?? _config["EmailSettings:SenderEmail"];
            var mailMessage = new MailMessage(fromEmail!, email)
            {
                Subject = "Welcome to Planner App - Your Account Has Been Created",
                Body = GenerateRegistrationEmailBody(name, staffId, password),
                IsBodyHtml = true,
            };

            return mailMessage;
        }

        private MailMessage CreatePasswordResetCodeMessage(
            string email,
            string name,
            string resetCode
        )
        {
            var fromEmail = _config["Email:SenderEmail"] ?? _config["EmailSettings:SenderEmail"];
            var mailMessage = new MailMessage(fromEmail!, email)
            {
                Subject = "Password Reset Request - Planner App",
                Body = GeneratePasswordResetCodeEmailBody(name, resetCode),
                IsBodyHtml = true,
            };

            return mailMessage;
        }

        private MailMessage CreatePasswordResetConfirmationMessage(string email, string name)
        {
            var fromEmail = _config["Email:SenderEmail"] ?? _config["EmailSettings:SenderEmail"];
            var mailMessage = new MailMessage(fromEmail!, email)
            {
                Subject = "Password Reset Successful - Planner App",
                Body = GeneratePasswordResetConfirmationEmailBody(name),
                IsBodyHtml = true,
            };

            return mailMessage;
        }

        private MailMessage CreateReportMessage(
            string email,
            string recipientName,
            string subject,
            string body,
            byte[] pdfBytes,
            string fileName,
            string? ccEmails,
            string? bccEmails
        )
        {
            var fromEmail = _config["Email:SenderEmail"] ?? _config["EmailSettings:SenderEmail"];
            var mailMessage = new MailMessage(fromEmail!, email)
            {
                Subject = subject,
                Body = body,
                IsBodyHtml = true,
            };

            // Add CC recipients
            if (!string.IsNullOrWhiteSpace(ccEmails))
            {
                foreach (var cc in ccEmails.Split(';', StringSplitOptions.RemoveEmptyEntries))
                {
                    try
                    {
                        mailMessage.CC.Add(cc.Trim());
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning($"Failed to add CC email {cc}: {ex.Message}");
                    }
                }
            }

            // Add BCC recipients
            if (!string.IsNullOrWhiteSpace(bccEmails))
            {
                foreach (var bcc in bccEmails.Split(';', StringSplitOptions.RemoveEmptyEntries))
                {
                    try
                    {
                        mailMessage.Bcc.Add(bcc.Trim());
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning($"Failed to add BCC email {bcc}: {ex.Message}");
                    }
                }
            }

            // Attach PDF
            if (pdfBytes != null && pdfBytes.Length > 0)
            {
                var stream = new System.IO.MemoryStream(pdfBytes);
                var attachment = new Attachment(stream, fileName, "application/pdf");
                mailMessage.Attachments.Add(attachment);
            }

            return mailMessage;
        }

        private string GenerateRegistrationEmailBody(string name, string staffId, string password)
        {
            return $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #4F46E5; color: white; padding: 20px; border-radius: 5px 5px 0 0; }}
        .content {{ background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }}
        .footer {{ background-color: #f0f0f0; padding: 10px; border-radius: 0 0 5px 5px; font-size: 12px; }}
        .credentials {{ background-color: white; padding: 15px; border-left: 4px solid #10B981; margin: 20px 0; }}
        .credentials p {{ margin: 10px 0; }}
        code {{ background-color: #f4f4f4; padding: 2px 6px; border-radius: 3px; }}
        .button {{ display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <h1>Welcome to Planner App</h1>
        </div>
        <div class=""content"">
            <p>Hi {name},</p>
            <p>Your account has been created successfully! You can now log in to the Planner App using your credentials below.</p>
            
            <div class=""credentials"">
                <p><strong>Staff ID:</strong> <code>{staffId}</code></p>
                <p><strong>Temporary Password:</strong> <code>{password}</code></p>
            </div>

            <p><strong>Next Steps:</strong></p>
            <ol>
                <li>Log in to the Planner App with your Staff ID and the temporary password above</li>
                <li>Go to your account settings</li>
                <li>Change your password to something you'll remember</li>
            </ol>

            <p><strong>Important:</strong> Please change this temporary password immediately after your first login for security.</p>

            <p>If you have any questions or need assistance, please contact your administrator.</p>

            <p>Best regards,<br/>The Planner App Team</p>
        </div>
        <div class=""footer"">
            <p>This is an automated email. Please do not reply to this message.</p>
        </div>
    </div>
</body>
</html>";
        }

        private string GeneratePasswordResetCodeEmailBody(string name, string resetCode)
        {
            return $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #4F46E5; color: white; padding: 20px; border-radius: 5px 5px 0 0; }}
        .content {{ background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }}
        .footer {{ background-color: #f0f0f0; padding: 10px; border-radius: 0 0 5px 5px; font-size: 12px; }}
        .code {{ background-color: white; padding: 15px; border-left: 4px solid #10B981; margin: 20px 0; text-align: center; }}
        .reset-code {{ font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4F46E5; }}
        .warning {{ background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <h1>Password Reset Request</h1>
        </div>
        <div class=""content"">
            <p>Hi {name},</p>
            <p>We received a request to reset your password for your Planner App account.</p>
            
            <div class=""code"">
                <p><strong>Your verification code is:</strong></p>
                <div class=""reset-code"">{resetCode}</div>
                <p><small>This code will expire in <strong>15 minutes</strong>.</small></p>
            </div>

            <div class=""warning"">
                <p><strong>⚠️ Security Notice:</strong></p>
                <p>If you did not request this password reset, please ignore this email. Your password will remain unchanged.</p>
                <p>Never share this code with anyone, including anyone claiming to be from the Planner App support team.</p>
            </div>

            <p>To reset your password:</p>
            <ol>
                <li>Enter this verification code on the password reset page</li>
                <li>Create a new strong password</li>
                <li>Log in with your new password</li>
            </ol>

            <p>Best regards,<br/>The Planner App Team</p>
        </div>
        <div class=""footer"">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>© 2024 Planner App. All rights reserved.</p>
        </div>
    </div>
</body>
</html>";
        }

        private string GeneratePasswordResetConfirmationEmailBody(string name)
        {
            return $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #10B981; color: white; padding: 20px; border-radius: 5px 5px 0 0; }}
        .content {{ background-color: #f9f9f9; padding: 20px; border: 1px solid #ddd; }}
        .footer {{ background-color: #f0f0f0; padding: 10px; border-radius: 0 0 5px 5px; font-size: 12px; }}
        .success {{ background-color: white; padding: 15px; border-left: 4px solid #10B981; margin: 20px 0; }}
        .warning {{ background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 15px; margin: 20px 0; }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <h1>Password Reset Successful</h1>
        </div>
        <div class=""content"">
            <p>Hi {name},</p>
            <p>Your password has been successfully reset.</p>
            
            <div class=""success"">
                <p><strong>✓ Password Updated</strong></p>
                <p>You can now log in to your Planner App account using your new password.</p>
            </div>

            <div class=""warning"">
                <p><strong>⚠️ Didn't make this change?</strong></p>
                <p>If you did not reset your password, please contact your system administrator immediately as your account may have been compromised.</p>
            </div>

            <p><strong>Login Information:</strong></p>
            <ul>
                <li>URL: {_config["App:Url"] ?? "https://your-planner-app.com"}</li>
                <li>Use your Staff ID and new password to log in</li>
            </ul>

            <p>For security reasons, we recommend:</p>
            <ul>
                <li>Using a strong, unique password</li>
                <li>Never sharing your password with anyone</li>
                <li>Enabling two-factor authentication if available</li>
            </ul>

            <p>If you have any questions or need assistance, please contact your administrator.</p>

            <p>Best regards,<br/>The Planner App Team</p>
        </div>
        <div class=""footer"">
            <p>This is an automated email. Please do not reply to this message.</p>
            <p>© 2024 Planner App. All rights reserved.</p>
        </div>
    </div>
</body>
</html>";
        }
    }
}
