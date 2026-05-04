using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations.Schema; // Add this

namespace PlannerApp.Api.Models;

public class Notification
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public User User { get; set; } = null!;
    public Guid? BoardId { get; set; }
    public Guid? TaskId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public bool IsRead { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime ScheduledAt { get; set; }
    public bool IsSent { get; set; } = false;
    public string Type { get; set; } = string.Empty;
    public Guid? RelatedEntityId { get; set; }

    // Add this property for storing additional data like report URLs
    public string? MetadataJson { get; set; }

    // Helper property to work with Metadata as a dictionary
    [NotMapped] // THIS is what EF needs
    [System.Text.Json.Serialization.JsonIgnore]
    public Dictionary<string, string>? Metadata
    {
        get =>
            MetadataJson == null
                ? null
                : System.Text.Json.JsonSerializer.Deserialize<Dictionary<string, string>>(
                    MetadataJson
                );
        set =>
            MetadataJson = value == null ? null : System.Text.Json.JsonSerializer.Serialize(value);
    }
}
