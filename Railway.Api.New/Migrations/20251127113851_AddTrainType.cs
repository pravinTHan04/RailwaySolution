using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Railway.Api.Migrations
{
    public partial class AddTrainType : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1. Create TrainTypes table
            migrationBuilder.CreateTable(
                name: "TrainTypes",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FareMultiplier = table.Column<decimal>(type: "decimal(5,2)", nullable: false),
                    SpeedFactor = table.Column<decimal>(type: "decimal(5,2)", nullable: false),
                    StopsAtEveryStation = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrainTypes", x => x.Id);
                });

            // 2. Insert default seed record
            migrationBuilder.InsertData(
                table: "TrainTypes",
                columns: new[] { "Id", "Name", "FareMultiplier", "SpeedFactor", "StopsAtEveryStation", "Description" },
                values: new object[] { "type-local", "Local", 1.00m, 1.00m, true, "Default train type" }
            );

            // 3. Add FK column to Trains
            migrationBuilder.AddColumn<string>(
                name: "TrainTypeId",
                table: "Trains",
                type: "nvarchar(450)",
                nullable: false,
                defaultValue: "type-local"
            );

            // 4. Create index
            migrationBuilder.CreateIndex(
                name: "IX_Trains_TrainTypeId",
                table: "Trains",
                column: "TrainTypeId");

            // 5. Add FK constraint
            migrationBuilder.AddForeignKey(
                name: "FK_Trains_TrainTypes_TrainTypeId",
                table: "Trains",
                column: "TrainTypeId",
                principalTable: "TrainTypes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Trains_TrainTypes_TrainTypeId",
                table: "Trains");

            migrationBuilder.DropIndex(
                name: "IX_Trains_TrainTypeId",
                table: "Trains");

            migrationBuilder.DropColumn(
                name: "TrainTypeId",
                table: "Trains");

            migrationBuilder.DropTable(
                name: "TrainTypes");
        }
    }
}
