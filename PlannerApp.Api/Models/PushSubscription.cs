namespace PlannerApp.Api.Models;

public class PushSubscription
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid UserId { get; set; }
    public string Endpoint { get; set; } = string.Empty;
    public string P256dh { get; set; } = string.Empty;
    public string Auth { get; set; } = string.Empty;
    public string FcmToken { get; set; } // The token from the client device

    public User User { get; set; }
}
