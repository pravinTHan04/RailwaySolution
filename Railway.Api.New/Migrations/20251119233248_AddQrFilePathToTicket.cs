using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Railway.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddQrFilePathToTicket : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "QrCodeBase64",
                table: "Tickets",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "QrFilePath",
                table: "Tickets",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "QrCodeBase64",
                table: "Tickets");

            migrationBuilder.DropColumn(
                name: "QrFilePath",
                table: "Tickets");
        }
    }
}
