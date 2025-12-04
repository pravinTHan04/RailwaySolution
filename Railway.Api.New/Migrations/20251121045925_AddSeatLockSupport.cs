using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Railway.Api.Migrations
{
    /// <inheritdoc />
    public partial class AddSeatLockSupport : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "LockExpiresAt",
                table: "ReservedSeats",
                type: "datetime2",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LockExpiresAt",
                table: "ReservedSeats");
        }
    }
}
