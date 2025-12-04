using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Railway.Api.Migrations
{
    /// <inheritdoc />
    public partial class TrainTypeFinalWorking : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // 1️⃣ Create TrainTypes first
            migrationBuilder.CreateTable(
                name: "TrainTypes",
                columns: table => new
                {
                    Id = table.Column<string>(type: "nvarchar(450)", nullable: false),
                    Name = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    FareMultiplier = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    SpeedFactor = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Description = table.Column<string>(type: "nvarchar(max)", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_TrainTypes", x => x.Id);
                });

            // 2️⃣ Add column to trains (NULLABLE FIRST)
            migrationBuilder.AddColumn<string>(
                name: "TrainTypeId",
                table: "Trains",
                type: "nvarchar(450)",
                nullable: true
            );

            // 3️⃣ Insert default basic type
            migrationBuilder.Sql(@"
        IF NOT EXISTS (SELECT 1 FROM TrainTypes WHERE Id = 'basic')
        INSERT INTO TrainTypes (Id, Name, FareMultiplier, SpeedFactor, Description)
        VALUES ('basic', 'Standard', 1.00, 1.00, 'Fallback type')
    ");

            // 4️⃣ Assign default type to existing trains
            migrationBuilder.Sql("UPDATE Trains SET TrainTypeId = 'basic' WHERE TrainTypeId IS NULL");

            // 5️⃣ Now enforce NOT NULL
            migrationBuilder.AlterColumn<string>(
                name: "TrainTypeId",
                table: "Trains",
                type: "nvarchar(450)",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(450)",
                oldNullable: true
            );

            // 6️⃣ Add FK + index
            migrationBuilder.CreateIndex(
                name: "IX_Trains_TrainTypeId",
                table: "Trains",
                column: "TrainTypeId");

            migrationBuilder.AddForeignKey(
                name: "FK_Trains_TrainTypes_TrainTypeId",
                table: "Trains",
                column: "TrainTypeId",
                principalTable: "TrainTypes",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Trains_TrainTypes_TrainTypeId",
                table: "Trains");

            migrationBuilder.DropTable(
                name: "TrainTypes");

            migrationBuilder.DropIndex(
                name: "IX_Trains_TrainTypeId",
                table: "Trains");

            migrationBuilder.DropColumn(
                name: "TrainTypeId",
                table: "Trains");
        }
    }
}
