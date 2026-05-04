// DTOs/SupervisorRequestDtos.cs
public class SendSuperviseeRequestDto
{
    public Guid SupervisorId { get; set; }
    public Guid SuperviseeId { get; set; }
    public string Frequency { get; set; } = "Weekly";
}
