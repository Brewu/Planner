using Microsoft.EntityFrameworkCore;
using PlannerApp.Api.Models;

namespace PlannerApp.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<Notification> Notifications { get; set; }
    public DbSet<PushSubscription> PushSubscriptions { get; set; }
    public DbSet<Board> Boards { get; set; }
    public DbSet<TaskItem> Tasks { get; set; }
    public DbSet<SupervisorRequest> SupervisorRequests { get; set; }
    public DbSet<ReportRecord> ReportRecords { get; set; }
    public DbSet<UserSupervisor> UserSupervisors { get; set; }
    public DbSet<PasswordReset> PasswordResets { get; set; }
    public DbSet<ReportRecipient> ReportRecipients { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        // ── UserSupervisor (many-to-many) ─────────────────────────────────────────
        modelBuilder.Entity<UserSupervisor>(entity =>
        {
            entity.HasKey(us => new { us.UserId, us.SupervisorId });

            entity
                .HasOne(us => us.User)
                .WithMany(u => u.MySupervisors)
                .HasForeignKey(us => us.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity
                .HasOne(us => us.Supervisor)
                .WithMany(u => u.MySupervisees)
                .HasForeignKey(us => us.SupervisorId)
                .OnDelete(DeleteBehavior.Restrict);
        });
        // ── User ────────────────────────────────────────────────────────────
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.Email).IsUnique(false);
            entity.HasIndex(u => u.PhoneNumber).IsUnique(false);
            entity.HasIndex(u => u.GoogleId).IsUnique(false);
            entity.HasIndex(u => u.StaffId).IsUnique(false);

            entity
                .HasOne(u => u.Supervisor)
                .WithMany()
                .HasForeignKey(u => u.SupervisorId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ── Board ────────────────────────────────────────────────────────────
        modelBuilder.Entity<Board>(entity =>
        {
            entity
                .HasOne(b => b.Supervisor)
                .WithMany()
                .HasForeignKey(b => b.SupervisorId)
                .OnDelete(DeleteBehavior.SetNull);
        });

        // ── Notification ─────────────────────────────────────────────────────
        modelBuilder.Entity<Notification>(entity =>
        {
            entity.Property(e => e.MetadataJson).HasColumnType("nvarchar(max)");

            entity
                .HasOne(e => e.User)
                .WithMany()
                .HasForeignKey(e => e.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(e => e.UserId);
            entity.HasIndex(e => e.IsRead);
            entity.HasIndex(e => e.CreatedAt);
            entity.HasIndex(e => e.Type);
        });

        // ── SupervisorRequest ─────────────────────────────────────────────────
        modelBuilder.Entity<SupervisorRequest>(entity =>
        {
            entity
                .HasOne(r => r.Requester)
                .WithMany()
                .HasForeignKey(r => r.RequesterId)
                .OnDelete(DeleteBehavior.Cascade);

            entity
                .HasOne(r => r.Supervisor)
                .WithMany()
                .HasForeignKey(r => r.SupervisorId)
                .OnDelete(DeleteBehavior.Restrict);
        });

        // ── TaskItem ──────────────────────────────────────────────────────────
        modelBuilder.Entity<TaskItem>(entity =>
        {
            entity
                .HasOne(t => t.AssignedUser)
                .WithMany()
                .HasForeignKey(t => t.AssignedUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity
                .HasOne(t => t.Board)
                .WithMany(b => b.Tasks)
                .HasForeignKey(t => t.BoardId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        // ── PushSubscription ──────────────────────────────────────────────────
        modelBuilder.Entity<PushSubscription>(entity =>
        {
            entity
                .HasOne(p => p.User)
                .WithMany()
                .HasForeignKey(p => p.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            entity.HasIndex(p => p.UserId);
            entity.HasIndex(p => p.FcmToken);
        });

        // ── ReportRecord ──────────────────────────────────────────────────────
        modelBuilder.Entity<ReportRecord>(entity =>
        {
            entity.Property(r => r.PdfBytes).HasColumnType("varbinary(max)");

            entity
                .HasOne(r => r.Board)
                .WithMany()
                .HasForeignKey(r => r.BoardId)
                .OnDelete(DeleteBehavior.Cascade);

            entity
                .HasOne(r => r.GeneratedByUser)
                .WithMany()
                .HasForeignKey(r => r.GeneratedByUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity
                .HasOne(r => r.SentToUser)
                .WithMany()
                .HasForeignKey(r => r.SentToUserId)
                .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(r => r.BoardId);
            entity.HasIndex(r => r.SentToUserId);
            entity.HasIndex(r => r.GeneratedAt);
        });

        // ── Seed Users ────────────────────────────────────────────────────────
        var supervisorId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var supervisor2Id = Guid.Parse("33333333-3333-3333-3333-333333333333");
        var supervisor3Id = Guid.Parse("44444444-4444-4444-4444-444444444444");
        var supervisor4Id = Guid.Parse("55555555-5555-5555-5555-555555555555");
        var superviseeId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        // After HasData for users, seed the supervisor relationship
        modelBuilder
            .Entity<UserSupervisor>()
            .HasData(
                new UserSupervisor
                {
                    UserId = superviseeId,
                    SupervisorId = supervisorId,
                    Frequency = ReportingFrequency.Weekly,
                    AssignedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                }
            );
        modelBuilder
            .Entity<User>()
            .HasData(
                new User
                {
                    Id = supervisorId,
                    Name = "Kwame Mensah",
                    StaffId = "KNUST001",
                    Email = "kwame.mensah@knust.edu.gh",
                    PasswordHash = "HASH_FOR_Password@001",
                    SupervisorId = null,
                    CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                },
                new User
                {
                    Id = supervisor2Id,
                    Name = "Kofi Asante",
                    StaffId = "KNUST003",
                    Email = "kofi.asante@knust.edu.gh",
                    PasswordHash = "$2a$11$2q2weH38pzlja.IUFRe4zOl2YcIkOz1R5cvch3jpxls3NeZdzaxim",
                    SupervisorId = null,
                    CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                },
                new User
                {
                    Id = supervisor3Id,
                    Name = "Abena Frimpong",
                    StaffId = "KNUST004",
                    Email = "abena.frimpong@knust.edu.gh",
                    PasswordHash = "$2a$11$r3w.uqlPCTf0LbZ7eBvrhu7oBVbVK6c7bgyzT5l0T7g6syjXdBecS",
                    SupervisorId = null,
                    CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                },
                new User
                {
                    Id = supervisor4Id,
                    Name = "Yaw Darko",
                    StaffId = "KNUST005",
                    Email = "yaw.darko@knust.edu.gh",
                    PasswordHash = "$2a$11$wx6l0C6WMyRhkM1/1qdM6.NHf44E904ryJOwiLrFcb9Yb2QSggkMK",
                    SupervisorId = null,
                    CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                },
                new User
                {
                    Id = superviseeId,
                    Name = "Ama Owusu",
                    StaffId = "KNUST002",
                    Email = "ama.owusu@st.knust.edu.gh",
                    PasswordHash = "HASH_FOR_Password@002",
                    SupervisorId = supervisorId,
                    CreatedAt = new DateTime(2024, 1, 1, 0, 0, 0, DateTimeKind.Utc),
                }
            );
    }
}
