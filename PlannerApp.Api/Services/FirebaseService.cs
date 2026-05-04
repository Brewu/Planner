using FirebaseAdmin;
using FirebaseAdmin.Messaging;
using Google.Apis.Auth.OAuth2;

namespace PlannerApp.Api.Services;

public class FirebaseService
{
    public FirebaseService(IConfiguration configuration)
    {
        string path = configuration["Firebase:ServiceAccountPath"];

        if (FirebaseApp.DefaultInstance == null)
        {
            FirebaseApp.Create(
                new AppOptions()
                {
                    Credential = GoogleCredential.FromFile(path), // ⚠️ warning is ok for now
                }
            );
        }
    }

    public async Task SendPushNotificationAsync(string fcmToken, string title, string body)
    {
        var message = new Message
        {
            Token = fcmToken,
            Notification = new Notification { Title = title, Body = body },
        };

        await FirebaseMessaging.DefaultInstance.SendAsync(message);
    }
}
