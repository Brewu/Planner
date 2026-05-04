using System;
using System.IO;
using iText.IO.Font.Constants;
using iText.Kernel.Colors;
using iText.Kernel.Font;
using iText.Kernel.Geom;
using iText.Kernel.Pdf;
using iText.Layout;
using iText.Layout.Borders;
using iText.Layout.Element;
using iText.Layout.Properties;
using PlannerApp.Api.DTOs;

namespace PlannerApp.Api.Services;

public class PdfGenerationService
{
    private readonly ILogger<PdfGenerationService> _logger;

    public PdfGenerationService(ILogger<PdfGenerationService> logger)
    {
        _logger = logger;
    }

    public byte[] GenerateBoardReportPdf(
        BoardReportDto report,
        ReportHeaderConfig? headerConfig = null
    )
    {
        try
        {
            using (var memoryStream = new MemoryStream())
            {
                var writer = new PdfWriter(memoryStream);
                var pdf = new PdfDocument(writer);
                var document = new Document(pdf, PageSize.A4);

                // Set margins
                document.SetMargins(40, 40, 40, 40);

                // Add header section
                AddHeader(document, headerConfig, report);

                // Add report metadata
                AddReportMetadata(document, report);

                // Add statistics section
                AddStatisticsSection(document, report);

                // Add tasks table
                AddTasksTable(document, report);

                // Add footer
                AddFooter(document);

                document.Close();
                pdf.Close();

                return memoryStream.ToArray();
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating PDF report");
            throw;
        }
    }

    private void AddHeader(Document document, ReportHeaderConfig? config, BoardReportDto report)
    {
        config ??= new ReportHeaderConfig
        {
            OrganizationName = "Organization",
            DivisionName = "Division",
            ReportType = "Weekly Report",
        };

        try
        {
            var font = PdfFontFactory.CreateFont(StandardFonts.HELVETICA);
            var fontBold = PdfFontFactory.CreateFont(StandardFonts.HELVETICA_BOLD);

            // Organization Name
            var orgParagraph = new Paragraph(config.OrganizationName)
                .SetFont(fontBold)
                .SetFontSize(14)
                .SetFontColor(ColorConstants.BLACK)
                .SetTextAlignment(TextAlignment.CENTER)
                .SetMarginBottom(2);
            document.Add(orgParagraph);

            // Division Name
            var divisionParagraph = new Paragraph(config.DivisionName)
                .SetFont(font)
                .SetFontSize(11)
                .SetFontColor(new DeviceRgb(34, 139, 34)) // Green
                .SetTextAlignment(TextAlignment.CENTER)
                .SetMarginBottom(2);
            document.Add(divisionParagraph);

            // Report Type
            var reportTypeParagraph = new Paragraph(config.ReportType)
                .SetFont(font)
                .SetFontSize(11)
                .SetFontColor(new DeviceRgb(0, 0, 139)) // Dark Blue
                .SetTextAlignment(TextAlignment.CENTER)
                .SetMarginBottom(10);
            document.Add(reportTypeParagraph);

            // Decorative line
            document.Add(
                new Paragraph("")
                    .SetBorderTop(new SolidBorder(ColorConstants.BLACK, 3f))
                    .SetMarginBottom(10)
                    .SetMarginTop(0)
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding header to PDF");
        }
    }

    private void AddReportMetadata(Document document, BoardReportDto report)
    {
        try
        {
            var font = PdfFontFactory.CreateFont(StandardFonts.HELVETICA);
            var fontBold = PdfFontFactory.CreateFont(StandardFonts.HELVETICA_BOLD);

            // Reporting Period
            var startDate = report.GeneratedAt.AddDays(-(int)report.GeneratedAt.DayOfWeek);
            var endDate = startDate.AddDays(6);
            var periodText =
                $"Reporting Period: {startDate:d MMMM} – {endDate:d MMMM}, {report.GeneratedAt:yyyy}";
            var periodParagraph = new Paragraph(periodText)
                .SetFont(font)
                .SetFontSize(10)
                .SetMarginBottom(8);
            document.Add(periodParagraph);

            // Name of Person Reporting
            var nameText = $"NAME OF PERSON REPORTING: ......{report.GeneratedBy}";
            var nameParagraph = new Paragraph(nameText)
                .SetFont(font)
                .SetFontSize(10)
                .SetMarginBottom(4);
            document.Add(nameParagraph);

            // Rank/Title
            var rankText = "Rank/Title: (If applicable)";
            var rankParagraph = new Paragraph(rankText)
                .SetFont(font)
                .SetFontSize(9)
                .SetFontColor(new DeviceRgb(100, 100, 100))
                .SetMarginLeft(40)
                .SetMarginBottom(12)
                .SetFont(PdfFontFactory.CreateFont(StandardFonts.HELVETICA_OBLIQUE));
            rankParagraph.SetFont(PdfFontFactory.CreateFont(StandardFonts.HELVETICA_OBLIQUE));
            // Board Name as project section
            var boardNameParagraph = new Paragraph(report.BoardName)
                .SetFont(fontBold)
                .SetFontSize(12)
                .SetMarginBottom(10)
                .SetMarginTop(4);
            document.Add(boardNameParagraph);

            // Bottom border for metadata section
            document.Add(
                new Paragraph("")
                    .SetBorderBottom(new SolidBorder(new DeviceRgb(100, 100, 100), 1f))
                    .SetMarginBottom(10)
            );
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding metadata to PDF");
        }
    }

    private void AddStatisticsSection(Document document, BoardReportDto report)
    {
        try
        {
            var stats = report.Statistics;
            var font = PdfFontFactory.CreateFont(StandardFonts.HELVETICA);
            var fontBold = PdfFontFactory.CreateFont(StandardFonts.HELVETICA_BOLD);

            // Statistics header
            var statsHeader = new Paragraph("Summary Statistics")
                .SetFont(fontBold)
                .SetFontSize(11)
                .SetMarginBottom(8)
                .SetMarginTop(8);
            document.Add(statsHeader);

            // Create a 3-column statistics table
            var statsTable = new Table(3, true)
                .SetWidth(UnitValue.CreatePercentValue(100))
                .SetMarginBottom(12);

            // Stat cells
            AddStatCell(statsTable, "Total Tasks", stats.TotalTasks.ToString(), font, fontBold);
            AddStatCell(statsTable, "Completed", stats.CompletedTasks.ToString(), font, fontBold);
            AddStatCell(
                statsTable,
                "Completion %",
                $"{stats.CompletionPercentage:F1}%",
                font,
                fontBold
            );

            AddStatCell(
                statsTable,
                "In Progress",
                stats.InProgressTasks.ToString(),
                font,
                fontBold
            );
            AddStatCell(statsTable, "Pending", stats.PendingTasks.ToString(), font, fontBold);
            AddStatCell(statsTable, "Overdue", "0", font, fontBold);

            document.Add(statsTable);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding statistics section to PDF");
        }
    }

    private void AddStatCell(
        Table table,
        string label,
        string value,
        PdfFont labelFont,
        PdfFont valueFont
    )
    {
        var cell = new Cell()
            .SetBorder(new SolidBorder(new DeviceRgb(200, 200, 200), 0.5f))
            .SetPadding(8);

        var labelParagraph = new Paragraph(label)
            .SetFont(labelFont)
            .SetFontSize(9)
            .SetMarginBottom(4);

        var valueParagraph = new Paragraph(value)
            .SetFont(valueFont)
            .SetFontSize(10)
            .SetFontColor(new DeviceRgb(34, 139, 34)); // Green

        cell.Add(labelParagraph);
        cell.Add(valueParagraph);

        table.AddCell(cell);
    }

    private void AddTasksTable(Document document, BoardReportDto report)
    {
        try
        {
            var font = PdfFontFactory.CreateFont(StandardFonts.HELVETICA);
            var fontBold = PdfFontFactory.CreateFont(StandardFonts.HELVETICA_BOLD);

            // Tasks section header
            var tasksHeader = new Paragraph("Task Details")
                .SetFont(fontBold)
                .SetFontSize(11)
                .SetMarginBottom(8)
                .SetMarginTop(8);
            document.Add(tasksHeader);

            // Create tasks table: No. | Task Category | Remarks
            var table = new Table(new float[] { 1, 2, 4 }, true)
                .SetWidth(UnitValue.CreatePercentValue(100))
                .SetMarginBottom(12)
                .SetBorder(new SolidBorder(ColorConstants.BLACK, 1f));

            // Header row
            var headerCell1 = new Cell()
                .SetBackgroundColor(new DeviceRgb(50, 50, 50))
                .SetFontColor(ColorConstants.WHITE)
                .SetPadding(8)
                .SetTextAlignment(TextAlignment.CENTER)
                .SetVerticalAlignment(VerticalAlignment.MIDDLE);
            headerCell1.Add(
                new Paragraph("No.")
                    .SetFont(fontBold)
                    .SetFontSize(10)
                    .SetFontColor(ColorConstants.WHITE)
            );
            table.AddCell(headerCell1);

            var headerCell2 = new Cell()
                .SetBackgroundColor(new DeviceRgb(50, 50, 50))
                .SetFontColor(ColorConstants.WHITE)
                .SetPadding(8)
                .SetVerticalAlignment(VerticalAlignment.MIDDLE);
            headerCell2.Add(
                new Paragraph("Task Category")
                    .SetFont(fontBold)
                    .SetFontSize(10)
                    .SetFontColor(ColorConstants.WHITE)
            );
            table.AddCell(headerCell2);

            var headerCell3 = new Cell()
                .SetBackgroundColor(new DeviceRgb(50, 50, 50))
                .SetFontColor(ColorConstants.WHITE)
                .SetPadding(8)
                .SetVerticalAlignment(VerticalAlignment.MIDDLE);
            headerCell3.Add(
                new Paragraph("Remark")
                    .SetFont(fontBold)
                    .SetFontSize(10)
                    .SetFontColor(ColorConstants.WHITE)
            );
            table.AddCell(headerCell3);

            // Data rows
            int rowNumber = 1;
            foreach (var task in report.Tasks ?? new List<ReportTaskDto>())
            {
                // No. column
                var noCell = new Cell()
                    .SetBorder(new SolidBorder(new DeviceRgb(200, 200, 200), 0.5f))
                    .SetPadding(8)
                    .SetTextAlignment(TextAlignment.CENTER)
                    .SetVerticalAlignment(VerticalAlignment.TOP);
                noCell.Add(
                    new Paragraph(rowNumber.ToString())
                        .SetFont(font)
                        .SetFontSize(9)
                        .SetFontColor(new DeviceRgb(119, 119, 119))
                );
                table.AddCell(noCell);

                // Task Category column
                var categoryCell = new Cell()
                    .SetBorder(new SolidBorder(new DeviceRgb(200, 200, 200), 0.5f))
                    .SetPadding(8)
                    .SetVerticalAlignment(VerticalAlignment.TOP);

                var taskNameText = new Paragraph(task.Title ?? "").SetFont(fontBold).SetFontSize(9);
                categoryCell.Add(taskNameText);

                if (!string.IsNullOrEmpty(task.Status))
                {
                    var statusText = new Paragraph($"[{task.Status.ToUpper()}]")
                        .SetFont(font)
                        .SetFontSize(8)
                        .SetFontColor(new DeviceRgb(100, 100, 100))
                        .SetMarginTop(3);
                    categoryCell.Add(statusText);
                }

                table.AddCell(categoryCell);

                // Remark column
                var remarkCell = new Cell()
                    .SetBorder(new SolidBorder(new DeviceRgb(200, 200, 200), 0.5f))
                    .SetPadding(8)
                    .SetVerticalAlignment(VerticalAlignment.TOP);

                var remarkText = new Paragraph(task.Description ?? "(No description)")
                    .SetFont(font)
                    .SetFontSize(9);
                remarkCell.Add(remarkText);

                if (task.DueDate.HasValue)
                {
                    var dueText = new Paragraph($"Due: {task.DueDate:d MMMM yyyy}")
                        .SetFont(font)
                        .SetFontSize(8)
                        .SetFontColor(new DeviceRgb(100, 100, 100))
                        .SetMarginTop(3);
                    remarkCell.Add(dueText);
                }

                if (!string.IsNullOrEmpty(task.AssignedTo))
                {
                    var assignedText = new Paragraph($"Assigned to: {task.AssignedTo}")
                        .SetFont(font)
                        .SetFontSize(8)
                        .SetFontColor(new DeviceRgb(100, 100, 100))
                        .SetMarginTop(2);
                    remarkCell.Add(assignedText);
                }

                table.AddCell(remarkCell);

                rowNumber++;
            }

            // Handle empty task list
            if (report.Tasks == null || report.Tasks.Count == 0)
            {
                var emptyCell = new Cell(1, 3)
                    .SetBorder(new SolidBorder(new DeviceRgb(200, 200, 200), 0.5f))
                    .SetPadding(32)
                    .SetTextAlignment(TextAlignment.CENTER);
                emptyCell.Add(
                    new Paragraph("No tasks to display")
                        .SetFont(font)
                        .SetFontSize(9)
                        .SetFontColor(new DeviceRgb(150, 150, 150))
                );
                table.AddCell(emptyCell);
            }

            document.Add(table);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding tasks table to PDF");
        }
    }

    private void AddFooter(Document document)
    {
        try
        {
            var font = PdfFontFactory.CreateFont(StandardFonts.HELVETICA);

            document.Add(new Paragraph(" ")); // Spacer

            // Top border
            document.Add(
                new Paragraph("")
                    .SetBorderTop(new SolidBorder(new DeviceRgb(200, 200, 200), 0.5f))
                    .SetMarginBottom(8)
            );

            // Footer text
            var footerText = new Paragraph(
                $"Report generated on {DateTime.Now:dddd, d MMMM yyyy 'at' HH:mm:ss}\nThis is an automated report from PlannerApp."
            )
                .SetFont(font)
                .SetFontSize(9)
                .SetFontColor(new DeviceRgb(100, 100, 100))
                .SetTextAlignment(TextAlignment.CENTER)
                .SetMarginTop(4);

            document.Add(footerText);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error adding footer to PDF");
        }
    }
}

public class ReportHeaderConfig
{
    public string OrganizationName { get; set; } = string.Empty;
    public string DivisionName { get; set; } = string.Empty;
    public string ReportType { get; set; } = string.Empty;
}
